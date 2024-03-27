import streamlit as st
from prompt_finder_and_invoke_llm import prompt_finder
from chat_history_prompt_generator import chat_history

# Title displayed on the streamlit web app
st.title(f""":rainbow[Bedrock Chat]""")

# configuring values for session state
if "messages" not in st.session_state:
    st.session_state.messages = []
    open("chat_history.txt", "w").close()
# writing the message that is stored in session state
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
# adding some special effects from the UI perspective
st.balloons()
# evaluating st.chat_input and determining if a question has been input
if question := st.chat_input("Ask me about anything...but actually...anything..."):
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
        # putting a spinning icon to show that the query is in progress
        with st.status("Determining the best possible answer!", expanded=True) as status:
            # passing the question into the kendra search function, which later invokes the llm
            answer = prompt_finder(question)
            # writing the answer to the front end
            message_placeholder.markdown(f"{answer}")
            # showing a completion message to the front end
            status.update(label="Question Answered...", state="complete", expanded=False)
    # appending the results to the session state
    st.session_state.messages.append({"role": "assistant",
                                      "content": answer})
    # invoking that chat_history function in the chat_history_prompt_generator.py file to format past questions and
    # answers and dynamically add them to future prompt
    chat_history(st.session_state)
