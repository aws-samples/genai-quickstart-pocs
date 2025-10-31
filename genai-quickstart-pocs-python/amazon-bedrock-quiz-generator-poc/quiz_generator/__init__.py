from pydantic import BaseModel, Field
from enum import Enum

class QuestionType(str, Enum):
    MULTI_CHOICE = "multi_choice"
    TRUE_FALSE = "true_false"

    class Config:  
        use_enum_values = True

class QuizAnswer(BaseModel):
    answer: str = Field(..., description="The answer value")
    is_correct: bool = Field(..., description="Whether the answer is correct or not")

class QuizGenerationQuestionOutput(BaseModel):
    question: str = Field(..., description="The question generated from the documents")
    question_type: QuestionType = Field(..., description="The type of question (multi-choice or true/false)")
    answers: list[QuizAnswer] = Field(..., description="The list of possible answers for the question and if the answer is the correct answer")

class QuizGenerationOutput(BaseModel):
    questions: list[QuizGenerationQuestionOutput] = Field(..., description="The list of questions generated from the documents")