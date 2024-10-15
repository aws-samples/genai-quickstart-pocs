import logging
from langchain_core.documents import Document
from langchain_community.retrievers import WikipediaRetriever
from .models import (
    LLMResponseSlide,
    SectionWithResearch,
    SectionWithBaseContentSlides,
    SectionWithBaseContentSlidesWithResearch,
    SlideWithBaseContentAndResearch,
)


logger = logging.getLogger(__name__)


def research_topic_background(
    research_query: str, write_callback=None, research_wikipedia: bool = True
) -> list[Document]:
    if research_wikipedia:
        if write_callback:
            write_callback(
                f"Querying Wikipedia for Topic Background with query {research_query}"
            )
        logger.info(f"Querying Wikipedia for Topic Background; {research_query}")
        retriever = WikipediaRetriever()
        background_research = retriever.invoke(research_query)
        logger.info("Topic Background research retrieved.")
        return background_research
    else:
        return []


def research_details_for_sections(
    sections: list[LLMResponseSlide],
    write_callback=None,
    research_wikipedia: bool = True,
) -> list[SectionWithResearch]:
    """
    Research details for each section based on the provided sections.
    """
    if research_wikipedia:
        logger.info("Researching details for sections")
        if write_callback:
            write_callback("Researching details for sections")
        updated_sections = []
        for section in sections:
            logger.info(f"Researching details for section: {section.title}")
            if write_callback:
                write_callback(f"Researching details for section: {section.title}")
            retriever = WikipediaRetriever()
            details = retriever.invoke(section.research_query)
            updated_sections.append(
                SectionWithResearch(
                    title=section.title,
                    research_query=section.research_query,
                    research=details,
                )
            )
        logger.info("Details researched for all sections!")
        if write_callback:
            write_callback("Details researched for all sections")
        return updated_sections
    else:
        updated_sections = []
        for section in sections:
            updated_sections.append(
                SectionWithResearch(
                    title=section.title,
                    research_query=section.research_query,
                    research=[],
                )
            )
        return updated_sections


def research_slides_in_sections(
    sections: list[SectionWithBaseContentSlides],
    write_callback=None,
    research_wikipedia: bool = True,
) -> list[SectionWithBaseContentSlidesWithResearch]:
    """
    Research details for each slide within a section
    """
    if research_wikipedia:
        logger.info("Starting research on each slide within each section")
        if write_callback:
            write_callback("Researching details for each slide in each section")
        updated_sections: list[SectionWithBaseContentSlidesWithResearch] = []
        for section in sections:
            logger.info(f"Researching slides within section: {section.title}")
            if write_callback:
                write_callback(f"Researching slides within section: {section.title}")
            slides_with_research = []
            for slide in section.slides:
                if write_callback:
                    write_callback(f"Researching details for slide: {slide.title}")
                logger.info(f"Researching details for slide: {slide.title}")
                retriever = WikipediaRetriever()
                details = retriever.invoke(slide.research_query)
                slides_with_research.append(
                    SlideWithBaseContentAndResearch(
                        research=details,
                        research_query=slide.research_query,
                        title=slide.title,
                    )
                )
            updated_sections.append(
                SectionWithBaseContentSlidesWithResearch(
                    title=section.title,
                    slides=slides_with_research,
                    research_query=section.research_query,
                )
            )
        logger.info("Research completed for all slides within each section!")
        if write_callback:
            write_callback("Research completed for all slides within each section!")
        return updated_sections
    else:
        updated_sections = []
        for section in sections:
            slides_with_research = []
            for slide in section.slides:
                slides_with_research.append(
                    SlideWithBaseContentAndResearch(
                        research=[],
                        research_query=slide.research_query,
                        title=slide.title,
                    )
                )
            updated_sections.append(
                SectionWithBaseContentSlidesWithResearch(
                    title=section.title,
                    slides=slides_with_research,
                    research_query=section.research_query,
                )
            )
        return updated_sections
