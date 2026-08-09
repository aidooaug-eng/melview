import json
import os
import boto3
from boto3.dynamodb.conditions import Key

table = boto3.resource("dynamodb").Table(os.environ["REGISTRATIONS_TABLE"])
HEADERS = {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}

def lambda_handler(event, context):
    email = (event.get("pathParameters") or {}).get("email", "").strip().lower()
    if not email:
        return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"message": "Email is required."})}
    try:
        response = table.query(IndexName="EmailIndex", KeyConditionExpression=Key("email").eq(email))
        registrations = [item for item in response.get("Items", []) if item.get("status") == "ACTIVE"]
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps(registrations)}
    except Exception:
        return {"statusCode": 500, "headers": HEADERS, "body": json.dumps({"message": "Unable to load tickets."})}
