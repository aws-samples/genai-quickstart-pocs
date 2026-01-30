from pydantic import BaseModel, Field
from langchain_core.documents import Document


class LLMResponseSlide(BaseModel):
    """
    Represents the response from the LLM model for defining a section
    """

    title: str = Field(..., description="The title of the section")
    research_query: str = Field(
        ..., description="The query to search for relevant information on Wikipedia"
    )


class LLMResponseSections(BaseModel):
    """
    Represents the response from the LLM model for defining a section
    """

    section_slides: list[LLMResponseSlide] = Field(
        ..., description="The sections of the presentation"
    )


class LLMResponseCompleteSlideContent(BaseModel):
    """
    Represents the response from the LLM model for a detailed slide
    """

    main_content: str = Field(
        ...,
        description="The main content of the slide that is presented to the audience. This content should be high-level bullet points, not sentences.",
    )
    presenter_notes: str = Field(
        ...,
        description="Detailed notes about the content of the slide to help the presenter understand what to present. This should include details of the content and also presentation style (including 'director notes')",
    )


class LLMResponseSectionBaseSlides(BaseModel):
    """
    Represents the response from the LLM model for defining a section
    """

    section_slides: list[LLMResponseSlide] = Field(
        ..., description="The sections of the presentation"
    )


class CompleteSlideContent(LLMResponseCompleteSlideContent, LLMResponseSlide):
    """
    Represents the return from slide generation, combining LLMResponseCompleteSlideContent and LLMResponseSlide
    """


class SectionWithResearch(LLMResponseSlide):
    """
    Represents a section with additional research details
    """

    research: list[Document] = Field(
        [], description="The research details for the section"
    )


class SlideWithBaseContentAndResearch(SectionWithResearch):
    """
    Represents a slide with base content and research details
    """

    pass  # Is the same as SectionWithResearch


class SectionWithBaseContentSlides(SectionWithResearch):
    """
    Represents a section with base content details
    """

    slides: list[LLMResponseSlide] = Field([], description="The slides for the section")


class SectionWithBaseContentSlidesWithResearch(SectionWithResearch):
    """
    Represents a section with base content details and research
    """

    slides: list[SlideWithBaseContentAndResearch] = Field(
        [], description="The slides for the section with research documents"
    )


class CompleteSectionWithSlides(BaseModel):
    """
    Represents a section with detailed slides
    """

    title: str = Field(..., description="The title of the section")
    slides: list[CompleteSlideContent] = Field(
        [], description="The detailed slides for the section"
    )
