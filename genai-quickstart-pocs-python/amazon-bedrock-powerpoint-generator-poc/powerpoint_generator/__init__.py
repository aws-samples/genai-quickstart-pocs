import logging
import logging.handlers
import sys


if logging.getLogger(__name__).hasHandlers():
    logging.getLogger(__name__).handlers.clear()
logging.getLogger(__name__).addHandler(logging.StreamHandler(sys.stdout))

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


from .generate import (
    generate_background_research_query,
    generate_powerpoint_sections,
    generate_base_slides_for_sections,
    generate_detailed_content_for_slides_in_sections,
)
from .research import (
    research_topic_background,
    research_slides_in_sections,
    research_details_for_sections,
)

from .documents import load_documents

from .powerpoint import generate_powerpoint_file
import time


def generate_powerpoint(
    topic: str,
    additional_info: str,
    callback,
    write_callback,
    background_data: list = None,
    research_wikipedia: bool = True,
) -> str:
    """
    Generate a PowerPoint presentation based on a given topic and additional information.
    """
    logger.info("Starting PowerPoint generation process")
    start_time = time.time()
    background_documents = None
    if background_data:
        logger.info("Extracting provided data to use with the presentation")
        if callback:
            callback("Extracting provided data to use with the presentation")
        background_documents = load_documents(background_data, write_callback)
    else:
        logger.info("No provided data to use with the presentation")
        callback(
            "No provided data to use with the presentation - will rely on research"
        )
    if callback:
        callback("Starting PowerPoint generation process")
        callback("Generating background research query")
    if research_wikipedia:
        background_research_query = generate_background_research_query(
            topic,
            additional_info,
            write_callback=write_callback,
            background_documents=background_documents,
        )
        if callback:
            callback("Researching topic background")
        background_research = research_topic_background(
            background_research_query,
            write_callback=write_callback,
        )
    else:
        background_research = []

    if callback:
        callback("Generating presentation sections")
    sections_to_research = generate_powerpoint_sections(
        topic,
        additional_info,
        background_research,
        write_callback=write_callback,
        background_documents=background_documents,
    )

    if callback and research_wikipedia:
        callback("Researching about each section")
    sections_with_research = research_details_for_sections(
        sections_to_research,
        write_callback=write_callback,
        research_wikipedia=research_wikipedia,
    )

    if callback:
        callback("Generating base details for each slide in each section")
    sections_with_base_slides = generate_base_slides_for_sections(
        topic,
        additional_info,
        sections_with_research,
        write_callback=write_callback,
        background_documents=background_documents,
    )

    if callback and research_wikipedia:
        callback("Researching details for every slide in each section")
    sections_with_base_slides_and_research = research_slides_in_sections(
        sections_with_base_slides,
        write_callback=write_callback,
        research_wikipedia=research_wikipedia,
    )

    if callback:
        callback("Generating detailed content for slides in each section")
    complete_sections_with_slides = generate_detailed_content_for_slides_in_sections(
        topic,
        additional_info,
        sections_with_base_slides_and_research,
        write_callback=write_callback,
        background_documents=background_documents,
    )
    if callback:
        callback("Generating PowerPoint file")
    file_path = generate_powerpoint_file(
        topic, complete_sections_with_slides, write_callback=write_callback
    )
    logger.info(f"PowerPoint presentation generated!")
    end_time = time.time()
    logger.info(f"Total time taken: {end_time - start_time} seconds")
    return file_path


if __name__ == "__main__":
    generate_powerpoint()
