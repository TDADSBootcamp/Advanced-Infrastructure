# user_admin

Scripts to help create users and clean up the project.
Requires Python 3.8.

From this directory: `pipenv install` to install dependencies

- `pipenv run python clean_account.py` will delete any student resources it can find. Use the Tag Editor service to find any unexpected resources that might have been created. Permissions for students are limited to avoid this happening but it could.
  Required Parameters:
  - `profile`: your local AWS profile with admin access to the course AWS account
  - `account_id`: the course AWS account ID. Currently `628189597849`
- `./setup_user.sh username profile` is used to provision AWS accounts for students

## Setup (During the session)

Once the stack is deployed, users can be created with [./setup_user.sh username profile](setup_user.sh).

For each student, create a user with an appropriate username.
The new user will have a randomly generated password and require a reset at first login.

On Linux, the password will be copied into your clipboard (you'll need xclip installed).
You'll need to modify the script if you're not running Linux.
Paste the password into a DM with the student.

MFA will be required for the student to generate access keys for the AWS CLI.
