terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# 1. Reseau VPC & Sous-reseaux
module "vpc" {
  source       = "./modules/vpc"
  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
}

# 2. Base de donnees PostgreSQL avec pgvector
module "rds_pgvector" {
  source             = "./modules/rds_pgvector"
  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  vpc_cidr           = "10.0.0.0/16"
  private_subnet_ids = module.vpc.private_subnet_ids
  db_username        = var.db_username
  db_password        = var.db_password
}

# 3. Stockage S3 pour documents et datasets d'evaluation
module "s3_storage" {
  source       = "./modules/s3_storage"
  project_name = var.project_name
  environment  = var.environment
}

# 4. Securite IAM & Droits Bedrock
module "bedrock_iam" {
  source       = "./modules/bedrock_iam"
  project_name = var.project_name
  environment  = var.environment
}

# 5. Monitoring CloudWatch & Alertes SNS
module "monitoring" {
  source       = "./modules/monitoring"
  project_name = var.project_name
  environment  = var.environment
}

# 6. Service API Serverless App Runner
module "app_runner" {
  source                  = "./modules/app_runner"
  project_name            = var.project_name
  environment             = var.environment
  aws_region              = var.aws_region
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  instance_role_arn       = module.bedrock_iam.role_arn
  database_url            = module.rds_pgvector.database_url
  bedrock_llm_model       = var.bedrock_llm_model
  bedrock_embedding_model = var.bedrock_embedding_model
  langfuse_public_key     = var.langfuse_public_key
  langfuse_secret_key     = var.langfuse_secret_key
}
