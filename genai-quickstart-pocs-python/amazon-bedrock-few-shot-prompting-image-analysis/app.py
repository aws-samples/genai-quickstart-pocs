# Import the Streamlit library for creating web applications
import streamlit as st

# Import custom functions from banana module for XML parsing and image processing
from banana import parse_xml, image_to_text

# Configure the Streamlit page with a title and icon
st.set_page_config(page_title="Few Shot Image Prompting Image Analysis", page_icon=":tada")
# Display main header text
st.header("Few Shot Image Prompting Image Analysis")
# Display subheader text
st.subheader("Grocery Store Manager - Inventory")

    
# Create a container to group related elements    
with st.container():    
    # Create a file upload widget for image selection
    uploaded_file = st.file_uploader("Choose an Image")
    # Create a button that triggers image processing
    result=st.button("Process Image")
    # If button is clicked, process the image
    if result:
        # Get filename of uploaded file
        file_name = uploaded_file.name
        # Get file type/mime type of uploaded file
        file_type = uploaded_file.type
        # Display the filename
        st.write(file_name)
        # Display the file type
        st.write(file_type)
        # Display the uploaded image
        st.image(uploaded_file)
        # Process image and convert to text using custom function
        results = image_to_text(uploaded_file, file_type)
        # Extract scratchpad info from results XML
        scratchpad = parse_xml(results, "scratchpad")
        # Extract shelf fullness info from results XML
        fullness = parse_xml(results, "banana_shelf_fullness")
        # Extract strange item info from results XML
        strange_item = parse_xml(results, "strange_item")
        # Display scratchpad results
        st.write(f"scratchpad: {scratchpad}")
        # Display shelf fullness results
        st.write(f"fullness: {fullness}")
        # Display strange item results
        st.write(f"strange_item: {strange_item}")
        
        # Display raw results
        st.write(results)








