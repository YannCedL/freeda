# 📦 AWS Setup Guide – Freeda

## 1️⃣ Prérequis (une fois)
- Compte AWS
- AWS CLI (`winget install Amazon.AWSCLI`)
- `aws configure` → Access Key / Secret Key / région (`eu-west-3`)
- Créez le repository ECR `freeda/backend`
- Auth Docker à ECR (`aws ecr get-login-password … | docker login …`)

## 2️⃣ Variables d’environnement
Copiez `.env.example` → `.env` et remplissez :
```
MISTRAL_API_KEY=…
JWT_SECRET_KEY=…
STORAGE_TYPE=json   # ou dynamodb en prod
CHROMA_DB_DIR=./backend/data/chroma_db
AWS_REGION=eu-west-3
DYNAMODB_TABLE_TICKETS=Tickets
```

## 3️⃣ Secrets CI (GitHub)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `MISTRAL_API_KEY`
- `JWT_SECRET_KEY`

## 4️⃣ Déploiement (une commande)
```powershell
.\deploy-all.ps1 -Environment production
```
Le script :
1. Build & push Docker
2. Seed RAG (vérifie que la collection n’est pas vide)
3. Déploie CloudFormation (DynamoDB, ECS/Fargate, S3, CloudFront)
4. Build le frontend et le copie dans S3

## 5️⃣ Vérifications
- `curl https://<lb-dns>/health`
- Ouvrez l’URL CloudFront affichée
- Test RAG via le chatbot

## 6️⃣ (Optionnel) Domaine personnalisé
1. Réservez un domaine (Route 53)
2. Créez un certificat ACM
3. Modifiez `infrastructure/ecs-fargate.yaml` → `DomainName` et `CertificateArn`

## 7️⃣ Nettoyage des docs inutiles
- Supprimez `docs/archive/FICHIERS_CREES.md`
- Déplacez `AWS_DEPLOYMENT.md` dans `docs/archive/old/` (obsolète)
- Conservez les autres fichiers listés dans le tableau du guide.

---
*Ce guide remplace les anciens fichiers `AWS_DEPLOYMENT.md`, `PRE_DEPLOYMENT_GUIDE.md`, etc. Tout est automatisé ; il ne vous reste plus qu’à fournir les secrets et lancer le script.*
