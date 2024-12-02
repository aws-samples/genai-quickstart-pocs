import boto3
import io
import json
import fitz

class PDFTranslator:
    def __init__(self):
        self.translate_client = boto3.client('translate')
        self.bedrock_client = boto3.client('bedrock-runtime')
        
        self.languages = {
            'English': 'en',
            'Spanish': 'es',
            'French': 'fr',
            'German': 'de',
            'Italian': 'it',
            'Portuguese': 'pt',
            'Chinese (Simplified)': 'zh'
        }

    def batch_translate(self, texts, source_lang, target_lang, use_bedrock=False, batch_size=10):
        print(f"Translating {len(texts)} segments from {source_lang} to {target_lang}...")
        if not texts:
            return []
        
        if use_bedrock:
            return self._batch_translate_with_bedrock(texts, source_lang, target_lang, batch_size)
        return self._batch_translate_with_translate(texts, source_lang, target_lang)

    def _batch_translate_with_translate(self, texts, source_lang, target_lang):
        print("Using Amazon Translate...")
        translations = []
        for text in texts:
            if not text.strip():
                translations.append(text)
                continue
            
            try:
                response = self.translate_client.translate_text(
                    Text=text,
                    SourceLanguageCode=source_lang,
                    TargetLanguageCode=target_lang
                )
                translations.append(response['TranslatedText'])
            except Exception as e:
                print(f"Translation error: {str(e)}")
                translations.append(text)
                
        return translations

    def _batch_translate_with_bedrock(self, texts, source_lang, target_lang, batch_size):
        print("Using Amazon Bedrock...")
        translations = []
        
        for i in range(0, len(texts), batch_size):
            print(f"Translating batch {i + 1}-{min(i + batch_size, len(texts))}...")
            batch = texts[i:i + batch_size]
            combined_text = "\n---\n".join(batch)
            
            prompt = f"""Human: Translate the following text segments from {source_lang} to {target_lang}.
            Do not translate symbols like '#', '$', etc. within a sentence/translation - return the symbols as they are or properly
            incorporate the symbol into the translated text. 
            There may be codes like 'C-137' or 'R2-D2' that should not be translated and returned as they are.
Each segment is separated by '---'. Provide only the translations in the same order, 
separated by '---'.

{combined_text}

Respond with the translations and no outher output text.

Assistant:"""
            
            try:
                response = self.bedrock_client.converse(
                    modelId="us.anthropic.claude-3-5-haiku-20241022-v1:0",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "text": prompt
                                }
                            ]
                        }
                    ]
                )
                response_body = response
                response_output = response_body['output']['message']['content'][0]['text']
                print(f"Bedrock response output: {response_output}")
                batch_translations = response_output.strip().split("---")
                translations.extend([t.strip() for t in batch_translations])
                
            except Exception as e:
                print(f"Bedrock translation error: {str(e)}")
                translations.extend(batch)  # Use original text on error
                
        return translations

    def extract_text_and_positions(self, pdf_bytes):
        text_data = []
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        try:
            for page_num in range(len(doc)):
                page = doc[page_num]
                dict_data = page.get_text("dict", sort=True)
                
                for block in dict_data["blocks"]:
                    if "lines" not in block:
                        continue
                    for line in block["lines"]:
                        for span in line["spans"]:
                            if not span['text'].strip():
                                continue
                            text_data.append({
                                'text': span['text'],
                                'page': page_num,
                                'x': span['origin'][0],
                                'y': span['origin'][1],
                                'width': span['bbox'][2] - span['bbox'][0],
                                'height': span['bbox'][3] - span['bbox'][1],
                                'font_size': span['size'],
                                'bbox': span['bbox']
                            })
        finally:
            doc.close()
            
        return text_data

    def create_translated_pdf(self, original_pdf_bytes, text_positions, translations):
        print("Creating translated PDF...")
        doc = fitz.open(stream=original_pdf_bytes, filetype="pdf")
        
        try:
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                for pos, trans in zip(text_positions, translations):
                    if pos['page'] == page_num:
                        rect = fitz.Rect(pos['bbox'])
                        annot = page.add_redact_annot(rect)
                        page.apply_redactions()
                        
                        page.insert_text(
                            point=(pos['x'], pos['y']),
                            text=trans,
                            fontsize=pos['font_size']
                        )
            
            output_stream = io.BytesIO(doc.tobytes())
            return output_stream.getvalue()
        finally:
            doc.close()