output "bucket_name" {
  description = "Nom du bucket S3 hébergeant les fichiers statiques du frontend"
  value       = aws_s3_bucket.frontend.id
}

output "bucket_arn" {
  description = "ARN du bucket S3 hébergeant le frontend"
  value       = aws_s3_bucket.frontend.arn
}

output "cloudfront_distribution_id" {
  description = "ID de la distribution CloudFront"
  value       = aws_cloudfront_distribution.frontend_cdn.id
}

output "cloudfront_domain_name" {
  description = "Nom de domaine CloudFront (ex: d111111abcdef8.cloudfront.net)"
  value       = aws_cloudfront_distribution.frontend_cdn.domain_name
}

output "frontend_url" {
  description = "URL publique HTTPS d'accès au frontend React"
  value       = "https://${aws_cloudfront_distribution.frontend_cdn.domain_name}"
}
