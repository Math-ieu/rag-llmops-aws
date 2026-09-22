output "db_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "db_address" {
  value = aws_db_instance.postgres.address
}

output "db_port" {
  value = aws_db_instance.postgres.port
}

output "database_url" {
  value     = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/rag_llmops"
  sensitive = true
}
