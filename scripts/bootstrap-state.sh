#!/usr/bin/env bash
# One-time setup: creates the S3 bucket + DynamoDB table terraform needs
# for remote state. Run this ONCE, before the first `terraform init` /
# before the first CI/CD run. Safe to re-run (skips anything that already
# exists).
#
# Run this in AWS CloudShell (console, top-right icon) or any shell with
# the AWS CLI configured against this account.

set -euo pipefail

BUCKET="veerabank-terraform-state-517798688687"
TABLE="veerabank-terraform-locks"
REGION="us-east-1"

echo "== Creating S3 bucket: $BUCKET in $REGION =="
if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "Bucket already exists, skipping create."
else
  aws s3api create-bucket --bucket "$BUCKET" --region "$REGION"
fi

echo "== Enabling versioning =="
aws s3api put-bucket-versioning \
  --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled

echo "== Enabling default encryption (AES256) =="
aws s3api put-bucket-encryption \
  --bucket "$BUCKET" \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

echo "== Blocking public access =="
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "== Creating DynamoDB lock table: $TABLE =="
if aws dynamodb describe-table --table-name "$TABLE" --region "$REGION" >/dev/null 2>&1; then
  echo "Table already exists, skipping create."
else
  aws dynamodb create-table \
    --table-name "$TABLE" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION"
fi

echo ""
echo "Done. terraform/main.tf already points at this bucket/table -"
echo "you can now run 'terraform init' locally, or rerun the GitHub Actions workflow."
