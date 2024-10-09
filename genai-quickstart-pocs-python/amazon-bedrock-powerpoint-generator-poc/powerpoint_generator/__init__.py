from langchain_aws import ChatBedrockConverse
from pydantic import BaseModel, Field
from langchain_core.output_parsers import PydanticOutputParser, StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_community.retrievers import WikipediaRetriever


class PowerPointSlide(BaseModel):
    title: str = Field(..., description="Title of the slide")
    content: str = Field(..., description="Content of the slide")
    wiki_search_query: str = Field(
        ...,
        description="The query to search for relevant information for the specific slide on Wikipedia",
    )


class PowerPointPresentation(BaseModel):
    title: str = Field(..., description="Title of the presentation")
    slides: list[PowerPointSlide] = Field(
        ..., description="List of slides in the presentation"
    )


def generate_powerpoint():
    topic = "Should Human Rights Universal?"
    additional_info = "The topic is important because it focuses on universal access to justice and equality for all."
    background_research = get_background_research(topic, additional_info)
    base_presentation = generate_powerpoint_content(
        topic, additional_info, background_research
    )
    print(base_presentation)


def get_background_research(topic, additional_info):
    parser = StrOutputParser()
    prompt = PromptTemplate(
        template="""
    You are a specialist in creating PowerPoint presentations.
    Your goal is to generate a string query to search for relevant information on Wikipedia.
    The topic for the presentation is {topic}.
    Here's some additional information to help you get started:
    <AdditionalInfo>
    {additional_info}
    </AdditionalInfo>
    ---- End of Additional Info ----
    You should output a plaintext string query that can be used to search for relevant information on Wikipedia.
    You should only output the query, nothing else. Do not add formatting. 
    """,
        input_variables=["topic", "additional_info"],
    )
    llm = ChatBedrockConverse(model="anthropic.claude-3-sonnet-20240229-v1:0")
    chain = prompt | llm | parser
    print("Generating background research query...")
    query = chain.invoke({"topic": topic, "additional_info": additional_info})
    print("Querying Wikipedia...")
    retriever = WikipediaRetriever()
    background_research = retriever.invoke(query)
    return background_research


def generate_powerpoint_content(topic, additional_info, background_research):
    parser = PydanticOutputParser(pydantic_object=PowerPointPresentation)
    prompt = PromptTemplate(
        template="""
    You are a specialist in creating PowerPoint presentations.
    Your goal is to generate rich powerpoint presentations that deliver the message effectively.
    The topic for the presentation is {topic}.
    Here's some additional information to help you get started:
    <AdditionalInfo>
    {additional_info}
    </AdditionalInfo>

    Here's some background research to help you get started:
    <BackgroundResearch>
    {background_research}
    </BackgroundResearch>
    The information should be structured to be usable in a PowerPoint presentation.
    There should be a title for the presentation. 
    Each slide should have a title and content.
    Format the output as a JSON object following this structure:
    {format_instructions}
    Follow the format strictly, no exceptions.
    """,
        partial_variables={"format_instructions": parser.get_format_instructions()},
        input_variables=["topic", "additional_info", "background_research"],
    )
    llm = ChatBedrockConverse(model="anthropic.claude-3-sonnet-20240229-v1:0")
    chain = prompt | llm | parser
    print("Generating PowerPoint content...")
    response: PowerPointPresentation = chain.invoke(
        {
            "topic": topic,
            "additional_info": additional_info,
            "background_research": background_research,
        }
    )
    return response

def generate_powerpoint_file(presentation: PowerPointPresentation):
    print("Generating PowerPoint file...")
    # Code to generate PowerPoint file goes here
    print("PowerPoint file generated successfully!")
