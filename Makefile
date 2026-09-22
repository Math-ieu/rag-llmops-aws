.PHONY: help dev up down test eval tf-init tf-plan tf-apply clean

help:
	@echo "Commandes disponibles pour RAG-LLMOps AWS :"
	@echo "  make up          - Lance la stack locale (PostgreSQL pgvector, backend, frontend)"
	@echo "  make down        - Arrête la stack locale"
	@echo "  make test        - Exécute la suite de tests unitaires backend"
	@echo "  make eval        - Lance le Quality Gate d'évaluation anti-régression"
	@echo "  make tf-init     - Initialise les modules Terraform"
	@echo "  make tf-plan     - Affiche le plan d'infrastructure AWS Terraform"
	@echo "  make tf-apply    - Déploie l'infrastructure sur AWS"

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

clean:
	rm -rf backend/__pycache__ backend/*/__pycache__ backend/eval_report.md
