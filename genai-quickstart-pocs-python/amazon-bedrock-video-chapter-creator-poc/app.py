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
    print(f"Jumping to {timestamp}")
    st.session_state.video_timestamp = int(timestamp)
    print(st.session_state.video_timestamp)
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

        # Allow the user to select whether they want to upload a video and transcribe it, or ingest an already transcribed video
        video_type = st.radio(
            "Select an option",
            ("Upload Video and Transcribe It", "Ingest Already Transcribed Video"),
            index=None,
        )

        # If the user wants to upload a video and transcribe it
        if video_type == "Upload Video and Transcribe It":
            # Allow the user to upload a video file
            uploaded_file = st.file_uploader("Choose a Video")

            # Add a button to start the video upload and transcription process
            result = st.button("Upload Video and Start")

            # If the button is clicked, execute the following code
            if result:
                # Start the timer for the upload process
                upload_start = datetime.now()

                # Display a status bar to show the progress of the process
                with st.status(
                    "Processing Request", expanded=False, state="running"
                ) as status:
                    # Get the name of the uploaded file
                    filename = uploaded_file.name

                    # Upload the file to S3
                    status.update(
                        label="Uploading File to S3", state="running", expanded=False
                    )
                    object_name = upload_to_s3(uploaded_file, filename)

                    # Get the CloudFront URL for the S3 object
                    cf_name = get_cloudfront_name(object_name)

                    # Calculate the upload time
                    upload_end = datetime.now()
                    upload_time = upload_end - upload_start
                    st.write(
                        ":heavy_check_mark: Uploaded File to S3: " + str(upload_time)
                    )

                    # Transcribe the video
                    status.update(
                        label="Transcribing Video", state="running", expanded=False
                    )
                    transcribe_start = datetime.now()
                    transcripts = transcribe_file(object_name)
                    transcribe_end = datetime.now()
                    transcribe_time = transcribe_end - transcribe_start
                    st.write(
                        ":heavy_check_mark: Video Transcribed: " + str(transcribe_time)
                    )

                    # Extract the transcript and subtitles from the transcripts
                    transcript = transcripts[0]
                    subtitles = transcripts[1]
                    st.write(
                        ":heavy_check_mark: Topics Identified: ): "
                        + str(transcribe_time)
                    )

                    # Set the process status to "READY"
                    st.session_state.process_status = "READY"

        # If the user wants to ingest an already transcribed video
        elif video_type == "Ingest Already Transcribed Video":
            # Allow the user to enter the S3 object keys for the video and SRT files
            video_key = st.text_input("Enter the S3 Object Key of the video file")
            srt_key = st.text_input("Enter the S3 Object Key of the srt file")
            object_name = video_key.split("/")[-1]
            # Add a button to start the video ingestion process
            result = st.button("Start Processing")

            # If the button is clicked, execute the following code
            if result or st.session_state['process_started']:
                st.session_state['process_started'] = True
                # Start the timer for the ingestion process
                upload_start = datetime.now()

                # Display a status bar to show the progress of the process
                with st.status(
                    "Processing Request", expanded=False, state="running"
                ) as status:
                    # Get the CloudFront URL for the S3 video object
                    cf_name = get_cloudfront_url_for_s3_key(video_key)

                    # Validate that the video file is accessible
                    status.update(
                        label="Confirming access to video... ",
                        state="running",
                        expanded=False,
                    )
                    if not validate_s3_object(video_key):
                        st.write(":x: Could not access video file")
                        exit(1)

                    # Get the text content of the SRT file
                    subtitles = get_s3_object_text(srt_key)
                    st.write(":heavy_check_mark: Successfully read srt file")

                    # Create a transcript from the subtitles
                    transcript = srt_to_transcript(subtitles)
                    st.write(
                        ":heavy_check_mark: Successfully created transcript from subtitles"
                    )

                    # Set the process status to "READY"
                    st.session_state.process_status = "READY"

        # If the process status is "READY"
        if st.session_state["process_status"] == "READY":
            with st.status(
                "Processing Request", expanded=False, state="running"
            ) as status:
                if not "df" in st.session_state or st.session_state.df is None:
                    # Split the transcript into smaller chunks for fuzzy search
                    subtitle_doc = split_transcript(subtitles)

                    # Identify the topics in the video
                    status.write("Identifying video topics")
                    topic_start = datetime.now()
                    topics = create_topics(transcript, object_name)
                    topic_end = datetime.now()
                    topic_time = topic_end - topic_start

                    # Find the start times for the identified topics
                    start_time_start = datetime.now()
                    status.write(
                        ":heavy_check_mark: Topics Identified: " + str(topic_time)
                    )
                    status.write("Finding start times for topics")
                    find_video_start_times(topics, subtitle_doc, object_name)
                    start_time_end = datetime.now()
                    start_time_full = start_time_end - start_time_start
                    st.write(
                        ":heavy_check_mark: Start Times Found :" + str(start_time_full)
                    )
                    buttons = []
                st.dataframe(st.session_state.df)
                for i, row in st.session_state.df.iterrows():
                    st.button(
                        f"Jump to Chapter: {row['Title']} ({row['Start Time']})",
                        key=f"video_jump_{i})",
                        on_click=partial(jump_to_chapter, row['Start Time in Seconds'])
                    )
                if not "video_timestamp" in st.session_state:
                    st.session_state['video_timestamp'] = "0"
                video_player = st.video(
                    cf_name,
                    format="video/mp4",
                    start_time=int(st.session_state['video_timestamp']),
                    subtitles={"Englist SRT": subtitles, },
                )

                status.update(
                    label=":heavy_check_mark: Request Complete",
                    state="complete",
                    expanded=True,
                )

        # Save the results
        save_results = st.button(
            "Save", disabled=(st.session_state["process_status"] != "READY")
        )
        if save_results:
            st.balloons()
            save_doc()
            st.session_state.df = None
            st.session_state.process_status = "NEW"

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
