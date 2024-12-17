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
            # First pass: Apply all white rectangles
            for page_num in range(len(doc)):
                page = doc[page_num]
                for pos in text_positions:
                    if pos['page'] == page_num:
                        # Calculate exact text dimensions from bbox
                        text_height = pos['bbox'][3] - pos['bbox'][1]
                        text_width = pos['bbox'][2] - pos['bbox'][0]
                        
                        # Create precise white rectangle for text coverage
                        rect = fitz.Rect(
                            pos['bbox'][0],  # x0
                            pos['bbox'][1],  # y0
                            pos['bbox'][0] + text_width,  # x1
                            pos['bbox'][1] + text_height  # y1
                        )
                        
                        # Draw precise white rectangle
                        page.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1))
            
            # Second pass: Place all translated text
            for page_num in range(len(doc)):
                page = doc[page_num]
                for pos, trans in zip(text_positions, translations):
                    if pos['page'] == page_num:
                        available_width = pos['bbox'][2] - pos['bbox'][0]
                        available_height = pos['bbox'][3] - pos['bbox'][1]
                        font_size = pos['font_size']
                        
                        try:
                            # Create text writer
                            tw = fitz.TextWriter(page.rect)
                            font = fitz.Font("helv")
                            text_width = font.text_length(trans, fontsize=font_size)
                            
                            # Rest of text placement logic remains the same
                            if text_width > available_width:
                                scaling_factor = available_width / text_width
                                font_size = max(6, font_size * scaling_factor)
                            
                            # If text is still too wide, try wrapping
                            if font.text_length(trans, fontsize=font_size) > available_width:
                                words = trans.split()
                                lines = []
                                current_line = []
                                
                                for word in words:
                                    test_line = ' '.join(current_line + [word])
                                    if font.text_length(test_line, fontsize=font_size) <= available_width:
                                        current_line.append(word)
                                    else:
                                        if current_line:
                                            lines.append(' '.join(current_line))
                                            current_line = [word]
                                        else:
                                            lines.append(word)
                                            current_line = []
                                
                                if current_line:
                                    lines.append(' '.join(current_line))
                                
                                # Calculate vertical spacing
                                line_height = font_size * 1.2
                                total_height = line_height * len(lines)
                                
                                # Center text block vertically
                                start_y = pos['y'] + (available_height - total_height) / 2
                                
                                # Write each line using TextWriter
                                for i, line in enumerate(lines):
                                    y_pos = start_y + (i * line_height)
                                    tw.append((pos['x'], y_pos), line, font=font, fontsize=font_size)
                            else:
                                # Single line - center vertically
                                y_pos = pos['y'] + (available_height - font_size) / 2
                                tw.append((pos['x'], y_pos), trans, font=font, fontsize=font_size)
                            
                            # Write all text to page
                            tw.write_text(page)
                            
                        except Exception as e:
                            print(f"Error placing text: {str(e)}")
                            # Fallback to simple text insertion
                            page.insert_text(
                                (pos['x'], pos['y']),
                                trans,
                                fontsize=font_size
                            )
            
            output_stream = io.BytesIO(doc.tobytes())
            return output_stream.getvalue()
        finally:
            doc.close()