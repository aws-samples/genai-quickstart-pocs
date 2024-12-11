import streamlit as st
from PIL import Image
from image_generation import image_generator
import base64
from datetime import datetime

st.title(f""":rainbow[Image Generation with Amazon Bedrock]""")

# configuring values for session state
if "messages" not in st.session_state:
    st.session_state.messages = []
# writing the message that is stored in session state
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        if "content" in message:
            st.markdown(message["content"])
        if "image" in message:
            st.image(base64.b64decode(message["image"]), caption=f"Generated Image - {message['modelId']}")

# Move model selection and checkbox to sidebar
with st.sidebar:
    st.subheader("Image Model Settings")
    st.selectbox(
        "Select a model", 
        ["amazon.nova-canvas-v1:0", "stability.sd3-large-v1:0"], 
        key="model_selection"
    )
    use_last_image = st.checkbox(
        "Include my last image with my next request. *Used to change color & style, while keeping image contents similar.*", 
        key="use_last_image"
    )
    st.divider()
    st.button("Clear Chat", on_click=lambda: [st.session_state.pop("messages", None), st.session_state.pop("last_image", None)])

# Chat input and image generation
if question := st.chat_input("Ask me to create you an image!"):
    with st.chat_message("user"):
        st.markdown(question)
    st.session_state.messages.append({"role": "user", "content": question})
    
    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        with st.spinner("Creating you an image!"):
            condition_image = None
            if st.session_state.get('last_image') and use_last_image:
                condition_image = st.session_state.last_image
            model_selected = st.session_state.model_selection
            image_bytes = image_generator(
                question, 
                modelId=model_selected,
                condition_image=condition_image
            )
            
            encoded_image = base64.b64encode(image_bytes).decode('utf-8')
            st.session_state.last_image = encoded_image
            
            st.session_state.messages.append({
                "role": "assistant",
                "content": "Generated Image:",
                "image": encoded_image,
                "modelId": model_selected,
            })
            
            st.image(image_bytes, caption=f"Generated Image - {model_selected}")
            st.success("Image created")
