# Overview

Infrastructure is set up using AWS CDK. See `Cloudformation` service in AWS for deployed stacks and stack state.

# Provision Infrastructure

`BILLING_ALERT_EMAILS=email@domain1.com,email@domain2.com cdk deploy --profile tda`

List of email addresses in BILLING_ALERT_EMAILS should be alerted if the account exceeds a given billing threshold.

# Destroy Infrastructure

`BILLING_ACCOUNT_EMAILS="" cdk destroy --profile AWS_PROFILE`