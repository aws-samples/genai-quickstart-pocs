import streamlit as st
from strands import tool

@tool
def display_visualization(relative_file_path: str, visual_title: str) -> None:
    """
    Takes in a file path and renders streamlit object so the agent can show it
    :arg relative_file_path - file path relative to the python script being run ("app.py")
    :arg visual_title - title of the visual to be used for streamlit expander the visual is rendered using.
    return None
    """
    if relative_file_path.lower().endswith(('.png', '.jpg', '.jpeg')):
        try:
            with st.expander(visual_title, expanded=True):
                st.image(relative_file_path)
        except Exception as e:
            print("There was a problem displaying the image. Is the file path correct?")
            print(e)
    else:
        print("Error: File isn't an image or visualization.")

    return None