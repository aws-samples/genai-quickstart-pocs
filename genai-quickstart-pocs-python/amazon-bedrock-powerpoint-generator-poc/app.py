import streamlit as st
from powerpoint_generator import generate_powerpoint
from powerpoint_generator.powerpoint import delete_file


def reset():
    st.session_state.fields_disabled = False
    st.session_state.topic = ""
    st.session_state.additional_info = ""
    st.session_state.background_files = None
    st.session_state.research_wikipedia = True


def lock_for_run():
    st.session_state.fields_disabled = True


if "fields_disabled" not in st.session_state:
    st.session_state.fields_disabled = False


def process_uploads():
    files = st.session_state.background_files
    documents = []
    for file in files:
        documents.append({"file_bytes": file.getvalue(), "file_name": file.name})
    return documents


st.title("Generative AI powered PowerPoint creator")
st.subheader(
    "Using Generative AI models in Amazon Bedrock, automate researching and generating an in-depth PowerPoint presentation."
)

st.text_input(
    "Enter the topic for the PowerPoint presentation",
    key="topic",
    disabled=st.session_state.fields_disabled,
)
st.text_area(
    "Enter additional information for the PowerPoint presentation",
    key="additional_info",
    help="Additional information can include more details on the topic, who the presentation audience is or any other relevant input.",
    disabled=st.session_state.fields_disabled,
)
st.toggle(
    "Research with Wikipedia",
    disabled=st.session_state.fields_disabled,
    help="When enabled, the demo will research background on the topic, background on the sections and background on each slide it will create.",
    key="research_wikipedia",
    value=True,
)
st.file_uploader(
    "Upload any documents you'd like used as background information.",
    type=["pdf", "docx", "txt"],
    accept_multiple_files=True,
    key="background_files",
)
if st.button("Generate PowerPoint", disabled=st.session_state.fields_disabled):
    if not st.session_state.topic or not st.session_state.additional_info:
        st.error("Please enter a topic and additional information")
    else:
        lock_for_run()
        with st.status(
            "Generating PowerPoint. This may take up to 5 minutes to research all content and create the presentation"
        ) as status:

            def status_update_callback(message: str) -> None:
                status.update(label=message, state="running")

            def status_write_callback(message: str) -> None:
                status.write(message)

            try:
                file_path = generate_powerpoint(
                    st.session_state.topic,
                    st.session_state.additional_info,
                    status_update_callback,
                    status_write_callback,
                    process_uploads(),
                    research_wikipedia=st.session_state.research_wikipedia,
                )
                status.update(
                    label="PowerPoint Ready!", expanded=True, state="complete"
                )
                st.balloons()
                with open(file_path, "rb") as f:
                    st.download_button(
                        on_click=reset,
                        label="Download PowerPoint",
                        data=f,
                        file_name="powerpoint.pptx",
                        mime="application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    )
                delete_file(
                    file_path
                )  # User has downloaded it, delete it from temp to avoid continously growing
            except Exception as e:
                st.error(
                    f"Error generating PowerPoint! Click **Generate PowerPoint** to try again."
                )
                st.session_state.fields_disabled = False
