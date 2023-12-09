import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { EndpointType, LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import {
  Effect,
  PolicyStatement,
} from "aws-cdk-lib/aws-iam";
import { CfnOutput, Duration, RemovalPolicy } from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class ServerlessCdkOtelStack_OTEL extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const updateNameFunction = new NodejsFunction(this, "function", {
      runtime: Runtime.NODEJS_18_X,
      architecture: Architecture.ARM_64,
      memorySize: 10240,
      timeout: Duration.seconds(20),
      environment: {
        DDB_TABLE_NAME: "sre-otel-poc-dev",
        OTEL_SERVICE_NAME: "SRE-OTEL-POC-Collector-api-1",
        OTEL_LAMBDA_DISABLE_AWS_CONTEXT_PROPAGATION: "true",
        AWS_LAMBDA_EXEC_WRAPPER: "/opt/otel-handler",
        OPENTELEMETRY_COLLECTOR_CONFIG_FILE: "/var/task/collector.yaml",
        // NEW_RELIC_LICENSE_KEY: "<api_key>",
        // NEW_RELIC_OPENTELEMETRY_ENDPOINT": "otlp.nr-data.net:443"
      },
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(
          this,
          'otel-layer',
          'arn:aws:lambda:us-west-2:901920570463:layer:aws-otel-nodejs-arm64-ver-1-17-1:1'
        ),
      ],
      tracing: lambda.Tracing.ACTIVE,
      bundling: {
        minify: true,
        sourceMap: true,
        keepNames: true,
        nodeModules: [
          "@aws-sdk/client-dynamodb",
          "@aws-sdk/client-appconfig",
          "@aws-sdk/client-appconfigdata",
        ],

        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string): string[] {
            return [`cp ${inputDir}/collector.yaml ${outputDir}`]
          },
          afterBundling(): string[] {
            return []
          },
          beforeInstall() {
            return []
          },
        },
      }
    });

    updateNameFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["dynamodb:PutItem", "lambda:GetLayerVersion"],
        resources: ["arn:aws:dynamodb:" + this.region + ":" + this.account + ":table/sre*"],
      })
    );

    const api = new apigateway.LambdaRestApi(this, "SRE-apigw-ts", {
      handler: updateNameFunction,
      endpointTypes: [EndpointType.EDGE],
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization", "traceparent", "tracestate", "newrelic"],
      },
    });

    //new CfnOutput("this.environment", 'url_', { value: api.restApiName });
  }
}
