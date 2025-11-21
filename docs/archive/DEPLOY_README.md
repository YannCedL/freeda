# 🚀 Déploiement Complet - Freeda sur AWS

**Déployez TOUT (Frontend + Backend) en UNE SEULE commande !**

---

## ⚡ Quick Start (30 minutes)

### 1. **Prérequis** (5 min)

Installez :
- ✅ [AWS CLI](https://aws.amazon.com/cli/)
- ✅ [Docker Desktop](https://www.docker.com/get-started)
- ✅ [Node.js 18+](https://nodejs.org/)

Configurez AWS :
```bash
aws configure
# Entrer: Access Key, Secret Key, Region (eu-west-1), Output (json)
```

---

### 2. **Configuration** (10 min)

#### A. Récupérer votre VPC et Subnets

```bash
# Lister vos VPCs
aws ec2 describe-vpcs --region eu-west-1

# Lister vos subnets
aws ec2 describe-subnets --region eu-west-1
```

Notez :
- **VPC ID** : `vpc-xxxxxxxxx`
- **Subnet IDs** : `subnet-xxxxx,subnet-yyyyy` (2 dans des AZ différentes)

#### B. Obtenir votre clé Mistral AI

1. Aller sur https://console.mistral.ai/
2. Créer un compte
3. Générer une API Key
4. Copier la clé

#### C. Configurer les paramètres

Éditer `backend/infrastructure/parameters.json` :

```json
{
  "ParameterKey": "VpcId",
  "ParameterValue": "vpc-VOTRE_VPC_ID"  ← Remplacer
},
{
  "ParameterKey": "SubnetIds",
  "ParameterValue": "subnet-XXX,subnet-YYY"  ← Remplacer
},
{
  "ParameterKey": "MistralApiKey",
  "ParameterValue": "VOTRE_CLE_MISTRAL"  ← Remplacer
}
```

---

### 3. **Déploiement** (15 min)

#### Windows (PowerShell)
```powershell
.\deploy-all.ps1 -Environment production
```

#### Linux/Mac (Bash)
```bash
chmod +x deploy-all.sh
./deploy-all.sh production
```

**C'est tout !** ☕ Le script va :
1. ✅ Créer DynamoDB
2. ✅ Builder et pusher le backend Docker
3. ✅ Déployer sur ECS Fargate
4. ✅ Builder le frontend React
5. ✅ Déployer sur S3 + CloudFront
6. ✅ Configurer tout automatiquement

---

## 📊 Ce Qui Est Déployé

### Frontend
- ✅ **S3** : Hébergement des fichiers statiques
- ✅ **CloudFront** : CDN global avec HTTPS
- ✅ **Security Headers** : CSP, HSTS, X-Frame-Options
- ✅ **Cache optimisé** : Assets (1 an), HTML (0s)

### Backend
- ✅ **ECS Fargate** : 2 containers serverless
- ✅ **Application Load Balancer** : Distribution de charge
- ✅ **Auto-scaling** : 2-10 tâches selon CPU
- ✅ **Health checks** : /health, /health/ready, /health/live
- ✅ **CloudWatch Logs** : Logs centralisés

### Base de Données
- ✅ **DynamoDB** : Table avec GSI
- ✅ **On-Demand billing** : Pay-per-use
- ✅ **Point-in-Time Recovery** : Backups automatiques
- ✅ **Encryption at rest** : KMS

---

## 🎯 Après le Déploiement

### Récupérer les URLs

```bash
# Frontend
aws cloudformation describe-stacks \
  --stack-name freeda-frontend-production \
  --region eu-west-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
  --output text

# Backend
aws cloudformation describe-stacks \
  --stack-name freeda-ecs-production \
  --region eu-west-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text
```

### Tester

```bash
# Health check backend
curl http://BACKEND_URL/health

# Ouvrir le frontend
# Copier l'URL CloudFront dans votre navigateur
```

---

## 💰 Coûts

| Service | Coût/Mois |
|---------|-----------|
| ECS Fargate (2 tâches) | $30 |
| DynamoDB (On-demand) | $0.50 |
| ALB | $20 |
| S3 + CloudFront | $1 |
| CloudWatch | $2.50 |
| **TOTAL** | **~$54** |

**Optimisé avec FARGATE_SPOT** : ~$33/mois

---

## 🔄 Mises à Jour

### Backend
```bash
# Modifier le code
# Puis relancer le script
./deploy-all.sh production
```

Le script va :
1. Rebuilder l'image Docker
2. Pousser vers ECR
3. Faire un rolling update (zero downtime)

### Frontend
```bash
# Modifier le code
# Puis relancer le script
./deploy-all.sh production
```

Le script va :
1. Rebuilder l'application
2. Uploader vers S3
3. Invalider le cache CloudFront

---

## 🗑️ Supprimer Tout

```bash
# Backend
aws cloudformation delete-stack --stack-name freeda-ecs-production --region eu-west-1

# Frontend
aws cloudformation delete-stack --stack-name freeda-frontend-production --region eu-west-1

# DynamoDB
aws cloudformation delete-stack --stack-name freeda-dynamodb-production --region eu-west-1

# ECR
aws ecr delete-repository --repository-name freeda-backend --force --region eu-west-1
```

---

## 🆘 Problèmes Courants

### "VPC not found"
→ Vérifiez votre VPC ID dans `parameters.json`

### "Subnets must be in different AZs"
→ Choisissez 2 subnets dans des Availability Zones différentes

### "Docker daemon not running"
→ Démarrez Docker Desktop

### "AWS credentials not found"
→ Exécutez `aws configure`

---

## 📚 Documentation Complète

- **Configuration détaillée** : [PRE_DEPLOYMENT_GUIDE.md](PRE_DEPLOYMENT_GUIDE.md)
- **Architecture AWS** : [ARCHITECTURE.md](ARCHITECTURE.md)
- **Guide complet** : [backend/docs/AWS_DEPLOYMENT.md](backend/docs/AWS_DEPLOYMENT.md)

---

## 🎉 C'est Tout !

Votre application Freeda est maintenant **déployée sur AWS** avec :
- ✅ Frontend global (CloudFront)
- ✅ Backend scalable (ECS Fargate)
- ✅ Base de données serverless (DynamoDB)
- ✅ Monitoring (CloudWatch)
- ✅ Sécurité (IAM, Secrets Manager)

**Bon déploiement ! 🚀**
