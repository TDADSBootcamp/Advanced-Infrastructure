#!/bin/bash

set -euo pipefail

USERNAME=$1
export AWS_PROFILE=$2
PASSWORD=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 32 ; echo '')

aws iam create-user --user-name ${USERNAME}

aws iam add-user-to-group --group-name students --user-name ${USERNAME}

aws iam create-login-profile --user-name ${USERNAME} --password ${PASSWORD} --password-reset-required

echo ${PASSWORD} | xclip -sel clipboard
