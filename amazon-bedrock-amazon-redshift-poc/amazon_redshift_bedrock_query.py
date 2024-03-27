import os
from dotenv import load_dotenv
import yaml
from langchain.prompts.few_shot import FewShotPromptTemplate
from langchain.prompts.prompt import PromptTemplate
from langchain.sql_database import SQLDatabase
from langchain.chains.sql_database.prompt import PROMPT_SUFFIX, _postgres_prompt
from langchain.embeddings.huggingface import HuggingFaceEmbeddings
from langchain.llms import Bedrock
from langchain.prompts.example_selector.semantic_similarity import (
    SemanticSimilarityExampleSelector,
)
from langchain.vectorstores import Chroma
from langchain_experimental.sql import SQLDatabaseChain

# Loading environment variables
load_dotenv()
# configuring your instance of Amazon bedrock, selecting the CLI profile, modelID, endpoint url and region.
llm = Bedrock(
    credentials_profile_name=os.getenv("profile_name"),
    model_id="amazon.titan-text-express-v1",
    endpoint_url="https://bedrock-runtime.us-east-1.amazonaws.com",
    region_name="us-east-1",
    verbose=True
)


# Executing the SQL database chain with the users question
def redshift_answer(question):
    """
    This function collects all necessary information to execute the sql_db_chain and get an answer generated, taking
    a natural language question in and returning an answer and generated SQL query.
    :param question: The question the user passes in from the frontend
    :return: The final answer in natural langauge along with the generated SQL query.
    """
    # retrieving the final Redshift URI to initiate a connection with the database
    redshift_uri = get_redshift_uri()
    # formatting the Redshift URI and preparing it to be used with Langchain sql_db_chain
    db = SQLDatabase.from_uri(redshift_uri)
    # loading the sample prompts from SampleData/moma_examples.yaml
    examples = load_samples()
    # initiating the sql_db_chain with the specific LLM we are using, the db connection string and the selected examples
    sql_db_chain = load_few_shot_chain(llm, db, examples)
    # the answer created by Amazon Bedrock and ultimately passed back to the end user
    answer = sql_db_chain(question)
    # Passing back both the generated SQL query and the final result in a natural language format
    return answer["intermediate_steps"][1], answer["result"]


def get_redshift_uri():
    # SQLAlchemy 2.0 reference: https://docs.sqlalchemy.org/en/20/dialects/postgresql.html
    # URI format: postgresql+psycopg2://user:pwd@hostname:port/dbname
    """
    This function is used to build the Redshift URL and eventually used to connect to the database.
    :return: The full Redshift URL that is used to query against.
    """
    # setting the key parameters to build the Redshift connection string, these are stored in the .env file
    REDSHIFT_HOST = os.getenv('redshift_host')
    REDSHIFT_PORT = os.getenv('redshift_port')
    REDSHIFT_DATABASE = os.getenv('redshift_database')
    REDSHIFT_USERNAME = os.getenv('redshift_username')
    REDSHIFT_PASSWORD = os.getenv('redshift_password')

    # taking all the inputted parameters and formatting them in a finalized string
    REDSHIFT_ENDPOINT = f"redshift+psycopg2://{REDSHIFT_USERNAME}:{REDSHIFT_PASSWORD}@{REDSHIFT_HOST}:{REDSHIFT_PORT}/{REDSHIFT_DATABASE}"
    # returning the final Redshift URL that was built in the line of code above
    return REDSHIFT_ENDPOINT


def load_samples():
    """
    Load the sql examples for few-shot prompting examples
    :return: The sql samples in from the moma_examples.yaml file
    """
    # instantiating the sql samples variable
    sql_samples = None
    # opening our prompt sample file
    with open("Sampledata/moma_examples.yaml", "r") as stream:
        # reading our prompt samples into the sql_samples variable
        sql_samples = yaml.safe_load(stream)
    # returning the sql samples as a string
    return sql_samples


def load_few_shot_chain(llm, db, examples):
    """
    This function is used to load in the most similar prompts, format them along with the users question and then is
    passed in to Amazon Bedrock to generate an answer.
    :param llm: Large Language model you are using
    :param db: The Redshift database URL
    :param examples: The samples loaded from your examples file.
    :return: The results from the SQLDatabaseChain
    """
    # This is formatting the prompts that are retrieved from the SampleData/moma_examples.yaml
    example_prompt = PromptTemplate(
        input_variables=["table_info", "input", "sql_cmd", "sql_result", "answer"],
        template=(
            "{table_info}\n\nQuestion: {input}\nSQLQuery: {sql_cmd}\nSQLResult:"
            " {sql_result}\nAnswer: {answer}"
        ),
    )
    # instantiating the hugging face embeddings model to be used to produce embeddings of user queries and prompts
    local_embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    # The example selector loads the examples, creates the embeddings, stores them in Chroma (vector store) and a
    # semantic search is performed to see the similarity between the question and prompts, it returns the 3 most similar
    # prompts as defined by k
    example_selector = SemanticSimilarityExampleSelector.from_examples(
        examples,
        local_embeddings,
        Chroma,
        k=min(3, len(examples)),
    )
    # This is orchestrating the example selector (finding similar prompts to the question), example_prompt (formatting
    # the retrieved prompts, and formatting the chat history and the user input
    few_shot_prompt = FewShotPromptTemplate(
        example_selector=example_selector,
        example_prompt=example_prompt,
        prefix=_postgres_prompt + "Provide no preamble",
        suffix=PROMPT_SUFFIX,
        input_variables=["table_info", "input", "top_k"],
    )
    # Where the LLM, DB and prompts are all orchestrated to answer a user query.
    return SQLDatabaseChain.from_llm(
        llm,
        db,
        prompt=few_shot_prompt,
        use_query_checker=True,
        verbose=True,
        return_intermediate_steps=True,
    )
