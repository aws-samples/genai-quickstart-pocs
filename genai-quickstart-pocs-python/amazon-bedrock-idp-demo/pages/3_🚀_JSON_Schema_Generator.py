import streamlit as st
import json
from typing import Dict, List, Any
from PIL import Image
import base64
from utils.utils_streamlitApp import *

image_path = "./assets/Banner_1.jpg"
site_icon=Image.open("./assets/IDP_Icon2.png")

# Set up the Streamlit app
st.set_page_config(layout="wide",page_icon=site_icon)



def initialize_schema():
    """Initialize or reset the schema to default empty state"""
    return {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "class": "",
        "description": "",
        "definitions": {},
        "properties": {}
    }

def clear_property_inputs(section_key: str):
    """Clear all property input fields for a given section"""
    keys_to_clear = [
        f"new_prop_{section_key}",
        f"new_prop_type_{section_key}",
        f"new_prop_inference_{section_key}",
        f"array_item_type_{section_key}",
        f"new_prop_instruction_{section_key}"
    ]
    for key in keys_to_clear:
        if key in st.session_state:
            del st.session_state[key]


def main():

    display_banner(
        banner_path=image_path,
        caption="Intelligent Document Processing - Powered by Amazon Bedrock"
    )
    
    
    
    st.subheader("JSON Schema Generator for creating Custom Blueprint")    
    st.markdown("""
    Define the fields you want to extract from documents. For each field, specify:
    - Field name
    - Data type
    - Whether it requires explicit extraction
    - Any additional instructions
    """)

    # Initialize session state
    if 'schema' not in st.session_state:
        st.session_state.schema = initialize_schema()
    
    if 'definitions' not in st.session_state:
        st.session_state.definitions = {}

    # Form for basic schema information
    with st.sidebar:
        st.subheader("Schema Metadata")
        st.session_state.schema["class"] = st.text_input("Form Class (e.g., CMS 1500 Claim Form)", 
                                                        value=st.session_state.schema.get("class", ""))
        st.session_state.schema["description"] = st.text_area("Description", 
                                                             value=st.session_state.schema.get("description", ""))
        
        # Clear All button
        if st.button("Clear All Fields", type="primary"):
            st.session_state.schema = initialize_schema()
            st.session_state.definitions = {}
            st.rerun()

    contact_sidebar()
    
    # Create tabs
    tab1, tab2 = st.tabs(["Main Properties", "Complex Type Definitions"])

    with tab1:
        st.header("Main Properties")
        properties = st.session_state.schema.get("properties", {})
        add_property_section(properties, "properties")

    with tab2:
        st.header("Complex Type Definitions")
        st.markdown("Define complex types that can be referenced in your properties (like arrays of objects)")
        
        # Add new definition
        with st.expander("Add New Definition"):
            new_def_name = st.text_input("Definition Name (e.g., Procedure_Service_Supplies)", 
                                       key="new_definition_name")
            if st.button("Add Definition") and new_def_name:
                if new_def_name not in st.session_state.definitions:
                    st.session_state.definitions[new_def_name] = {"properties": {}}
                    st.session_state.schema["definitions"] = st.session_state.definitions
                    st.rerun()
        
        # Display existing definitions
        for def_name in st.session_state.definitions:
            with st.expander(f"Definition: {def_name}", expanded=False):
                cols = st.columns([4, 1])
                with cols[1]:
                    if st.button(f"Delete '{def_name}'", key=f"delete_def_{def_name}"):
                        del st.session_state.definitions[def_name]
                        st.session_state.schema["definitions"] = st.session_state.definitions
                        st.rerun()
                
                # Show properties for this definition
                add_property_section(
                    st.session_state.definitions[def_name]["properties"], 
                    f"definitions_{def_name}"
                )

    # Display and download the generated schema
    st.divider()
    st.header("Generated JSON Schema")
    schema_json = json.dumps(st.session_state.schema, indent=2)
    st.code(schema_json, language="json")
    
    st.download_button(
        label="Download JSON Schema",
        data=schema_json,
        file_name="extraction_schema.json",
        mime="application/json"
    )

def add_property_section(properties: Dict[str, Any], section_key: str):
    """Helper function to add properties to a section (main properties or definitions)"""
    st.markdown("### Add New Property")
    
    # Initialize session state keys if they don't exist
    if f"new_prop_{section_key}" not in st.session_state:
        st.session_state[f"new_prop_{section_key}"] = ""
    if f"new_prop_type_{section_key}" not in st.session_state:
        st.session_state[f"new_prop_type_{section_key}"] = "string"
    if f"new_prop_inference_{section_key}" not in st.session_state:
        st.session_state[f"new_prop_inference_{section_key}"] = "explicit"
    if f"array_item_type_{section_key}" not in st.session_state:
        st.session_state[f"array_item_type_{section_key}"] = "string"
    if f"new_prop_instruction_{section_key}" not in st.session_state:
        st.session_state[f"new_prop_instruction_{section_key}"] = ""
    
    new_prop_name = st.text_input("Property Name", 
                                 key=f"new_prop_{section_key}",
                                 value=st.session_state[f"new_prop_{section_key}"])
    
    col1, col2, col3 = st.columns(3)
    with col1:
        new_prop_type = st.selectbox(
            "Data Type", 
            ["string", "number", "boolean", "array", "object"],
            key=f"new_prop_type_{section_key}",
            index=["string", "number", "boolean", "array", "object"].index(
                st.session_state[f"new_prop_type_{section_key}"]
            )
        )
    with col2:
        new_prop_inference = st.selectbox(
            "Inference Type", 
            ["explicit", "inferred"],
            key=f"new_prop_inference_{section_key}",
            index=["explicit", "inferred"].index(
                st.session_state[f"new_prop_inference_{section_key}"]
            )
        )
    with col3:
        if new_prop_type == "array":
            array_item_type = st.selectbox(
                "Array Item Type",
                list(st.session_state.definitions.keys()) + ["string", "number", "boolean", "object"],
                key=f"array_item_type_{section_key}",
                index=0
            )
    
    new_prop_instruction = st.text_area(
        "Instruction/Description", 
        key=f"new_prop_instruction_{section_key}",
        value=st.session_state[f"new_prop_instruction_{section_key}"]
    )
    
    if st.button("Add Property", key=f"add_prop_{section_key}") and new_prop_name:
        prop_def = {
            "type": new_prop_type,
            "instruction": new_prop_instruction
        }
        
        if new_prop_inference == "explicit":
            prop_def["inferenceType"] = "explicit"
        
        if new_prop_type == "array":
            if array_item_type in st.session_state.definitions:
                prop_def["items"] = {"$ref": f"#/definitions/{array_item_type}"}
            else:
                prop_def["items"] = {"type": array_item_type}
        
        properties[new_prop_name] = prop_def
        clear_property_inputs(section_key)
        st.rerun()
    
    # Display existing properties with delete option
    st.markdown("---")
    st.markdown("### Existing Properties")
    if not properties:
        st.info("No properties defined yet")
    else:
        for prop_name, prop_def in list(properties.items()):
            cols = st.columns([4, 1])
            with cols[0]:
                st.json(prop_def)
            with cols[1]:
                if st.button(f"Delete", key=f"delete_{section_key}_{prop_name}"):
                    del properties[prop_name]
                    st.rerun()

if __name__ == "__main__":
    main()