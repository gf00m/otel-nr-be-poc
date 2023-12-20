#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServerlessCdkOtelStack } from '../lib/serverless-cdk-otel-stack';

const app = new cdk.App();
new ServerlessCdkOtelStack(app, 'SREOtelPocStack-SNS', {
 
});