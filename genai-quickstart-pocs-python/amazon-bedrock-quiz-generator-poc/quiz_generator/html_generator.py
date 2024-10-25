import json
from . import QuizGenerationOutput
from jinja2 import Environment, select_autoescape, FileSystemLoader
import os
from uuid import uuid4


def render_quiz(quiz_data: QuizGenerationOutput, quiz_title: str):
    templateLoader = FileSystemLoader(searchpath=os.path.dirname(__file__))
    env = Environment(
        autoescape=select_autoescape(),
        loader=templateLoader,
    )
    template = env.get_template("quiz-template.html")

    data = quiz_data.model_dump(mode="json", include="questions")
    return template.render(questions=json.dumps(data['questions']), quiz_title=quiz_title)
