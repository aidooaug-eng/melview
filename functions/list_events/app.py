import json
import os
from decimal import Decimal
 
import boto3
 
 
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["EVENTS_TABLE"])
 
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
 
 
def lambda_handler(event, context):
    try:
        response = table.scan()
        events = convert_decimals(response.get("Items", []))
 
        events.sort(key=lambda item: item.get("date", ""))
 
        return {
            "statusCode": 200,
            "headers": HEADERS,
            "body": json.dumps({"events": events}),
        }
 
    except Exception as error:
        print(f"Unable to load events: {error}")
 
        return {
            "statusCode": 500,
            "headers": HEADERS,
            "body": json.dumps({"message": "Unable to load events."}),
        }