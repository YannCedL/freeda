# 🚀 Guide de Configuration Pré-Déploiement - Freeda

Ce guide vous aide à préparer votre environnement AWS avant le déploiement complet.

---

## ⚙️ Prérequis

### 1. **Compte AWS**
- ✅ Compte AWS actif
- ✅ Accès administrateur (ou permissions suffisantes)
- ✅ Carte de crédit enregistrée

### 2. **Outils Locaux**
```bash
# Vérifier les installations
aws --version        # AWS CLI v2.x
docker --version     # Docker 20.x+
node --version       # Node.js 18.x+
npm --version        # npm 9.x+
jq --version         # jq 1.6+
```

**Installation si manquant** :
- **AWS CLI** : https://aws.amazon.com/cli/
- **Docker** : https://www.docker.com/get-started
- **Node.js** : https://nodejs.org/
- **jq** : `npm install -g jq` ou `choco install jq` (Windows)

---

## 🔧 Configuration AWS

### Étape 1 : Configurer AWS CLI

```bash
aws configure
```

Entrer :
- **AWS Access Key ID** : Votre clé d'accès
- **AWS Secret Access Key** : Votre clé secrète
- **Default region name** : `eu-west-1`
- **Default output format** : `json`

**Vérifier** :
```bash
aws sts get-caller-identity
```

Vous devriez voir votre Account ID et ARN.

---

### Étape 2 : Créer un VPC (si vous n'en avez pas)

#### Option A : VPC par Défaut
```bash
# Lister vos VPCs
aws ec2 describe-vpcs --region eu-west-1

# Lister vos subnets
aws ec2 describe-subnets --region eu-west-1
```

Si vous avez un VPC par défaut, notez :
- **VPC ID** : `vpc-xxxxxxxxx`
- **Subnet IDs** : `subnet-xxxxx,subnet-yyyyy` (au moins 2 dans des AZ différentes)

#### Option B : Créer un Nouveau VPC
```bash
# Créer un VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --region eu-west-1

# Créer 2 subnets publics
aws ec2 create-subnet \
  --vpc-id vpc-XXXXXXXX \
  --cidr-block 10.0.1.0/24 \
  --availability-zone eu-west-1a

aws ec2 create-subnet \
  --vpc-id vpc-XXXXXXXX \
  --cidr-block 10.0.2.0/24 \
  --availability-zone eu-west-1b

# Créer une Internet Gateway
aws ec2 create-internet-gateway

# Attacher l'IGW au VPC
aws ec2 attach-internet-gateway \
  --vpc-id vpc-XXXXXXXX \
  --internet-gateway-id igw-XXXXXXXX
```

---

### Étape 3 : Obtenir votre Clé Mistral AI

1. Aller sur https://console.mistral.ai/
2. Créer un compte (si nécessaire)
3. Générer une API Key
4. Copier la clé (format : `xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

---

### Étape 4 : Configurer les Paramètres de Déploiement

Éditer `backend/infrastructure/parameters.json` :

```json
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "production"
  },
  {
    "ParameterKey": "VpcId",
    "ParameterValue": "vpc-0123456789abcdef0"  ← VOTRE VPC ID
  },
  {
    "ParameterKey": "SubnetIds",
    "ParameterValue": "subnet-abc123,subnet-def456"  ← VOS SUBNET IDS
  },
  {
    "ParameterKey": "MistralApiKey",
    "ParameterValue": "VOTRE_CLE_MISTRAL_ICI"  ← VOTRE CLÉ MISTRAL
  },
  {
    "ParameterKey": "DynamoDBTableName",
    "ParameterValue": "freeda-tickets-production"
  },
  {
    "ParameterKey": "ContainerImage",
    "ParameterValue": "SERA_REMPLI_AUTOMATIQUEMENT"
  },
  {
    "ParameterKey": "DesiredCount",
    "ParameterValue": "2"
  },
  {
    "ParameterKey": "ContainerCpu",
    "ParameterValue": "512"
  },
  {
    "ParameterKey": "ContainerMemory",
    "ParameterValue": "1024"
  },
  {
    "ParameterKey": "AllowedOrigins",
    "ParameterValue": "*"
  }
]
```

**Paramètres à modifier** :
- ✅ `VpcId` : Votre VPC ID
- ✅ `SubnetIds` : Vos Subnet IDs (séparés par des virgules)
- ✅ `MistralApiKey` : Votre clé Mistral AI

---

## 🚀 Déploiement

### Déploiement Complet (Frontend + Backend)

```bash
# Rendre le script exécutable
chmod +x deploy-all.sh

# Déployer TOUT
./deploy-all.sh production
```

### Déploiement avec Améliorations (Redis, Cache, etc.)

```bash
./deploy-all.sh production --with-improvements
```

---

## 📊 Que Va Faire le Script ?

Le script `deploy-all.sh` va automatiquement :

### 1. **Vérifications** (1 min)
- ✅ Vérifier AWS CLI, Docker, Node.js, jq
- ✅ Vérifier les credentials AWS
- ✅ Vérifier que tous les fichiers existent

### 2. **DynamoDB** (3 min)
- ✅ Créer la table DynamoDB
- ✅ Configurer les Global Secondary Indexes
- ✅ Activer Point-in-Time Recovery
- ✅ Configurer les alarmes CloudWatch

### 3. **Backend Docker** (5 min)
- ✅ Créer le repository ECR
- ✅ Builder l'image Docker
- ✅ Pousser vers ECR

### 4. **Backend ECS** (10 min)
- ✅ Créer le cluster ECS
- ✅ Créer l'Application Load Balancer
- ✅ Créer le service ECS avec 2 tâches
- ✅ Configurer l'auto-scaling
- ✅ Configurer les health checks

### 5. **Frontend Build** (2 min)
- ✅ Installer les dépendances npm
- ✅ Builder l'application React
- ✅ Optimiser les assets

### 6. **Frontend Déploiement** (5 min)
- ✅ Créer le bucket S3
- ✅ Créer la distribution CloudFront
- ✅ Uploader les fichiers
- ✅ Invalider le cache

### 7. **Configuration** (1 min)
- ✅ Configurer CORS
- ✅ Tester les health checks

**Temps total** : ~25-30 minutes

---

## 🔍 Vérifications Post-Déploiement

### 1. **Backend**
```bash
# Récupérer l'URL du backend
BACKEND_URL=$(aws cloudformation describe-stacks \
  --stack-name freeda-ecs-production \
  --region eu-west-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text)

# Tester
curl http://$BACKEND_URL/health
```

**Réponse attendue** :
```json
{
  "status": "healthy",
  "storage_type": "dynamodb",
  "mistral_configured": true
}
```

### 2. **Frontend**
```bash
# Récupérer l'URL du frontend
FRONTEND_URL=$(aws cloudformation describe-stacks \
  --stack-name freeda-frontend-production \
  --region eu-west-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
  --output text)

# Ouvrir dans le navigateur
echo $FRONTEND_URL
```

### 3. **DynamoDB**
```bash
# Compter les tickets
aws dynamodb scan \
  --table-name freeda-tickets-production \
  --select COUNT \
  --region eu-west-1
```

---

## 💰 Estimation des Coûts

### Configuration Standard
| Service | Configuration | Coût/Mois |
|---------|--------------|-----------|
| **ECS Fargate** | 2 tâches × 0.5vCPU × 1GB | $30.00 |
| **DynamoDB** | On-demand, 10k tickets | $0.50 |
| **ALB** | 1 ALB + data transfer | $20.00 |
| **S3** | 1GB frontend | $0.02 |
| **CloudFront** | 10GB transfer | $1.00 |
| **CloudWatch** | Logs + Metrics | $2.50 |
| **ECR** | 1GB storage | $0.10 |
| **Secrets Manager** | 1 secret | $0.40 |
| **TOTAL** | | **~$54.52** |

### Configuration Optimisée (FARGATE_SPOT)
| Service | Coût/Mois |
|---------|-----------|
| **ECS Fargate SPOT** | $9.00 |
| **Autres services** | $24.52 |
| **TOTAL** | **~$33.52** |

---

## 🆘 Dépannage

### Erreur : "VPC not found"
```bash
# Lister vos VPCs
aws ec2 describe-vpcs --region eu-west-1

# Mettre à jour parameters.json avec le bon VPC ID
```

### Erreur : "Subnets must be in different AZs"
```bash
# Lister vos subnets avec leurs AZ
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=vpc-XXXXXXXX" \
  --region eu-west-1 \
  --query 'Subnets[*].[SubnetId,AvailabilityZone]' \
  --output table

# Choisir 2 subnets dans des AZ différentes
```

### Erreur : "Docker daemon not running"
```bash
# Windows
# Démarrer Docker Desktop

# Linux
sudo systemctl start docker
```

### Erreur : "AWS credentials not found"
```bash
# Reconfigurer AWS CLI
aws configure

# Ou définir les variables d'environnement
export AWS_ACCESS_KEY_ID=xxx
export AWS_SECRET_ACCESS_KEY=xxx
export AWS_DEFAULT_REGION=eu-west-1
```

---

## 📞 Besoin d'Aide ?

### Documentation
- **Guide AWS** : `backend/docs/AWS_DEPLOYMENT.md`
- **Architecture** : `ARCHITECTURE.md`
- **Quick Deploy** : `backend/QUICK_DEPLOY.md`

### Commandes Utiles

**Voir les logs ECS** :
```bash
aws logs tail /ecs/freeda-production --follow --region eu-west-1
```

**Voir les stacks CloudFormation** :
```bash
aws cloudformation describe-stacks --region eu-west-1
```

**Supprimer tout** :
```bash
# Backend
aws cloudformation delete-stack --stack-name freeda-ecs-production --region eu-west-1

# Frontend
aws cloudformation delete-stack --stack-name freeda-frontend-production --region eu-west-1

# DynamoDB
aws cloudformation delete-stack --stack-name freeda-dynamodb-production --region eu-west-1
```

---

## ✅ Checklist Avant Déploiement

- [ ] AWS CLI installé et configuré
- [ ] Docker installé et démarré
- [ ] Node.js et npm installés
- [ ] jq installé
- [ ] VPC ID récupéré
- [ ] 2 Subnet IDs récupérés (AZ différentes)
- [ ] Clé Mistral AI obtenue
- [ ] `parameters.json` configuré
- [ ] Carte de crédit enregistrée sur AWS

**Tout est prêt ?** → Lancez `./deploy-all.sh production` ! 🚀

---

**Bonne chance ! 🎉**
