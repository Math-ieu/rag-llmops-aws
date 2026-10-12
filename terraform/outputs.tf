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

output "frontend_url" {
  description = "URL publique HTTPS d'accès au frontend React (CloudFront)"
  value       = module.frontend.frontend_url
}

output "frontend_bucket_name" {
  description = "Bucket S3 accueillant les fichiers statiques de build React"
  value       = module.frontend.bucket_name
}

output "frontend_distribution_id" {
  description = "ID de la distribution CloudFront (pour les invalidations de cache)"
  value       = module.frontend.cloudfront_distribution_id
}

