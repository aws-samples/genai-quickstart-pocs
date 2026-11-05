# RFP Agent Response System

An RFP (Request for Proposal) processing pipeline that extracts the questions from an RFP document, answers them from an Amazon Bedrock knowledge base, reviews each answer for PII and confidential information, and drafts a client-ready response. It accepts PDF and text files and includes a web interface for uploading RFPs, tracking jobs and downloading results.

> **Security note: this is a demo, not a production system.** The sample shows one way to put a Cognito sign-in in front of the API and keep data private, but it has not been hardened for production use. For example, it has no WAF, no MFA, no API access logging, no per-user data separation (every signed-in user sees every job), no data retention policy, and no human approval step before a response leaves the system. Review the generated responses yourself, and review the code and configuration against your own security requirements before using it with real data.

## Architecture

```
Browser ──► CloudFront ──► S3 (static site)
   │
   ├──► Cognito hosted UI (sign-in, authorization code + PKCE)
   │
   ├──► API Gateway (Cognito authorizer, throttled) ──► API Lambdas
   │        POST /upload  GET /status  GET /list-jobs  GET /downloads  GET /download/{path}
   │
   └──► S3 upload bucket (presigned POST / GET only)
             │
             ▼  S3 event notifications
   uploaded_rfp_requests/ ─► rfp_question_extractor ─► formatted_questions/
   formatted_questions/   ─► question_processor     ─► completed_responses/   (Bedrock knowledge base)
   completed_responses/   ─► compliance_agent       ─► compliance_reviewed/
   compliance_reviewed/   ─► drafting_agent         ─► final_responses/
                                    │
                                    └─► DynamoDB status table (every stage)
```

The system is two CloudFormation stacks:

- **Processing stack** (`infrastructure/cloudformation.yaml`): the upload bucket and its event notifications, the four pipeline Lambda functions (each with its own least-privilege role), the DynamoDB status table, and a deployment bucket for the Lambda package.
- **Web stack** (`infrastructure/web-cloudformation.yaml`): a private S3 bucket served through CloudFront, a Cognito user pool with the hosted sign-in UI, an API Gateway REST API with a Cognito authorizer on every method, and the API Lambda functions.

All Lambda functions run on Python 3.14 and are deployed from one package built from `src/`.

### Processing pipeline

1. **Upload.** The browser asks `POST /upload` for permission to upload. The API checks the file type and size and returns a presigned S3 POST for `uploaded_rfp_requests/<name>_<timestamp>.<ext>`. The browser uploads the file straight to S3; the presigned policy caps the size (10 MB by default), so S3 rejects larger files.
2. **Question extraction** (`rfp_question_extractor.py`). Reads the PDF (with [pypdf](https://pypi.org/project/pypdf/)) or text file and asks Claude to turn every requirement into a question. Output: `formatted_questions/<name>_questions.json`.
3. **Answers** (`question_processor.py`). Calls Bedrock `RetrieveAndGenerate` against your knowledge base for each question. Output: `completed_responses/<name>_responses.json`.
4. **Compliance review** (`compliance_agent.py`). Asks Claude whether each answer contains PII or privileged information and whether to approve, redact or reject it. Output: `compliance_reviewed/<name>_compliance_reviewed.json`.
5. **Drafting** (`drafting_agent.py`). Drafts a polished answer per question and a complete response document, applying each compliance decision. Output:
   - `final_responses/<name>_RFP_Response.txt`: the client-ready response document.
   - `final_responses/<name>_final.json`: per-question original and drafted answers, compliance decisions and a compliance reasoning summary.

**The compliance step fails closed.** If the review of an answer errors, returns something that is not valid JSON, or doesn't make one clear approve, redact or reject decision, the answer is **withheld**. A withheld answer is never sent to the drafting model and never appears in the response document; a placeholder takes its place. If drafting a redacted or rejected answer fails, the placeholder is used too, never the original answer. The status record lists the withheld questions, and the web UI shows them as "Needs review".

Every stage records its progress in the DynamoDB status table, which the status API and web UI read.

### Model

Every stage uses the same model, set by the `BedrockModelId` parameter of the processing stack. The default is `us.anthropic.claude-haiku-5-5`, the US cross-Region inference profile for Claude Haiku 5.5. It can be called from `us-east-1`, `us-east-2`, `us-west-1` and `us-west-2` (and the Canadian Regions), and routes requests to Regions in the US. To use a different geography or model, pass another inference profile ID with `--model-id` / `-ModelId`, for example `eu.anthropic.claude-haiku-5-5` from an EU Region. The IAM policy only allows that inference profile and its foundation model.

## Project structure

```
rfp-agent-response/
├── src/                            # Lambda functions (one shared package)
│   ├── common.py                   # Shared helpers: Bedrock calls, status tracking, validation
│   ├── rfp_question_extractor.py   # Stage 1: extract questions (PDF/TXT)
│   ├── question_processor.py       # Stage 2: answer from the knowledge base
│   ├── compliance_agent.py         # Stage 3: PII/confidentiality review (fails closed)
│   ├── drafting_agent.py           # Stage 4: draft the final response
│   ├── upload_api.py               # POST /upload
│   ├── status_api.py               # GET /status
│   ├── list_jobs_api.py            # GET /list-jobs
│   ├── download_api.py             # GET /downloads, GET /download/{path}
│   └── requirements.txt            # Lambda runtime dependencies
├── infrastructure/
│   ├── cloudformation.yaml         # Processing stack
│   └── web-cloudformation.yaml     # Web stack (CloudFront, Cognito, API Gateway)
├── scripts/
│   ├── deploy.sh / deploy.ps1                  # Deploy everything
│   ├── cleanup.sh / cleanup.ps1                # Remove everything, or reset demo data
│   ├── diagnose-pipeline.sh / diagnose-pipeline.ps1   # Read-only health checks
│   └── deploy_helper.py            # Packaging and site rendering shared by both script sets
├── web/templates/                  # Static web UI (index, status, downloads, json-explorer, admin)
│   └── js/app.js                   # Sign-in, API calls, escaping helpers
├── example-data/
│   ├── sample-rfps/                # Sample RFPs (.txt)
│   └── knowledge-base-docs/        # Sample knowledge base documents (.md)
├── tests/                          # Unit tests (pytest, moto, botocore Stubber)
├── requirements-dev.txt            # Test and lint tools
└── README.md
```

## Prerequisites

| | macOS / Linux | Windows |
|---|---|---|
| Shell | bash (the bash 3.2 that ships with macOS works) | Windows PowerShell 5.1 or PowerShell 7 |
| AWS CLI | [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) | [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
| Python | Python 3.9 or later, with `pip` (`python3`) | Python 3.9 or later, with `pip` (`python` or `py`) |
| Other | `curl` (preinstalled on macOS and most Linux distributions) | none |

PowerShell is not needed on macOS or Linux.

You also need:

- AWS credentials for the account you deploy to, configured for the AWS CLI (for example `aws configure sso`, then `export AWS_PROFILE=<profile>` or `$env:AWS_PROFILE = "<profile>"`). The deploy scripts print the identity they use before they change anything. The credentials must be able to create the resources listed under [Architecture](#architecture), including IAM roles.
- Access to Claude Haiku 5.5 (or the model you choose) in Amazon Bedrock in your Region. The first time you use an Anthropic model, Bedrock might ask you for use-case details in the console.
- A Bedrock knowledge base in the same Region (see below).

Create a virtual environment in the project folder. The deploy scripts use it automatically if it exists.

**macOS / Linux**

```bash
cd agents-quickstart-pocs/rfp-agent-response
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
```

**Windows (PowerShell)**

```powershell
cd agents-quickstart-pocs\rfp-agent-response
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
```

## Set up the knowledge base

The pipeline answers questions from a Bedrock knowledge base that contains your company's information. Create it before you deploy.

1. Create an S3 bucket for the documents and upload the samples (or your own documents):

   ```bash
   aws s3 mb s3://<your-kb-docs-bucket> --region us-east-1
   aws s3 sync example-data/knowledge-base-docs/ s3://<your-kb-docs-bucket>/
   ```

2. In the Amazon Bedrock console, open **Knowledge bases** and choose **Create knowledge base** with a vector store.
3. Use the S3 bucket as the data source, choose an embeddings model (for example Amazon Titan Text Embeddings V2), and let Bedrock create the vector store (Amazon OpenSearch Serverless or Amazon S3 Vectors).
4. After it's created, **sync** the data source.
5. Copy the **knowledge base ID**, a 10-character value such as `ABC123DEF4`.

Useful documents include a company overview, product and service descriptions, pricing and service tiers, compliance certifications and security controls, implementation methodology, and support offerings.

## Deployment

The two script sets do the same thing and take the same options.

**macOS / Linux**

```bash
./scripts/deploy.sh \
  --knowledge-base-id ABC123DEF4 \
  --admin-email you@example.com \
  --region us-east-1
```

**Windows (PowerShell)**

```powershell
.\scripts\deploy.ps1 `
  -KnowledgeBaseId ABC123DEF4 `
  -AdminEmail you@example.com `
  -Region us-east-1
```

| bash | PowerShell | Default | Description |
|---|---|---|---|
| `--knowledge-base-id` | `-KnowledgeBaseId` | prompted | Bedrock knowledge base ID |
| `--admin-email` | `-AdminEmail` | none | Creates a Cognito user; Cognito emails a temporary password |
| `--model-id` | `-ModelId` | `us.anthropic.claude-haiku-5-5` | Inference profile ID used by every stage |
| `--region` | `-Region` | `us-east-1` | AWS Region |
| `--infra-stack-name` | `-InfraStackName` | `terminal-upload` | Processing stack name |
| `--web-stack-name` | `-WebStackName` | `rfp-web-app` | Web stack name |
| `--skip-packaging` | `-SkipPackaging` | off | Reuse `build/lambda-function.zip` |

The deploy script:

1. Builds `build/lambda-function.zip` from `src/` (`scripts/deploy_helper.py package`).
2. Deploys the processing stack and updates the pipeline Lambda functions.
3. Deploys the web stack and updates the API Lambda functions.
4. Sets the upload bucket's CORS rule to the CloudFront origin.
5. Renders the web UI and `config.js` from the stack outputs (`scripts/deploy_helper.py render-web`), uploads it, and invalidates the CloudFront cache.
6. Checks that every API route rejects anonymous requests with `401`, and fails if any doesn't.

Run it again at any time to apply changes. The first deployment takes about 10 minutes, mostly for CloudFront.

### Sign in

Open the CloudFront URL that the script prints. You are redirected to the Cognito sign-in page. With `--admin-email`/`-AdminEmail`, Cognito emails a temporary password; you set a new password the first time you sign in. Self sign-up is disabled. To add users:

```bash
aws cognito-idp admin-create-user --region us-east-1 \
  --user-pool-id <UserPoolId from the script output> \
  --username user@example.com \
  --user-attributes Name=email,Value=user@example.com Name=email_verified,Value=true
```

Every user in the pool can see and download every job.

## Usage

1. **Upload** a PDF or text RFP on the upload page (drag and drop, or **Select File**). The page then tracks the job through each stage.
2. **Job Status** (`status.html`) lists every job with its progress, and flags answers that were withheld for review.
3. **Download Center** (`downloads.html`) lists the final responses (`_RFP_Response.txt` and `_final.json`). Each stage's output is also linked from the job's status. Downloads use five-minute presigned S3 URLs.
4. **JSON Explorer** (`json-explorer.html`) shows the `_final.json` file: questions, original and drafted answers, compliance decisions and reasoning.

To try it, upload one of the samples in `example-data/sample-rfps/`:

- `banking-core-system-rfp.txt`
- `payment-processing-rfp.txt`
- `cybersecurity-services-rfp.txt`

The pipeline takes a few minutes per RFP, depending on the number of questions.

### Outputs

| S3 prefix | File | Contents |
|---|---|---|
| `uploaded_rfp_requests/` | `<name>_<timestamp>.pdf` or `.txt` | The uploaded RFP |
| `formatted_questions/` | `<name>_questions.json` | Extracted questions (JSON array) |
| `completed_responses/` | `<name>_responses.json` | Knowledge base answers |
| `compliance_reviewed/` | `<name>_compliance_reviewed.json` | Answers with compliance decisions |
| `final_responses/` | `<name>_RFP_Response.txt` | Client-ready response document |
| `final_responses/` | `<name>_final.json` | Drafted answers, decisions and compliance reasoning |

### API

Every method requires a Cognito ID token in the `Authorization` header (API Gateway returns `401` otherwise), and the stage is throttled (10 requests per second, burst 20, by default). CORS allows only the CloudFront origin.

| Method and path | Description |
|---|---|
| `POST /upload` | Body `{"fileName": "rfp.pdf", "fileSize": 12345}`. Validates the type (`.pdf`, `.txt`) and size, and returns `{uploadUrl, fields, timestamped_filename, ...}`, a presigned S3 POST. Returns `413` for files over the limit. |
| `GET /status?fileName=<timestamped file name>` | Status of one job: every stage, download links, and warnings for withheld answers. |
| `GET /list-jobs` | Uploaded file names, newest first. |
| `GET /downloads` | Files under `final_responses/`, with size and last-modified time. |
| `GET /download/<prefix>/<file>` | `{url, fileName, expiresIn}`, a presigned URL for one file. Only the five prefixes above are allowed; `..`, other prefixes and encoded paths return `400`. A bare `<file>` refers to `final_responses/`. |

There is no cleanup endpoint. Destructive operations are only available through the cleanup scripts, using your own AWS credentials.

### Configuration

| Stack | Parameter | Default | Description |
|---|---|---|---|
| Processing | `KnowledgeBaseId` | (required) | Bedrock knowledge base ID |
| Processing | `BedrockModelId` | `us.anthropic.claude-haiku-5-5` | Inference profile ID |
| Processing | `WebAppOrigin` | set by the deploy script | Origin allowed by the upload bucket's CORS rule |
| Web | `AdminEmail` | empty | First Cognito user |
| Web | `MaxUploadBytes` | `10485760` (10 MB) | Largest upload the API authorizes |
| Web | `ApiThrottleRateLimit` / `ApiThrottleBurstLimit` | `10` / `20` | API Gateway stage throttling |
| Web | `ProcessingStackName` | `terminal-upload` | Processing stack to import the bucket and table from |

## Testing

```bash
source .venv/bin/activate          # Windows: .\.venv\Scripts\Activate.ps1
python -m pytest                   # unit tests; no AWS calls
flake8 src scripts tests
cfn-lint infrastructure/*.yaml
```

To check the deployed pipeline (read-only):

```bash
./scripts/diagnose-pipeline.sh --region us-east-1         # macOS / Linux
.\scripts\diagnose-pipeline.ps1 -Region us-east-1        # Windows
```

## Cleanup

Reset the demo data (delete every uploaded file, pipeline output and status record) but keep the stacks:

```bash
./scripts/cleanup.sh --data-only          # macOS / Linux
.\scripts\cleanup.ps1 -DataOnly           # Windows
```

Delete everything (S3 buckets and their contents, both stacks, the Cognito user pool and its users):

```bash
./scripts/cleanup.sh                      # macOS / Linux
.\scripts\cleanup.ps1                     # Windows
```

Both ask you to type a confirmation word; `--force` / `-Force` skips the prompt. Pass the same `--region` and stack names you deployed with. The knowledge base and its document bucket are not part of the stacks; delete them in the Bedrock and S3 consoles if you no longer need them. Lambda log groups are kept.

## Troubleshooting

- **The deploy script stops at "The API is not rejecting anonymous requests".** Don't use the deployment. Check that the web stack deployed fully and that the API Gateway methods use the Cognito authorizer, then run the deploy script again.
- **Sign-in loops or fails with "state mismatch".** Open the site in one tab only, clear the site's session storage, and sign in again. The callback URL must be `https://<CloudFront domain>/index.html`.
- **Upload fails with a CORS or 403 error from S3.** The upload bucket's CORS rule is set in deploy step 7. Run the deploy script again.
- **Model errors (`AccessDeniedException`, `ValidationException`).** Make sure your account can use the model in your Region, and that `--model-id` is an inference profile that your Region can call.
- **Empty or generic answers.** Make sure the knowledge base data source has been synced and that the knowledge base is in the same Region as the stacks.
- **Answers marked "Needs review".** The compliance review could not reach a clear decision for those answers, so they were withheld from the response document. Review them in the `_compliance_reviewed.json` or `_final.json` file and edit the response yourself.
- **A job is stuck.** Run the diagnose script and check the Lambda logs in CloudWatch.
