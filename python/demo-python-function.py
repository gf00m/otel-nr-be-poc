import json
import os

def handler(event, context):
    print(os.environ['AWS_REGION'])
    
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Api-Key,traceparent,b3,x-honeycomb-team",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Expose-Headers": "Server-Timing",
            "Server-Timing": "traceparent;desc=" + "\"" + event['headers']['traceparent'] + "\""
        },
        "body": json.dumps({
            "Region": os.environ['AWS_REGION'],
            "from": "fdse-aws-lambda" 
        })
    }
