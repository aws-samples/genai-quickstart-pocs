class S3:
    

    def __init__(self, _session, s3_bucket):
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
        f_key = f"raw/{job_name}.{file_extension}"
        file_uri = None
        if file_binary_data is not None:
            self.s3_client.put_object(Body=file_binary_data, Bucket=self.s3_bucket, Key=f_key)
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
        self.s3_client.delete_object(Bucket=self.s3_bucket, Key=f_key)



