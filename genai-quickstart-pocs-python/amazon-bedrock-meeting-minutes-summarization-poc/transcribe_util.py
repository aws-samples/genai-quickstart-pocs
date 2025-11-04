"""
This utility module manages interactions with the Amazon Transcribe service, including retrieving transcription job history
and initiating transcription jobs or getting transcribed text
"""
import requests
import time


class Transcribe:
    """
    This class provided an abstraction layer for interacting with Amazon Transcribe Service

    """ 
    def __init__(self, _session):
        """
        Initialize the Transcribe class.
        :param _session: boto3 session.
        """
        self.transcribe_client = _session.client("transcribe")
        self.job_name = None

    def get_job_name(self, file_name):
        """
        The name of the transcription job follows this convention: the letters 
        "GA" are appended as prefix to original file name.
        :param file: file name.
        :return: job_name.
        """
        #Append GA to file_name for identification purpose
        self.job_name = "{}_{}".format("GA", file_name)
        return "{}_{}".format("GA", file_name)

    def get_transcribe_jobs_list(self):
        """
        returns list of completed transcribe job names
        """
        jobs_list = []
        response = self.transcribe_client.list_transcription_jobs()
        ts = response["TranscriptionJobSummaries"]
        next_token = None
        #iterate over all transcription summaries
        for jobs in ts:
            #if transcription job has completed status append to list
            if jobs["TranscriptionJobStatus"] == "COMPLETED":
                jobs_list.append(jobs["TranscriptionJobName"])
        if "NextToken" in response.keys():
            next_token = response["NextToken"]
        #iterate over additional pages if next token is present in response
        while next_token is not None:
            response = self.transcribe_client.list_transcription_jobs(NextToken = next_token)
            ts = response["TranscriptionJobSummaries"]
            for jobs in ts:
                #if transcription job has completed status append to list
                if jobs["TranscriptionJobStatus"] == "COMPLETED":
                    jobs_list.append(jobs["TranscriptionJobName"])          
            if "NextToken" in response.keys():
                next_token = response["NextToken"]
            else:
                next_token =None
        return jobs_list

    def transcribe_file(self, job_name, file_uri, file_extension):
        """
        Start the Transcription Job
        :param job_name: Transcribe job Name.
        :param file_uri: S3 file path.
        :param file_extension: extension of transcription file.
        :return: None.
        """
        self.transcribe_client.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={"MediaFileUri": file_uri},
            MediaFormat=file_extension,
            LanguageCode="en-US",
        )
        #set the job name 
        self.job_name = job_name

    def get_transcribe_text(self, job_name):
        """
        :param job_name: Transcribe job Name.
        :return: transcribed text for specific job.
        """
        transcript = None
        self.job_name = job_name
        max_tries = 60
        #Check the status of TranscriptionJob is completed 
        # Keep checking the status for 60 iteration with each 5 second pause
        while max_tries > 0:
            max_tries -= 1
            job = self.transcribe_client.get_transcription_job(TranscriptionJobName = self.job_name)
            job_status = job["TranscriptionJob"]["TranscriptionJobStatus"]
            if job_status == "COMPLETED":
                #if TranscriptionJob is completed get transcript and break the loop
                response = self.transcribe_client.get_transcription_job(
                    TranscriptionJobName=self.job_name
                )
                url = response["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
                #geth trasncript by requesting url
                r = requests.get(url)
                transcript = r.json()["results"]["transcripts"][0]["transcript"]
                break
            # Sleep for 5 seconds before retrying
            time.sleep(5)
        return transcript
    


