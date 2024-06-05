import requests
import time


class Transcribe:
    def __init__(self, _session):
        self.transcribe_client = _session.client("transcribe")
        self.job_name = None

    def get_job_name(self, file_name):
        """
        Get the transcribe job name.Transribe job naming convention 
        is GA appended to file name
        :param file: Bindary data.
        :param file_name: File Name or Job Name.
        :param file_name: Extenstion of file.
        :return: job_name.
        """
        self.job_name = "{}_{}".format("GA", file_name)
        return "{}_{}".format("GA", file_name)

    def get_transcribe_jobs_list(self):
        """
        gets the names of all completed transcribe jobs
        """
        jobs_list = []
        response = self.transcribe_client.list_transcription_jobs()
        ts = response["TranscriptionJobSummaries"]
        next_token = None
        for jobs in ts:
            if jobs["TranscriptionJobStatus"] == "COMPLETED":
                jobs_list.append(jobs["TranscriptionJobName"])
        if "NextToken" in response.keys():
            next_token = response["NextToken"]

        while next_token is not None:
            response = self.transcribe_client.list_transcription_jobs(NextToken = next_token)
            ts = response["TranscriptionJobSummaries"]
            for jobs in ts:
                if jobs["TranscriptionJobStatus"] == "COMPLETED":
                    jobs_list.append(jobs["TranscriptionJobName"])          
            if "NextToken" in response.keys():
                next_token = response["NextToken"]
            else:
                next_token =None
        return jobs_list

    def transcribe_file(self, job_name, file_uri, file_extension):
        self.transcribe_client.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={"MediaFileUri": file_uri},
            MediaFormat=file_extension,
            LanguageCode="en-US",
        )
        self.job_name = job_name

    def get_transcribe_text(self, job_name):
        transcript = None
        self.job_name = job_name
        max_tries = 60
        while max_tries > 0:
            max_tries -= 1
            job = self.transcribe_client.get_transcription_job(TranscriptionJobName = self.job_name)
            job_status = job["TranscriptionJob"]["TranscriptionJobStatus"]
            if job_status == "COMPLETED":
                response = self.transcribe_client.get_transcription_job(
                    TranscriptionJobName=self.job_name
                )
                url = response["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
                r = requests.get(url)
                transcript = r.json()["results"]["transcripts"][0]["transcript"]
                break
            time.sleep(5)
        return transcript
    


