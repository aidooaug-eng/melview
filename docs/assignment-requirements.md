# Event Registration and Ticketing System Requirements
 
Build a serverless Event Registration and Ticketing System using AWS.
 
Required services:
- AWS SAM
- AWS Lambda
- Amazon API Gateway
- Amazon DynamoDB
- Amazon S3
- Amazon CloudFront
- Amazon CloudWatch
- GitHub Actions CI/CD
- Optional Amazon SNS
- IAM least privilege where reasonable
 
Required API endpoints:
- GET /events
- POST /register
- GET /registrations/{email}
- DELETE /registration/{id}
 
Required features:
- Users can view available events
- Users can register for an event
- Users can receive a ticket-style confirmation in the web app
- Users can search for their registration by email
- Users can cancel a registration
- Event capacity should update after successful registration and cancellation
- Frontend should be hosted as a static site
- Backend should be deployed with AWS SAM
- CI/CD should validate, build, and deploy
- CloudWatch logs, dashboard, and alarms should be configured
 
Deliverables:
- GitHub repository
- API code
- Lambda functions
- DynamoDB table definitions
- CloudWatch alarms configuration
- CI/CD pipeline
- README
- Product presentation