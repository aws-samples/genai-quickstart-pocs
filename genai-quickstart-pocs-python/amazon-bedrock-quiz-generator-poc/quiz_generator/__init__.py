from pydantic import BaseModel, Field


class QuizGenerationQuestionOutput(BaseModel):
    question: str = Field(..., description="The question generated from the documents")
    answers: list[str] = Field(..., description="The list of possible answers for the question. Only one should be correct.")
    correct_answer: str = Field(..., description="The answer from the list of answers that is the correct answer.")

class QuizGenerationOutput(BaseModel):
    questions: list[QuizGenerationQuestionOutput] = Field(..., description="The list of questions generated from the documents")