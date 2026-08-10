import json
import os
from datetime import datetime, timezone
from decimal import Decimal
 
import boto3
from botocore.exceptions import ClientError
 
 
dynamodb = boto3.resource("dynamodb")
events_table = dynamodb.Table(os.environ["EVENTS_TABLE"])
registrations_table = dynamodb.Table(os.environ["REGISTRATIONS_TABLE"])
 
HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "DELETE,OPTIONS",
}
 
 
def convert_decimals(value):
    if isinstance(value, list):
        return [convert_decimals(item) for item in value]
 
    if isinstance(value, dict):
        return {key: convert_decimals(item) for key, item in value.items()}
 
    if isinstance(value, Decimal):
        if value % 1 == 0:
            return int(value)
        return float(value)
 
    return value
 
 
def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": HEADERS,
        "body": json.dumps(convert_decimals(body)),
    }
 
 
def lambda_handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return response(200, {})
 
    path_parameters = event.get("pathParameters") or {}
    registration_id = path_parameters.get("id")
 
    print(f"Registration ID received for cancellation: {registration_id}")
 
    if not registration_id:
        return response(400, {"message": "Registration ID is required."})
 
    try:
        existing_response = registrations_table.get_item(
            Key={"registrationId": registration_id}
        )
 
        registration = existing_response.get("Item")
 
        if not registration:
            return response(404, {"message": "Registration not found."})
 
        current_status = (
            registration.get("registrationStatus")
            or registration.get("status")
            or ""
        ).upper()
 
        print(f"Current registration status: {current_status}")
 
        if current_status in ["CANCELLED", "CANCELED"]:
            return response(
                200,
                {
                    "message": "Registration is already cancelled.",
                    "registration": registration,
                },
            )
 
        event_id = registration.get("eventId")
        cancelled_at = datetime.now(timezone.utc).isoformat()
 
        registrations_table.update_item(
            Key={"registrationId": registration_id},
            UpdateExpression="SET #registrationStatus = :cancelled, #status = :cancelled, cancelledAt = :cancelledAt",
            ExpressionAttributeNames={
                "#registrationStatus": "registrationStatus",
                "#status": "status",
            },
            ExpressionAttributeValues={
                ":cancelled": "CANCELLED",
                ":cancelledAt": cancelled_at,
            },
        )
 
        if event_id:
            try:
                events_table.update_item(
                    Key={"eventId": event_id},
                    UpdateExpression="SET #registeredCount = #registeredCount - :one",
                    ConditionExpression="#registeredCount > :zero",
                    ExpressionAttributeNames={
                        "#registeredCount": "registeredCount",
                    },
                    ExpressionAttributeValues={
                        ":one": 1,
                        ":zero": 0,
                    },
                )
            except ClientError as count_error:
                print(f"Event count update skipped or failed: {count_error}")
 
        updated_registration = registrations_table.get_item(
            Key={"registrationId": registration_id}
        ).get("Item")
 
        return response(
            200,
            {
                "message": "Registration cancelled.",
                "registration": updated_registration,
            },
        )
 
    except Exception as error:
        print(f"Unable to cancel registration: {error}")
        return response(500, {"message": "Unable to cancel registration."})
