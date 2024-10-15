import logging
from langchain_aws import ChatBedrockConverse
from langchain_core.documents import Document
from langchain_core.output_parsers import PydanticOutputParser, StrOutputParser
from langchain_core.prompts import PromptTemplate
from .models import (
    LLMResponseSlide,
    SectionWithResearch,
    SectionWithBaseContentSlides,
    SectionWithBaseContentSlidesWithResearch,
    LLMResponseCompleteSlideContent,
    CompleteSectionWithSlides,
    CompleteSlideContent,
    LLMResponseSections,
    LLMResponseSectionBaseSlides,
)


logger = logging.getLogger(__name__)


def generate_background_research_query(
    topic, additional_info, write_callback=None, background_documents: list = None
) -> str:
    """
    Generate a string query to search for relevant information on Wikipedia based on the topic and additional information provided.
    """
    parser = StrOutputParser()
    input_arguments = {"topic": topic, "additional_info": additional_info}
    prompt_template = """
    You are a specialist in creating PowerPoint presentations.
    Your goal is to generate a string query to search for relevant information on Wikipedia.
    The topic for the presentation is {topic}.
    Here's some additional information to help you get started:
    <AdditionalInfo>
    {additional_info}
    </AdditionalInfo>
    ---- End of Additional Info ----
    """
    if background_documents:
        prompt_template += """
        Here's some background research to help you get started:
        <BackgroundResearch>
        {background_documents}
        </BackgroundResearch>
        """
        input_arguments["background_documents"] = background_documents

    prompt_template += """You should output a plaintext string query that can be used to search for relevant information on Wikipedia.
    You should only output the query, nothing else. Do not add formatting. 
    """

    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=input_arguments.keys(),
    )
    llm = ChatBedrockConverse(model="anthropic.claude-3-haiku-20240307-v1:0")
    chain = prompt | llm | parser
    if write_callback:
        write_callback("Generating background research wiki query")
    logger.info("Generating background research query...")
    query = chain.invoke(input_arguments)

    if write_callback:
        write_callback(f'Background research wiki query is "{query}"')
    return query


def generate_powerpoint_sections(
    topic: str,
    additional_info: str,
    background_research: list[Document],
    write_callback=None,
    background_documents: list = None,
) -> list[LLMResponseSlide]:
    """
    Generate high-level sections for a PowerPoint presentation based on the provided topic, additional information, and background research.
    """
    parser = PydanticOutputParser(pydantic_object=LLMResponseSections)
    input_arguments = {
        "topic": topic,
        "additional_info": additional_info,
        "background_research": background_research,
    }
    prompt_template = """
    You are a specialist in creating PowerPoint presentations.
    Your goal is to generate rich powerpoint presentations that deliver the message effectively.
    You are tasked to create the section for the presentation.
    Section slides are used to introduce new topics.
    Multiple content slides will eventually be created for each section.
    Sections should be used to break up the presentation into core topics.
    Slides should have quality content that is meaningful.
    Presentations should have a minimum of 3 sections and a maximum of 15 sections.
    The topic for the presentation is {topic}.
    Here's some additional information to help you get started:
    <AdditionalInfo>
    {additional_info}
    </AdditionalInfo>"""

    if background_documents:
        prompt_template += """
        Here's some background info provided to help you get started:
        <ProvidedBackgroundInfo>
        {background_documents}
        </ProvidedBackgroundInfo>
        """
        input_arguments["background_documents"] = background_documents

    prompt_template += """
    Here's some background research to help you get started:
    <BackgroundResearch>
    {background_research}
    </BackgroundResearch>"""

    if background_documents:
        prompt_template += """
        The ProvidedBackgroundInfo should carry more weight than the BackgroundResearch.
        """

    prompt_template += """The information should be structured to be usable in a PowerPoint presentation.
    Each section should contain a title to the section and a query to be used with Wikipedia to research additional details about the section.
    Format the output as a JSON object following this structure:
    {format_instructions}
    Only output the instructed JSON object and nothing else.
    Follow the format strictly, no exceptions.
    """
    prompt = PromptTemplate(
        template=prompt_template,
        partial_variables={"format_instructions": parser.get_format_instructions()},
        input_variables=input_arguments.keys(),
    )
    llm = ChatBedrockConverse(model="anthropic.claude-3-haiku-20240307-v1:0")
    chain = prompt | llm | parser
    logger.info("Generating PowerPoint content...")
    if write_callback:
        write_callback("Generating presentation sections topics")
    response: LLMResponseSections = chain.invoke(input_arguments)
    if write_callback:
        write_callback(
            f"Presentation sections are {",".join([section.title for section in response.section_slides])}"
        )
    return response.section_slides


def generate_base_slides_for_sections(
    topic: str,
    additional_info: str,
    sections: list[SectionWithResearch],
    write_callback=None,
    background_documents: list = None,
) -> list[SectionWithBaseContentSlides]:
    """
    Generate base content for each section of a PowerPoint presentation based on the provided sections.
    """
    if write_callback:
        write_callback("Generating base slide content for sections")
    logger.info("Generating slides base content for sections")
    slides_with_base_content = []
    parser = PydanticOutputParser(pydantic_object=LLMResponseSectionBaseSlides)
    input_arguments = {
        "topic": topic,
        "additional_info": additional_info,
        "section_title": None,
        "background_research": None,
        "section_titles": None,
    }
    prompt_template = """
    You are an AI specialist in creating PowerPoint Presentations.
    Your goal is to generate quality content and research queries for the provided section.
    You should create between 1 and 5 slides of content for the section. 
    The section is one of multiple sections within the presentation. 
    You need to create a title and a research query for each slide, which will be used to query Wikipedia.
    The presentation's topic is {topic}.
    The user provided this additional input:
    <AdditionalInput>
    {additional_info}
    </AdditionalInput>
    The current section is {section_title}."""
    if background_documents:
        prompt_template += """
        Here's some background info provided to help you get started:
        <ProvidedBackgroundInfo>
        {background_documents}
        </ProvidedBackgroundInfo>
        """
        input_arguments["background_documents"] = background_documents
        
    prompt_template += """The current section has the following research for background:
    <BackgroundResearch>
    {background_research}
    </BackgroundResearch>"""

    if background_documents:
        prompt_template += """
        The ProvidedBackgroundInfo should carry more weight than the BackgroundResearch.
        """

    prompt_template += """The full list of sections included in the presentation is:
    <Sections>
    {section_titles}
    </Sections>

    Generate the title and queries for each slide needed in the section. 
    Follow these formatting instructions:
    <FormatInstructions>
    {format_instructions}
    </FormatInstructions>
    Only output the instructed JSON object and nothing else.
    Follow the format strictly, no exceptions.
    """
    prompt = PromptTemplate(
        template=prompt_template,
        partial_variables={"format_instructions": parser.get_format_instructions()},
        input_variables=input_arguments.keys(),
    )
    llm = ChatBedrockConverse(model="anthropic.claude-3-haiku-20240307-v1:0")
    chain = prompt | llm | parser
    logger.info("Starting base slide generation for sections.")
    for section in sections:
        logger.info(f"Generating base slides for {section.title}")
        if write_callback:
            write_callback(f"Generating base slides for {section.title}")

        section_input_arguments = input_arguments
        section_input_arguments["section_title"] = section.title
        section_input_arguments["background_research"] = section.research
        section_input_arguments["section_titles"] = ", ".join([s.title for s in sections])
        section_response: LLMResponseSectionBaseSlides = chain.invoke(
            section_input_arguments
        )
        slides_with_base_content.append(
            SectionWithBaseContentSlides(
                title=section.title,
                research_query=section.research_query,
                slides=section_response.section_slides,
            )
        )

    return slides_with_base_content


def generate_detailed_content_for_slides_in_sections(
    topic: str,
    additional_info: str,
    sections: list[SectionWithBaseContentSlidesWithResearch],
    write_callback=None,
    background_documents: list = None,
) -> list[CompleteSectionWithSlides]:
    """
    Generate detailed content for each slide in each section of a PowerPoint presentation based on the provided sections.
    """
    logger.info("Generating detailed content for slides in sections")
    if write_callback:
        write_callback("Generating detailed content for slides in sections")
    parser = PydanticOutputParser(pydantic_object=LLMResponseCompleteSlideContent)
    llm = ChatBedrockConverse(model="anthropic.claude-3-haiku-20240307-v1:0")
    input_arguments = {
        "topic": topic,
        "additional_info": additional_info,
        "section_title": None,
        "section_research": None,
        "slide_title": None,
        "slide_research": None,
    }
    prompt_template = """
    You are an AI specialist in creating PowerPoint Presentations.
    Your goal is to generate quality content for a specific PowerPoint slide within the presentation.
    The main content (main_content) should be the content that is presented to the audience. 
    You should aim to keep the main_content high-level and depend on the presenter to dive in, define, and explain. 
    You can have bullet point topics or very short sentences.
    Start each new line/bullet with ">>" and no other symbols or formatting.
    <Example>
    ">> Bullet text\n>> Another Bullet text"
    </Example>
    <Example>
    ">> Main item - short additional text\n>> Another main item"
    </Example>
    The presenter notes (presenter_notes) should be as detailed as possible. 
    The presenter notes should enable the presenter to fully understand the content they need to present.
    The presenter notes should also include suggestions on presenting the slide. 
    The PowerPoint presentation topic is: {topic}
    The user provided this additional information:
    <AdditionalInformation>
    {additional_info}
    </AdditionalInformation>
    The current section title is: {section_title}"""

    if background_documents:
        prompt_template += """
        Here's some background info provided to help you get started:
        <ProvidedBackgroundInfo>
        {background_documents}
        </ProvidedBackgroundInfo>
        """
        input_arguments["background_documents"] = background_documents

    prompt_template += """The current section has the following research:
    <SectionResearch>
    {section_research}
    </SectionResearch>
    The current slide is titled: {slide_title}
    The current slide has the following research:
    <SlideResearch>
    {slide_research}
    </SlideResearch>"""

    if background_documents:
        prompt_template += """
        The ProvidedBackgroundInfo should carry more weight than the SectionResearch and SlideResearch.
        """

    prompt_template += """Generate the main content and presenter notes for the slide.
    Follow these formatting instructions:
    <FormatInstructions>
    {format_instructions}
    </FormatInstructions>
    Only output the instructed JSON object and nothing else.
    Follow the format strictly, no exceptions.
    """
    prompt = PromptTemplate(
        template=prompt_template,
        partial_variables={"format_instructions": parser.get_format_instructions()},
        input_variables=input_arguments.keys(),
    )
    chain = prompt | llm | parser
    updated_sections: list[CompleteSectionWithSlides] = []
    for section in sections:
        logger.info(f"Generating content for section: {section.title}")
        if write_callback:
            write_callback(f"Generating content for slides in section {section.title}")
        slides_with_content: list[CompleteSlideContent] = []
        for slide in section.slides:
            logger.info(
                f"Section {section.title}: Generating slide content for {slide.title}"
            )
            if write_callback:
                write_callback(f"Generating content for slide {slide.title}")
            section_arguments = input_arguments.copy()
            section_arguments["section_title"] = section.title
            section_arguments["section_research"] = section.research_query
            section_arguments["slide_title"] = slide.title
            slide_content: LLMResponseCompleteSlideContent = chain.invoke(
                section_arguments
            )
            slides_with_content.append(
                CompleteSlideContent(
                    main_content=slide_content.main_content,
                    presenter_notes=slide_content.presenter_notes,
                    research_query=slide.research_query,
                    title=slide.title,
                    section=section,
                )
            )
        updated_sections.append(
            CompleteSectionWithSlides(
                title=section.title,
                research=section.research,
                slides=slides_with_content,
            )
        )
    if write_callback:
        write_callback("Content generated for all slides in all sections!")
    logger.info("Content generated for all slides in all sections!")
    return updated_sections
