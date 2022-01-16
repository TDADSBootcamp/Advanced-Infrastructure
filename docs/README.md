# Overview

This repo sets up the AWS infrastructure needed for the Data Science Phase 3 bootcamp section.
It also includes scripts to manage the workspace.

It's a VSCode workspace, comprising two components with their own READMEs:

- [user_admin](user_admin) includes user account setup for students and cleanup scripts to remove student resources after a cohort.
- [infra](infra) sets up the cloud infrastructure required for the course material.

The scripts are needed for each cohort - to set up student access in the `Advanced-Cloud` section, and to clean up afterwards.

# Prereqs

- AWS Account for student use
- Admin access to the AWS Account
- Locally installed AWS client and credentials to that AWS Account

# Running the Course

- Designed for one cohort at a time. Intructors for concurrent cohorts would beed to co-ordinate to prepare the environment before the first cohort and clean up after the last.
- Attempts to clean up as much evidence of previous cohorts as possible. Unfortunately, automated deletion of an AWS account is not possible and regular create/delete account activity is not advised by AWS. Sagemaker does not permit removal of existing training jobs. It may be possible to hide these using tagging and permissions but not attempted. There will also be evidence of previous cohorts in audit logs, etc.
- Students are restricted by permissions as much as possible, including to one AWS region. Currently `eu-west-2` (London). Ensure your consoles are looking at the right region.

## Before the Cohort

- ensure the cleanup script in `user_admin` has been run
- ensure the existing infra has been destroyed in `infra`
- re-create the infra in `infra`

## During the Cohort

You'll need the user setup scripts in `user_admin` for the Advanced-Cloud section of the course

## After the Cohort

- ensure the cleanup script in `user_admin` has been run
- ensure the existing infra has been destroyed in `infra`
