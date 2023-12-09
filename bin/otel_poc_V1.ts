#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServerlessCdkOtelStack_OTEL } from '../lib/update-name-otel';

const app = new cdk.App();
new ServerlessCdkOtelStack_OTEL(app, 'SRE-OTEL-POC-Collector', {
    stackName: "SRE-OTEL-POC-Collector",
    description: "Staging - otel poc nested stack",
    env: {
      region: process.env.CDK_DEFAULT_REGION,
      account: process.env.CDK_DEFAULT_ACCOUNT,
    },
  });
  //Uncomment below stack details while deployment
  // new MainAppStack(app, "SRE-AutomationCDK-TS-DevNested", {
  //   stackName: "SRE-AutomationCDK-TS-DevNested",
  //   description: "Dev Nested stack",
  //   env: {
  //     region: process.env.CDK_DEFAULT_REGION,
  //     account: process.env.CDK_DEFAULT_ACCOUNT,
  //   },
  // });