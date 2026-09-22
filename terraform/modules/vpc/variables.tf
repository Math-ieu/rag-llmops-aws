variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "aws_region" {
  type = string
}

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}
