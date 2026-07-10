# ---------------------------------------------------------------------------
# Lambda: transactions-history (S3 read/write) behind API Gateway
# ---------------------------------------------------------------------------

data "archive_file" "transactions_history" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambdas/transactions_history"
  output_path = "${path.module}/build/transactions_history.zip"
}

resource "aws_iam_role" "transactions_history_lambda" {
  name = "${var.project_name}-${var.environment}-txn-history-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "transactions_history_lambda" {
  name = "s3-access"
  role = aws_iam_role.transactions_history_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject", "s3:ListBucket"]
        Resource = [
          aws_s3_bucket.transaction_history.arn,
          "${aws_s3_bucket.transaction_history.arn}/*",
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

resource "aws_lambda_function" "transactions_history" {
  function_name    = "${var.project_name}-${var.environment}-transactions-history"
  role              = aws_iam_role.transactions_history_lambda.arn
  handler           = "handler.handler"
  runtime           = "python3.12"
  timeout           = 15
  filename          = data.archive_file.transactions_history.output_path
  source_code_hash = data.archive_file.transactions_history.output_base64sha256

  environment {
    variables = {
      TRANSACTION_HISTORY_BUCKET = aws_s3_bucket.transaction_history.bucket
    }
  }
}

resource "aws_apigatewayv2_api" "transactions_history" {
  name          = "${var.project_name}-${var.environment}-transactions-history"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "transactions_history" {
  api_id                 = aws_apigatewayv2_api.transactions_history.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.transactions_history.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "write_history" {
  api_id    = aws_apigatewayv2_api.transactions_history.id
  route_key = "POST /history"
  target    = "integrations/${aws_apigatewayv2_integration.transactions_history.id}"
}

resource "aws_apigatewayv2_route" "read_history" {
  api_id    = aws_apigatewayv2_api.transactions_history.id
  route_key = "GET /history/{account_id}"
  target    = "integrations/${aws_apigatewayv2_integration.transactions_history.id}"
}

resource "aws_apigatewayv2_stage" "transactions_history" {
  api_id      = aws_apigatewayv2_api.transactions_history.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "transactions_history_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action         = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transactions_history.function_name
  principal      = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.transactions_history.execution_arn}/*/*"
}

# ---------------------------------------------------------------------------
# Lambda: notification-writer (SQS -> DynamoDB "notifications" table)
# ---------------------------------------------------------------------------

data "archive_file" "notification_writer" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambdas/notification_writer"
  output_path = "${path.module}/build/notification_writer.zip"
}

resource "aws_iam_role" "notification_writer_lambda" {
  name = "${var.project_name}-${var.environment}-notification-writer-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "notification_writer_lambda" {
  name = "sqs-and-dynamodb-access"
  role = aws_iam_role.notification_writer_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Resource = aws_sqs_queue.user_registered_notifications.arn
      },
      {
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem"]
        Resource = aws_dynamodb_table.generic["notifications"].arn
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

resource "aws_lambda_function" "notification_writer" {
  function_name    = "${var.project_name}-${var.environment}-notification-writer"
  role              = aws_iam_role.notification_writer_lambda.arn
  handler           = "handler.handler"
  runtime           = "python3.12"
  timeout           = 15
  filename          = data.archive_file.notification_writer.output_path
  source_code_hash = data.archive_file.notification_writer.output_base64sha256

  environment {
    variables = {
      NOTIFICATIONS_TABLE = aws_dynamodb_table.generic["notifications"].name
    }
  }
}

resource "aws_lambda_event_source_mapping" "notification_writer_sqs" {
  event_source_arn = aws_sqs_queue.user_registered_notifications.arn
  function_name     = aws_lambda_function.notification_writer.arn
  batch_size        = 10
}
