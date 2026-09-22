output "api_service_url" {
  description = "URL publique HTTPS de l'API FastAPI"
  value       = module.app_runner.service_url
}

output "database_endpoint" {
  description = "Point d'acces RDS PostgreSQL (pgvector)"
  value       = module.rds_pgvector.db_endpoint
}

output "documents_bucket" {
  description = "Bucket S3 pour les documents d'ingestion"
  value       = module.s3_storage.bucket_id
}

output "alerts_topic_arn" {
  description = "Topic SNS pour les alertes de dérive ou d'erreur"
  value       = module.monitoring.alerts_topic_arn
}
