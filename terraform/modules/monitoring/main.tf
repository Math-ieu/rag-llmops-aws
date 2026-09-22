resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apprunner/${var.project_name}-api"
  retention_in_days = 30

  tags = {
    Name        = "${var.project_name}-logs"
    Environment = var.environment
  }
}

resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts-topic"

  tags = {
    Name        = "${var.project_name}-alerts"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${var.project_name}-high-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5xxStatusResponses"
  namespace           = "AWS/AppRunner"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alerte de depassement du taux d'erreurs 5xx sur l'API RAG"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ServiceName = var.service_name
  }
}
