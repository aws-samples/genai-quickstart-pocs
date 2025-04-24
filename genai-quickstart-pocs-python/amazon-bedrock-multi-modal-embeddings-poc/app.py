import streamlit as st
from img_service import ImageService
import ast

def init_img_service():
    """Initialize RAG service in session state if not exists"""
    if 'img_service' not in st.session_state:
        st.session_state.img_service = ImageService()

def process_dataset(dataset_name: str, image_field_name: str, num_images: int):
    """Process HuggingFace dataset and initialize vector store"""
    try:
        st.session_state.img_service.process_dataset(
            dataset_name=dataset_name,
            image_field_name=image_field_name,
            num_images=num_images
        )
        return True
    except Exception as e:
        st.error(f"Error processing dataset: {str(e)}")
        return False

def query_dataset(question: str, image_str: str = None):
    """Query the RAG service with text and optional image"""
    try:
        return st.session_state.img_service.query(query=question, image_data=image_str)
    except Exception as e:
        st.error(f"Error generating answer: {str(e)}")
        return None

def main():
    st.set_page_config(
        page_title="Multi modal embeddings POC"
    )
    st.title("Multi modal embeddings POC")

    # Initialize RAG service
    init_img_service()

    # Dataset processing section
    st.subheader("Step 1 - Load Dataset")

    col1, col2, col3 = st.columns([1, 1, 1])

    with col1:
        dataset_name = st.text_input(
            "Enter HuggingFace Dataset Name",
            help="Format: username/dataset-name"
        )

    with col2:
        image_field_name = st.text_input(
            "Enter Image field name",
            help="Field which contains an image or image url"
        )

    with col3:
        num_images = st.number_input(
            "Number of Images",
            min_value=1,
            value=100,
            help="Maximum number of images to process"
        )

    if st.button("Load Dataset"):
        with st.spinner("Processing dataset..."):
            if process_dataset(dataset_name, image_field_name, num_images):
                st.success("Dataset processed successfully!")

    # Query section
    if st.session_state.img_service.vector_store_ready():
        st.divider()
        st.subheader("Step 2 - Search Images")

        # Create two columns for text and image input
        col1, col2 = st.columns([2, 2])

        with col1:
            question = st.text_area(
                "Enter your search query",
                height=100,
                help="Describe what you're looking for"
            )

        with col2:
            image_file = st.file_uploader(
                "Upload a reference image (optional)", 
                type=['png', 'jpg', 'jpeg'],
                help="Upload an image to search by similarity"
            )
            if image_file:
                st.image(image_file, width=200)

        if st.button("Search", disabled=not question):
            with st.spinner("Searching and analyzing images..."):
                image_bytes = None
                if image_file:
                    image_bytes = image_file.read()

                # Get response
                response = query_dataset(question, image_bytes)

                if response:
                    # Display analysis first
                    st.markdown("### Search results")
                    st.write(response["answer"])

                    # Display top matches in a grid
                    if response.get("top_matches"):
                        num_matches = len(response["top_matches"])
                        st.markdown(f"#### Found {num_matches} images")

                        cols = st.columns(3)
                        for idx, result in enumerate(response["top_matches"]):
                            col_idx = idx % 3
                            with cols[col_idx]:
                                st.image(
                                    result["source"],
                                    width=200,
                                )

                                with st.expander("Image Details"):
                                    data = ast.literal_eval(result["content"])
                                    for key, value in data.items():
                                        st.markdown(f"• **{key}:** {value}")
    else:
        st.info("Please load a dataset to start searching.")

if __name__ == "__main__":
    main()
