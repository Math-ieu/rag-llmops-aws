output "role_arn" {
  value = aws_iam_role.app_execution_role.arn
}

output "role_name" {
  value = aws_iam_role.app_execution_role.name
}
