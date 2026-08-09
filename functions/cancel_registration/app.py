import json
import os
from datetime import datetime, timezone
import boto3
from botocore.exceptions import ClientError

db = boto3.client("dynamodb")
REGISTRATIONS_TABLE = os.environ["REGISTRATIONS_TABLE"]
EVENTS_TABLE = os.environ["EVENTS_TABLE"]
HEADERS = {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}

def lambda_handler(event, context):
    registration_id = (event.get("pathParameters") or {}).get("id", "").strip()
    if not registration_id:
        return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"message": "Registration ID is required."})}
    registration = db.get_item(TableName=REGISTRATIONS_TABLE, Key={"registrationId": {"S": registration_id}}, ConsistentRead=True).get("Item")
    if not registration or registration.get("status", {}).get("S") != "ACTIVE":
        return {"statusCode": 404, "headers": HEADERS, "body": json.dumps({"message": "Active registration not found."})}
    try:
        db.transact_write_items(TransactItems=[
            {"Update": {"TableName": REGISTRATIONS_TABLE, "Key": {"registrationId": {"S": registration_id}},
                "UpdateExpression": "SET #status = :cancelled, cancelledAt = :now", "ConditionExpression": "#status = :active",
                "ExpressionAttributeNames": {"#status": "status"}, "ExpressionAttributeValues": {":active": {"S": "ACTIVE"}, ":cancelled": {"S": "CANCELLED"}, ":now": {"S": datetime.now(timezone.utc).isoformat()}}}},
            {"Update": {"TableName": EVENTS_TABLE, "Key": {"eventId": registration["eventId"]},
                "UpdateExpression": "SET registeredCount = registeredCount - :one", "ConditionExpression": "registeredCount >= :one",
                "ExpressionAttributeValues": {":one": {"N": "1"}}}}
        ])
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"message": "Registration cancelled."})}
    except ClientError:
        return {"statusCode": 409, "headers": HEADERS, "body": json.dumps({"message": "Registration could not be cancelled."})}
