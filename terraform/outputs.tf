output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "configure_kubectl" {
  description = "Run this to set up kubectl access"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

output "ecr_repository_urls" {
  description = "Map of service name -> ECR repository URL"
  value       = { for name, repo in aws_ecr_repository.service : name => repo.repository_url }
}

output "dynamodb_accounts_table" {
  value = aws_dynamodb_table.accounts.name
}

output "backend_irsa_role_arn" {
  description = "Put this on the Kubernetes ServiceAccount annotation eks.amazonaws.com/role-arn"
  value       = module.backend_app_irsa.iam_role_arn
}

output "vpc_id" {
  value = local.vpc_id
}

output "users_db_endpoint" {
  description = "Aurora MySQL cluster endpoint for the users-service"
  value       = aws_rds_cluster.users.endpoint
}

output "users_db_name" {
  value = aws_rds_cluster.users.database_name
}

output "users_db_secret_arn" {
  description = "Secrets Manager ARN holding the users-service DB credentials"
  value       = aws_secretsmanager_secret.users_db.arn
}

output "transaction_history_bucket" {
  value = aws_s3_bucket.transaction_history.bucket
}

output "transactions_history_api_url" {
  description = "Base URL of the transactions-history API Gateway (Lambda-backed, reads/writes S3)"
  value       = aws_apigatewayv2_stage.transactions_history.invoke_url
}
