output "service_url" {
  value = "https://${aws_apprunner_service.api.service_url}"
}

output "service_arn" {
  value = aws_apprunner_service.api.arn
}

output "service_id" {
  value = aws_apprunner_service.api.service_id
}
