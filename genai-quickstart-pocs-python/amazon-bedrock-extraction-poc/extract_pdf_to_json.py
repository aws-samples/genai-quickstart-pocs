import boto3
import botocore
import json
import streamlit as st
import pdfplumber
from dotenv import load_dotenv
import os


# loading in environment variables
load_dotenv()
# setting default session with AWS CLI Profile
boto3.setup_default_session(profile_name=os.getenv('profile_name'))
# Setup Bedrock client
config = botocore.config.Config(connect_timeout=300, read_timeout=300)
bedrock = boto3.client('bedrock-runtime' , 'us-east-1', config = config)



def parse_xml(xml, tag):
  start_tag = f"<{tag}>"
  end_tag = f"</{tag}>"
  
  start_index = xml.find(start_tag)
  if start_index == -1:
    return ""

  end_index = xml.find(end_tag)
  if end_index == -1:
    return ""

  value = xml[start_index+len(start_tag):end_index]
  return value

def pdf_extraction(content):

    system_prompt=f"""
You are a Data Processor. You will be provided the text of a Earnings Call or Financial Report from a company
Extract the following items and information from the provided content and output them into a valid json array
    Title (shorten the title to 6 words or less)
    The Published Date (in the format of mm/dd/yyyy)
    The Company of focus (ex. Amazon, Apple etc.)
    Earnings Per Share (EPS) of the Company ("Not Provided" if not provided)
    Net Income of the Company ("Not Provided" if not provided) - include the number-word expression ie. Million or Billion
    Free Cash Flow ("Not Provided" if not provided) include the number-word expression ie. Million or Billion
    a brief summary of the financial report based on the information provided and the outlook of the financial performance - make sure this value is valid json (be sure to use escape characters to handle quotation marks if they exist in your summary (ie. \\"SampleQuotes\\"))
    A key quote from the Company leader (include citation and speaker name/title) - be sure to use escape characters to handle quotation marks (ie. \\"SampleQuotes\\")


Return your response in valid JSON, using the provided output format
<example_format>
{{"Title": "(title)", "Date": "(article_date - in mm/dd/yyy)", "Company": "(company)", "Earnings_Per_Share": "(earnings per share)", "Net_Income": "(net income)", "Free_Cash_Flow": "(Free Cash Flow)", "Outlook": "(outlook)", "Quote": "(quote)"}}
</example_format>

When creating the summary and the key quotes, be sure to escape quotation marks in string values so that the output is valid json

Think through each step of your thought process and write your thoughts down in <scratchpad> xml tags

return the valid json array with the extracted details in <output> xml tags, only including the valid json

"""

    content=[{
        "type": "text",
        "text": content
            }]
    
    prompt = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 10000,
        "temperature": 0.5,
        "system": system_prompt,
        "messages": [    
            {
                "role": "user",
                "content": f"<financial_call_content> {content} </financial_call_content>"
            }
        ]
    }

    prompt = json.dumps(prompt)

    print(prompt)
    print("------------------------------------------------------")

    response = bedrock.invoke_model(body=prompt, modelId="anthropic.claude-3-sonnet-20240229-v1:0", accept="application/json", contentType="application/json")
    response_body = json.loads(response.get('body').read())
    llmOutput=response_body['content'][0]['text']

    print(llmOutput)

    
    scratch = parse_xml(llmOutput, "scratchpad")
    output = parse_xml(llmOutput, "output")

    return scratch, output


def pdf_processing(pdf):
# Open the PDF file
    text = ""
    with st.status("Processing PDF", expanded=False, state="running") as status:
        with pdfplumber.open(pdf) as pdf:
        # Loop through each page in the PDF
            for page in pdf.pages:
                # Extract the text from the page
                text = text + page.extract_text()
        
                # Print the extracted text
                print(text)
        status.update(label=":heavy_check_mark: PDF Processing Complete", state="running", expanded=False)
        st.write(":heavy_check_mark: PDF Processing Complete")

        status.update(label="Extracting Details from PDF", state="running", expanded=False)
        scratch, output=pdf_extraction(text)
        output_json=json.loads(output)

        status.update(label=":heavy_check_mark: Details Extracted", state="complete", expanded=False)
        st.write(":heavy_check_mark: Details Extracted")
        



    for key in output_json:
        value = output_json[key]
        st.text_input(key,value)

    with st.expander("Full JSON Payload"):
        st.json(output)


