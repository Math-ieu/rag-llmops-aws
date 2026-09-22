resource "aws_security_group" "app_runner_sg" {
  name        = "${var.project_name}-apprunner-sg"
  description = "Security group for App Runner VPC connector"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_apprunner_vpc_connector" "connector" {
  vpc_connector_name = "${var.project_name}-vpc-conn"
  subnets            = var.private_subnet_ids
  security_groups    = [aws_security_group.app_runner_sg.id]
}

resource "aws_apprunner_service" "api" {
  service_name = "${var.project_name}-api"

  source_configuration {
    auto_deployments_enabled = false

    image_repository {
      image_identifier      = var.image_uri
      image_repository_type = "ECR"

      image_configuration {
        port = "8000"
        runtime_environment_variables = {
          "APP_ENV"                    = var.environment
          "AWS_REGION"                 = var.aws_region
          "DATABASE_URL"               = var.database_url
          "BEDROCK_LLM_MODEL_ID"       = var.bedrock_llm_model
          "BEDROCK_EMBEDDING_MODEL_ID" = var.bedrock_embedding_model
          "LANGFUSE_PUBLIC_KEY"        = var.langfuse_public_key
          "LANGFUSE_SECRET_KEY"        = var.langfuse_secret_key
        }
      }
    }

    authentication_configuration {
      access_role_arn = var.access_role_arn
    }
  }

  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.connector.arn
    }
  }

  instance_configuration {
    cpu               = "1024"
    memory            = "2048"
    instance_role_arn = var.instance_role_arn
  }

  tags = {
    Name        = "${var.project_name}-api"
    Environment = var.environment
  }
}
