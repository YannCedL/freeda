# 📚 Documentation consolidée du projet **Freeda**

> **⚡ Objectif** : disposer d’un seul document de référence qui couvre tout le cycle de vie du projet (on‑boarding, déploiement, production, RAG, historique).  
> **📂 Emplacement** : `docs/COMBINED_DOCUMENTATION.md`

---

## 1️⃣ Déploiement AWS – Guide complet
*(ex‑trait de `AWS_DEPLOYMENT.md`)*
- Prérequis AWS, création du repository ECR, configuration du CLI.
- Étapes de build Docker, push, création de la stack CloudFormation (DynamoDB, ECS/Fargate, S3, CloudFront).
- Validation post‑déploiement (health‑checks, URL du frontend, test RAG).

---

## 2️⃣ Pré‑déploiement – Checklist
*(ex‑trait de `PRE_DEPLOYMENT_GUIDE.md`)*
- Vérifier les variables d’environnement (`.env`).
- S’assurer que les secrets sont présents dans GitHub / CI.
- Lancer `aws ecr get-login-password` et authentifier Docker.
- Exécuter `./deploy‑all.ps1 -Environment production --dry‑run` (optionnel).

---

## 3️⃣ Déploiement ultra‑rapide (5 min)
*(ex‑trait de `QUICK_DEPLOY.md`)*
```powershell
# 1️⃣ Build & push
docker build -t $ECR_REPO:$SHA .
docker push $ECR_REPO:$SHA

# 2️⃣ Déploiement CloudFormation (one‑liner)
aws cloudformation deploy --template-file backend/infrastructure/ecs-fargate.yaml \
    --stack-name freeda-prod --parameter-overrides ImageTag=$SHA
```
- Vérifier rapidement l’URL CloudFront.

---

## 4️⃣ Instructions de build & push
*(ex‑trait de `DEPLOY_README.md`)*
- `docker build -t freeda/backend:${GIT_SHA} .`
- `docker tag … $ACCOUNT_ID.dkr.ecr.eu-west-3.amazonaws.com/freeda/backend:${GIT_SHA}`
- `docker push …`

---

## 5️⃣ Résumé du script `deploy‑all.*`
*(ex‑trait de `DEPLOY_SCRIPT_SUMMARY.md`)*
1. **Build Docker** → image multi‑stage.
2. **Seed RAG** (`python -m scripts.seed_rag`).
3. **Push ECR**.
4. **Deploy CloudFormation** (DynamoDB, ECS, S3, CloudFront).
5. **Build Frontend** (`npm run build`) → upload S3.
6. **Post‑deploy checks** (health, RAG, logs).

---

## 6️⃣ Diagramme visuel du flux de déploiement
*(ex‑trait de `DEPLOY_VISUAL.md` – illustration ASCII simplifiée)*
```
[Code] → Docker build → ECR
   │
   └─► Seed RAG (façade ChromaDB)
   │
   └─► CloudFormation
        ├─ DynamoDB
        ├─ ECS/Fargate (backend)
        └─ S3 + CloudFront (frontend)
   │
   └─► Health checks → /health, /health/ready, /health/live
```

---

## 7️⃣ Checklist **Production‑Ready**
*(ex‑trait de `PRODUCTION_READY.md`)*
- ✅ Variables d’environnement sécurisées (JWT, Mistral, AWS).
- ✅ Secrets stockés dans GitHub / AWS Secrets Manager.
- ✅ TLS via CloudFront + ACM.
- ✅ Monitoring CloudWatch (logs, métriques, alarmes).
- ✅ Auto‑scaling ECS (CPU > 70 % → scale‑out).
- ✅ Backup DynamoDB (PITR activé).
- ✅ Health‑checks configurés.
- ✅ Tests d’intégration RAG passent (`pytest backend/tests/test_rag_integration.py`).

---

## 8️⃣ Améliorations majeures
*(ex‑trait de `IMPROVEMENTS_SUMMARY.md`)*
- Seed RAG automatisé.
- Verrouillage du JSONStore (`filelock`).
- Logs IA enrichis (request_id, payload, status).
- Tests d’intégration RAG.
- Sécurisation du WebSocket (JWT).
- Pipeline CI/CD complet (GitHub Actions).

---

## 9️⃣ Index de la documentation
*(ex‑trait de `INDEX_DOCUMENTATION.md`)*
| Section | Description |
|---------|-------------|
| **On‑boarding** | `START_HERE.md` |
| **Architecture** | `ARCHITECTURE.md` |
| **Déploiement** | `AWS_SETUP_GUIDE.md` + `COMBINED_DOCUMENTATION.md` |
| **RAG** | `README_RAG.md` |
| **Changelog** | `CHANGELOG.md` |
| **Production** | `PRODUCTION_READY.md` |
| **FAQ** | `IMPROVEMENTS_SUMMARY.md` |

---

## 🔟 Guide d’on‑boarding
*(ex‑trait de `START_HERE.md`)*
1. `git clone … && cd Freeda`
2. Copiez `.env.example → .env` et remplissez les clés.
3. `python -m venv venv && .\venv\Scripts\Activate.ps1`
4. `pip install -r backend/requirements.txt`
5. `npm ci && npm run dev` (frontend)
6. `uvicorn backend.main:app --reload` (backend)
7. Accédez à `http://localhost:3000` et testez le chatbot.

---

## 🅰️ Résumé exécutif (pour décideurs)
*(ex‑trait de `RESUME_EXECUTIF.md`)*
- **Valeur ajoutée** : chatbot IA avec RAG, stockage flexible (JSON / DynamoDB).
- **Coût AWS estimé** : < 15 €/mois (Free‑tier + petite instance Fargate).
- **Road‑map** : monitoring avancé, scaling multi‑AZ, IA fine‑tuned.

---

## 🅱️ RAG – Comment ça marche
*(ex‑trait de `README_RAG.md`)*
- **ChromaDB** persiste les embeddings Mistral.
- `backend/scripts/seed_rag.py` charge `faq_documents.json` au build.
- `RAGService.get_context_for_query` renvoie les 3 documents les plus proches.
- Le contexte est injecté dans le *system prompt* avant chaque appel Mistral.

---

## 🆎 Changelog
*(ex‑trait de `CHANGELOG.md`)*
| Version | Date | Modifications majeures |
|---------|------|------------------------|
| 2.0.0 | 21 janv 2025 | Seed RAG, file‑lock JSONStore, logs IA, CI/CD, WebSocket JWT, docs consolidées. |
| 1.0.0 | 15 oct 2024 | MVP fonctionnel, API tickets, chatbot optimiste. |

---

## 🆑 Historique de création / modification
*(ex‑trait de `FICHIERS_CREES.md` – résumé)*
- 15 nouveaux fichiers créés pour la version 2.0.
- 4 fichiers modifiés (DynamoDBStore, health router, .env.example, README).

---

## 🆒 Bilan du dernier déploiement
*(ex‑trait de `DEPLOY_COMPLETE_SUMMARY.md`)*
- **Backend** : 3 réplicas ECS, 99 % de disponibilité.
- **Frontend** : CloudFront avec TTL = 5 min, aucune erreur 404.
- **RAG** : 42 documents chargés, temps moyen de recherche = 120 ms.
