# Agents4Energy Technical Inventory 

This document provides details of the resources deployed in the Agents4Energy (A4E) CDK stack as deployed through Amplify main branch connected to GitHub aws-samples repository as of Feb 2025.  
The amount of data and specific resources that are deployed will consume approximately $550/month of AWS spend.  Approximately 63% of the spend is OpenSearch Serverless, 25% is RDS, and other 
services make up the remaining 12%.  This estimate has the potential to be higher based on user-Agent interaction and addition of more data, so deployments should be done with caution and 
cleaned up after use to prevent unexpected AWS billing charges.

## Overview
Agents4Energy is an Amazon Bedrock-based solution designed to enable AWS customers and partners to deploy sample agents tailored for oil & gas and power/utilities workloads. 
This documentation provides a comprehensive overview of the technical resources deployed as part of the CDK Amplify application, intended for review by technical teams to 
better understand the inventory of resources deployed by the project.  The Agents4Energy solution leverages several AWS services to create a robust, scalable, and secure 
environment for deploying and managing agents. The architecture is designed to be modular, allowing for easy extension and integration with other AWS services.



## AWS Resource Deployment Summary
### Amazon Bedrock
Amazon Bedrock provides the underlying infrastructure and services required for agent deployment. Bedrock Agents and Knowledge Bases are deployed as part of Agents4Energy.

* Resources:
    * Bedrock Knowledge Bases: 5
        * Maintenance
            * Shift handover reports from operators, covering equipment status, maintenance activities, product quality, safety reminders, KPIs, production targets, etc.
            * Contact information for a pipeline repair contractor
            * A list of equipment tags/identifiers for key units in the biodiesel process like the CSTR reactor, tanks, separators, etc.
            * Notes on resolving an issue with a blocked biodiesel separator inlet feed line and completing scheduled preventative maintenance on the reactor.
        * Petroleum
        * Petrophysics
        * Regulatory
        * TableDefinition
    * Bedrock Agents: 3
        * Relationships to KBs: Each agent is associated with one or more knowledge bases.
        * Action Groups: 5

### Amazon Cognito
Cognito provides authentication and authorization for login credentials.

* Resources:
    * User Pools: 1
    * Identity Pools: 1

### Amazon S3
S3 is used for object storage of agent artifacts and logs.

* Resources:
    * S3 Buckets: 3
        * Model Schema
        * Model Introspection Schema
        * Knowledge Base Files

### Amazon Relational Database Service (RDS)
Aurora Serverless v2 PostgreSQL databases are created for the sample industry datasets, as well as an option for using pgvector for embeddings used in Bedrock Knowledge Base

* Resources:
    * Clusters (Single Instance): 3
        * Hydrocarbon Production
        * CMMS Maintenance Database
        * PostgreSQL Vector Store
* CMMS Sample Database:

The CMMS database contains the following tables populated with oil & gas industry sample data:

1. equipmenttypes - Defines the different types of equipment 
2. mainttypes - Categories of maintenance that can be performed 
3. locationtypes - The different types of locations like facilities, units, wellpads 
4. locations - Details on actual locations/facilities like addresses, contacts, work centers 
5. businessunits - The different business units or companies 
6. statustypes - List of status types like active, inactive that can be applied 
7. equipment - Master data on individual assets/equipment with specs, service dates, status, location 
8. maintenance - Tracks all maintenance activities on equipment with details like dates, downtime, effort, costs


The equipment and maintenance tables are the primary data tables, linking to the other lookup/reference data tables for equipment types, maintenance types, location details, status types, and business units.  Column names and data types are outlined below:

    * TABLE: equipmenttypes - This table contains the different types of equipment like pumps, compressors, etc. It has columns for the equipment type ID, name, and audit columns for created/updated details.
        * equiptypeid (integer, primary key)
        * equiptypename (varchar)
        * createdby (varchar)
        * createddate (timestamp)
        * updatedby (varchar)
        * updateddate (timestamp)
    * TABLE: mainttypes - This stores the different categories of maintenance that can be performed like preventive, reactive, etc. It has columns for the maintenance type ID, name, and audit details.
        * mainttypeid (varchar, primary key)
        * mainttypename (varchar)
        * createdby (varchar)
        * createddate (timestamp)
        * updatedby (varchar)
        * updateddate (timestamp)
    * TABLE: locationtypes - This defines the different types of locations like facilities, units, wellpads, etc. It has columns for the location type ID, name, and audit columns.
        * loctypeid (varchar, primary key)
        * loctypename (varchar)
        * createdby (varchar)
        * createddate (timestamp)
        * updatedby (varchar)
        * updateddate (timestamp)
    * TABLE: locations - This table contains details on the actual locations/facilities like addresses, coordinates, contacts, work centers, and the type of location. It links to the locationtypes table.
        * locationid (integer, primary key)
        * locname (varchar, not null)
        * loctypeid (varchar, foreign key to locationtypes)
        * facility (integer)
        * businessunit (varchar)
        * workcenter (varchar)
        * section (varchar)
        * locmgrid (varchar)
        * latitude (float8)
        * longitude (float8)
        * address1 (varchar)
        * address2 (varchar)
        * city (varchar)
        * state (varchar)
        * zip (varchar)
        * country (varchar)
        * phone (varchar)
        * fax (varchar)
        * email (varchar)
        * createdby (varchar)
        * createddate (timestamp)
        * updatedby (varchar)
        * updateddate (timestamp)
    * TABLE: businessunits - This stores the different business units or companies. It has columns for the business unit ID, name, and audit details.
        * buid (varchar, primary key)
        * buname (varchar, not null)
        * createdby (varchar)
        * createddate (timestamp)
        * updatedby (varchar)
        * updateddate (timestamp)
    * TABLE: statustypes - This contains a list of status types that can be applied to equipment or maintenance records like active, inactive, etc. It has columns for the status ID, name, and audit details.
        * statusid (varchar, primary key)
        * statusname (varchar, not null)
        * createdby (varchar)
        * createddate (timestamp)
        * updatedby (varchar)
        * updateddate (timestamp)
    * TABLE: equipment - This is the core equipment master data table. It contains information on individual assets like equipment name, type, manufacturer, specs, service dates, status, and location details. It links to the equipmenttypes, locations, and statustypes tables.
        * equipid (varchar, primary key)
        * equipname (varchar, not null)
        * equiplongdesc (varchar)
        * equiptypeid (integer, foreign key to equipmenttypes)
        * manufacturer (varchar)
        * model (varchar)
        * serialnum (varchar)
        * equipweight (numeric)
        * weblink (varchar)
        * installlocationid (integer)
        * lat (numeric)
        * lon (numeric)
        * safetycritical (boolean, not null)
        * statusid (varchar, foreign key to statustypes, not null)
        * manfyear (integer)
        * servicedatestart (date)
        * servicedateend (date)
        * createdby (varchar)
        * createddate (timestamp)
        * updatedby (varchar)
        * updateddate (timestamp)
    * TABLE: maintenance - This table tracks all maintenance activities performed on equipment. It has columns for the maintenance ID, type, description, planned/actual start and end dates, downtime required, effort hours, costs, technician, status, and links to the mainttypes, equipment, and statustypes tables.
        * maintid (integer, primary key)
        * workorderid (varchar)
        * equipid (varchar, refers to equipment)
        * mainttypeid (varchar, foreign key to mainttypes)
        * maintname (varchar, not null)
        * maintlongdesc (varchar)
        * efforthours (integer)
        * downtimereq (boolean)
        * statusid (varchar, foreign key to statustypes, not null)
        * technicianid (varchar)
        * responsibleid (varchar)
        * requirespermit (boolean)
        * planneddatestart (date)
        * planneddateend (date)
        * actualdatestart (date)
        * actualdateend (date)
        * estcost (numeric)
        * createdby (varchar)
        * createddate (timestamp)
        * updatedby (varchar)
        * updateddate (timestamp)

### AWS Lambda
Lambda functions are used to execute agent logic and handle interactions.

* Resources:
    * Lambda Functions: 39
        * Various functions for Amplify management (key rotation, etc.), custom resource providers, and agent tool functionality such as populating and querying data sources

### Amazon DynamoDB
DynamoDB is used to store agent configurations and states including chat message history.

* Resources:
    * DynamoDB Tables: 2
    * DynamoDB Streams: 1
    * DynamoDB Global Secondary Indexes: 1

### AWS Step Functions
Step Functions orchestrate complex workflows involving multiple AWS services for deployment and processing.

* Resources:
    * State Machines: 3
        * agents4energy-workflow
        * agents4energy-data-processing
        * agents4energy-maintenance
    * Activities: 2
        * agents4energy-activity
        * agents4energy-maintenance-activity
    * Executions: Multiple (depending on workflow executions)

### AWS Identity and Access Management (IAM)
IAM manages permissions and access control for the deployed resources.  Review the specific roles for your environment carefully as they control access
to the resources that provide Agents access to internal data.  All roles and policies should be carefully reviewed to ensure the least privilege
necessary.  The samples provided are not intended for production use.

### Amplify
Amplify enhances the CDK deployment with additional features, such as CI/CD pipelines and environment management.

* Resources:
    * Amplify Environments: 1
    * Amplify Pipelines: 1

### AWS Cloud Development Kit (CDK)
AWS CDK is used to define the infrastructure as code, allowing for consistent and repeatable deployments.

* Resources:
    * CDK Stacks: 5

### Additional Resources

* OpenSearch Serverless:
    * Collections: 3
        * Backend vector database for Bedrock KBs
* Amazon Secrets Manager:
    * Secrets: 3
        * DB credentials for Aurora Serverless v2 PostgreSQL authentication
* Amazon EC2:
    * Subnets: 4
    * Security Groups: 3
    * Internet Gateways: 1
    * NAT Gateways: 2
    * VPCs: 1
    * Route Tables: 4
    * Elastic IPs: 2
* Amazon Athena:
    * Workgroups: 1
* AWS Glue:
    * Crawlers: 1
* AWS Systems Manager (SSM):
    * Parameters: 4
* Amazon CloudWatch:
    * Log Groups: 2
* Amazon VPC Flow Logs:
    * Flow Logs: 1
* Amazon Route 53:
    * Hosted Zones: 1
* AWS Key Management Service (KMS):
    * Keys: 1
* Amazon Simple Notification Service (SNS):
    * Topics: 1

This resource inventory is provided only as a representative sample and may not be kept up to date with additional open-source contributions.
It is recommended to use AWS Resource Search specifying a Tag Key="AgentsForEnergy" to see the specific resources deployed into your AWS account.


## Code of Conduct <a name="CoC"></a>
This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct).
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact
opensource-codeofconduct@amazon.com with any additional questions or comments.


## Security Issue Notifications <a name="Security"></a>
If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public github issue.


## Licensing <a name="License"></a>

See the [LICENSE](https://github.com/aws-samples/aws-cdk-examples/blob/master/LICENSE) file for our project's licensing. We will ask you to confirm the licensing of your contribution.

We may ask you to sign a [Contributor License Agreement (CLA)](http://en.wikipedia.org/wiki/Contributor_License_Agreement) for larger changes.