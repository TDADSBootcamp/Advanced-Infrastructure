import * as cdk from '@aws-cdk/core';
import * as cfn_inc from '@aws-cdk/cloudformation-include';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as budgets from '@aws-cdk/aws-budgets';

import userCredentialsPolicy from './user_credentials_policy.json';

const sagemakerAccessPolicies = [
  iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonAthenaFullAccess'),
  iam.ManagedPolicy.fromAwsManagedPolicyName('AWSGlueConsoleFullAccess'),
  iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
  iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess')
]

function throwError(message: string): any {
  throw new Error(message);
}

export class AppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const billingAlertEmails: string[] = process.env.BILLING_ALERT_EMAILS?.split(',') ?? throwError('Comma-separated env var BILLING_ALERT_EMAILS must be provided');

    const exampleBucket = new s3.Bucket(this, 'example-bucket', { versioned: true });

    // try to prevent the user creating resouces in unexpected regions
    const regionLimits = new iam.ManagedPolicy(this, 'single-region-policy', {
      statements: [
        new iam.PolicyStatement({
          notActions: [ // allow read access to any bucket by default for Athena
            "iam:*",
            "s3:List*",
            "s3:Get*",
            "s3:Abort*"
          ],
          effect: iam.Effect.DENY,
          resources: ['*'],
          conditions: {
            'StringNotEquals': {
              'aws:RequestedRegion': ['eu-west-2']
            }
          }
        })
      ]
    });

    const manageOwnCredentials = new iam.ManagedPolicy(this, 'manage-own-credentials', {
      document: iam.PolicyDocument.fromJson(userCredentialsPolicy)
    });

    const exampleBucketAccess = new iam.ManagedPolicy(this, 'example-bucket-policy', {
      statements: [
        new iam.PolicyStatement({
          actions: ['s3:*'],
          resources: [exampleBucket.bucketArn]
        })
      ]
    });

    const student_group = new iam.Group(this, 'students', {
      groupName: 'students',
      managedPolicies: [
        ...sagemakerAccessPolicies,
        regionLimits,
        exampleBucketAccess,
        manageOwnCredentials
      ]
    });

    const covidLake = new cfn_inc.CfnInclude(this, 'covid-data-lake-glue', {
      templateFile: 'CovidLakeStack.template.json',
      preserveLogicalIds: false
    });

    const notebookRole = new iam.Role(this, 'notebook_access_role', {
      assumedBy: new iam.ServicePrincipal('sagemaker'),
      managedPolicies: [
        ...sagemakerAccessPolicies,
        regionLimits,
        exampleBucketAccess
      ]
    })

    const budget = new budgets.CfnBudget(this, 'budget', {
      budget: {
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: 20,
          unit: 'USD'
        }
      },
      notificationsWithSubscribers: [
        {
          notification: {
            comparisonOperator: 'GREATER_THAN',
            notificationType: 'ACTUAL',
            threshold: 50
          },
          subscribers: billingAlertEmails.map(address => ({
            subscriptionType: 'EMAIL',
            address: address
          }))
        },
        {
          notification: {
            comparisonOperator: 'GREATER_THAN',
            notificationType: 'ACTUAL',
            threshold: 300
          },
          subscribers: billingAlertEmails.map(address => ({
            subscriptionType: 'EMAIL',
            address: address
          }))
        }

      ]
    })
  }

}
