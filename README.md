# Welcome to your CDK and React project!

## Prerequisite

- node >= v14.7.0
- npm >= 7.6.3

## Build
### Init CDK

```bash
$ cdk init --language typescript
$ mkdir lib/backend
$ mkdir lib/backend/api
$ cd lib/backend && npm init -y && cd ../..
$ mkdir lib/frontend
$ mkdir lib/frontend/src
$ mkdir lib/frontend/dist
$ cd lib/frontend && npm init -y && cd ../..
```

Add following list into `dependencies` of `package.json`. (Do not use `npm i` to avoid CDK version mismatch). Please replace `1.90.0` with version of `@aws-cdk/core` in your `package.json`.

```json
    "@aws-cdk/aws-lambda": "1.90.0",
    "@aws-cdk/aws-iam": "1.90.0",
    "@aws-cdk/aws-dynamodb": "1.90.0",
    "@aws-cdk/aws-apigateway": "1.90.0",
```

And run `npm i`

### Create Lambda function

```bash
$ cd lib/backend
$ npm i aws-sdk
```

Put main API code `main.ts` and `app.ts` in `lib/backend/api`. These are separated because `app.ts` code is used by not only lambda function but also local server for development.

`app.ts`
```ts
import * as express from "express";

const app = express();

app.get("/api/v1/message", (req: express.Request, res: express.Response) => {
  res.send({ message: "Hello, Hello, Hello" });
});
app.use(express.static("assets"));

export default app;
```

`main.ts`
```ts
import * as awsServerlessExpress from "aws-serverless-express";
import * as lambda from "aws-lambda";

import app from "./app";

const server = awsServerlessExpress.createServer(app);

export function handler(
  event: lambda.APIGatewayProxyEvent,
  context: lambda.Context
) {
  awsServerlessExpress.proxy(server, event, context);
}
```

### Create frontend

Move to `lib/frontend/`

```bash
$ npm i -D ts-loader typescript webpack webpack-cli webpack-dev-server
$ npm i @types/react @types/react-dom react react-dom
```

Create `lib/frontend/tsconfig.json`

```json
{
  "compilerOptions": {
    "sourceMap": true,
    "target": "es5",
    "module": "es2015",
    "jsx": "react",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "lib": ["es2020", "dom"]
  }
}
```

Create `lib/frontend/webpack.config.js`

```js
module.exports = {
  mode: "development",
  entry: "./src/js/main.tsx",
  output: {
    path: `${__dirname}/dist`,
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
  },
  devServer: {
    contentBase: "dist",
    proxy: {
      "/api": "http://localhost:9080",
    },
    hot: true,
  },
  target: ["web", "es5"],
};
```

Create `lib/frontend/src/js/main.tsx`. This code sends a request to API endpoint `api/v1/message` and shows a result from API.

```tsx
import * as React from "react";
import * as ReactDOM from "react-dom";

interface myAppState {
  isLoaded: boolean;
  msg?: string;
  error?: any;
}

const App: React.FC = () => {
  const [state, setState] = React.useState<myAppState>({ isLoaded: false });
  const showMessage = () => {
    if (!state.isLoaded) {
      return <p>Loading</p>;
    } else if (state.msg) {
      return <p>msg: {state.msg}</p>;
    } else {
      return <p>Error: {state.error}</p>;
    }
  };

  React.useEffect(() => {
    fetch("api/v1/message")
      .then((res) => {
        return res.json();
      })
      .then(
        (result) => {
          setState({ isLoaded: true, msg: result.message });
        },
        (error) => {
          setState({ isLoaded: true, error: "error" + error });
        }
      );
  }, []);

  return (
    <div>
      <h1>Welcome to my awesome app!</h1>
      {showMessage()}
    </div>
  );
};
ReactDOM.render(<App />, document.querySelector("#app"));
```

Create `lib/frontend/dist/index.html`

```html
<!DOCTYPE html>
<html>
  <head>
    <title>catbox</title>
    <meta charset="UTF-8" />
    <script defer src="bundle.js"></script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

### Configure CDK

Edit `lib/boilerplate-cdk-react-app-stack.ts` and add following code for lambda function and API gateway.

```ts
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
      endpointTypes: [apigateway.EndpointType.PRIVATE],
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
```

Edit `tsconfig.json`

```json
  "exclude": ["cdk.out", "lib/frontend/", "lib/backend/"]
```

Then we can deploy CDK stack.

```
$ cdk deploy
----- (snip) -----
 ✅  BoilerplateCdkReactAppStack

Outputs:
BoilerplateCdkReactAppStack.apiEndpoint9349E63C = https://xxxxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/

Stack ARN:
arn:aws:cloudformation:ap-northeast-1:11111111111:stack/BoilerplateCdkReactAppStack/3cd4e670-8ec1-11eb-8515-069db2e9c955
```

Open https://xxxxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/ by your browser and you may see below page.

![your-app](https://user-images.githubusercontent.com/605953/116548066-aa8eb100-a92e-11eb-9ae0-c047539d6305.png)

## Development

### Create and launch local API server

Install `ts-node` by `npm -i -D ts-node` and add `lib/backend/local/server.ts`.

```ts
import app from "../api/app";

const port = 9080;
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
```

Then, run `npm exec ts-node ./local/server`

### Launch webpack server

Run `npm exec webpack serve`

Then, open http://localhost:8080/ by your browser.