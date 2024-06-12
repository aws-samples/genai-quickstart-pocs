"""
This utility module manages the logic for interacting with S3,
including uploading media files to an S3 bucket and deleting them.
"""


class S3:
    """
    This class provided an abstraction layer for interacting with S3
    """ 
    def __init__(self, _session, s3_bucket):
        """
        :param _session: boto3 session
        :param s3_bucket: S3 Bucket Name.
        """
        self.s3_client = _session.client('s3')
        self.s3_bucket = s3_bucket

    def upload_media_file_on_s3(self, file_binary_data, job_name, file_extension):
        """
        Upload a file to an S3 bucket.
        :param file: Bindary data.
        :param file_name: File Name or Job Name.
        :param file_name: Extenstion of file.
        :return: S3 complete file uri.
        """
        #create raw prefix 
        f_key = f"raw/{job_name}.{file_extension}"
        file_uri = None
        # verify binary data is not None
        if file_binary_data is not None:
            #upload file to an Amazon S3 bucket using a "raw" prefix in the object key.
            self.s3_client.put_object(Body=file_binary_data, Bucket=self.s3_bucket, Key=f_key)
            #Generate complete S3 path
            file_uri = "s3://{}/{}".format(self.s3_bucket, f_key)
        return file_uri
    
    
    def delete_media_file_from_s3(self, job_name, file_extension):
        """
        Delete a file from S3 bucket.
        :param file_name:  Job Name and file name are same
        :param file_name: Extenstion of file.
        :return: None
        """
        f_key = "raw/{}.{}".format(job_name, file_extension)
        #Delete temporary file from S3 bucket
        self.s3_client.delete_object(Bucket=self.s3_bucket, Key=f_key)



