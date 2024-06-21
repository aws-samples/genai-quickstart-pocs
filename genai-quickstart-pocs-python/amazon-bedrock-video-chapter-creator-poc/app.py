from functools import partial
import streamlit as st
from datetime import datetime
from videochapterlogic import (
    upload_to_s3,
    validate_s3_object,
    get_s3_object_text,
    srt_to_transcript,
    get_cloudfront_url_for_s3_key,
    get_cloudfront_name,
    transcribe_file,
    split_transcript,
    create_topics,
    find_video_start_times,
    save_doc,
    submit_user_query,
)

# Streamlit setup
# Here, we set the page configuration for the Streamlit web app, including the title, icon, and layout.
st.set_page_config(
    page_title="Video Chapter Creator", page_icon=":ledger", layout="centered"
)


def jump_to_chapter(timestamp):
    st.session_state.video_timestamp = int(timestamp)
    st.rerun()


# Creating the main UI
with st.container():
    if "process_started" not in st.session_state:
        st.session_state.process_started = False
    # Add a title to the web app
    st.title(f""":rainbow[Amazon Bedrock Generative AI Video Chapter Creator]""")
    # Create two tabs: "Add Videos & Generate Chapters" and "Ask questions, get relevant videos"
    ingest_tab, search_tab = st.tabs(
        ["Add Videos & Generate Chapters", "Ask questions, get relevant videos"]
    )

    # Ingestion Tab
    with ingest_tab:
        # Add a header and subheader to the ingestion tab
        with st.container():
            st.header(
                "Generate searchable sections from video uploads or from pre-transcribed videos using Generative AI",
            )

        # Initialize the process status to "NEW"
        st.session_state.process_status = "NEW"
        st.session_state.disable_buttons = False

        # Allow the user to select whether they want to upload a video and transcribe it, or ingest an already transcribed video
        video_type = st.radio(
            "Select an option",
            ("Upload Video and Transcribe It", "Ingest Already Transcribed Video"),
            index=None,
        )
        result = None
        # If the user wants to upload a video and transcribe it
        if video_type == "Upload Video and Transcribe It":
            # Allow the user to upload a video file
            uploaded_file = st.file_uploader("Choose a Video")
            # Add a button to start the video upload and transcription process
            result = st.button(
                "Upload Video and Start", disabled=st.session_state.disable_buttons
            )

        # If the user wants to ingest an already transcribed video
        elif video_type == "Ingest Already Transcribed Video":
            # Allow the user to enter the S3 object keys for the video and SRT files
            video_key = st.text_input("Enter the S3 Object Key of the video file")
            srt_key = st.text_input("Enter the S3 Object Key of the srt file")
            st.session_state['object_name'] = video_key.split("/")[-1]
            # Add a button to start the video ingestion process
            result = st.button(
                "Start Processing", disabled=st.session_state.disable_buttons
            )

        if video_type:
            chapter_box = st.status(
                "Ready to process request", expanded=False, state="running"
            )

        if video_type == "Upload Video and Transcribe It" and (
            result or st.session_state["process_started"]
        ):
            st.session_state["process_started"] = True
            upload_start = datetime.now()
            filename = uploaded_file.name
            # Upload the file to S3
            chapter_box.update(
                label="Uploading File to S3. This may take some time depending on size...", state="running", expanded=False
            )
            if 'object_name' not in st.session_state:
                st.session_state['object_name'] = upload_to_s3(uploaded_file, filename)

            # Get the CloudFront URL for the S3 object
            if 'cf_name' not in st.session_state:
                st.session_state['cf_name'] = get_cloudfront_name(st.session_state["object_name"])

            # Calculate the upload time
            upload_end = datetime.now()
            upload_time = upload_end - upload_start
            chapter_box.write(
                ":heavy_check_mark: Uploaded File to S3: " + str(upload_time)
            )

            # Transcribe the video
            chapter_box.update(
                label="Transcribing Video", state="running", expanded=False
            )
            if 'transcripts' not in st.session_state:
                transcribe_start = datetime.now()
                st.session_state['transcripts'] = transcribe_file(st.session_state['object_name'])
                transcribe_end = datetime.now()
                transcribe_time = transcribe_end - transcribe_start
                chapter_box.write(
                    ":heavy_check_mark: Video Transcribed: " + str(transcribe_time)
                )

                # Extract the transcript and subtitles from the transcripts
                st.session_state['transcript'] = st.session_state['transcripts'][0]
                st.session_state['subtitles'] = st.session_state['transcripts'][1]

            st.session_state.process_status = "READY"
        # If the button is clicked, execute the following code
        elif video_type == "Ingest Already Transcribed Video" and (
            result or st.session_state["process_started"]
        ):
            st.session_state["process_started"] = True
            # Start the timer for the ingestion process
            upload_start = datetime.now()

            if 'cf_name' not in st.session_state:
                # Get the CloudFront URL for the S3 video object
                st.session_state['cf_name'] = get_cloudfront_url_for_s3_key(video_key)

                # Validate that the video file is accessible
                chapter_box.update(
                    label="Confirming access to video... ",
                    state="running",
                    expanded=False,
                )
                if not validate_s3_object(video_key):
                    chapter_box.write(":x: Could not access video file")
                    exit(1)

            if 'subtitles' not in st.session_state:
                # Get the text content of the SRT file
                st.session_state['subtitles'] = get_s3_object_text(srt_key)
                chapter_box.write(":heavy_check_mark: Successfully read srt file")

            if 'transcript' not in st.session_state:
                # Create a transcript from the subtitles
                st.session_state['transcript'] = srt_to_transcript(st.session_state['subtitles'])
                chapter_box.write(
                    ":heavy_check_mark: Successfully created transcript from subtitles"
                )

            # Set the process status to "READY"
            st.session_state.process_status = "READY"

        # If the process status is "READY"
        if st.session_state["process_status"] == "READY":

            if not "df" in st.session_state or st.session_state.df is None:
                # Split the transcript into smaller chunks for fuzzy search
                subtitle_doc = split_transcript(st.session_state['subtitles'])

                # Identify the topics in the video
                chapter_box.update(label="Identifying video topics")
                topic_start = datetime.now()
                topics = create_topics(st.session_state['transcript'], st.session_state['object_name'])
                topic_end = datetime.now()
                topic_time = topic_end - topic_start

                # Find the start times for the identified topics
                start_time_start = datetime.now()
                chapter_box.write(
                    ":heavy_check_mark: Topics Identified: " + str(topic_time)
                )
                chapter_box.update(label="Finding start times for topics")
                find_video_start_times(topics, subtitle_doc, st.session_state['object_name'])
                start_time_end = datetime.now()
                start_time_full = start_time_end - start_time_start
                chapter_box.write(
                    ":heavy_check_mark: Start Times Found :" + str(start_time_full)
                )
                buttons = []
            chapter_box.dataframe(st.session_state.df)
            for i, row in st.session_state.df.iterrows():
                chapter_box.button(
                    f"Jump to Chapter: {row['Title']} ({row['Start Time']})",
                    key=f"video_jump_{i})",
                    on_click=partial(jump_to_chapter, row["Start Time in Seconds"]),
                    disabled=st.session_state.disable_buttons,
                )
            if not "video_timestamp" in st.session_state:
                st.session_state["video_timestamp"] = "0"
            video_player = chapter_box.video(
                st.session_state['cf_name'],
                format="video/mp4",
                start_time=int(st.session_state["video_timestamp"]),
                subtitles={
                    "Englist SRT": st.session_state['subtitles'],
                },
            )

            chapter_box.update(
                label="Video chapters ready!",
                state="complete",
                expanded=True,
            )

        # Save the results
        save_results = st.button(
            "Save",
            disabled=(
                st.session_state["process_status"] != "READY"
                or st.session_state.disable_buttons
            ),
            type="primary"
        )
        if st.button("Start over", type='secondary'):
            st.session_state.clear()
            video_type = None
            st.session_state.df = None
            st.session_state.process_status = "NEW"
            st.session_state["video_timestamp"] = "0"
            st.session_state.process_started = False
            result = None
            uploaded_file = None
            st.rerun()
        if save_results:
            with st.status("Saving chapters!") as save_status:
                save_status.write("Saving video chapters...")
                save_doc()
                save_status.write("Video Chapters saved!")
                save_status.warning(
                    "Video chapters may take up to 30 seconds before user inquiries will be able to locate the video chapters.",
                    icon="⚠️",
                )
                st.balloons()
                st.session_state.clear()
                st.session_state.df = None
                st.session_state.process_status = "NEW"
                st.session_state["video_timestamp"] = "0"
                st.session_state.process_started = False
                result = None
                chapter_box.update(
                    label="Ready to process request", state="running", expanded=False
                )

    # Search Tab
    with search_tab:
        with st.container():
            # Add a title to the search tab
            st.title(
                "Ask Questions and I will link you to the relevant time of a video",
            )

            with st.container():
                st.write("---")
                st.write("Search for Video Content")
                # Allow the user to enter a query
                userQuery = st.text_input("Ask a Question")
                # Add a button to submit the query
                result = st.button("ASK!")
                if result:
                    # Submit the user query and get the response
                    response = submit_user_query(userQuery)
                    print(response)
                    if response:
                        st.write(response['llm_response'])
                        st.video(response['video_link'], format="video/mp4", start_time=response['start_time'],
                                 subtitles={"English Subtitles": response['subtitles']})
