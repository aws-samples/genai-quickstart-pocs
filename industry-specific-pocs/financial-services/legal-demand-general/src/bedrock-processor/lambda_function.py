###################################################################################################################################################
# Sample code, software libraries, command line tools, proofs of concept, templates, or other related technology are provided as AWS Content      #
# or Third-Party Content under the AWS Customer Agreement, or the relevant written agreement between you and AWS (whichever applies). You should  # 
# not use this AWS Content or Third-Party Content in your production accounts, or on production or other critical data. You are responsible for   #
# testing, securing, and optimizing the AWS Content or Third-Party Content, such as sample code, as appropriate for production grade use based on #  
# your specific quality control practices and standards. Deploying AWS Content or Third-Party Content may incur AWS charges for creating or using # 
# AWS chargeable resources, such as running Amazon EC2 instances or using Amazon S3 storage.                                                      #
###################################################################################################################################################

import boto3
import botocore
from botocore.config import Config
import os
import json
import logging
from urllib.parse import unquote_plus

# Set constants
LOCAL = os.getenv("LOCAL", "N")
SNS_ARN = os.getenv("SNS_ARN")  
RUN_ID = os.getenv("RUN_ID", "-1")
MODEL_ID = os.getenv("MODEL_ID", "us.anthropic.claude-3-5-sonnet-20241022-v2:0") # Defaults to CRIS Claude 3.5 Sonnet
DYNAMODB_TABLE = os.getenv("DYNAMODB_TABLE")

# Set logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logger = logging.getLogger(__name__)
logger.setLevel(LOG_LEVEL)
logger.info("boto3 version: " + boto3.__version__)
logger.info("botocore version: " + botocore.__version__) 

#Set clients
textract = boto3.client('textract')
# sets retries to handle Bedrock throttling
config = Config (
    retries = dict (
        max_attempts = 20,  # Total attempts (1 initial + 9 retries)
        mode = 'adaptive'
    )
)
bedrock = boto3.client('bedrock-runtime', config=config)
sns = boto3.client('sns')
dynamodb = boto3.client('dynamodb')

def dynamoDBwrite(result, rationale, job_id, object, bucket, expected_result, model):
    try: 
        # performing the write call against DynamoDB
        dynamodb_response = dynamodb.put_item(
            TableName=DYNAMODB_TABLE,
            Item={
                'result': {'S': result},
                'Rationale': {'S': rationale},
                'job_id': {'S': job_id},
                'Bucket': {'S': bucket},
                'Object': {'S': object},
                'ExpectedResult': {'S': expected_result}, # Source bucket prefix, used to initial validation against a labeled set
                'Model': {'S': model},
                'RunId': {'S': RUN_ID}
            }
        )
        return(dynamodb_response)
    except botocore.exceptions.ClientError as e:
        error_code = e.response['Error']['Code']
        error_msg = e.response['Error']['Message']
        logger.error(f"DynamoDB API error: {error_code} - {error_msg}")
        raise Exception(f"DynamoDB write failed: {error_code} - {error_msg}")
    except Exception as e:
        logger.error(f"Error invoking DynamoDB: {str(e)}")
        raise

def snsPut(message, topic_arn):
    try: 
        # performing the publish call against SNS
        sns_response = sns.publish(
            TopicArn=topic_arn,
            Message=message,
            Subject='Document analysis'
        )
        return(sns_response)
    
    except botocore.exceptions.ClientError as e:
        error_code = e.response['Error']['Code']
        error_msg = e.response['Error']['Message']
        logger.error(f"SNS API error: {error_code} - {error_msg}")
        raise Exception(f"SNS publish failed: {error_code} - {error_msg}")
    except Exception as e:
        logger.error(f"Error invoking SNS: {str(e)}")
        raise

def textractGet(job_id):
    try:
        # initiating textract client
        word_join = ""
        
        # Initialize pagination token
        next_token = None
        
        while True:
            # Build the base request parameters
            request_params = {
                'JobId': job_id
            }
            
            # Add NextToken if we have one from a previous iteration
            if next_token:
                request_params['NextToken'] = next_token
                
            # Get the response from Textract
            textract_response = textract.get_document_text_detection(**request_params)
            
            # Process blocks from current response
            for blocks in textract_response['Blocks']:
                if blocks['BlockType'] == 'WORD':
                    word_join = (word_join + " " + blocks['Text'])
            
            # Check if there are more pages to process
            if 'NextToken' in textract_response:
                next_token = textract_response['NextToken']
            else:
                # No more pages, exit the loop
                break
                
        return word_join
    
    except botocore.exceptions.ClientError as e:
        error_code = e.response['Error']['Code']
        error_msg = e.response['Error']['Message']
        logger.error(f"Textract API error: {error_code} - {error_msg}")
        raise Exception(f"Textract processing failed: {error_code} - {error_msg}")
    except Exception as e:
        logger.error(f"Error invoking Textract: {str(e)}")
        raise

def invokeLLM(extracted_words):
    try: 
        # configure model specifics such as specific model
        # accept = 'application/json'
        # contentType = 'application/json'

        # prompt that is passed into the LLM, template is for Anthropic Claude
        system_prompt = f"""<role> You are a document classifier and your job is to evaluate input text from an email to determine if an urgent response is required. </role>

    <context> 
    <factor> Evaluate a set of rules to determine if they indicate a document is urgent or routine in nature. </factor> 
    <factor> Carefully examine each rule in the list of urgent rules and routine rules.  </factor>  
    <factor> In addition to the defined rules, also use common email request indicators that an urgent response is required.  </factor> 
    </context>
    """
        prompt = f"""<tasks> 
    - Use the following input text: {extracted_words} 
    - Evaluate the urgency considering the defined factors.
    - Determine if the input text is urgent or routine based both the urgent rules and routine rules.
    - In addition to the lists of rules, look for common terms indicating an urgent response such as a escalation, threats of legal action, penalties, demands, or ultimatums. 
    - The input text does not need to exactly match the rules. 
    - Output with valid JSON only. Do not include any extra text.
    - Each item should have: response (string), rationale (string)
    - Provide your response as a single word: "urgent" or "routine". 
    - Provide your rationale as a summary in no more than 3 short sentences.
    </tasks>

    <urgent_rules> 
    "as a result of your negligence, we are seeking compensation for [damage/injury]"
    "please remit payment within [x days]"
    "this amount includes [economic/non-economic damages]"
    "photos of the damage are attached to support this claim"
    "this demand is made in good faith to resolve this matter"
    "we expect a response by [specific date]"
    "please consider this letter a formal demand"
    "if we do not hear from you by [deadline], we will proceed to court"
    "it is clear that the fault for this incident lies with [responsible party]"
    "the disruption to daily life has been significant"
    "we are willing to discuss a settlement to avoid litigation"
    "failure to comply may result in legal proceedings"
    "to avoid unnecessary legal costs, we suggest [action]"
    "police reports and witness statements substantiate the facts"
    "we propose settling this claim for [specific amount]"
    "the incident has caused ongoing trauma and hardship"
    "under applicable laws, you are required to [action]"
    "our goal is to reach an equitable resolution"
    "due to the incident that occurred on [date], we are pursuing damages"
    "the pain and suffering caused by this incident"
    "failure to maintain a safe environment caused [incident]"
    "liability lies with [responsible party]"
    "we are seeking damages for emotional distress"
    "this is your opportunity to resolve the matter amicably"
    "your actions have resulted in [consequence]"
    "reimbursement for medical bills totaling [specific amount]"
    "we are writing to address [issue]"
    "evidence of property damage is included herein"
    "failure to respond will leave us no choice but to pursue legal action"
    "this letter serves as a formal demand for [specific amount]"
    "the total amount of compensation being sought is [specific amount]"
    "we request payment for lost wages due to [reason]" 
    </urgent_rules> 

    <routine_rules>
    "thank you for assigning to us the defense of national carriers, inc. and its driver [name]"
    "what is undisputed is that the insured vehicle backed into the plaintiff's vehicle"
    "you retained a biomechanical expert to analyze this case and the opinion is that the"
    "Comes now the plaintiff, individually and as next of kin and guardian of their minor child, pursuant to [rule number], and hereby gives notice to all parties of the taking of deposition of [doctor name]. This deposition shall take place at [facility name and address] on [date] at [time] and continuing until concluded. This deposition shall be conducted by both audio/visual and stenographic means."
    "i certify that a true and exact copy of the foregoing was served this [date] via email to the following:"
    "adjustments to the policy coverage were requested following the claim"
    "the repair estimates for this claim exceed the initial projection"
    "incident description for claim [number] includes a minor collision"
    "the insured has submitted all necessary forms for processing"
    "this entry number [number] is part of routine correspondence about claims"
    "the policyholder reported a weather-related incident last [month]"
    "please review the photographs provided to support claim [number]"
    "the claimant mentioned the incident occurred near a construction site"
    "the vehicle sustained damage during the parking lot incident on [date]"
    "claim number [number] requires additional documentation for processing"
    "matters span from patient care reviews to legal appeals, with consequences for delayed responses"
    "The cases include benefit terminations, settlements, and medical emergencies requiring action to protect patient care and legal rights"
    </routine_rules>
    """
        # body of data with parameters that is passed into the bedrock invoke model request
        logger.debug("System prompt: " + system_prompt)
        logger.debug("Prompt: " + prompt)
        #print(prompt_data)
        inferenceConfig = {
                            #"anthropic_version": "bedrock-2023-05-31",
                            "maxTokens": 4096,
                            "stopSequences": [],
                            "temperature": 1,
                            "topP": 1,
        }
        messages = [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "text": prompt
                                }
                            ]
                        }
                    ]
        system = [
                    {
                        "text": system_prompt
                    }
                ]
        performanceConfig = {
            "latency": "standard" # Slower processing but more think time
        }
        logger.debug(messages)
        response = bedrock.converse(inferenceConfig=inferenceConfig,
                                    system=system,
                                    messages=messages,
                                    performanceConfig=performanceConfig,
                                    modelId=MODEL_ID
        )
        answer = response['output']['message']['content'][0]['text']
        return (answer)
    
    except botocore.exceptions.ClientError as e:
        error_code = e.response['Error']['Code']
        error_msg = e.response['Error']['Message']
        logger.error(f"Bedrock API error: {error_code} - {error_msg}")
        raise Exception(f"Bedrock processing failed: {error_code} - {error_msg}")
    except Exception as e:
        logger.error(f"Error invoking Bedrock: {str(e)}")
        raise

def lambda_handler(event, context):
    try:
        logger.info(event)
        sns_message = json.loads(event['Records'][0]['Sns']['Message'])
        logger.debug("SNS Message: " + json.dumps(sns_message))
        textract_job_id = sns_message['JobId']
        logger.info("Textract Job Id: " + textract_job_id)

        extracted_words = textractGet(textract_job_id) # Calling Textract job to get output
        logger.info("Textract words: " + extracted_words)
        
        llm_response = json.loads(invokeLLM(extracted_words)) # Calling LLM to get classification response
        logger.info("LLM response: " + json.dumps(llm_response))
        response = llm_response['response']
        rationale = llm_response['rationale']
            
        dynamodb_response = dynamoDBwrite(
                response, 
                rationale,
                textract_job_id, 
                unquote_plus(sns_message['DocumentLocation']['S3ObjectName'].split('/')[-1]), 
                sns_message['DocumentLocation']['S3Bucket'], 
                sns_message['DocumentLocation']['S3ObjectName'].split('/')[0], 
                MODEL_ID
            ) # Writing response to DynamoDB table
        logger.debug("DynamoDB response: " + json.dumps(dynamodb_response))

        sns_response = snsPut(response, SNS_ARN) # Sending response to email via SNS
        logger.debug("SNS response: " + json.dumps(sns_response))
        
        logger.info("Processing completed successfully")

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")

# Local testing event payload and handler invocation, Set for local testing
if LOCAL == "Y":
    import sys
    
    # Create file handler
    file_handler = logging.FileHandler('lambda_errors.log')
    file_handler.setLevel(LOG_LEVEL)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    
    # Add handler to logger
    logger.addHandler(file_handler)

    event = {} # Add event for local testing
    lambda_handler(event, None)