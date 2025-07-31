#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BookFlowStack } from '../lib/bookflow-stack';

const app = new cdk.App();

// Development Stack
new BookFlowStack(app, 'BookFlowStack-dev', {
  stage: 'dev',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '812508052193',
    region: process.env.CDK_DEFAULT_REGION || 'sa-east-1',
  },
});

// Production Stack (commented for now)
// new BookFlowStack(app, 'BookFlowStack-prod', {
//   stage: 'prod',
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
//   },
// });