import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import {
  Effect,
  PolicyStatement,
} from "aws-cdk-lib/aws-iam";
import { Duration } from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class updateName extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const updateNameFunction = new NodejsFunction(this, "function", {
      runtime: Runtime.NODEJS_16_X,
      architecture: Architecture.ARM_64,
      memorySize: 10240,
      timeout: Duration.seconds(20),
      environment: {
        DDB_TABLE_NAME: "sre-otel-poc-dev",
        OTEL_SERVICE_NAME: "staging-backend",
        OTEL_LAMBDA_DISABLE_AWS_CONTEXT_PROPAGATION: "true",
        AWS_LAMBDA_EXEC_WRAPPER: "/opt/otel-handler",
        OPENTELEMETRY_COLLECTOR_CONFIG_FILE: "/var/task/collector.yaml",
        NEW_RELIC_LICENSE_KEY: "<api_key>",
        NEW_RELIC_OPENTELEMETRY_ENDPOINT": "otlp.nr-data.net:443"
      },
       layers: [
        lambda.LayerVersion.fromLayerVersionArn(
          this,
          'otel-layer',
          'arn:aws:lambda:us-west-2:901920570463:layer:aws-otel-nodejs-arm64-ver-1-17-1:1'
        ),
      ],
      tracing: lambda.Tracing.PASS_THROUGH,
      bundling: {
        keepNames: true,
        nodeModules: [
          "@aws-sdk/client-dynamodb",
          "@aws-sdk/client-eventbridge",
          "@aws-sdk/client-route-53",
          "@aws-sdk/client-s3",
          "@aws-sdk/client-sns",
          "@aws-sdk/client-sqs",
          "@aws-sdk/client-appconfig",
          "@aws-sdk/client-appconfigdata",
        ],
        externalModules: [
          "@opentelemetry/api",
          "@opentelemetry/sdk-node",
          "@opentelemetry/auto-instrumentations-node",
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
        resources: ["arn:aws:dynamodb:"+this.region+":"+this.account+":table/sre*"],
      })
    );

    new LambdaRestApi(this, "SRE-apigw-ts", {
      handler: updateNameFunction,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization", "traceparent", "tracestate", "newrelic"],
      },
    });
  }
}
