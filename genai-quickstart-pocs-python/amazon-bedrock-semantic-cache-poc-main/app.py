import streamlit as st
from knowledge_base import answer_query
import pandas as pd
from semantic_cache import save_response, query_cache
from utils import lst_text_models, lst_embedding_models
from botocore.exceptions import ClientError

def main():
    st.title(f":rainbow[RAG with Amazon Bedrock and a Semantic Cache]")

    # List  models
    textmodels = lst_text_models()
    embeddingmodels = lst_embedding_models()

    st.sidebar.selectbox(
        label='Text Model',
        options=textmodels,
        index=textmodels.index(next(filter(lambda n: n.get('modelId') == 'anthropic.claude-3-5-sonnet-20240620-v1:0', textmodels))),
        format_func=lambda textmodel: textmodel['modelId'].split(".")[1],
        key='textmodel'
    )

    st.sidebar.selectbox(
        label='Embedding Model',
        options=embeddingmodels,
        index=embeddingmodels.index(next(filter(lambda n: n.get('modelId') == 'amazon.titan-embed-text-v2:0', embeddingmodels))),
        format_func=lambda embeddingmodel: embeddingmodel['modelId'].split(".")[1],
        key='embeddingmodel'
    )

    # Initialize message history in session state
    if "messages" not in st.session_state:
        st.session_state.messages = []

    # Display message history
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    st.balloons()

    # Handle user input
    if question := st.chat_input("Ask about your data stored in Amazon Knowledge Bases"):
        # Display user question
        with st.chat_message("user"):
            st.markdown(question)

        st.session_state.messages.append({"role": "user", "content": question})

        # Generate and display assistant response
        with st.chat_message("assistant"):
            message_placeholder = st.empty()
            with st.status("Determining the best possible answer!", expanded=False) as status:
                try:
                    # Check cache first
                    cached_answer = query_cache(question)
                    if cached_answer:
                        answer = cached_answer
                        message = "Question Answered from Cache"
                    else:
                        # If not in cache, query the knowledge base
                        answer = answer_query(question)
                        save_response(question, answer)
                        message = "Question Answered and Written to Cache"    
                except:
                    answer = "Throttled."
                    message = "Model is busy. Please try again later"

                # Display the answer and update status
                message_placeholder.markdown(f"{answer}")
                status.update(label=message, state="complete", expanded=False)

        # Add assistant response to message history
        st.session_state.messages.append({"role": "assistant", "content": answer})


if __name__ == "__main__":
    main()