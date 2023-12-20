import { APIGatewayProxyResultV2 } from "aws-lambda";



const { context, trace, propagation, opentelemetry } = require('@opentelemetry/api');
const output = {};

const extractTraceContext = (snsRecord: any) =>{
  console.log("snsRecord - "+ JSON.stringify(snsRecord))
  const traceparent = snsRecord.MessageAttributes['traceparent']?.Value;
  const tracestate = snsRecord.MessageAttributes['tracestate']?.Value;

  if (traceparent) {
      const carrier = { traceparent, tracestate };
      return propagation.extract(context.active(), carrier);
  }else{
    console.log('traceparent and tracestate not available')
  }
  return context.active();
}

exports.subscriber = async (event: any): Promise<APIGatewayProxyResultV2>  =>  {
  const snsRecord = event.Records[0].Sns;
  const extractedContext = extractTraceContext(snsRecord);
  const tracer = trace.getTracer('lambda-tracer', '0.1.0');

  return context.with(extractedContext, async () => {
    const span = tracer.startSpan('recordawsinfradetails');
    try {
      console.log('event received::::::', JSON.stringify(event, null, 2));
  
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
      };
      
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
      };
    }finally{
        span.end();
    }
});
}