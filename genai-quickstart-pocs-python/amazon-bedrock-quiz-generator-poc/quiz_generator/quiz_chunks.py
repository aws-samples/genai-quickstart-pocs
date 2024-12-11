# quiz_generator/quiz_chunks.py
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from . import QuizGenerationOutput
import json
from langchain_aws import ChatBedrockConverse
from langchain.prompts import PromptTemplate

def chunk_documents(documents: list[Document], chunk_size=800, chunk_overlap=50) -> list[Document]:
    """Split documents into smaller chunks"""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,  # Reduced from 1000
        chunk_overlap=chunk_overlap,  # Reduced from 100
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    return text_splitter.split_documents(documents)

def summarize_chunks(chunks: list[Document]) -> list[str]:
    """Summarize each group of chunks"""
    summaries = []
    for chunk in chunks:
        # Basic summarization logic (this can be replaced with a more sophisticated summarization method)
        summaries.append(chunk.page_content[:200] + '...')  # Updated from chunk.text to chunk.page_content
    return summaries

def process_chunk(chunk: Document) -> QuizGenerationOutput:
    """Process individual document chunk or summary"""
    llm = ChatBedrockConverse(
        model="amazon.nova-micro-v1:0",
        disable_streaming=True,
    )
    
    prompt = PromptTemplate(
        template="""Generate 2-3 quiz questions based on the following content. Create a mix of multi-choice and true/false questions:

{text}

Each question must follow this EXACT format in the JSON structure:
{{
    "questions": [
        {{
            "question": "<question text>",
            "question_type": "multi_choice",
            "answers": [
                {{
                    "answer": "<correct answer>",
                    "is_correct": true
                }},
                {{
                    "answer": "<wrong answer>",
                    "is_correct": false
                }},
                {{
                    "answer": "<wrong answer>",
                    "is_correct": false
                }},
                {{
                    "answer": "<wrong answer>",
                    "is_correct": false
                }}
            ]
        }},
        {{
            "question": "<question text>",
            "question_type": "true_false",
            "answers": [
                {{
                    "answer": "True",
                    "is_correct": true|false
                }},
                {{
                    "answer": "False",
                    "is_correct": true|false
                }}
            ]
        }}
    ]
}}

Requirements:
- Return ONLY valid JSON
- Multi-choice questions must have exactly 4 answers
- True/false questions must have exactly 2 answers
- Each question must have exactly one correct answer
- Base questions only on the provided text""",
        input_variables=["text"]
    )
    
    try:
        print(f"\nProcessing chunk of length: {len(chunk.page_content)}")
        
        chain = prompt | llm | StrOutputParser()
        result = chain.invoke({"text": chunk.page_content})
        
        print(f"\nRaw LLM response:\n{result}")
        
        result = result.strip()
        parsed = json.loads(result)
        questions = parsed.get('questions', [])
        
        # Validate each question
        valid_questions = []
        for q in questions:
            try:
                if not all(key in q for key in ['question', 'question_type', 'answers']):
                    print(f"Skipping question missing required fields: {q}")
                    continue
                
                answers = q['answers']
                question_type = q['question_type']
                
                # Validate based on question type
                if question_type == 'multi_choice' and len(answers) != 4:
                    print(f"Skipping multi choice question without exactly 4 answers")
                    continue
                elif question_type == 'true_false' and len(answers) != 2:
                    print(f"Skipping true/false question without exactly 2 answers")
                    continue
                    
                if sum(a.get('is_correct', False) for a in answers) != 1:
                    print(f"Skipping question without exactly one correct answer")
                    continue
                    
                valid_questions.append(q)
                
            except Exception as e:
                print(f"Error validating question: {str(e)}")
                continue
            
        print(f"Extracted {len(valid_questions)} valid questions")
        return QuizGenerationOutput(questions=valid_questions)
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {str(e)}")
        return QuizGenerationOutput(questions=[])
    except Exception as e:
        print(f"Error processing chunk: {str(e)}")
        return QuizGenerationOutput(questions=[])