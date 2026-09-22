output "log_group_name" {
  value = aws_cloudwatch_log_group.api_logs.name
}

output "alerts_topic_arn" {
  value = aws_sns_topic.alerts.arn
}
