import streamlit as st
import pandas as pd
import logging
from os import environ
from model_config import get_model_config
from strands import Agent
from strands_tools import file_read, python_repl
from tools import display_visualization

################################################
# Streamlit Config Section
################################################
# Configure the page
st.set_page_config(
    page_title="Business Analyst Assistant",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .chat-message {
        padding: 1rem;
        margin: 0.5rem 0;
        border-radius: 0.5rem;
        border-left: 4px solid #1f77b4;
        background-color: #f8f9fa;
    }
    .success-box {
        padding: 1rem;
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        border-radius: 0.25rem;
        color: #155724;
        margin: 1rem 0;
    }
    .error-box {
        padding: 1rem;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 0.25rem;
        color: #721c24;
        margin: 1rem 0;
    }
    section[sidebar="stSidebar"] {
            width: 400px !important;
    }
</style>
""", unsafe_allow_html=True)

# Initialize Streamlit session state
if "file_name" not in st.session_state:
    st.session_state.file_name = None
if "chosen_dataset" not in st.session_state:
    st.session_state.chosen_dataset = None
if "messages" not in st.session_state:
    st.session_state.messages = []

################################################
# Agent Config Section
################################################
# Set BYPASS_TOOL_CONSENT to 'True' to auto-accept requests from the agent to run things such as the Python REPL.
environ["BYPASS_TOOL_CONSENT"] = 'True'

# Set STRANDS_TOOL_CONSOLE_MODE to 'enabled'. In short, it makes the output in the console look nicer.
environ["STRANDS_TOOL_CONSOLE_MODE"] = 'enabled'

# Define agent's system prompt
SYSTEM_PROMPT="""
You are a business analyst assistant that operates as a strict tool-dependent analyst for CSV data, 
requiring all insights to come from actual tool calls rather than assumptions or generic analysis. 
If requested by the user, the assistant follows a mandatory workflow starting with dataset information gathering, 
then applying appropriate analysis tools (structure analysis, filtering/aggregation, visualization, insights generation) 
based on user needs, and finally delivering business-focused recommendations in professional yet accessible language. 
The core constraint is that no analysis can occur without examining real data through tools - the assistant must request CSV uploads 
when no data exists at location `./sample_data/`. Sample datasets to examine by the agent will only exist directly under `./sample_data/`.
Avoid assumptions about data content, and maintain transparency about limitations while providing actionable insights 
specifically tailored to the uploaded dataset rather than offering generic advice. Your first action should be to find 
out which dataset the user chose to analyze. Determine this result before proceeding. Write any results or artifacts for a particular 
sample dataset to the `sample_data/analysis_results/` path in this repository. Add a prefix to the file names you create 
with the name of the file that is being analyzed without the file extension. Do not read, alter, delete, or create files outside of this repository.
Do not write outputs unless the user requests it. It is imperative that do not provide more information or perform more actions 
than what the user is requesting. If you want to do more than the user is asking, ask them if you are allowed.
"""

# Which tools are available to the agent?
TOOLS = [file_read, python_repl, display_visualization]

# Define the model configuration for the agent
# Found in the model_config.py file in this repo
MODEL_CONFIG = get_model_config()

# Configure the root strands logger
# Uncomment the block below to enable DEBUG logs.
# logging.getLogger("strands").setLevel(logging.DEBUG)
# logging.basicConfig(
#     format="%(levelname)s | %(name)s | %(message)s",
#     handlers=[logging.StreamHandler()]
# )

if "agent" not in st.session_state:
    st.session_state.agent = Agent(
        model=MODEL_CONFIG,
        system_prompt=SYSTEM_PROMPT,
        tools=TOOLS
    )

################################################
# Main Function - App Logic Implemented Here
################################################
def main():
    # Custom Header
    st.markdown(
        '<div class="main-header">📊 Business Analyst Agent</div>',
        unsafe_allow_html=True
        )
    st.markdown(
        "<div style='text-align: center'>Powered by Strands Agents SDK -- Choose your dataset and ask questions in natural language!</div>",
        unsafe_allow_html=True
    )
    st.write("")
    # Agent Disclaimer Expander
    with st.expander("🤖 Agent Disclaimer - Please Read"):
        st.markdown("""
            ### ⚠️ Please read ⚠️
            This agent leverages tools that can:
            1. Arbitrarily run Python code on your machine (via Python REPL)
            2. Read files on your computer
            3. Edit files
            
            The agent has been instructed to only read and edit files local to the repository. However, you can build the included
            Dockerfile and run this in a container, if that makes you more comfortable.
            
            If you would like to remove the ability to test and run python code, simply remove the `python_repl` tool
            from the agent's `tool` parameter in the `initialize_agent` function in `app.py`.
                 
            It is always best practice to read and understand the code you are executing. Comments have been added, where
            possible, to increase readability.
            """)


    st.write("---")
    
    # Sidebar for file upload and configuration
    with st.sidebar:
        st.header("📁 Choose your dataset", divider="red")

        st.session_state.chosen_dataset = st.selectbox(
            "Which dataset would you like to analyze?",
            (
                "ecommerce_sales.csv",
                "employee_analytics.csv",
                "marketing_campaigns.csv",
                "support_tickets.csv"
            ),
            format_func=lambda x: x.replace("_", " ").split(".")[0],
            index=None,
            placeholder="Select..." 
        )

        if st.session_state.chosen_dataset is not None:
            try:
                # Read the CSV and show preview and data shape details
                chosen_file = "sample_data/" + st.session_state.chosen_dataset
                df = pd.read_csv(chosen_file)
                
                st.markdown('<div class="success-box">✅ File uploaded successfully!</div>', unsafe_allow_html=True)
                st.write(f"**Data Shape:** {df.shape[0]} rows × {df.shape[1]} columns")
                
                # Show preview
                with st.expander("Preview Data"):
                    st.dataframe(df.head())
                
            except Exception as e:
                st.markdown(f'<div class="error-box">❌ Error reading file: {str(e)}</div>', unsafe_allow_html=True)
        
        # Sample questions
        if st.session_state.chosen_dataset is not None:
            st.write("---")
            st.header("💡 Try These Questions")
            sample_questions = [
                "What are the key insights from this data?",
                "Show me the correlation between columns",
                "Create one simple visualization of the data",
                "Give me a 100 word summary of the dataset",
                "What patterns do you see in the data?",
                "List files directly under the sample_data directory."
            ]
            
            for question in sample_questions:
                st.code(f'''{question}''', language=None, wrap_lines=True)

        st.write("---")
        st.info("""ℹ️ This agent writes artifacts and images to the `sample_data/analysis_results/` path in this repo. 
        You might want to delete it when you're done!""")

    st.subheader("💬 Chat with Your Data")

    # Display old chat messages
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.empty()
            if message.get("type") == "tool_use":
                with st.expander("🛠️ Using Tool... ", expanded=False):
                    st.code(message["content"])
            elif message.get("type") == "reasoning":
                with st.expander("🧠 Reasoning...", expanded=False):
                    st.markdown(message["content"])
            else:
                st.markdown(message["content"])
    
    # Chat input
    if st.session_state.chosen_dataset is not None:
        if prompt := st.chat_input("Ask me anything about your data..."):

            # Add user message with supplemental information
            st.session_state.messages.append({"role": "user", "content": prompt})

            # Clear previous tool usage details
            if "details_placeholder" in st.session_state:
                st.session_state.details_placeholder.empty()

            
            # Display user message
            with st.chat_message("user"):
                st.markdown(prompt)

            # Prepare containers for response
            with st.chat_message("assistant"):
                st.session_state.details_placeholder = st.empty()  # Create a new placeholder

            # Initialize strings to store streaming of model output
            st.session_state.output = []

            # Create the callback handler to display streaming responses
            def custom_callback_handler(**kwargs):
                def add_to_output(output_type, content, append = True):
                    if len(st.session_state.output) == 0:
                        st.session_state.output.append({"type": output_type, "content": content})
                    else:
                        last_item = st.session_state.output[-1]
                        if last_item["type"] == output_type:
                            if append:
                                st.session_state.output[-1]["content"] += content
                            else:
                                st.session_state.output[-1]["content"] = content
                        else:
                            st.session_state.output.append({"type": output_type, "content": content})

                with st.session_state.details_placeholder.container():
                    current_streaming_tool_use = ""
                    # Process stream data
                    if "data" in kwargs:
                        add_to_output("data", kwargs["data"])
                    elif "current_tool_use" in kwargs and kwargs["current_tool_use"].get("name"):
                        tool_use_id = kwargs["current_tool_use"].get("toolUseId")
                        current_streaming_tool_use = kwargs["current_tool_use"]["name"] + " with args: " + str(kwargs["current_tool_use"]["input"])
                        add_to_output("tool_use", current_streaming_tool_use, append = False)
                    elif "reasoningText" in kwargs:
                        add_to_output("reasoning", kwargs["reasoningText"])

                    # Display output
                    for output_item in st.session_state.output:
                        if output_item["type"] == "data":
                            st.markdown(output_item["content"])
                        elif output_item["type"] == "tool_use":
                            with st.expander("🛠️ Using Tool...", expanded=True):
                                st.code(output_item["content"])
                        elif output_item["type"] == "reasoning":
                            with st.expander("🧠 Reasoning...", expanded=True):
                                st.markdown(output_item["content"])

            # Set callback handler into the agent
            st.session_state.agent.callback_handler = custom_callback_handler

            # Get response from agent
            response = st.session_state.agent(prompt + f""". Do nothing else. For the agent's context, the user has
                                                        chosen file {st.session_state.chosen_dataset}""")

            # When done, add assistant messages to chat history
            for output_item in st.session_state.output:
                st.session_state.messages.append({"role": "assistant", "type": output_item["type"] , "content": output_item["content"]})


    elif st.session_state.chosen_dataset is None:
        st.info("👈 Please choose a dataset in the sidebar to get started!")


if __name__ == "__main__":
    main()