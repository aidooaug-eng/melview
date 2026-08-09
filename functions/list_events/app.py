import json
import os
import boto3

table = boto3.resource("dynamodb").Table(os.environ["EVENTS_TABLE"])
HEADERS = {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}

def lambda_handler(event, context):
    try:
        response = table.scan()
        events = response.get("Items", [])
        while "LastEvaluatedKey" in response:
            response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
            events.extend(response.get("Items", []))
        return {"statusCode": 200, "headers": HEADERS, "body": json.dumps(sorted(events, key=lambda item: item["eventId"]))}
    except Exception:
        return {"statusCode": 500, "headers": HEADERS, "body": json.dumps({"message": "Unable to load events."})}
