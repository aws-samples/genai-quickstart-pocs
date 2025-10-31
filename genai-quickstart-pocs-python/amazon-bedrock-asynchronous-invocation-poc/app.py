import streamlit as st
import asyncio
from asynchronous_invocations import orchestrator
from timeit import default_timer as timer

# Title displayed on the streamlit web app
st.title(f""":rainbow[Bedrock Asynchronous Invocation Sample]""")
# configuring values for session state
if "messages" not in st.session_state:
    st.session_state.messages = []
# writing the message that is stored in session state
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
# adding some special effects from the UI perspective
st.balloons()
# evaluating st.chat_input and determining if a question has been input
if question := st.chat_input("Ask me about anything...and I will ask multiple models asynchronously!!"):
    # with the user icon, write the question to the front end
    with st.chat_message("user"):
        st.markdown(question)
    # append the question and the role (user) as a message to the session state
    st.session_state.messages.append({"role": "user",
                                      "content": question})
    # respond as the assistant with the answer
    with st.chat_message("assistant"):
        # making sure there are no messages present when generating the answer
        message_placeholder = st.empty()
        # starting a timer to time the latency to invoke all three models asynchronously
        start = timer()
        # invoking the orchestrator function to invoke all three models asynchronously
        answer = asyncio.run(orchestrator(question))
        # Ending the timer
        end = timer()
        # Calculating the latency to invoke all three models asynchronously
        time_length = round(end - start, 2)
        # Creating three columns to display the answer, model name, and latency for each model
        col1, col2, col3 = st.columns(3)
        # In column one display the answer, model name, and latency for the first model (Claude 3 - Sonnet)
        with col1:
            # Writing the answer/response from the model
            st.write(f"""**Answer:** {answer[0][0]}""")
            # Writing the model name
            st.write(f"""**Model Name:** {answer[0][1]}""")
            # Writing the latency
            st.write(f"""**Latency:** {answer[0][2]}""")
        # In column two display the answer, model name, and latency for the first model (Claude 3 - Haiku)
        with col2:
            # Writing the answer/response from the model
            st.write(f"""**Answer:** {answer[1][0]}""")
            # Writing the model name
            st.write(f"""**Model Name:** {answer[1][1]}""")
            # Writing the latency
            st.write(f"""**Latency:** {answer[1][2]}""")
        # In column three display the answer, model name, and latency for the first model (Claude 2.1)
        with col3:
            # Writing the answer/response from the model
            st.write(f"""**Answer:** {answer[2][0]}""")
            # Writing the model name
            st.write(f"""**Model Name:** {answer[2][1]}""")
            # Writing the latency
            st.write(f"""**Latency:** {answer[2][2]}""")
        # Creating a sidebar to display the latency of the asynchronous invocation, and the total time without an asynchronous invocation
        with st.sidebar:
            # Writing the latency with the asynchronous invocation
            st.markdown(f"""# **Total time without Asynchronous:**
            {round(float(answer[0][2] + answer[1][2] + answer[2][2]),4)} Seconds""")
            # Writing the latency with the asynchronous invocation
            st.markdown(f"""# **Total time with Asynchronous:**
            {time_length} Seconds """)
    # appending the final answer to the session state
    st.session_state.messages.append({"role": "assistant",
                                      "content": answer})