from . import QuizGenerationOutput
from langchain.prompts import PromptTemplate
from langchain_aws import ChatBedrockConverse
from langchain.output_parsers import PydanticOutputParser
import logging

def generate_quiz_questions(documents: list) -> QuizGenerationOutput:
    """
    Generates quiz questions in batches of 5 questions at a time.
    
    Args:
        documents (list): The list of documents to generate questions from.

    Returns:
        QuizGenerationOutput: The output containing the generated questions
    """
    print("Generating quiz questions!")
    quiz_questions = QuizGenerationOutput(questions=[])
    while len(quiz_questions.questions) < 25:
        print(f"Generating 5 quiz questions")
        new_questions = generate_quiz_question_set(documents, quiz_questions)
        quiz_questions.questions.extend(new_questions.questions)

    print("Generating quiz questions complete!")
    return quiz_questions



def generate_quiz_question_set(
    documents: list, existing_questions: QuizGenerationOutput
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
        model="anthropic.claude-3-haiku-20240307-v1:0",
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
