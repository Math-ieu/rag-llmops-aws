.PHONY: help dev up down test eval tf-init tf-plan tf-apply deploy-frontend clean

help:
	@echo "Commandes disponibles pour RAG-LLMOps AWS :"
	@echo "  make up              - Lance la stack locale (PostgreSQL pgvector, backend, frontend)"
	@echo "  make down            - Arrête la stack locale"
	@echo "  make test            - Exécute la suite de tests unitaires backend"
	@echo "  make eval            - Lance le Quality Gate d'évaluation anti-régression"
	@echo "  make tf-init         - Initialise les modules Terraform"
	@echo "  make tf-plan         - Affiche le plan d'infrastructure AWS Terraform"
	@echo "  make tf-apply        - Déploie l'infrastructure sur AWS"
	@echo "  make deploy-frontend - Build React et synchronise les assets sur S3 + CloudFront"

up:
	docker compose up --build -d

down:
	docker compose down

test:
	cd backend && MOCK_BEDROCK=True python3 -m pytest tests/ -v

eval:
	cd backend && python3 -m app.evaluation.regression_gate app/evaluation/golden_dataset.json

tf-init:
	cd terraform && terraform init

tf-plan:
	cd terraform && terraform plan

tf-apply:
	cd terraform && terraform apply -auto-approve

deploy-frontend:
	@echo "==> Récupération des outputs Terraform..."
	@API_URL=$$(cd terraform && terraform output -raw api_service_url 2>/dev/null || echo ""); \
	BUCKET=$$(cd terraform && terraform output -raw frontend_bucket_name 2>/dev/null || echo ""); \
	DISTRIB_ID=$$(cd terraform && terraform output -raw frontend_distribution_id 2>/dev/null || echo ""); \
	if [ -z "$$BUCKET" ]; then \
		echo "Erreur: Bucket frontend non trouvé dans les outputs Terraform. Lancez d'abord make tf-apply."; \
		exit 1; \
	fi; \
	echo "==> Build du frontend React avec API_URL=$$API_URL..."; \
	cd frontend && VITE_API_URL="$$API_URL" npm run build && \
	echo "==> Synchronisation S3 vers s3://$$BUCKET..."; \
	aws s3 sync dist/ s3://$$BUCKET --delete && \
	if [ -n "$$DISTRIB_ID" ]; then \
		echo "==> Invalidation du cache CloudFront ($$DISTRIB_ID)..."; \
		aws cloudfront create-invalidation --distribution-id "$$DISTRIB_ID" --paths "/*"; \
	fi; \
	echo "==> Déploiement Frontend terminé avec succès !"

clean:
	rm -rf backend/__pycache__ backend/*/__pycache__ backend/eval_report.md

