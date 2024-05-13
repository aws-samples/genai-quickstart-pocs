import json
import streamlit as st
from datetime import datetime
import pandas as pd
from ingestionlogic import upload_to_s3,validate_s3_object, get_s3_object_text, srt_to_transcript, get_cloudfront_url_for_s3_key, get_cloudfront_name, transcribe_file, split_transcript, create_topics, fuzzy_search, add_row, starting_time, time_math_seconds, persist_doc, bedrock





#Streamlit setup
### Title displayed on the Streamlit Web App
st.set_page_config(page_title="Create Video Sections and Timestamps", page_icon=":tada", layout="wide")


#Header and Subheader dsiplayed in the Web App
with st.container():
    st.header("Generate searchable sections from video uploads or from pre-transcribed videos using Generative AI")
    st.subheader("")
    st.title("")


#setup dataframe
data = {
    'Title': [],
    'Summary': [],
    'Start Time': [],
    'Video Link': []
}

df=pd.DataFrame(data)

#Streamlit Logic
st.session_state.process_status = "NEW"
#Does file need upload and transcription or is it already uploaded and transcribed?
video_type = st.radio("Select an option", ('Upload Video and Transcribe It', 'Ingest Already Transcribed Video'),
                      index=None)
if video_type == 'Upload Video and Transcribe It':
    #Upload Video File
    uploaded_file = st.file_uploader("Choose a Video")

    result=st.button("Upload Video and Start")
    if result:
        upload_start = datetime.now()
        with st.status("Processing Request", expanded=False, state="running") as status:
        
            filename= uploaded_file.name

            #upload file to s3
            status.update(label="Uploading File to S3: ", state="running", expanded=False)
            object_name=upload_to_s3(uploaded_file, filename)

            cf_name = get_cloudfront_name(object_name) #To avoid setting my AWS S3 Bucket to public, i want to serve my data via Cloudfront - this will get the Object's URI from CLoudfront

            upload_end = datetime.now()
            upload_time= upload_end - upload_start

        
            st.write(":heavy_check_mark: Uploaded File to S3: " + str(upload_time))

            #transcribe audio
            status.update(label="Transcribing Video: ", state="running", expanded=False)
            transcribe_start = datetime.now()

            transcripts = transcribe_file(object_name)

            transcribe_end = datetime.now()
            transcribe_time = transcribe_end - transcribe_start

            st.write(":heavy_check_mark: Video Transcribed: " + str(transcribe_time))


            transcript=transcripts[0]
            subtitles=transcripts[1]
            st.write(":heavy_check_mark: Topics Identified: ): " + str(transcribe_time))
            st.session_state.process_status = "READY"
elif video_type == 'Ingest Already Transcribed Video':
    video_key = st.text_input("Enter the S3 Object Key of the video file")
    srt_key = st.text_input("Enter the S3 Object Key of the srt file")
    result=st.button("Start Processing")
    if result:
        upload_start = datetime.now()
        with st.status("Processing Request", expanded=False, state="running") as status:
            cf_name = get_cloudfront_url_for_s3_key(video_key)
            st.write(label="Confirming access to video... ", state="running", expanded=False)
            if not validate_s3_object(video_key):
                st.write(":x: Could not access video file")
                exit(1)
            subtitles = get_s3_object_text(srt_key)
            object_name = srt_key
        
            st.write(":heavy_check_mark: Successfully read srt file")

            transcript = srt_to_transcript(subtitles)
            st.write(":heavy_check_mark: Successfully created transcript from subtitles")
            st.session_state.process_status = "READY"



if st.session_state['process_status'] == "READY":
    with st.status("Processing Request", expanded=False, state="running") as status:
        #Split up subtitles into x number of chars by line to use for fuzzy search
        subtitle_doc = split_transcript(subtitles)

        #create topics
        status.update(label="Identifying Video Topics: ", state="running", expanded=False)

        topic_start = datetime.now()

        topics=create_topics(transcript, object_name)


        topic_end = datetime.now()
        topic_time = topic_end - topic_start

        

        #loops through the Json and displays Title and summary
        total_sections = len(topics)

        start_time_start = datetime.now()

        status.update(label="Finding Start Times: ", state="running", expanded=False)


        num_sections = 1
        previous_timestamp = ""
        for key in topics:
            title = key['Title']
            description = key['Summary']
            topic_sentence = key['Starting_Sentence']



        #Fuzzy Partial Ratio Score as Search mechanism
            fuzzy_results = fuzzy_search(topic_sentence, subtitle_doc, num_sections, total_sections)
            start_time_fuzzy = starting_time(fuzzy_results, topic_sentence, previous_timestamp)
            previous_timestamp = start_time_fuzzy

            #yt_suffix_fuzzy = time_math(start_time_fuzzy)
            video_time = time_math_seconds(start_time_fuzzy.strip())

            #write data into dataframe
            new_row_data = {'Title': title, 'Summary': description, 'Start Time': start_time_fuzzy, 'Video Link': cf_name}
            df = add_row(df, new_row_data)


            #play video at timestamp

            st.write(title+ ": ")
            st.video(cf_name, format="video/mp4", start_time=video_time)

            num_sections += 1

            #End of Loop

        start_time_end = datetime.now()
        start_time_full = start_time_end - start_time_start

        st.write(":heavy_check_mark: Start Times Found :"  + str(start_time_full))

        final_time = start_time_end - upload_start
        #complete status
    st.status(label=":heavy_check_mark: Request Complete: Total Time: " + str(final_time) , state="complete", expanded=False)


    st.write(df)
    st.session_state.df = df

    #Persist to VectorStore (OpenSearch in my case)
save_results=st.button("Save", disabled=(st.session_state['process_status'] != "READY"))
if save_results:
    if 'df' not in st.session_state:
        st.write("No Data To Save")
    else:
        st.write("saving...")
        persist_doc(st.session_state.df)
    st.session_state.process_status = "NEW"
