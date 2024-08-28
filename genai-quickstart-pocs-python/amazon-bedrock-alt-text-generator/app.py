from datetime import datetime
from uuid import uuid4
import streamlit as st
import os
from pdf_image_alt_text_generator import generator
from pdf_image_alt_text_generator import download_results
import logging


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


empty_box = None

if "inference_started" not in st.session_state:
    st.session_state["inference_started"] = False


def set_inference_started():
    st.session_state["inference_started"] = True


@st.fragment
def image_box(alt_text_result):
    try:
        if alt_text_result is not None:
            with st.container(border=True):
                col1, col2 = st.columns([2, 3])
                if "image" in alt_text_result:
                    col1.image(
                        alt_text_result["image"],
                        width=200,
                    )
                else:
                    col1.error("Error displaying image")
                if "alt_text" in alt_text_result:
                    col2.write(alt_text_result["alt_text"])
                else:
                    col2.error("Error generating alt text")
                if "score" in alt_text_result:
                    col2.write(f"Confidence Score: **{alt_text_result['score']}**")
                else:
                    col2.error("Error generating confidence score")
                if "page" in alt_text_result:
                    logger.debug(
                        f"alt_text_result['page'] = {alt_text_result['page']} with type {type(alt_text_result['page'])}"
                    )
                    col2.write(f"Page Number: **{int(alt_text_result['page']) + 1}**")
                if "metadata" in alt_text_result:
                    metadata = alt_text_result["metadata"]["usage"]
                    col2.write(f"Metadata:")
                    col2.json(metadata)
        else:
            print("No alt text result for record")
    except Exception as e:
        print(f"Error: {e}")


st.title("PDF Alt-Text Generation with Generative AI")
st.write(
    "This app uses a Generative AI FM from Amazon Bedrock to generate alt-text for images in a PDF file."
)
empty_box = None
if "upload_uuid" not in st.session_state:
    st.session_state["upload_uuid"] = str(uuid4())
if st.button("Start New Session"):
    st.session_state.clear()
    st.cache_data.clear()
    file = None
    st.session_state["upload_uuid"] = str(uuid4())
    st.rerun()
file = st.file_uploader(
    "Upload a PDF file",
    type="pdf",
    key=st.session_state["upload_uuid"],
    disabled=st.session_state["inference_started"],
)
if "prompt_data" not in st.session_state:
    st.session_state["prompt_data"] = []
if st.session_state["prompt_data"] is not None:
    if file is not None:
        try:
            if not st.session_state["prompt_data"]:
                with st.status("Uploading file to app...") as status:
                    generator.save_pdf_file(file)
                    status.update(label="File uploaded. Extracting data...")
                    data, image_map = generator.load_pdf(file.name)
                    input_pdf = os.path.join("files", file.name).replace(" ", "_")
                    status.update(
                        label="Data extracted successfully. Preparing data for calling model inference..."
                    )
                    st.session_state["prompt_data"] = generator.prep_data_for_model(
                        data, image_map
                    )
                    status.update(label="Data ready for inference!", state="complete")

            if "prompt_data" in st.session_state and st.session_state["prompt_data"]:
                st.write(
                    f"#### There are **{len(st.session_state['prompt_data'])} images** in this PDF."
                )
                if st.button(
                    "Start Inference",
                    disabled=st.session_state["inference_started"],
                    on_click=set_inference_started,
                ):
                    try:
                        st.session_state["full_result"] = generator.run_inference(
                            st.session_state["prompt_data"], image_box
                        )
                        st.session_state["inference_started"] = True
                        logger.debug("Inference started")
                    except Exception as e:
                        logger.error(e)
                if (
                    "full_result" in st.session_state
                    and st.session_state["full_result"]
                ):
                    logger.debug("full_results in")
                    st.session_state["alt_text_pdf"] = download_results.generate_pdf(
                        st.session_state["full_result"]
                    )
                    if (
                        "alt_text_pdf" in st.session_state
                        and st.session_state["alt_text_pdf"]
                    ):
                        with open(
                            st.session_state["alt_text_pdf"], "rb"
                        ) as output_file:
                            st.download_button(
                                label="Download PDF with Alt Text & Images",
                                data=output_file,
                                file_name="alt-text-ouput.pdf",
                                mime="application/pdf",
                            )

        except Exception as e:
            st.error(f"Error: {e}")

else:
    st.write("Please upload a file.")
