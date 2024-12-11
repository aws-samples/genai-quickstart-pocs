from . import QuizGenerationOutput
from .quiz_chunks import chunk_documents, process_chunk
from langchain.prompts import PromptTemplate
from langchain_aws import ChatBedrockConverse
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document
from tenacity import retry, stop_after_attempt, wait_exponential
from concurrent.futures import ThreadPoolExecutor
import time


def summarize_chunks(chunks: list[Document]) -> list[str]:
    """Summarize each group of chunks"""
    summaries = []
    for chunk in chunks:
        # Basic summarization logic (this can be replaced with a more sophisticated summarization method)
        summaries.append(chunk.text[:200] + '...')  # Take the first 200 characters as a summary
    return summaries

def summarize_document_group(chunks: list[Document], max_length: int = 1000, status_callback=None) -> str:
    """Generate a concise summary of a group of document chunks"""
    llm = ChatBedrockConverse(
        model="amazon.nova-micro-v1:0",
        disable_streaming=True,
    )
    
    # Limit input size to avoid Bedrock limits
    MAX_INPUT_LENGTH = 2000  # Bedrock has input limits
    
    # Combine chunks but respect length limits
    texts = []
    current_text = ""
    
    for chunk in chunks:
        if len(current_text) + len(chunk.page_content) > MAX_INPUT_LENGTH:
            texts.append(current_text)
            current_text = chunk.page_content
        else:
            current_text += "\n\n" + chunk.page_content if current_text else chunk.page_content
    
    if current_text:
        texts.append(current_text)
    
    # Process each text segment
    summaries = []
    prompt = PromptTemplate(
        template="""Summarize the following text in {max_length} characters or less, focusing on key facts and concepts:

{text}

Summary:""",
        input_variables=["text", "max_length"]
    )
    
    for text in texts:
        try:
            chain = prompt | llm | StrOutputParser()
            summary = chain.invoke({"text": text[:MAX_INPUT_LENGTH], "max_length": max_length // len(texts)})
            summaries.append(summary)
        except Exception as e:
            print(f"Error summarizing text segment: {str(e)}")
            summaries.append(text[:max_length // len(texts)])  # Fallback to truncation
    
    # Combine summaries
    final_summary = " ".join(summaries)
    return final_summary[:max_length]  # Ensure we don't exceed max length

# @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def generate_quiz_questions(documents: list, images: list, num_questions: int = 25, status_callback=None) -> QuizGenerationOutput:
    """Generate quiz questions with parallel processing and rate limiting"""
    if status_callback:
        status_callback("Starting quiz generation process...")
        
    chunks = chunk_documents(documents)
    if status_callback:
        status_callback(f"Document split into {len(chunks)} chunks")
    
    quiz_questions = QuizGenerationOutput(questions=[])
    
    # If we have too many chunks, summarize them in groups
    if len(chunks) > 100:
        if status_callback:
            status_callback("Large document detected. Starting content summarization...")
        
        summarized_groups = []
        group_size = 25  # Reduced from 50
        chunk_groups = list(range(0, len(chunks), group_size))
        total_groups = len(chunk_groups)
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = []
            for i in chunk_groups:
                group = chunks[i:i+group_size]
                futures.append(executor.submit(summarize_document_group, group))
            
            for idx, future in enumerate(futures, 1):
                if status_callback:
                    status_callback(f"Summarizing content (phase 1): {idx}/{total_groups}")
                summary = future.result()
                summarized_groups.append(Document(page_content=summary))
                time.sleep(0.1)  # Rate limiting
        
        chunks = summarized_groups
    
    if status_callback:
        status_callback(f"Generating questions from {len(chunks)} content sections...")
    
    # Generate questions from chunks (original or summarized)
    with ThreadPoolExecutor(max_workers=5) as executor:
        chunk_results = []
        chunk_groups = list(range(0, len(chunks), 10))
        total_groups = len(chunk_groups)
        
        for idx, i in enumerate(chunk_groups, 1):
            group = chunks[i:i+10]
            if status_callback:
                status_callback(f"Generating questions (phase 2): {idx}/{total_groups}")
            group_results = list(executor.map(process_chunk, group))
            
            # Process results immediately after each group
            for result in group_results:
                if result and result.questions:
                    quiz_questions.questions.extend(result.questions)
                    print(f"Added {len(result.questions)} questions. Total now: {len(quiz_questions.questions)}")
            
            # Check if we have enough questions
            if len(quiz_questions.questions) >= num_questions:
                print(f"Reached target number of questions: {len(quiz_questions.questions)}")
                break
            
            time.sleep(0.1)  # Rate limiting
        
        if status_callback:
            status_callback(f"Generated {len(quiz_questions.questions)} questions so far...")
    
    if status_callback:
        status_callback("Finalizing quiz questions...")
    
    # Replace set-based deduplication with list-based deduplication
    seen_questions = {}
    unique_questions = []
    for q in quiz_questions.questions:
        # Create a key based on question text to identify duplicates
        question_key = q.question.strip().lower()
        if question_key not in seen_questions:
            seen_questions[question_key] = True
            unique_questions.append(q)
    
    quiz_questions.questions = unique_questions[:num_questions]
    return quiz_questions


def generate_quiz_question_set(
    documents: list, images: list, existing_questions: QuizGenerationOutput
):
    """
    Generates a set of quiz questions from the provided documents.

    Args:
        documents (list): The list of documents to generate questions from.
        existing_questions (QuizGenerationOutput): The existing questions to avoid duplicating.

    Returns:
        QuizGenerationOutput: The output containing the generated questions + any existing questions
    """
    parser = PydanticOutputParser(pydantic_object=QuizGenerationOutput)
    prompt = PromptTemplate(
        template="""
    You are an intelligent quiz question generator. Your task is to generate quiz questions based on the provided source material. Follow these instructions carefully:

1. First, you will be given source material in the form of documents and/or images. This will be provided within <source_material> tags:

<source_material>
{documents}
</source_material>

2. You may also be provided with previously generated questions to avoid duplication and ensure relevance. If provided, these will appear within <previous_questions> tags:

<previous_questions>
{previous_questions}
</previous_questions>

3. Carefully analyze the source material. Pay attention to key facts, concepts, dates, names, and other important information that could form the basis of good quiz questions.

4. Generate quiz questions based on the source material, following these guidelines:
   a. Create a mix of question types (e.g., multiple choice, true/false). Do not generate open-ended questions.
   b. Ensure questions are clear, concise, and unambiguous.
   c. Vary the difficulty level of questions from easy to challenging.
   d. Focus on important and interesting information from the source material.
   e. For multiple choice questions, include one correct answer and three plausible but incorrect options.

5. If previous questions were provided, ensure that your newly generated questions:
   a. Do not duplicate any of the previous questions in content or structure.
   b. Cover different aspects of the source material than the previous questions.
   c. Complement the previous questions to create a well-rounded quiz.

6. Generate a total of 5 unique questions, unless otherwise specified.

7. After generating the questions, review them to ensure they meet all the above criteria and are of high quality.

8.  Output the generated questions in the following format:
{format_instructions}
    Begin generating quiz questions and only output the response in the formatted JSON as instructed and nothing else.

    """,
        input_variables=["documents", "previous_questions"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )
    llm = ChatBedrockConverse(
        model="amazon.nova-micro-v1:0",
        disable_streaming=True,
    )

    chain = prompt | llm | parser
    response = chain.invoke(
        {
            "documents": documents,
            "previous_questions": (
                existing_questions
                if existing_questions
                else QuizGenerationOutput(questions=[])
            ),
        }
    )

    return response


def generate_quiz_title(questions: list) -> str:
    """
    Generates a quiz title based on the provided questions.

    Args:
        questions (list): The list of generated questions to base the quiz title on.

    Returns:
        str: The generated quiz title.
    """
    print(f"Generating quiz title!")
    prompt = PromptTemplate(
        template="""
    You are an intelligent quiz generator.
    You are tasked with creating a title for a quiz. 
    You will be provided with a list of quiz questions.
    The title should be clear, concise, and relevant to the content of the questions.
    The title should look like: 
    Quiz: <title>
    Where <title> is the actual title of the quiz.
                            
    Quiz questions:
    <questions>
    {questions}
    </questions>

    Generate a quiz title based on the provided questions.
    Do not include any additional information or context. Only output the title.
    """,
        input_variables=["questions"]
    )
    llm = ChatBedrockConverse(
        model="amazon.nova-micro-v1:0",
        disable_streaming=True,
    )
    chain = prompt | llm | StrOutputParser()
    response = chain.invoke({"questions": questions})
    return response
