import streamlit as st

from banana import parse_xml, image_to_text

st.set_page_config(page_title="Few Shot Image Prompting Image Analysis", page_icon=":tada")
st.header("Few Shot Image Prompting Image Analysis")
st.subheader("Grocery Store Manager - Inventory")

    
    
    
with st.container():    
    #Streamlit workflow
    uploaded_file = st.file_uploader("Choose an Image")
    result=st.button("Process Image")
    if result:
        file_name = uploaded_file.name
        file_type = uploaded_file.type
        st.write(file_name)
        st.write(file_type)
        st.image(uploaded_file)
        # results = image_to_text(file_name, file_type)
        results = image_to_text(uploaded_file, file_type)
        # produce_group = parse_xml(results, "produce_group")
        scratchpad = parse_xml(results, "scratchpad")
        fullness = parse_xml(results, "banana_shelf_fullness")
        strange_item = parse_xml(results, "strange_item")
        # st.write(f"produce_group: {produce_group}")
        st.write(f"scratchpad: {scratchpad}")
        st.write(f"fullness: {fullness}")
        st.write(f"strange_item: {strange_item}")
        
        st.write(results)








