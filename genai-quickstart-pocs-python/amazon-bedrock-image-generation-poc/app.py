import streamlit as st
from PIL import Image
from image_generation import image_generator

st.title(f""":rainbow[Image Generation with Amazon Bedrock]""")

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
if question := st.chat_input("Ask me to create you an image!"):
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
        with st.spinner("Creating you an image!"):
            # answer placeholder to save in the session state
            answer = "Generated Image:"
            # passing the question into the image generation function, which later invokes the llm
            image_path = image_generator(question)
            # after the LLM has created an image, it returns a path to where it is saved locally
            # access that image by using Image.open and giving it the path of the created image
            generated_image = Image.open(image_path)
            # Writing to the front-end "Generated Image:"
            message_placeholder.markdown(f"{answer}")
            # displaying the image to the front end of the streamlit app
            st.image(generated_image, caption="Generated Image")
            # writing a success message to the front-end after the image was created and displayed
            st.success("Image created")
    # appending the results to the session state
    st.session_state.messages.append({"role": "assistant",
                                      "content": answer})
