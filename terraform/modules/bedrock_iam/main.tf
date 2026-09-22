resource "aws_iam_role" "app_execution_role" {
  name = "${var.project_name}-app-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "apprunner.amazonaws.com",
            "ecs-tasks.amazonaws.com"
          ]
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-iam-role"
  }
}

resource "aws_iam_policy" "bedrock_access" {
  name        = "${var.project_name}-bedrock-policy"
  description = "Politique d'acces restreint aux modeles Amazon Bedrock pour RAG et LLM-judge"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
          "bedrock:ListFoundationModels"
        ]
        Resource = [
          "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet*",
          "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku*",
          "arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach_bedrock" {
  role       = aws_iam_role.app_execution_role.name
  policy_arn = aws_iam_policy.bedrock_access.arn
}
