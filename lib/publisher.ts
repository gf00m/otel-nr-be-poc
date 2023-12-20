import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { APIGatewayProxyResultV2 } from "aws-lambda";
const { context, trace, propagation, opentelemetry } = require('@opentelemetry/api');

const output = {};

exports.publisher = async (event: any): Promise<APIGatewayProxyResultV2>  =>  {

    const tracer = context.active();
    propagation.inject(tracer, output);   
    const { traceparent, tracestate } = output;
    console.log("output" + JSON.stringify(output) );
    const span = trace.getSpan(context.active());
     try {
      console.log('event received::::::', JSON.stringify(event, null, 2));
  
      let requestPayload = {
          Message: JSON.stringify("otel test message"),
          TopicArn: process.env.OTEL_SNS_TOPIC_ARN,
        }
      
     let snsClient = new SNSClient({ region: process.env.AWS_REGION });
     let response = await snsClient.send(new PublishCommand(requestPayload))
     console.log('publish message log', response) 
    
      return  {
        statusCode: 200,
        body: JSON.stringify({
          msg: "success",
        }),
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type,Authorization,X-Api-Key,traceparent,tracestate,newrelic",
          "Access-Control-Allow-Credentials": "true",
        },
      };;
      
      } catch (e) {
      console.log(e);
      return  {
        statusCode: 500,
        body: JSON.stringify({
          msg: "error",
        }),
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type,Authorization,X-Api-Key,traceparent,tracestate,newrelic",
          "Access-Control-Allow-Credentials": "true",
        },
      };;
    }
  }