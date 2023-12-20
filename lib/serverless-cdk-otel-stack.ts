import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { updateName } from "./update-name-otel";
import { DemoPython } from "./demo-python";
import { SNSTest } from "./sns-test";

export class ServerlessCdkOtelStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new SNSTest(this, "sns-test");
  }
}
