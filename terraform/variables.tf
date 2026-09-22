variable "aws_region" {
  description = "Région AWS pour le déploiement de l'infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Nom de l'environnement (ex: dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Nom du projet pour le taggage des ressources"
  type        = string
  default     = "rag-llmops-aws"
}

variable "db_username" {
  description = "Nom d'utilisateur administrateur PostgreSQL"
  type        = string
  default     = "postgresadmin"
}

variable "db_password" {
  description = "Mot de passe administrateur PostgreSQL"
  type        = string
  sensitive   = true
  default     = "ChangeMeSecurePassword123!"
}

variable "bedrock_llm_model" {
  description = "Identifiant du modèle de fondation Bedrock pour la génération"
  type        = string
  default     = "anthropic.claude-3-5-sonnet-20240620-v1:0"
}

variable "bedrock_embedding_model" {
  description = "Identifiant du modèle Bedrock pour les embeddings"
  type        = string
  default     = "amazon.titan-embed-text-v2:0"
}

variable "langfuse_public_key" {
  description = "Clé publique Langfuse"
  type        = string
  default     = ""
}

variable "langfuse_secret_key" {
  description = "Clé secrète Langfuse"
  type        = string
  sensitive   = true
  default     = ""
}
