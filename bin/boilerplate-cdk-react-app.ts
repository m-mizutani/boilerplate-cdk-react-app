#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { BoilerplateCdkReactAppStack } from "../lib/boilerplate-cdk-react-app-stack";

const app = new cdk.App();
new BoilerplateCdkReactAppStack(app, "BoilerplateCdkReactApp");
