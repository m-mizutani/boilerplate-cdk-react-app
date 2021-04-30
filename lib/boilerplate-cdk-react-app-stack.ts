import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as iam from "@aws-cdk/aws-iam";
import * as apigateway from "@aws-cdk/aws-apigateway";

// import * as path from "path";

// FIXME: Change CDK stack class name
export class BoilerplateCdkReactAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda function
    const asset = lambda.Code.fromAsset(__dirname, {
      bundling: {
        image: lambda.Runtime.NODEJS_14_X.bundlingDockerImage,
        user: "root",
        command: ["bash", "build.sh"],
      },
    });

    const apiHandler = new lambda.Function(this, "apiHandler", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "lambda/api/main.handler",
      code: asset,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
    });

    const apiRoot = new apigateway.LambdaRestApi(this, "api", {
      handler: apiHandler,
      proxy: false,
      cloudWatchRole: false,
      endpointTypes: [apigateway.EndpointType.REGIONAL],
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: ["execute-api:Invoke"],
            resources: ["execute-api:/*/*"],
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
          }),
        ],
      }),
    });

    // UI assets
    apiRoot.root.addMethod("GET");
    apiRoot.root.addResource("bundle.js").addMethod("GET");

    const v1 = apiRoot.root.addResource("api").addResource("v1");

    // message
    const repository = v1.addResource("message");
    repository.addMethod("GET");
  }
}
