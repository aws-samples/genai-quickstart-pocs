import json
from . import QuizGenerationOutput
from jinja2 import Environment, select_autoescape, FileSystemLoader
import os
from uuid import uuid4
from enum import Enum
from pydantic import BaseModel  # Ensure correct import

class QuizEncoder(json.JSONEncoder):
    def default(self, obj):
        if hasattr(obj, '__dict__'):
            # Handle Pydantic models and custom classes
            return {k: v for k, v in obj.__dict__.items() if not k.startswith('_')}
        elif isinstance(obj, Enum):
            # Handle enum values
            return obj.value
        return super().default(obj)

def render_quiz(quiz_data: QuizGenerationOutput, quiz_title: str):
    """Generate HTML for the quiz"""
    templateLoader = FileSystemLoader(searchpath=os.path.dirname(__file__))
    env = Environment(
        autoescape=select_autoescape(),
        loader=templateLoader,
    )
    template = env.get_template("quiz-template.html")
    
    # Use custom encoder for JSON serialization
    questions_json = json.dumps(quiz_data.questions, cls=QuizEncoder)
    
    return template.render(
        questions=questions_json,
        quiz_title=quiz_title
    )
