# Melview — Serverless Event Registration and Ticketing

Melview is an AWS SAM capstone scaffold for listing local events, reserving tickets, viewing registrations by email, and cancelling a reservation. It is designed for deployment as a serverless REST API with a static frontend.

## Architecture

```text
Browser → CloudFront → private S3 frontend bucket
Browser → API Gateway REST API → Lambda functions → DynamoDB
                                      ├─ Events table
                                      └─ Registrations table (EmailIndex GSI)
CloudWatch dashboard and alarms observe Lambda and API Gateway
```

## API endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/events` | List events |
| POST | `/register` | Create a reservation |
| GET | `/registrations/{email}` | List active tickets for an email |
| DELETE | `/registration/{id}` | Soft-cancel a registration |

`POST /register` accepts exactly:

```json
{"eventId":"evt-001","attendeeName":"Ada Lovelace","email":"ada@example.com"}
```

## Services used

- AWS SAM / CloudFormation
- API Gateway REST API and Python 3.14 Lambda functions
- DynamoDB with an email Global Secondary Index
- S3 and CloudFront for static hosting
- CloudWatch dashboard and alarms
- GitHub Actions with AWS OIDC deployment credentials

## Setup

1. Install AWS SAM CLI, AWS CLI, Python 3.14, and AWS credentials for your account.
2. Build and validate locally:

   ```bash
   sam validate --lint
   sam build
   ```

3. Deploy the stack when ready (choose your own stack name and region):

   ```bash
   sam deploy --guided
   ```

4. Copy the `ApiBaseUrl` stack output into `frontend/app.js`, replacing `PASTE_API_BASE_URL_HERE`.
5. Seed `EventsTableName` with the three records in `scripts/seed_events.json`. This is intentionally a manual step; the repository does not run AWS commands automatically.
6. Upload the frontend files to the `FrontendBucketName` output and invalidate `FrontendDistributionId`, or push to `main` after configuring the deployment workflow.

## GitHub Actions deployment

Set repository secret `AWS_DEPLOY_ROLE_ARN` to an IAM role trusted by GitHub Actions OIDC. Optionally set repository variables `AWS_REGION` and `STACK_NAME`. The role needs permission to deploy the SAM/CloudFormation resources, read stack outputs, upload frontend assets, and create CloudFront invalidations.

The workflow substitutes the deployed API URL into `app.js` only for the uploaded artifact; the committed source retains the required placeholder.

## Screenshots

Add screenshots here after deployment:

- Home and event list
- Registration confirmation
- My Tickets and cancellation
- CloudWatch dashboard

## Future improvements

- Add Cognito authentication and authorization.
- Add SNS or SES confirmation notifications.
- Use DynamoDB Streams for analytics and audit records.
- Add automated Lambda unit/integration tests and a secure admin event-management API.
- Add custom domain names, WAF, and stricter CORS for production.
