'Scripting cleanup of user artifacts for AWS account deletion'

import typing
import argparse

import boto3
from botocore.exceptions import ClientError
from botocore.config import Config


class Args(typing.NamedTuple):
  profile: str
  account_id: str


def parse_args() -> Args:
  parser = argparse.ArgumentParser(description='User admin functions')
  parser.add_argument('--profile',
                      required=True,
                      help='AWS profile to use for these operations')
  
  parser.add_argument('--account_id',
                      required=True,
                      help='AWS acocunt ID to clean')


  parsed = parser.parse_args()
  return Args(profile=parsed.profile, account_id=parsed.account_id)


def get_student_group(session, student_group_name: str = 'students'):
  try:
    session.client('iam').get_group(GroupName=student_group_name)
    iam = session.resource('iam')
    students = iam.Group(student_group_name)
    return students
  except ClientError as ce:
    if ce.response['Error']['Code'] == 'NoSuchEntity':
      return None
    else:
      raise ce


def delete_user(user):
  print(f'Deleting user "{user.user_name}"')

  print('Deleting access keys...')
  for key in user.access_keys.all():
    key.delete()

  print('Dissociating from groups...')
  for group in user.groups.all():
    user.remove_group(GroupName=group.name)

  print('Dissociating MFA devices...')
  for mfa_device in user.mfa_devices.all():
    mfa_device.disassociate()

  print('Deleting login profile...')
  if user.LoginProfile():
    user.LoginProfile().delete()

  print('Deleting user account...')
  user.delete()

  print('Done')


def clear_student_group(group):
  print(f'Clearing policies in group {group.name}')
  for policy in group.policies.all():
    policy.delete()

  for policy in group.attached_policies.all():
    policy.detach_group(GroupName=group.name)


def delete_buckets(session):
  for bucket_name in (
      bucket['Name']
      for bucket in session.client('s3').list_buckets()['Buckets']
      if 'cdktoolkit' not in bucket['Name']):
    print(f'Clearing and deleting bucket "{bucket_name}"')
    bucket = session.resource('s3').Bucket(bucket_name)
    if bucket.Versioning().status == 'Enabled':
      bucket.object_versions.all().delete()
    bucket.objects.all().delete()
    bucket.delete()


def delete_notebook(sagemaker_client, notebook_instance_name: str):
  print(f'Deleting notebook instance {notebook_instance_name}')

  try:
    sagemaker_client.stop_notebook_instance(NotebookInstanceName=notebook_instance_name)
  except ClientError as ce:
    if ce.response['Error']['Code'] != 'ValidationException':
      raise ce

  sagemaker_client.delete_notebook_instance(NotebookInstanceName=notebook_instance_name)


def delete_sagemaker_notebooks(session):
  sagemaker_client = session.client('sagemaker', config=Config(region_name='eu-west-2'))
  response = sagemaker_client.list_notebook_instances(MaxResults=100)
  names = [
      instance['NotebookInstanceName']
      for instance in response['NotebookInstances']
  ]

  print(f'Found {len(names)} notebook instances')

  for notebook in names:
    delete_notebook(sagemaker_client, notebook_instance_name=notebook)


def main(args: Args):
  session = boto3.session.Session(profile_name=args.profile)
  
  account_id = session.client("sts").get_caller_identity()["Account"]
  if account_id != args.account_id:
    print(f'Found account ID {account_id}, expected {args.account_id} - aborting')
    exit(1)

  delete_buckets(session)

  delete_sagemaker_notebooks(session)

  student_group = get_student_group(session)

  if student_group:
    student_users = list(student_group.users.all())

    for user in student_users:
      delete_user(user)

    clear_student_group(student_group)
  else:
    print('No student group found')


if __name__ == '__main__':
  main(parse_args())
