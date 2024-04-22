import streamlit as st
from pathlib import Path
import os
from dotenv import load_dotenv
from analyze_images import analyze_image

# load environment variables
load_dotenv()
# title of the streamlit app
st.title(f""":rainbow[Image Analysis with Amazon Bedrock and Anthropic Claude 3]""")
# directions on what can be done with this streamlit app
st.header(f"""Directions to use this application:
1. Upload an image, and click the "Analyze Image" button.
2. Optionally, input a JSON spec to control image analysis prompt and return to specific attributes

""", divider='rainbow')
# default container that houses the image upload field
with st.container():
    # header that is shown on the web UI
    st.subheader('Image File Upload:')
    # the image upload field, the specific ui element that allows you to upload an image
    # when an image is uploaded it saves the file to the directory, and creates a path to that image
    File = st.file_uploader('Upload an Image', type=["png", "jpg", "jpeg"], key="new")
    # this is the text area that allows you to insert a custom JSON spec to control image analysis
    JSON_format = st.text_area("(optional)Insert your custom JSON spec to control image analysis")
    # this is the text that is shown on the front end, and is used as a default prompt
    text = f"Analyze this image in extreme detail. Please return a JSON response with the most relevant details of the image. If present, use this example JSON to categorize the image{JSON_format}"
    # this is the button that triggers the invocation of the model, processing of the image and/or question
    result = st.button("Analyze Image")
    # if the button is pressed, the model is invoked, and the results are output to the front end
    if result:
        # if an image is uploaded, a file will be present, triggering the image_to_text function
        if File is not None:
            # the image is displayed to the front end for the user to see
            st.image(File)
            # determine the path to temporarily save the image file that was uploaded
            save_folder = "./images"
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
                st.write(analyze_image(save_path, text))
                # removing the image file that was temporarily saved to perform the question and answer task
                os.remove(save_path)

