import streamlit as st
from pathlib import Path
import os
from dotenv import load_dotenv
from llm_multi_modal_invoke import image_to_text, text_to_text

# load environment variables
load_dotenv()
# title of the streamlit app
st.title(f""":rainbow[Multi-Modal with Amazon Bedrock and Anthropic Claude 3]""")
# directions on what can be done with this streamlit app
st.header(f"""Directions to use this application:
You have several options when it comes to leveraging Claude 3, you can either:
1. Upload an image, and ask a specific question about it by inserting the question into the text box.
2. Upload an image, and let the model describe the image without inserting text.
3. Insert a question in the text box, and let the model answer the question directly without uploading an image.

""", divider='rainbow')
# default container that houses the image upload field
with st.container():
    # header that is shown on the web UI
    st.subheader('Image File Upload:')
    # the image upload field, the specific ui element that allows you to upload an image
    # when an image is uploaded it saves the file to the directory, and creates a path to that image
    File = st.file_uploader('Upload an Image', type=["png", "jpg", "jpeg"], key="new")
    # this is the text box that allows the user to insert a question about the uploaded image or a question in general
    text = st.text_input("Do you have a question about the image? Or about anything in general?")
    # this is the button that triggers the invocation of the model, processing of the image and/or question
    result = st.button("Process Image or Answer Question or Both!")
    # if the button is pressed, the model is invoked, and the results are output to the front end
    if result:
        # if an image is uploaded, a file will be present, triggering the image_to_text function
        if File is not None:
            # the image is displayed to the front end for the user to see
            st.image(File)
            # determine the path to temporarily save the image file that was uploaded
            save_folder = os.getenv("save_folder")
            # create a posix path of save_folder and the file name
            save_path = Path(save_folder, File.name)
            # write the uploaded image file to the save_folder you specified
            with open(save_path, mode='wb') as w:
                w.write(File.getvalue())
            # once the save path exists...
            if save_path.exists():
                # write a success message saying the image has been successfully saved
                st.success(f'Image {File.name} is successfully saved!')
                # running the image to text task, and outputting the results to the front end
                st.write(image_to_text(File.name, text))
                # removing the image file that was temporarily saved to perform the question and answer task
                os.remove(save_path)
        # if an Image is not uploaded, but a question is, the text_to_text function is invoked
        else:
            # running a text to text task, and outputting the results to the front end
            st.write(text_to_text(text))