import streamlit as st
from task_classfication import llm_task_classification

# Header/Title for streamlit app
st.title(f""":rainbow[LLM for task classfication]""")

if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])


with st.sidebar:
    st.title("Instructions")
    st.markdown(
        '''
        This in an interface that handles processing of the 3 workflows below:
        1. Retrieve data from a SQL database &nbsp;
        2. Send/draft up emails &nbsp;
        3. Gather online documentations &nbsp; 

        To use this tool, give it a task that belongs to one of the three above with 
        relevant details, the interface will classify and initiate the workflow from input. 

        i.e: 
        * Fetch John Smith's shift data for the month of August. 
        * Send an email to my manager asking if I can take my PTO on the first Thursday of July. 
        * How can I use Claude Haiku with Amazon Bedrock APIs. 

        '''
    )

# Question and chat interface to input task classification 

if question := st.chat_input("Give me a task and I will find the most appropriate workflow for it"):
    with st.chat_message("user"):
        st.markdown(question)

    st.session_state.messages.append({
        "role":"user",
        "content": question
    })

    with st.chat_message("assistant"):
        message_placeholder = st.empty()

        class_tag, extra_content = llm_task_classification(question)
        # class_tag = parse_xml(model_output,"class")
        # extra_content = parse_xml(model_output,"extra")

        answer = st.write(class_tag)

        @st.experimental_dialog("Task workflow", width="large")
        
        def modal(class_tag, extra_content):
            st.write("Task:", class_tag)
            if 'SQL data retrieval' in class_tag:
                st.image('public/floppy_drive.png')
            elif 'Send an email' in class_tag:
                st.image('public/email-sent.png')
            elif 'Gather documentation':
                st.image('public/globe_map.png')

            st.write(extra_content)

        modal(class_tag, extra_content)

        

    st.session_state.messages.append({
        "role":"assistant",
        "content": answer
    })

    


    