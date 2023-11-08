import { Context, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const {
  trace,
} = require("@opentelemetry/api");
import { Span } from "@opentelemetry/api";

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

async function updateName(name: string): Promise<number> {
  let id = getRandomInt(10000);
  await ddbDocClient.send(
    new PutCommand({
      TableName: process.env.DDB_TABLE_NAME,
      Item: {
        id: id,
        name: name,
      },
    })
  );

  return id;
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  let span: Span;
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  let eventJson = JSON.parse(JSON.stringify(event, null, 2));
  let reqContextJson = JSON.parse(JSON.stringify(context, null, 2));

  let activeSpan: Span = trace.getActiveSpan();
  let activeSpanCtx = activeSpan.spanContext();
  console.log(activeSpan);
  console.log(activeSpanCtx);
  activeSpan.setAttribute("name", "api-ts");

  if (!eventJson.body) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        msg: "Invalid request",
      }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type,Authorization,X-Api-Key,traceparent",
        "Access-Control-Allow-Credentials": "true",
      },
    };
  }

  let body: any = JSON.parse(eventJson.body);
  console.log("body - " + JSON.stringify(body));
  let name = body.name;
  console.log("name - " + name);
  const newId = await updateName(name);

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      msg: "name update in db with ID - " + newId,
    }),
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type,Authorization,X-Api-Key,traceparent",
      "Access-Control-Allow-Credentials": "true",
    },
  };

  return response;
};

module.exports = { handler };
