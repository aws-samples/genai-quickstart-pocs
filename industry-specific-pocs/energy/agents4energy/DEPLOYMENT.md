# Solution Deployment
The following instructions show how to deploy Agents4Energy (A4E) in your AWS account for experimentation and testing.  This process takes approximately an hour, and requires an AWS account with administrative access.  All of the sample agents, configuration, AWS resources, and sample data used in the public demonstration site are provided.  Please be aware that deployment into your AWS account will create industry sample resources that incur AWS costs even if they are not used.  

<span style="color: red; font-weight: bold;">Once work with this project is complete, it is recommended to delete the CloudFormation stack if you no longer need Agents4Energy to prevent ongoing cloud costs which are approximately $500/month with the sample agents and supporting resources (as of March 2025).</span>

1. Fork the Agents4Energy GitHub repository to create a working version of the code 

2. Login to your AWS account navigate to Model Access in Amazon Bedrock

![Model Access](assets/images/A4E-Deploy01.png)

3. Enable the desired foundation models for use with your agentic workflows (select all)

![Enable Models](assets/images/A4E-Deploy02.png)

4. Access should be granted immediately

![Access Granted](assets/images/A4E-Deploy03.png)

5. Test the models in the Chat/Text playground of your desired region to make sure LLMs are working

![Chat Playground](assets/images/A4E-Deploy04.png)

6. Navigate to AWS Amplify and click Deploy an app

![Amplify Landing Page](assets/images/A4E-Deploy05.png)

7. The Amplify Gen2 app will be linked to the GitHub url of the fork created in Step 1

![Amplify Landing Page](assets/images/A4E-Deploy06.png)

8. This example shows the main branch which can also be deployed if you don't plan to make any changes - keep in mind this will automatically be updated with future changes in A4E main branch repository

![Amplify Landing Page](assets/images/A4E-Deploy07.png)

9. Amplify provides configuration of your build and service role policies

![Amplify Landing Page](assets/images/A4E-Deploy08.png)

10. Make sure to update the Advanced Settings to use Custom Build Image **aws/codebuild/amazonlinux2-x86_64-standard:5.0** and add a Key for **_BUILD_TIMEOUT** of 120 minutes

![Amplify Landing Page](assets/images/A4E-Deploy09.png)

11. Click "Save and deploy" to start the deployment.  
###  <span style="color:red">**THIS STEP WILL BEGIN TO CREATE AGENTS4ENERGY AWS RESOURCES AND INCUR COSTS IN YOUR AWS ACCOUNT!**</span>

![Amplify Landing Page](assets/images/A4E-Deploy10.png)

12. Amplify will bootstrap CDK in your account

![Amplify Landing Page](assets/images/A4E-Deploy11.png)

13. After the environment is bootstrapped, agents4energy will start deploying automatically

![Amplify Landing Page](assets/images/A4E-Deploy12.png)

14. Be patient – the initial deployment will take around 45minutes, but you can keep an eye on the logs in Amplify

![Amplify Landing Page](assets/images/A4E-Deploy13.png)

15. In CloudFormation, you can track the progress of the stack deployments with more detail

![Amplify Landing Page](assets/images/A4E-Deploy14.png)

16. After the build and deployment steps are complete, Amplify should look something like this.  The Domain link provides the URL to access the demo application in your AWS account.

![Amplify Landing Page](assets/images/A4E-Deploy15.png)

17. You can click on the "Domain" URL link to launch the application

![Amplify Landing Page](assets/images/A4E-Deploy16.png)

18. Click **Start a Chat** which will direct you to create a user account since you won't already be logged in.  Make sure to switch the login dialog to "Create Account" and enter your email and desired password 2x

![Amplify Landing Page](assets/images/A4E-Deploy17.png)

19. You'll get an email with a 6 digit code that you enter into the Confirmation Code box to validate your email

![Amplify Landing Page](assets/images/A4E-Deploy18.png)

20. Now when you Start a Chat you'll be brought to the main A4E chat workspace

![Amplify Landing Page](assets/images/A4E-Deploy19.png)

21. Pick the **Production Agent** using the ellipsis to the right of **Chat Agents**

![Amplify Landing Page](assets/images/A4E-Deploy20.png)

22. You can start interacting with the Agent, but the example prompts may be helpful since you don't know what data is in the samples!

```json
Search the well files for the well with API number 30-045-29202 to make a table with type of operation (drilling, completion, workover, plugging, other), text from the report describing operational details, and document title. Also execute a sql query to get the total monthly oil, gas and water production from this well. Create a plot with both the event data and the production data.
```

![Amplify Landing Page](assets/images/A4E-Deploy21.png)

23. Make sure the doc links to pdf source documents work

![Amplify Landing Page](assets/images/A4E-Deploy22.png)

24. Example pdf docs (from New Mexico Oil Conservation Division) should pull un in another web browser tab

![Amplify Landing Page](assets/images/A4E-Deploy23.png)

25. Test out the multi-series chart popups works (with links to documents) by clicking on the event series in the chart

![Amplify Landing Page](assets/images/A4E-Deploy24.png)

26. Switch the app to dark mode and try out the Maintenance Agent – it should find 2 biodiesel tanks located in the biodiesel unit of the refinery defined in the CMMS database

![Amplify Landing Page](assets/images/A4E-Deploy25.png)

27. Notice that the example prompts change as the Agent considers the context of the conversation

![Amplify Landing Page](assets/images/A4E-Deploy26.png)

28. When were the tanks in the biodiesel unit last inspected or serviced?

![Amplify Landing Page](assets/images/A4E-Deploy27.png)

29. Make up your own maintenance optimization questions – push the limits to see what Anthropic Claude Sonnet 3 can do when it has access to your CMMS database!
```json
I am concerned that our inspections took longer than expected in 2024.  Time is money in the refinery business since every day I have the biodiesel unit at reduced capacity it costs me $15,000.  If I want to make sure the inspections complete on time so we don't have to take the unit offline longer than planned, which technician should I have do the work based on the inspections last year?
```
![Amplify Landing Page](assets/images/A4E-Deploy28.png)

## Review Deployed AWS Resources
If you want to begin exploring the unstructured document data included in the samples, go to S3 and search for a bucket with "file" in the bucket name.  all of the pdfs, word docs, and other files that are embedded into the vectorized database are sourced from this S3 bucket.

![Amplify Landing Page](assets/images/A4E-Deploy29.png)

You can view the sample refinery shift handover reports and other documents in S3

![Amplify Landing Page](assets/images/A4E-Deploy30.png)

Relational Database Service (RDS) resources are secured through AWS Secrets Manager

![Amplify Landing Page](assets/images/A4E-Deploy31.png)

Click on the blue boxes to the left of the Secret ARN to copy it to your clipboard

![Amplify Landing Page](assets/images/A4E-Deploy32.png)

Once the RDS databases are deployed, you can use the Amazon RDS Query Editor to browse the CMMS data and validate Agent responses.

![Amplify Landing Page](assets/images/A4E-Deploy33.png)

You can use this secret to access the Query Editor to see the data in **maintdb** PostgreSQL database

![Amplify Landing Page](assets/images/A4E-Deploy34.png)

The tables in the public schema contains oil & gas sample data that is accessible to Agents4Energy Maintenance Agent 

![Amplify Landing Page](assets/images/A4E-Deploy35.png)

Work order samples are provided in the table called **maintenance**

![Amplify Landing Page](assets/images/A4E-Deploy36.png)

### Troubleshooting

![Amplify Landing Page](assets/images/A4E-Deploy37.png)

If you don't see any rows in the maintenance table, or the table doesn't exist, try running the Lambda function with "PrepDbFunction" in the name.  This will reset the data to the default set of deployment data, so you can run it at any time, but it will back out any changes you have made with the Maintenance Agent (INSERT, UPDATE, or DELETE) 

![Amplify Landing Page](assets/images/A4E-Deploy38.png)

Finally, verify that all Amazon Bedrock Knowledge Base Data Sources are synchronized.  That is the final verification step.  Your Agents4Energy environment is ready to use! 