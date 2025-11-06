pending items

without MCP:
    - pagination for calling bedrock for services with large number of parameters
        - ✅ service documentation (actions)
        - when reading from DynamoDB to send to Bedrock 
            -> there is plan to create chunks that needs to be validated
                - IAM should be fine

with MCP:
    - replace webscraping with MCP server (in the Documentation Manager lambda). 
        - Keep saving into database to use information for validations
    - stop sending actions and parameters and tell the agent to leverage the MCP server to pull the correct and most recent information (on all lambda functions that uses either parametes or actions as part of the prompt)
    - AgentCore
        - replace Bedrock calls from within the Lambdas
        - use stepfunctions to trigger parameter validation after bedrock output

- validation reports
    - analyze the existing reports and find true/false positives
        - true positives - find a solution when generating the code
        - false positives - improve the validation prompt
    - link to state machine

- review unecessary parameters from step to step

- S3 input should add to a SQS queue that would trigger the StepFunctions

- review CDK permission for services (many * should be removed)

- *** connect with the Partner SA for Wiz and ask him to contribute

- create the "execution id" concept to link the documentation and output to that 
    - save a local execution metadata to see when the documentation page was last changed to avoid downloading again 
    - same for MCP, if possible
    - set TTL on DynamoDB and S3 lifecycle

question:
- Strands Agent
    - use aws - can store data into DynamoDB directly




