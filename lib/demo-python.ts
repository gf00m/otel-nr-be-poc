import { Construct } from "constructs";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class DemoPython extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const demoPythonLambda = new lambda.Function(
      this,
      "demo-python-lambda-otel",
      {
        handler: "demo-python-function.handler",
        code: lambda.Code.fromAsset("./python"),
        runtime: Runtime.PYTHON_3_8,
        architecture: Architecture.ARM_64,
        memorySize: 10240,
        timeout: Duration.seconds(20),
      tracing: lambda.Tracing.PASS_THROUGH,
      }
    );

    new LambdaRestApi(this, "SRE-apigw-py", {
      handler: demoPythonLambda,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization", "traceparent"],
      },
    });
  }
}
