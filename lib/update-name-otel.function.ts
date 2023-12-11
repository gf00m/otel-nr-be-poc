import { Context, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
const { context, trace, opentelemetry } = require('@opentelemetry/api');
const { MeterProvider } = require('@opentelemetry/sdk-metrics');

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
  lambdaContext: Context
): Promise<APIGatewayProxyResult> => {
  //let span: Span;
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(lambdaContext, null, 2)}`);

  let eventJson = JSON.parse(JSON.stringify(event, null, 2));
  let reqContextJson = JSON.parse(JSON.stringify(lambdaContext, null, 2));

  // To create an instrument, you first need to initialize the Meter provider.
  // NOTE: The default OpenTelemetry meter provider does not record any metric instruments.
  //       Registering a working meter provider allows the API methods to record instruments.
  //opentelemetry.setGlobalMeterProvider(new MeterProvider());

  // To record a metric event, we used the global singleton meter to create an instrument.
  //const counter = opentelemetry.getMeter('default').createCounter('customMetric');

  const tracer = trace.getTracer('mytracer');
  const currentSpan = trace.getSpan(context.active()); // Corrected to use context.active()

  // Start a new span for the handler if there isn't an active one
  const span = currentSpan || tracer.startSpan(process.env.OTEL_SERVICE_NAME);

  // let activeSpan: Span = trace.getActiveSpan();
  // let activeSpanCtx = activeSpan.spanContext();
  // console.log(activeSpan);
  // console.log(activeSpanCtx);
  // activeSpan.setAttribute("name", "api-ts");

  // Add a custom attribute to the current span
  span.setAttribute("customAttribute.entryname", eventJson.body.name);
  // record a metric event.
  // counter.add(1, { customMetric_name: eventJson.body.name });


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
          "Content-Type,Authorization,X-Api-Key,traceparent,tracestate,newrelic",
        "Access-Control-Allow-Credentials": "true",
      },
    };


  }

  let body: any = JSON.parse(eventJson.body);
  console.log("body - " + JSON.stringify(body));
  let name = body.name;
  console.log("name - " + name);
  const newId = await updateName(name);
  span.setAttribute("customAttribute.entryname2", name);
  span.setAttribute("customAttribute.DatabaseID", newId);
  // counter.add(2, { customMetric_DatabaseID: newId });
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      msg: "name update in db with ID - " + newId,
    }),
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type,Authorization,X-Api-Key,traceparent,tracestate,newrelic",
      "Access-Control-Allow-Credentials": "true",
    },
  };

  return response;
};

module.exports = { handler };
