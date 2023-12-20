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
import *  as sns from 'aws-cdk-lib/aws-sns'

import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

export class SNSTest extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    let topic= new sns.Topic(this, "SRE-otel-sns-topic", {
      displayName: "SRE-otel-sns-topic",
      topicName: "SRE-otel-sns-topic",
    });

    let env = {
        OTEL_LAMBDA_DISABLE_AWS_CONTEXT_PROPAGATION: "true",
        AWS_LAMBDA_EXEC_WRAPPER: "/opt/otel-handler",
        OPENTELEMETRY_COLLECTOR_CONFIG_FILE: "/var/task/collector.yaml",
        NEW_RELIC_LICENSE_KEY: "521e73ff57f3f750e78e265f181c750aFFFFNRAL",
        NEW_RELIC_OPENTELEMETRY_ENDPOINT: "otlp.nr-data.net:443",
        OTEL_SNS_TOPIC_ARN: topic.topicArn
      }

    let layers =  [
        lambda.LayerVersion.fromLayerVersionArn(
          this,
          'otel-layer',
          'arn:aws:lambda:us-west-2:901920570463:layer:aws-otel-nodejs-arm64-ver-1-17-1:1'
        ),
      ]

    const publisher = new NodejsFunction(this, "SRE-otel-publisher", {
      entry : './lib/publisher.ts',
      handler: 'publisher',
      runtime: Runtime.NODEJS_18_X,
      architecture: Architecture.ARM_64,
      memorySize: 10240,
      timeout: Duration.seconds(20),
      environment: { ...env, OTEL_SERVICE_NAME: 'SRE-publisher'},
       layers: layers,
      tracing: lambda.Tracing.PASS_THROUGH,
      bundling: {
        keepNames: true,
        nodeModules: [
          "@aws-sdk/client-sns",
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
 

    publisher.addToRolePolicy(
      new PolicyStatement({
          actions: ['sns:Publish'],
          resources: [topic.topicArn]
      })
  );


    const subscriber = new NodejsFunction(this, "SRE-otel-subscriber", {
        entry: './lib/subscriber.ts',
        handler: 'subscriber',
        runtime: Runtime.NODEJS_18_X,
        architecture: Architecture.ARM_64,
        memorySize: 10240,
        timeout: Duration.seconds(20),
        environment: { ...env, OTEL_SERVICE_NAME: 'SRE-subscriber'},
         layers: layers,
        tracing: lambda.Tracing.PASS_THROUGH,
        bundling: {
          keepNames: true,
          nodeModules: [
            "@aws-sdk/client-sns",
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

      topic.addSubscription(new subscriptions.LambdaSubscription(subscriber));

    new LambdaRestApi(this, "SRE-publisher-apigw", {
      handler: publisher,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization", "traceparent", "tracestate", "newrelic"],
      },
    });


    new LambdaRestApi(this, "SRE-subscriber-apigw", {
      handler: subscriber,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization", "traceparent", "tracestate", "newrelic"],
      },
    });

  }
}
