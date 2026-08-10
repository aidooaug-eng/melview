import json
import os
from decimal import Decimal
from urllib.parse import unquote
 
import boto3
from boto3.dynamodb.conditions import Attr, Key
from botocore.exceptions import ClientError
 
 
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["REGISTRATIONS_TABLE"])
 
INDEX_NAME = os.environ.get("EMAIL_INDEX_NAME", "email-index")
 
HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
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
 
 
def is_active_registration(registration):
    status = (
        registration.get("registrationStatus")
        or registration.get("status")
        or "CONFIRMED"
    ).upper()
 
    return status not in ["CANCELLED", "CANCELED"]
 
 
def lambda_handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return response(200, {})
 
    path_parameters = event.get("pathParameters") or {}
    raw_email = path_parameters.get("email", "")
 
    email = unquote(raw_email).strip().lower()
 
    print(f"Raw email from path: {raw_email}")
    print(f"Decoded email used for lookup: {email}")
 
    if not email:
        return response(400, {"message": "Email is required."})
 
    try:
        try:
            result = table.query(
                IndexName=INDEX_NAME,
                KeyConditionExpression=Key("email").eq(email),
                ScanIndexForward=False,
            )
            registrations = result.get("Items", [])
            print(f"Query using {INDEX_NAME} found {len(registrations)} records.")
 
        except ClientError as error:
            print(f"Email index query failed, falling back to table scan: {error}")
 
            result = table.scan(
                FilterExpression=Attr("email").eq(email)
            )
            registrations = result.get("Items", [])
            print(f"Fallback scan found {len(registrations)} records.")
 
        active_registrations = [
            registration
            for registration in registrations
            if is_active_registration(registration)
        ]
 
        print(f"Active registrations returned: {len(active_registrations)}")
 
        return response(200, active_registrations)
 
    except Exception as error:
        print(f"Unable to load registrations: {error}")
        return response(500, {"message": "Unable to load registrations."})
