import json
import os
import re
import uuid
from datetime import datetime, timezone
import boto3
from botocore.exceptions import ClientError

db = boto3.client("dynamodb")
EVENTS_TABLE = os.environ["EVENTS_TABLE"]
REGISTRATIONS_TABLE = os.environ["REGISTRATIONS_TABLE"]
HEADERS = {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def reply(code, body):
    return {"statusCode": code, "headers": HEADERS, "body": json.dumps(body)}

def lambda_handler(event, context):
    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return reply(400, {"message": "Request body must be valid JSON."})
    event_id = str(payload.get("eventId", "")).strip()
    name = str(payload.get("attendeeName", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    if not event_id or not name or not EMAIL.match(email):
        return reply(400, {"message": "eventId, attendeeName, and a valid email are required."})

    # The deterministic ID makes duplicate event/email registrations impossible.
    registration_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{event_id}:{email}"))
    created_at = datetime.now(timezone.utc).isoformat()
    try:
        db.transact_write_items(TransactItems=[
            {"Put": {"TableName": REGISTRATIONS_TABLE, "Item": {
                "registrationId": {"S": registration_id}, "eventId": {"S": event_id}, "email": {"S": email},
                "attendeeName": {"S": name}, "status": {"S": "ACTIVE"}, "createdAt": {"S": created_at}},
                "ConditionExpression": "attribute_not_exists(registrationId)"}},
            {"Update": {"TableName": EVENTS_TABLE, "Key": {"eventId": {"S": event_id}},
                "UpdateExpression": "SET registeredCount = registeredCount + :one",
                "ConditionExpression": "attribute_exists(eventId) AND registeredCount < capacity", "ExpressionAttributeValues": {":one": {"N": "1"}}}}
        ])
    except ClientError as error:
        if error.response["Error"]["Code"] == "TransactionCanceledException":
            return reply(409, {"message": "Event does not exist, is full, or you are already registered."})
        raise
    return reply(201, {"message": "Registration confirmed.", "ticket": {"registrationId": registration_id, "eventId": event_id, "attendeeName": name, "email": email, "status": "ACTIVE", "createdAt": created_at}})
