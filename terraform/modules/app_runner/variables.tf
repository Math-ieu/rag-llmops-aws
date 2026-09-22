variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "image_uri" {
  type    = string
  default = "public.ecr.aws/aws-containers/hello-app-runner:latest"
}

variable "access_role_arn" {
  type    = string
  default = ""
}

variable "instance_role_arn" {
  type = string
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "bedrock_llm_model" {
  type = string
}

variable "bedrock_embedding_model" {
  type = string
}

variable "langfuse_public_key" {
  type    = string
  default = ""
}

variable "langfuse_secret_key" {
  type      = string
  default   = ""
  sensitive = true
}
