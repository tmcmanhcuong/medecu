# AWS Bedrock Agent Core LangChain Service

This directory contains a containerized FastAPI microservice designed to integrate with **AWS Bedrock Agent Core** (`bedrock-agent` and `bedrock-agent-runtime`) and **Amazon S3** using **LangChain**. It is fully optimized and ready to be built, tagged, and deployed to **AWS ECR (Elastic Container Registry)**.

---

## 1. Features

- **LangChain Integration**: Wrapped AWS Bedrock Agent Runtime calls inside a custom LangChain `BedrockAgentCoreRunnable` for modularity and seamless integration into LangChain ecosystems.
- **Micro-service Architecture**: Dedicated endpoints for Chat RAG, S3 Document Upload + Knowledge Base Syncing, Flashcard Generation, and Quiz Generation.
- **FastAPI / Uvicorn**: High-performance API server with auto-generated OpenAPI documentation.
- **Structured JSON & Caching**: Auto-parses the raw markdown/JSON responses from AWS Bedrock Agents into structured lists/dictionaries and caches them locally on disk.
- **Production Dockerfile**: Secure, light-weight, multi-stage build running as a non-root system user (`appuser`).

---

## 2. Local Development

### Step 1: Configuration

Create a `.env` file inside this directory (or in the root folder) containing your AWS credentials and resource IDs:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1

# S3 & Knowledge Base Configs
AWS_S3_BUCKET_NAME=your-s3-bucket-name
AWS_KB_ID=your-bedrock-kb-id
AWS_KB_DATA_SOURCE_ID=your-bedrock-kb-data-source-id

# Agent IDs & Alias IDs
AGENTCORE_CHAT_AGENT_ID=your-agent-id-for-chat
AGENTCORE_CHAT_AGENT_ALIAS_ID=TSTALIASID

AGENTCORE_FLASHCARD_AGENT_ID=your-agent-id-for-flashcard
AGENTCORE_FLASHCARD_AGENT_ALIAS_ID=TSTALIASID

AGENTCORE_QUIZ_AGENT_ID=your-agent-id-for-quiz
AGENTCORE_QUIZ_AGENT_ALIAS_ID=TSTALIASID
```

### Step 2: Install dependencies and run locally

If using a virtualenv or conda environment:

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

Access the OpenAPI documentation at: `http://localhost:8080/docs`

---

## 3. Run Locally via Docker

To verify that the production container image builds and functions correctly before pushing it to AWS ECR:

### Build the Image
```bash
docker build -t bedrockagentcore:latest .
```

### Run the Container
```bash
docker run -d \
  -p 8080:8080 \
  --env-file .env \
  --name bedrock-agent-service \
  bedrockagentcore:latest
```

---

## 4. Deploying to AWS ECR

Follow these steps to deploy this service to your AWS Account's Elastic Container Registry (ECR).

### Step 1: Authenticate Docker with your ECR Registry
Replace `<aws-region>` and `<aws-account-id>` with your actual AWS values:

```bash
aws ecr get-login-password --region <aws-region> | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.<aws-region>.amazonaws.com
```

### Step 2: Create the ECR Repository (if not already created)
```bash
aws ecr create-repository \
    --repository-name bedrockagentcore \
    --image-scanning-configuration scanOnPush=true \
    --region <aws-region>
```

### Step 3: Build & Tag the Image for ECR
Build the image locally:
```bash
docker build -t bedrockagentcore .
```

Tag it with your remote ECR repository URI:
```bash
docker tag bedrockagentcore:latest <aws-account-id>.dkr.ecr.<aws-region>.amazonaws.com/bedrockagentcore:latest
```

### Step 4: Push the Image to AWS ECR
```bash
docker push <aws-account-id>.dkr.ecr.<aws-region>.amazonaws.com/bedrockagentcore:latest
```

Once pushed, this image can be deployed on AWS ECS (Fargate), EKS (Kubernetes), or AWS App Runner!
