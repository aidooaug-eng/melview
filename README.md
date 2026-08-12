# Melview — Serverless Event Registration & Ticketing System

Melview is a serverless AWS Event Registration & Ticketing System for listing local events, reserving tickets, viewing registrations by email, and cancelling reservations.

The project replaces a manual **Microsoft Forms + Excel** registration workflow with a scalable REST API and static web frontend built on AWS serverless services.

It was designed as an AWS SAM/CloudFormation project with infrastructure as code, automated CI/CD through GitHub Actions, DynamoDB-backed persistence, CloudWatch observability, and AWS security controls.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Objectives](#objectives)
- [Features](#features)
- [Architecture](#architecture)
- [AWS Services Used](#aws-services-used)
- [Application Flow](#application-flow)
- [REST API](#rest-api)
- [Request Format](#request-format)
- [Data Model](#data-model)
- [Frontend](#frontend)
- [CI/CD Pipeline](#cicd-pipeline)
- [Security](#security)
- [Monitoring and Observability](#monitoring-and-observability)
- [Cost Management](#cost-management)
- [Project Scope and Milestones](#project-scope-and-milestones)
- [Repository Setup](#repository-setup)
- [Local Build and Validation](#local-build-and-validation)
- [Deployment](#deployment)
- [Seeding Events](#seeding-events)
- [GitHub Actions Deployment](#github-actions-deployment)
- [Manual Frontend Deployment](#manual-frontend-deployment)
- [Expected Stack Outputs](#expected-stack-outputs)
- [Project Deliverables](#project-deliverables)
- [Example User Journey](#example-user-journey)
- [Future Improvements](#future-improvements)
- [AWS Documentation](#aws-documentation)
- [Project Outcome](#project-outcome)

---

## Project Overview

### Problem

Traditional event registration can rely on tools such as Microsoft Forms and Excel. While these tools can work for small events, they make it difficult to build a scalable application with a dedicated API, persistent registration data, automated deployment, centralized monitoring, and cloud-native security.

### Solution

Melview provides a serverless event registration and ticketing platform where users can:

1. View available events.
2. Register for an event.
3. View active registrations using their email address.
4. Cancel an existing registration.

The backend exposes a REST API through Amazon API Gateway. AWS Lambda functions handle the application logic, while Amazon DynamoDB stores events and registrations.

The frontend is a static web application delivered through Amazon CloudFront from an Amazon S3 bucket.

---

## Objectives

The project was designed to:

- Design and build a serverless Event Registration & Ticketing System using AWS Cloud Services.
- Replace a Microsoft Forms + Excel workflow with a scalable REST API.
- Build the four core REST API operations required by the application.
- Use DynamoDB to persist event and registration information.
- Automate application deployment using GitHub Actions.
- Use AWS SAM and CloudFormation for infrastructure as code.
- Implement monitoring, logging, alarms, and security controls.
- Apply IAM least-privilege principles.
- Validate and sanitize API input.
- Track cloud costs and stay within the AWS Free Tier where possible.

---

## Features

### Event Management

- List available events.
- Store event information in DynamoDB.
- Seed the initial events from `scripts/seed_events.json`.

### Ticket Registration

- Register an attendee for an event.
- Store attendee name, email, event ID, registration ID, and registration status.
- Return a registration response through the REST API.

### Registration Lookup

- Retrieve active registrations for an email address.
- Use the DynamoDB `EmailIndex` Global Secondary Index to query registrations efficiently.

### Cancellation

- Cancel an existing registration.
- The cancellation is implemented as a soft cancellation rather than physically deleting the DynamoDB record.

### Static Frontend

- Static HTML/JavaScript frontend.
- Hosted in Amazon S3.
- Delivered through Amazon CloudFront.
- CloudFront provides HTTPS delivery and edge caching.

### Serverless Backend

- Amazon API Gateway REST API.
- Python Lambda functions.
- Amazon DynamoDB persistence.
- CloudWatch logging and monitoring.

### DevOps / CI/CD

- Source code hosted in GitHub.
- GitHub Actions automates the deployment workflow.
- AWS OIDC is used for GitHub Actions deployment credentials.
- SAM/CloudFormation manages AWS infrastructure.
- Frontend deployment includes CloudFront cache invalidation.

---

## Architecture

The high-level architecture is:

```text
                           ┌───────────────────────────────┐
                           │       GitHub Repository        │
                           └───────────────┬───────────────┘
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │    GitHub Actions       │
                              │   lint → test → build   │
                              └────────────┬───────────┘
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │       Amazon S3         │
                              │   Deployment Artifacts   │
                              └────────────┬───────────┘
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │      CloudFront         │
                              │       Invalidate        │
                              └────────────────────────┘


Users
  │
  ▼
┌─────────────────────┐
│    CloudFront       │
│ HTTPS / Edge Cache  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Private S3 Bucket   │
│ Static Frontend     │
└─────────────────────┘


Browser
   │
   │ REST API requests
   ▼
┌─────────────────────┐
│  API Gateway REST   │
└──────────┬──────────┘
           │
     ┌─────┼───────────────┬────────────────┐
     │     │               │                │
     ▼     ▼               ▼                ▼
 Lambda  Lambda          Lambda           Lambda
 Events  Register      Registrations     Cancel
     │     │               │                │
     └─────┴───────┬───────┴────────────────┘
                   │
                   ▼
          ┌───────────────────────┐
          │      DynamoDB         │
          │                       │
          │  Events Table         │
          │  Registrations Table  │
          │  EmailIndex GSI       │
          └───────────────────────┘

                   │
          ┌────────┴────────┐
          ▼                 ▼
       SNS*             CloudWatch
    Notifications       Logs & Alarms


Security & Observability
├── IAM
├── AWS WAF
├── AWS Shield
└── Amazon CloudWatch
```

### Architecture Diagram

The repository architecture diagram can be stored at:

```text
docs/architecture.png
```

Then referenced from this README:

![Melview Architecture](docs/architecture.png)


---

## AWS Services Used

| Service | Purpose |
|---|---|
| **AWS SAM** | Serverless application definition, build, validation, and deployment |
| **AWS CloudFormation** | Infrastructure as code and stack management |
| **Amazon API Gateway** | REST API entry point |
| **AWS Lambda** | Serverless application/business logic |
| **Amazon DynamoDB** | Event and registration persistence |
| **Amazon S3** | Static frontend hosting and deployment artifacts |
| **Amazon CloudFront** | HTTPS delivery, edge caching, and frontend distribution |
| **Amazon CloudWatch** | Logs, metrics, dashboards, and alarms |
| **AWS IAM** | Roles, permissions, and least-privilege access |
| **AWS WAF** | Web application protection |
| **AWS Shield** | DDoS protection |
| **Amazon SNS** | Notification capability / confirmation notifications |
| **AWS Budgets** | Cost tracking and budget awareness |
| **GitHub Actions** | CI/CD automation |
| **GitHub OIDC** | Short-lived AWS deployment credentials for GitHub Actions |
| **Python 3.14** | Lambda application runtime |
| **Boto3** | AWS SDK for Python |

> SNS confirmation notifications were identified as an optional capability in the original project scope. If the deployed version does not send notifications, SNS should be treated as an architectural extension rather than a required runtime dependency.

---

## Application Flow

### 1. User accesses the application

The user opens the frontend through the CloudFront distribution.

```text
User
  ↓
Amazon CloudFront
  ↓
Private Amazon S3 frontend bucket
  ↓
HTML / JavaScript application
```

### 2. User requests events

The frontend calls:

```http
GET /events
```

API Gateway receives the request and invokes the Events Lambda function.

```text
Browser
   ↓
CloudFront / Frontend
   ↓
API Gateway
   ↓
List Events Lambda
   ↓
DynamoDB Events Table
   ↓
API response
```

### 3. User registers for an event

The frontend sends:

```http
POST /register
```

with the required attendee information.

```text
Browser
   ↓
API Gateway
   ↓
Register Attendee Lambda
   ↓
DynamoDB Registrations Table
   ↓
Registration response
```

### 4. User views their tickets

The frontend calls:

```http
GET /registrations/{email}
```

The registrations Lambda queries the DynamoDB email Global Secondary Index.

### 5. User cancels a registration

The frontend calls:

```http
DELETE /registration/{id}
```

The registration is soft-cancelled rather than physically removed.

---

# REST API

Melview exposes four core REST endpoints.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/events` | List all available events |
| `POST` | `/register` | Create an event reservation |
| `GET` | `/registrations/{email}` | View active registrations for an email |
| `DELETE` | `/registration/{id}` | Soft-cancel a registration |

## `GET /events`

Returns the available events.

### Example

```http
GET /events
```

The response contains the events stored in the Events DynamoDB table.

---

## `POST /register`

Creates a new event reservation.

### Required request body

The endpoint accepts exactly:

```json
{
  "eventId": "evt-001",
  "attendeeName": "Ada Lovelace",
  "email": "ada@example.com"
}
```

### Required fields

| Field | Description |
|---|---|
| `eventId` | ID of the event being reserved |
| `attendeeName` | Name of the attendee |
| `email` | Attendee email address |

The API performs input validation before processing the registration.

---

## `GET /registrations/{email}`

Returns active tickets/registrations associated with an email address.

### Example

```http
GET /registrations/ada@example.com
```

The backend uses the `EmailIndex` DynamoDB Global Secondary Index to locate registrations by email.

---

## `DELETE /registration/{id}`

Soft-cancels a registration.

### Example

```http
DELETE /registration/reg-123
```

The registration remains in DynamoDB, but its status is changed so that it is no longer treated as an active ticket.

This approach preserves the registration record for audit/history purposes.

---

# Data Model

Melview uses two primary DynamoDB tables.

## Events Table

Logical table name:

```text
melview-events
```

The deployed physical table name may be generated by CloudFormation/SAM depending on the stack configuration.

The Events table stores the events that users can register for.

Example event information includes:

```text
eventId
eventName
eventDate
availability/status
```


---

## Registrations Table

Logical table name:

```text
melview-registrations
```

The deployed physical table name may be generated by CloudFormation/SAM depending on the stack configuration.

The registrations table stores attendee reservations.

The table includes an email Global Secondary Index:

```text
EmailIndex
```

This allows the application to query registrations by attendee email without scanning the entire table.

Registration records support soft cancellation through their registration status.

---

# Frontend

The frontend is a static web application containing files such as:

```text
index.html
app.js
```

The frontend:

- Displays available events.
- Sends registration requests to the API.
- Displays registration confirmation.
- Retrieves a user's tickets using their email.
- Allows users to cancel registrations.

The frontend is stored in a private S3 bucket and delivered through CloudFront.

The API base URL is injected into the deployment artifact during the CI/CD workflow so that the committed source can retain the placeholder:

```text
PASTE_API_BASE_URL_HERE
```

This prevents the deployed environment-specific API URL from having to be hard-coded into the committed source file.

---

# CI/CD Pipeline

Melview uses GitHub Actions for continuous integration and continuous deployment.

The deployment flow is:

```text
GitHub Repository
        │
        ▼
GitHub Actions
        │
        ├── Lint
        ├── Test
        └── Build
        │
        ▼
AWS SAM / CloudFormation
        │
        ▼
AWS Infrastructure
        │
        ├── API Gateway
        ├── Lambda
        ├── DynamoDB
        ├── S3
        └── CloudFront
        │
        ▼
Frontend Artifact
        │
        ▼
S3
        │
        ▼
CloudFront Invalidation
        │
        ▼
Updated Application
```

## GitHub Actions responsibilities

The workflow is designed to:

1. Trigger from repository changes.
2. Validate the application.
3. Build the SAM application.
4. Deploy the backend infrastructure.
5. Read the deployed API URL and other CloudFormation outputs.
6. Substitute the deployed API URL into the frontend deployment artifact.
7. Upload frontend assets to the S3 frontend bucket.
8. Create a CloudFront invalidation so users receive the latest frontend version.

---

# GitHub OIDC Deployment

The deployment workflow uses GitHub Actions OIDC instead of storing long-lived AWS access keys in GitHub.

The repository uses the following secret:

```text
AWS_DEPLOY_ROLE_ARN
```

Optional repository variables:

```text
AWS_REGION
STACK_NAME
```

The IAM role is trusted by GitHub's OIDC identity provider and is granted the permissions required for deployment.

This provides short-lived AWS credentials to the GitHub Actions workflow and avoids placing permanent AWS access keys in repository secrets.

---

# Security

Security was considered across the application and deployment architecture.

## IAM

IAM controls access to AWS resources and follows the principle of least privilege.

The GitHub Actions deployment role is granted the permissions required to:

- Deploy SAM/CloudFormation resources.
- Read CloudFormation stack outputs.
- Upload frontend assets.
- Create CloudFront invalidations.

Application Lambda functions use IAM execution roles to access only the AWS resources required by their functions.

## Input Validation

The API validates incoming registration data before processing requests.

The registration endpoint requires:

```json
{
  "eventId": "evt-001",
  "attendeeName": "Ada Lovelace",
  "email": "ada@example.com"
}
```

Input validation and sanitization help prevent malformed data from reaching the application and database layers.

## AWS WAF

AWS WAF is included in the security architecture as a web application protection layer.

It can be used to help protect public-facing application endpoints from common web-based threats.

## AWS Shield

AWS Shield provides DDoS protection for supported AWS resources.

## CORS

CORS is configured to allow the static frontend to communicate with the API Gateway REST API.

For production, the allowed origins should be restricted to the application's actual frontend domain rather than using an unnecessarily broad policy.

## GitHub Actions Security

GitHub OIDC is used for AWS deployment authentication instead of long-lived AWS access keys.

---

# Monitoring and Observability

Amazon CloudWatch is used to observe the serverless application.

## CloudWatch Logs

Each Lambda function writes logs to CloudWatch.

Logs support troubleshooting of:

- API requests.
- Registration failures.
- Lambda execution errors.
- Application behavior.

## Metrics

The project scope includes tracking:

- API request count.
- Failed registrations.
- Lambda duration.
- Lambda errors.

## Alarms

The project includes CloudWatch alarm requirements, including an error-rate alarm when the error rate exceeds:

```text
5%
```

CloudWatch alarms can be used to detect application problems before they become larger operational issues.

## CloudWatch Dashboard

A CloudWatch dashboard provides an operational view of the application's Lambda and API Gateway activity.

---

# Cost Management

AWS Budgets is used for cost awareness and tracking.

The project was designed with AWS Free Tier considerations in mind.

Cost optimization activities include:

- Using serverless services.
- Avoiding continuously running EC2 infrastructure.
- Monitoring resource usage.
- Tracking AWS costs with AWS Budgets.
- Reviewing resource lifecycle requirements.
- Avoiding unnecessary cloud resources.

> Actual AWS charges depend on account usage, AWS region, Free Tier eligibility, traffic, storage, CloudFront usage, and other AWS pricing factors.

---

# Project Scope and Milestones

The project was completed through five major phases.

## Phase 1 — Infrastructure Foundation

Activities included:

- Researching cloud infrastructure services for static hosting.
- Investigating serverless compute with AWS Lambda.
- Understanding the role of API Gateway.
- Understanding AWS Identity and Access Management.
- Designing a resource template to create the required infrastructure.

Implementation technologies:

```text
AWS SAM
CloudFormation
S3
CloudFront
API Gateway
Lambda
DynamoDB
IAM
```

---

## Phase 2 — API Development

The core challenge was to build four REST API endpoints.

### Endpoints

```text
POST   /register
GET    /events
GET    /registrations/{email}
DELETE /registration/{id}
```

Development activities included:

- Designing DynamoDB tables for events and registrations.
- Creating Lambda functions for API operations.
- Implementing error handling.
- Implementing application logging.
- Understanding and configuring CORS.
- Handling API Gateway Lambda events.
- Formatting API responses.
- Implementing input validation and sanitization.

---

## Phase 3 — Automation & CI/CD

The CI/CD phase focused on GitHub Actions.

Activities included:

- Setting up the GitHub repository.
- Defining a branching/development workflow.
- Creating GitHub Actions workflows.
- Automating application validation and testing.
- Automating the SAM build process.
- Automating deployment.
- Monitoring GitHub Actions logs for build and deployment success/failure.
- Using AWS OIDC for deployment authentication.

---

## Phase 4 — Monitoring & Security

Activities included:

- Tracking API request counts.
- Tracking failed registrations.
- Monitoring Lambda duration.
- Creating a CloudWatch error-rate alarm.
- Implementing CloudWatch Logs for Lambda functions.
- Researching API security patterns.
- Applying IAM least-privilege principles.
- Implementing input validation and sanitization.
- Using AWS WAF in the security architecture.
- Using AWS Shield for DDoS protection.
- Considering SNS confirmation notifications.
- Using AWS Budgets for cost tracking.

---

## Phase 5 — Deployment & Optimization

Activities included:

- Researching deployment automation.
- Implementing automated deployment scripts/workflows.
- Investigating monitoring and logging solutions.
- Applying cloud cost optimization principles.
- Considering resource lifecycle policies.
- Deploying the completed serverless application.

---

# Repository Setup

## Prerequisites

Install the following:

- AWS CLI
- AWS SAM CLI
- Python 3.14
- Git
- An AWS account
- AWS credentials with appropriate permissions

Verify the installations:

```bash
aws --version
sam --version
python3 --version
git --version
```

Configure AWS credentials if you are deploying manually:

```bash
aws configure
```

---

# Local Build and Validation

From the project root:

## Validate the SAM template

```bash
sam validate --lint
```

## Build the application

```bash
sam build
```

If both commands complete successfully, the project is ready for deployment.

---

# Deployment

Deploy the SAM application using:

```bash
sam deploy --guided
```

During guided deployment, provide:

- A stack name of your choice.
- Your AWS region.
- The requested deployment configuration.

After deployment, retrieve the CloudFormation outputs.

The important outputs include:

```text
ApiBaseUrl
FrontendBucketName
FrontendDistributionId
```

The `ApiBaseUrl` is the base URL used by the frontend to communicate with API Gateway.

---

# Configure the Frontend

The source frontend contains the placeholder:

```text
PASTE_API_BASE_URL_HERE
```

For local/manual deployment, replace the placeholder in:

```text
frontend/app.js
```

with the deployed `ApiBaseUrl`.

For the GitHub Actions deployment, the workflow is designed to substitute the deployed API URL only in the uploaded artifact.

This means the committed source retains:

```text
PASTE_API_BASE_URL_HERE
```

while the deployed frontend receives the actual API Gateway URL.

---

# Seeding Events

The initial event data is stored in:

```text
scripts/seed_events.json
```

The project intentionally does **not** run AWS CLI commands automatically to seed the database.

The Events DynamoDB table must therefore be populated manually using the records in:

```text
scripts/seed_events.json
```

This keeps database seeding separate from infrastructure deployment.

---

# GitHub Actions Deployment

To enable automated deployment, configure the repository with:

## Required GitHub Secret

```text
AWS_DEPLOY_ROLE_ARN
```

This should contain the ARN of the IAM role trusted by GitHub Actions through AWS OIDC.

## Optional GitHub Variables

```text
AWS_REGION
STACK_NAME
```

Example:

```text
AWS_REGION=eu-west-1
STACK_NAME=melview
```

The exact region and stack name can be changed to match the deployment environment.

---

## Deployment Permissions

The GitHub deployment role needs permissions to:

- Deploy SAM/CloudFormation resources.
- Read CloudFormation stack outputs.
- Upload frontend files to S3.
- Create CloudFront invalidations.

The role should follow least-privilege principles rather than using unrestricted administrator access.

---

# Manual Frontend Deployment

If the frontend is being deployed manually, upload the frontend files to the bucket identified by the CloudFormation output:

```text
FrontendBucketName
```

After uploading the new frontend assets, invalidate the CloudFront distribution identified by:

```text
FrontendDistributionId
```

This ensures CloudFront refreshes cached frontend assets.

---

# Expected Stack Outputs

After deployment, the stack provides outputs used by the application and deployment workflow.

Typical outputs include:

| Output | Purpose |
|---|---|
| `ApiBaseUrl` | Base URL for the API Gateway REST API |
| `FrontendBucketName` | S3 bucket containing the frontend |
| `FrontendDistributionId` | CloudFront distribution ID |
| `FrontendUrl` | CloudFront URL for the deployed frontend |
| `EventsTableName` | DynamoDB Events table |
| `RegistrationsTableName` | DynamoDB Registrations table |

The exact physical resource names can be generated by AWS SAM/CloudFormation.

---

# Example User Journey

## 1. Open Melview

The user accesses the application through CloudFront.

```text
CloudFront URL
```

## 2. View Events

The application requests:

```http
GET /events
```

The available events are displayed.



## 3. Register

The attendee provides:

```text
Name:  Ada Lovelace
Email: ada@example.com
Event: evt-001
```

The frontend sends:

```json
{
  "eventId": "evt-001",
  "attendeeName": "Ada Lovelace",
  "email": "ada@example.com"
}
```

to:

```http
POST /register
```

## 4. View Tickets

The attendee enters their email address.

The frontend calls:

```http
GET /registrations/ada@example.com
```

The active tickets are returned.

## 5. Cancel

The attendee selects a ticket to cancel.

The frontend sends:

```http
DELETE /registration/{id}
```

The registration is soft-cancelled.

---

# Project Deliverables

The completed project covers the expected deliverables:

- GitHub repository containing the API/application code.
- Serverless AWS architecture.
- AWS SAM/CloudFormation infrastructure.
- API Gateway REST API.
- Lambda functions.
- DynamoDB table definitions.
- DynamoDB email Global Secondary Index.
- Static S3 frontend.
- CloudFront distribution.
- GitHub Actions CI/CD pipeline.
- AWS OIDC deployment authentication.
- CloudWatch Logs.
- CloudWatch dashboard.
- CloudWatch alarms.
- IAM security controls.
- AWS WAF security architecture.
- AWS Shield protection architecture.
- AWS Budgets cost tracking.
- README documentation.
- Product/project presentation.
- Deployment automation.

---

# Project Architecture Decisions

## Why serverless?

The application uses serverless services so compute and API infrastructure can scale without managing traditional servers.

The core backend is built from:

```text
API Gateway
+
Lambda
+
DynamoDB
```

This reduces infrastructure management and fits an event registration workload that may have variable traffic.

## Why API Gateway?

API Gateway provides a managed REST API entry point for the frontend and routes requests to the appropriate Lambda function.

## Why Lambda?

Lambda provides event-driven serverless compute for the application's business logic.

Separate functions handle:

```text
List Events
Register Attendee
Get Registrations
Cancel Registration
```

## Why DynamoDB?

DynamoDB provides a managed NoSQL database suited to serverless applications.

The registration table's `EmailIndex` GSI allows registrations to be queried by email efficiently.

## Why S3 + CloudFront?

S3 provides durable static object storage for the frontend while CloudFront provides global edge delivery, HTTPS, and caching.

## Why GitHub Actions + OIDC?

GitHub Actions automates deployment, while OIDC avoids storing long-lived AWS access keys in GitHub.

## Why CloudWatch?

CloudWatch centralizes logs, metrics, dashboards, and alarms for the serverless backend.

---

# Future Improvements

The following improvements can extend Melview beyond the current implementation:

### Authentication and Authorization

Add Amazon Cognito to provide:

- User authentication.
- Authorization.
- Protected user operations.
- Role-based access.

### Notifications

Add Amazon SNS or Amazon SES to send:

- Registration confirmations.
- Cancellation confirmations.
- Event notifications.

### Analytics and Auditing

Use DynamoDB Streams to support:

- Registration analytics.
- Audit records.
- Event activity tracking.
- Downstream processing.

### Automated Testing

Expand the CI/CD pipeline with:

- Lambda unit tests.
- Integration tests.
- API tests.
- Automated regression testing.

### Administration

Create a secure admin API for:

- Creating events.
- Updating events.
- Managing event availability.
- Viewing registrations.
- Managing event capacity.

### Production Security

Further production hardening could include:

- Custom domain names.
- More restrictive CORS policies.
- Additional AWS WAF rules.
- Stronger authentication and authorization.
- Additional API throttling and validation.

---

# AWS Documentation

The project used AWS and related documentation covering:

- GitHub Actions
- AWS Lambda
- Amazon API Gateway
- Amazon DynamoDB
- Amazon CloudWatch
- AWS IAM
- Amazon SNS
- AWS Budgets
- Boto3
- AWS CloudFormation
- AWS SAM

Useful official documentation:

- GitHub Actions: https://docs.github.com/en/actions
- AWS Lambda: https://docs.aws.amazon.com/lambda
- Amazon API Gateway: https://docs.aws.amazon.com/apigateway
- Amazon DynamoDB: https://docs.aws.amazon.com/dynamodb
- Amazon CloudWatch: https://docs.aws.amazon.com/cloudwatch
- AWS IAM: https://docs.aws.amazon.com/iam
- Amazon SNS: https://docs.aws.amazon.com/sns

---

# Project Outcome

Melview demonstrates how a traditional event registration process can be redesigned as a cloud-native serverless application.

The final architecture combines:

```text
                    MELVIEW
                       │
        ┌──────────────┴──────────────┐
        │                             │
   Static Frontend                REST API
        │                             │
    S3 + CloudFront              API Gateway
                                      │
                                    Lambda
                                      │
                                  DynamoDB
                                      │
                       ┌──────────────┴──────────────┐
                       │                             │
                   Events Table              Registrations Table
                                                     │
                                                  EmailIndex
```

The platform also incorporates:

```text
CI/CD
GitHub Actions + AWS OIDC

Security
IAM + WAF + Shield

Observability
CloudWatch Logs + Metrics + Dashboard + Alarms

Cost Management
AWS Budgets + Free Tier awareness
```

The project demonstrates the complete lifecycle of a serverless AWS application:

```text
Design
  ↓
Infrastructure as Code
  ↓
API Development
  ↓
Database Design
  ↓
Frontend Integration
  ↓
Security
  ↓
Monitoring
  ↓
CI/CD
  ↓
Deployment
  ↓
Optimization
```

The goal of Melview is not only to provide a working event registration application, but also to demonstrate the reasoning behind the architectural decisions and the AWS cloud principles that can be applied to future projects.

---

## Project Name

**Melview**
