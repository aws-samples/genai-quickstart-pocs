import streamlit as st
import json
from pydantic import BaseModel, Field
import concurrent.futures
import boto3
from botocore.exceptions import ClientError
import time
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.messages import (
    HumanMessage,
)
from langchain_core.output_parsers import PydanticOutputParser
from langchain_aws import ChatBedrock
import base64
import os
import fitz
import logging
from uuid import uuid4

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

session = boto3.Session(region_name="us-east-1")

MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0"


class ModelOutput(BaseModel):
    altText: str = Field(description="The generated alt text")
    score: str = Field(
        description="The confidence score (x/10) of the generated alt text. The higher the score, the more confident the model is in the generated alt text."
    )


parser = PydanticOutputParser(pydantic_object=ModelOutput)


def save_pdf_file(file):
    logger.debug(f"Saving PDF file {file}")
    if not os.path.exists("files"):
        os.makedirs("files")
    if os.path.exists(os.path.join("files", file.name.replace(" ", "_"))):
        os.remove(os.path.join("files", file.name.replace(" ", "_")))
    with open(os.path.join("files", file.name.replace(" ", "_")), "wb") as f:
        f.write(file.getvalue())


def load_pdf(file_path):
    file_path = os.path.join("files", file_path).replace(" ", "_")
    loader = PyPDFLoader(file_path)
    data = loader.load()
    image_map = load_pdf_images(file_path)
    return data, image_map


def load_pdf_images(file_path):
    logger.debug(f"Loading PDF images from {file_path}")
    image_map = []
    pdf_file = fitz.open(file_path)
    images_path = os.path.join(file_path, "images").replace(".pdf", "_pdf")
    if not os.path.exists(images_path):
        os.makedirs(images_path)

    for page_index in range(len(pdf_file)):
        page = pdf_file[page_index]
        image_list = page.get_images(full=True)

        for image_index, img in enumerate(image_list):
            xref = img[0]
            base_image = fitz.Pixmap(pdf_file, xref)
            if base_image.colorspace.name not in (
                "DeviceGray",
                "DeviceRGB",
                "DeviceCMYK",
            ):
                base_image = fitz.Pixmap(fitz.csRGB, base_image)  # Convert to RGB

            image_bytes = base_image.tobytes("jpg")
            base64_image = base64.b64encode(image_bytes).decode("utf-8")

            # Check for duplicates before appending
            if not any(
                d["page"] == page_index and d["image_index"] == image_index
                for d in image_map
            ):
                image_map.append(
                    {
                        "page": page_index,
                        "image_index": image_index,
                        "image": base64_image,
                    }
                )
            else:
                logger.warning(
                    f"Duplicate image found on page {page_index + 1}, image index {image_index + 1}"
                )

    logger.debug(f"Returning image_map with {len(image_map)} unique images")
    return image_map


def prep_data_for_model(pdf_data, image_map) -> list:
    """
    Calls the LLM to generate alt text for the images
    The process is parallelized to improve performance
    returns:
        list: A list of results from the LLM calls
    """
    data = []
    print(f"Image map contains {len(image_map)} images")
    for image in image_map:
        page_num = image.get("page")
        start_page = max(0, page_num - 1)
        end_page = min(len(pdf_data), page_num + 2)
        page_context = pdf_data[start_page:end_page]
        page_content = "\n".join(str(item.page_content) for item in page_context)
        data.append(
            {
                "page": int(image.get("page")),
                "image_index": image.get("image_index"),
                "image": image.get("image"),
                "pages": page_content,
            }
        )
    return data


def run_inference(tasks, callback, pause_time=60, max_retries=5):
    logger.debug("Starting run_inference")
    try:
        results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            logger.debug("Submitting chains for execution")
            futures = {
                executor.submit(execute_chain, task): tuple(task.items())
                for task in tasks
            }
            retries = {tuple(task.items()): 0 for task in tasks}
            while futures:
                done, _ = concurrent.futures.wait(
                    futures, return_when=concurrent.futures.FIRST_COMPLETED
                )
                for future in done:
                    task_tuple = futures[future]
                    task = dict(task_tuple)  # Convert back to dictionary
                    try:
                        result = future.result()
                        results.append(result)
                        callback(result)
                        del futures[future]
                    except ClientError as e:
                        if e.response["Error"]["Code"] == "ThrottlingException":
                            retries[task_tuple] += 1
                            if retries[task_tuple] <= max_retries:
                                backoff_time = pause_time * (
                                    2 ** (retries[task_tuple] - 1)
                                )
                                logger.warning(
                                    f"Throttling exception encountered. Pausing for {backoff_time} seconds before retrying."
                                )
                                time.sleep(backoff_time)
                                futures[executor.submit(execute_chain, task)] = (
                                    task_tuple
                                )
                            else:
                                logger.error(
                                    f"Max retries reached for task {task}. Skipping."
                                )
                            del futures[future]
                        else:
                            logger.error(f"Error running inference (A): {e}")
                            raise e
                    except Exception as e:
                        logger.error(f"Error running inference (B): {e}")
                        raise e
        st.session_state["inference_completed"] = True
        return results
    except Exception as e:
        logger.error(f"Error running inference (C): {e}")
        raise e


def get_prompt(image, pages, parser):

    return HumanMessage(
        content=[
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": image,
                },
            },
            {
                "type": "text",
                "text": f"===PAGE TEXT START===\n {pages}\n===PAGE TEXT END===",
            },
            {
                "type": "text",
                "text": "Generate descriptive alt text for the image below. The alt text should be a brief description of the image content. You are provided the text on the page the image is placed for additional context.",
            },
            {
                "type": "text",
                "text": f"Output Formatting Instructions: {parser.get_format_instructions()}. Do not output any other text outside the formatted text.",
            },
        ]
    )


def execute_chain(task):
    """
    Returns a langchain chain for the LLM call
    """
    pages, image = task["pages"], task["image"]
    llm = ChatBedrock(model_id=MODEL_ID)
    prompt = get_prompt(image, pages, parser)
    response = llm.invoke([prompt])
    return parse_llm_response(response, task)


def parse_llm_response(llm_response, task):
    try:
        trimmed_response = strip_text_around_braces(llm_response.content)
        parsed_response = parser.parse(trimmed_response)
        time.sleep(1)
        return {
            "page": int(task["page"]),
            "image_index": task["image_index"],
            "alt_text": parsed_response.altText,
            "score": parsed_response.score,
            "image": f"data:image/jpeg;base64,{task['image']}",
            "metadata": llm_response.response_metadata,
        }
    except Exception as e:
        logger.error(f"Error parsing response: {e}")


def strip_text_around_braces(text):
    start_index = text.find("{")
    end_index = text.rfind("}")

    if start_index == -1 or end_index == -1 or start_index >= end_index:
        raise ValueError(
            "The input string must contain at least one '{' and one '}' with '{' before '}'"
        )

    return text[start_index : end_index + 1]
