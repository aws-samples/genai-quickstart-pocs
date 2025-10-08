'use client';

import ContentLayout from "@cloudscape-design/components/content-layout";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Header from "@cloudscape-design/components/header";
import ExpandableSection from "@cloudscape-design/components/expandable-section";

export default function PressRelease() {
  return (
    <ContentLayout
      defaultPadding
      header={
        <Header
          variant="h1"
          description="Press Release and FAQ for Agents4Energy"
        >
          AWS Launches Agents4Energy
        </Header>
      }
    >
      <SpaceBetween size="l">
        <Container>
          <Box variant="h2" padding={{ bottom: "s" }}>
            Press Release
          </Box>
          <Box variant="p">
            HOUSTON - March 17, 2025 - Amazon Web Services (AWS), an Amazon.com, Inc. company (NASDAQ: AMZN), announced Agents4Energy, an easily configurable and deployable, set of open-source agentic workflows to help customers in Energy industry accelerate their workloads on AWS. Agents4Energy is available as an open-source AWS Solution and makes it easy for energy professionals to use generative AI assistants for a range of common energy industry use cases, e.g., field operations, supply chain optimization, and asset integrity management.
          </Box>
          <Box variant="p">
            Generative AI is revolutionizing the energy industry by enhancing operational efficiencies and driving innovation. In particular, foundation model-based agentic workflows are gaining traction, activating autonomous task execution and collaboration to streamline complex processes. They are increasingly utilized in generative AI workloads for real-time decision making, actionable insight generation, automating routine tasks, and optimization of operational efficiencies. They can help answer questions such as &ldquo;what equipment has failed most frequently?&rdquo;, &ldquo;who serviced the equipment?&rdquo;, &ldquo;what procedures were followed?&rdquo;, &ldquo;which supplier provided the parts?&rdquo;, and determine whether there are connections between these data points. Their true power, however, lies in their ability to take action when needed - such as shutting down failing equipment, ordering parts, or scheduling maintenance crews - all with a human in the lead. Agentic workflows require domain expertise to design and engineering skill to deploy. Agents4Energy simplifies this by providing pre-designed agents for energy-specific domain workflows.
          </Box>
          <Box variant="p">
            The first release of Agents4Energy will feature agent-based assistants in specific energy domains: Maintenance, Production, Regulatory, and Petrophysics. It will include publicly-sourced test data to help customers evaluate available Agentic Workflows. Agents4Energy can also be easily configured to access and work with customer data, such as contracts, engineering reports, maintenance logs, and equipment manuals. The built-in chat interface supports natural language queries, activating data exploration and insights by drawing responses from various data sources.
          </Box>
          <Box variant="p">
            In addition to interactions with a company&apos;s static data, agents can provide a translation layer between energy professionals and the enterprise systems that contain crucial real-time data across the company. Systems such as SAP, daily production systems, and The OSDU Data Platform that historically required integration developers for data access are now accessed with interfaces created and run by agents.
          </Box>
          <Box variant="p">
            Agents4Energy is available today as an AWS Solution Guidance with sample demos on AWS Samples GitHub. The resources can be accessed and deployed through the Agents4Energy website at https://agents4energy.com For enterprise customers looking to scale their GenAI workloads, Agents4Energy is also part of the Energy GenAI Factory Program available exclusively through AWS, and we are actively collaborating with our partners to integrate agentic support for third-party energy solutions and workflows.
          </Box>
          <Box variant="p">
            Reach out to us at agents4energy@amazon.com to start transforming your energy operations today with Agents4Energy.
          </Box>
        </Container>

        <Container>
          <Box variant="h2" padding={{ bottom: "s" }}>
            Customer FAQ
          </Box>
          <SpaceBetween size="l">
            <ExpandableSection header="What is Agents4Energy?">
              Agents4Energy is an AWS Solution with easily configurable and deployable set of open-source agentic workflows to help energy customers accelerate their workloads.
            </ExpandableSection>

            <ExpandableSection header="What are Agents? What is an Agentic Workflow?">
              Agents in generative AI are autonomous systems that reason and run workflows with minimal supervision by leveraging foundation models for planning and decision-making. They can be instantiated through QnA chat sessions with a user, or invoked as part of day-to-day business activities, e.g. receipt of a new document, email, or entry in a database.
            </ExpandableSection>

            <ExpandableSection header="What Agentic Workflows are included in Agents4Energy?">
              Release 1 of Agents4Energy will include agentic workflows examples in the following domains:
              <ul>
                <li>Maintenance - Maintenance insights and optimization</li>
                <li>Production - Well remediation plan development</li>
                <li>Regulatory - Automatic contract notification</li>
                <li>Petrophysics - Reservoir characterization and complex calculations</li>
              </ul>
              Additional agents will be added in the future to fill in the rest of the structure for oil & gas with power & utilities agents to also be added in the future.
            </ExpandableSection>

            <ExpandableSection header="What LLMs does Agents4Energy use?">
              Agents4Energy currently defaults to Claude models from Anthropic but can be configured to use any foundation model within Amazon Bedrock which supports agents.
            </ExpandableSection>

            <ExpandableSection header="What Agentic Framework are you using for orchestration?">
              Agents4Energy uses the LangChain & LangGraph behind the scenes to help with Agent orchestration.
            </ExpandableSection>

            <ExpandableSection header="Is there a demo of Agents4Energy?">
              Demo videos and walkthroughs can be found at https://Agents4Energy.com
            </ExpandableSection>

            <ExpandableSection header="Is Agents4Energy open source?">
              Agents4Energy is a solution that is open-sourced under the Apache 2.0 license.
            </ExpandableSection>

            <ExpandableSection header="What AWS Services does the Solution use?">
              The solution is build on top of Amazon Bedrock with LangChain/LangGraph used for orchestration of agents. Other services include Amazon S3 for storage and Amazon Cognito for Authentication. A full list of the AWS resources deployed can be found at https://github.com/aws-samples/agents4energy/blob/main/INVENTORY.md
            </ExpandableSection>

            <ExpandableSection header="Is there an architecture diagram?">
              Yes, the reference architecture can be viewed in the GitHub repository README file with additional information published as part of the AWS Solution Guidance.
            </ExpandableSection>

            <ExpandableSection header="Are you going to support third-party agents or Agentic Workflows?">
              Third-party agents or Agentic Workflows that supports third-party software applications in customer workflows are on the roadmap for Agents4Energy, but not included in the initial March 2025 open-source release.
            </ExpandableSection>

            <ExpandableSection header="What are Knowledge Bases?">
              Amazon Bedrock Knowledge Bases give foundation models and agents contextual information from your company&apos;s data and date sources to deliver more relevant, accurate, and customized responses. Agents4Energy includes Knowledge Bases created from standard energy-industry data sources. Examples of using OpenSearch Serverless and Aurora Serverless are provided so customers can choose the appropriate storage service based on their policies and preferences.
            </ExpandableSection>

            <ExpandableSection header="Which knowledge bases will be included in Release 1 of Agents4Energy?">
              Regulatory, Petrophysics, Production, and Maintenance Agents are provided in the initial release. These 4 agents each have a knowledge base for their unstructured data, and an additional knowledge base for relational database structure of the Production Agent is also included.
            </ExpandableSection>

            <ExpandableSection header="Can I bring my data into Agents4Energy?">
              Yes. The entire concept of Agents4Energy is to extend pre-trained foundation models with the ability to access and analyze your corporate data. Proprietary and commercial data can be included as static documents in Knowledge Bases, or as live data accessed through APIs using Amazon Bedrock Action Groups. The data brought in by you will reside in your own account and will not be used to train or improve Amazon Bedrock or any model within Amazon Bedrock unless you consent.
            </ExpandableSection>

            <ExpandableSection header="I am interested, how do I get started?">
              Send an email to agents4energy@amazon.com to discuss next steps, including running a Agents4Energy workshop for your customer.
            </ExpandableSection>

            <ExpandableSection header="What does the Agents4Energy workshop entail & who should participate?">
              Agent4Energy interactive workshop demonstrates how it works and give customers an opportunity for hands-on lab exercises in a Workshop Studio environment to explore all of the features and benefits. Some technical experience is necessary, but the workshop is appropriate for line-of-business personas such as lease analysts, production engineers, maintenance technicians, regulatory managers, and HSE supervisors. Data scientists and IT administrators will be helpful in the workshop to understand how Agents4Energy can be deployed into an enterprise AWS environment.
            </ExpandableSection>

            <ExpandableSection header="How can Agents4Energy be deployed? Do you support a self-install?">
              Agents4Energy will be released as a ready to deploy open-source solution assembling AWS Services, code, and configurations. Customers will have the option to augment their IT and cloud administration teams with AWS Professional Services or qualified systems integrator partners to help get the most out of Agents4Energy and establish a secure, configurable production deployment.
            </ExpandableSection>

            <ExpandableSection header="Can I add my own Agentic Workflows to Agents4Energy?">
              Yes. Agents4Energy is available as an open-source AWS Solutions offering, which allows users to extend and customize the solution to fit their specific business needs. This includes the ability to add your own agents to Agents4Energy. While AWS desires that reusable work is contributed back to the GitHub repository, this is not a requirement for use.
            </ExpandableSection>

            <ExpandableSection header="What skills are required to deploy and manage Agents4Energy?">
              Deployment of Agents4Energy leverages the open-source software development framework for defining cloud infrastructure called the AWS Cloud Development Kit (CDK). Using the CDK allows customers to define Agents in code and provision them through AWS CloudFormation. AWS Amplify familiarity is also required to deploy the solution. Ongoing support requires familarity with relational databases, vector databases, web applications, and unstructured data in S3 that are common skills available on a cloud support team.
            </ExpandableSection>

            <ExpandableSection header="How much will it cost to run?">
              Because Agents4Energy is open-sourced under the Apache license, there are no licensing costs. AWS services usage (token pricing link) will be based on the amount of data stored in the knowledge bases and frequency of Amazon Bedrock use through the web application or API calls. With the sample data provided in release 1, Agents4Energy costs approximately $500/month even if never used and will continue to incur costs until the application and supporting resources are deleted from your AWS account.
            </ExpandableSection>

            <ExpandableSection header="How can I get help if I find a problem with an agent?">
              Email agents4Energy@amazon.com or contact your AWS Energy Account Team
            </ExpandableSection>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  );
} 
