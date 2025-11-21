# 🚀 Guide de Déploiement AWS - Freeda Support App

Ce guide vous accompagne pour déployer Freeda sur AWS avec DynamoDB et ECS Fargate.

---

## 📋 Prérequis

1. **Compte AWS** avec accès administrateur
2. **AWS CLI** installé et configuré
   ```bash
   aws configure
   ```
3. **Docker** installé localement
4. **Clé API Mistral** (https://console.mistral.ai/)

---

## 🏗️ Architecture de Déploiement

```
┌─────────────────────────────────────────────────────────┐
│                      Internet                           │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────▼──────────┐
         │  Application Load    │
         │     Balancer         │
         └───────────┬──────────┘
                     │
         ┌───────────▼──────────┐
         │   ECS Fargate        │
         │  (2+ containers)     │
         │  Auto-scaling        │
         └───────┬───────┬──────┘
                 │       │
        ┌────────▼──┐  ┌▼────────────┐
        │ DynamoDB  │  │ CloudWatch  │
        │ (Tickets) │  │ (Logs)      │
        └───────────┘  └─────────────┘
```

---

## 🔧 Étape 1 : Créer la Table DynamoDB

### Option A : Via CloudFormation (Recommandé)

```bash
cd backend/infrastructure

# Créer la stack DynamoDB
aws cloudformation create-stack \
  --stack-name freeda-dynamodb-production \
  --template-body file://dynamodb-table.yaml \
  --parameters ParameterKey=Environment,ParameterValue=production \
  --region eu-west-1

# Attendre que la stack soit créée
aws cloudformation wait stack-create-complete \
  --stack-name freeda-dynamodb-production \
  --region eu-west-1

# Vérifier le statut
aws cloudformation describe-stacks \
  --stack-name freeda-dynamodb-production \
  --region eu-west-1 \
  --query 'Stacks[0].StackStatus'
```

### Option B : Via AWS Console

1. Aller sur **DynamoDB** → **Tables** → **Create table**
2. Nom : `freeda-tickets-production`
3. Partition key : `ticket_id` (String)
4. **Table settings** : On-demand (pay-per-request)
5. Créer les **Global Secondary Indexes** :
   - **Index 1** : `status-created_at-index`
     - Partition key : `status` (String)
     - Sort key : `created_at` (String)
   - **Index 2** : `channel-created_at-index`
     - Partition key : `channel` (String)
     - Sort key : `created_at` (String)

---

## 📦 Étape 2 : Construire et Pousser l'Image Docker

### 2.1 Créer un Repository ECR

```bash
# Créer le repository
aws ecr create-repository \
  --repository-name freeda-backend \
  --region eu-west-1

# Récupérer l'URI du repository
ECR_URI=$(aws ecr describe-repositories \
  --repository-names freeda-backend \
  --region eu-west-1 \
  --query 'repositories[0].repositoryUri' \
  --output text)

echo "ECR URI: $ECR_URI"
```

### 2.2 Construire et Pousser l'Image

```bash
cd backend

# Se connecter à ECR
aws ecr get-login-password --region eu-west-1 | \
  docker login --username AWS --password-stdin $ECR_URI

# Construire l'image
docker build -t freeda-backend:latest .

# Tagger l'image
docker tag freeda-backend:latest $ECR_URI:latest

# Pousser l'image
docker push $ECR_URI:latest
```

---

## 🚢 Étape 3 : Déployer sur ECS Fargate

### 3.1 Préparer les Paramètres

Créer un fichier `parameters.json` :

```json
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "production"
  },
  {
    "ParameterKey": "VpcId",
    "ParameterValue": "vpc-xxxxxxxxx"
  },
  {
    "ParameterKey": "SubnetIds",
    "ParameterValue": "subnet-xxxxxxxx,subnet-yyyyyyyy"
  },
  {
    "ParameterKey": "MistralApiKey",
    "ParameterValue": "VOTRE_CLE_MISTRAL"
  },
  {
    "ParameterKey": "DynamoDBTableName",
    "ParameterValue": "freeda-tickets-production"
  },
  {
    "ParameterKey": "ContainerImage",
    "ParameterValue": "VOTRE_ECR_URI:latest"
  }
]
```

### 3.2 Déployer la Stack ECS

```bash
cd infrastructure

# Créer la stack ECS
aws cloudformation create-stack \
  --stack-name freeda-ecs-production \
  --template-body file://ecs-fargate.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_IAM \
  --region eu-west-1

# Attendre que la stack soit créée (peut prendre 10-15 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name freeda-ecs-production \
  --region eu-west-1

# Récupérer l'URL du Load Balancer
aws cloudformation describe-stacks \
  --stack-name freeda-ecs-production \
  --region eu-west-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text
```

---

## 🔄 Étape 4 : Migrer les Données (Optionnel)

Si vous avez des tickets existants en JSON :

```bash
cd backend

# Configurer les variables d'environnement
export AWS_REGION=eu-west-1
export DYNAMODB_TABLE_TICKETS=freeda-tickets-production

# Lancer la migration
python scripts/migrate_to_dynamodb.py
```

---

## ✅ Étape 5 : Vérifier le Déploiement

### 5.1 Tester l'API

```bash
# Récupérer l'URL du Load Balancer
ALB_URL=$(aws cloudformation describe-stacks \
  --stack-name freeda-ecs-production \
  --region eu-west-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text)

# Health check
curl http://$ALB_URL/health

# Créer un ticket de test
curl -X POST http://$ALB_URL/tickets \
  -H "Content-Type: application/json" \
  -d '{"initial_message": "Test de déploiement AWS"}'
```

### 5.2 Vérifier les Logs

```bash
# Lister les logs streams
aws logs describe-log-streams \
  --log-group-name /ecs/freeda-production \
  --region eu-west-1

# Voir les logs récents
aws logs tail /ecs/freeda-production --follow --region eu-west-1
```

### 5.3 Vérifier DynamoDB

```bash
# Compter les tickets
aws dynamodb scan \
  --table-name freeda-tickets-production \
  --select COUNT \
  --region eu-west-1
```

---

## 📊 Monitoring et Alertes

### CloudWatch Dashboards

Créer un dashboard pour surveiller :
- **CPU/Memory** du service ECS
- **Nombre de requêtes** sur l'ALB
- **Latence** des réponses
- **Erreurs** DynamoDB

```bash
# Voir les métriques ECS
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=freeda-service-production \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-01T23:59:59Z \
  --period 3600 \
  --statistics Average \
  --region eu-west-1
```

---

## 💰 Estimation des Coûts

Pour **10,000 tickets/mois** et **1,000 requêtes/jour** :

| Service | Coût Mensuel |
|---------|--------------|
| **ECS Fargate** (2 tâches 0.5vCPU, 1GB) | ~$30 |
| **DynamoDB** (On-demand) | ~$0.50 |
| **ALB** | ~$20 |
| **CloudWatch Logs** (5GB) | ~$2.50 |
| **Data Transfer** (10GB sortant) | ~$0.90 |
| **ECR** (1GB storage) | ~$0.10 |
| **TOTAL** | **~$54/mois** |

> 💡 **Optimisation** : Utiliser FARGATE_SPOT peut réduire les coûts de 70%

---

## 🔒 Sécurité

### Recommandations

1. **Restreindre CORS** dans les variables d'environnement
   ```yaml
   - Name: ALLOWED_ORIGINS
     Value: https://votre-dashboard.com
   ```

2. **Activer HTTPS** avec AWS Certificate Manager
   ```bash
   # Demander un certificat SSL
   aws acm request-certificate \
     --domain-name api.freeda.com \
     --validation-method DNS \
     --region eu-west-1
   ```

3. **Ajouter WAF** pour protection DDoS
   ```bash
   aws wafv2 create-web-acl \
     --name freeda-waf \
     --scope REGIONAL \
     --region eu-west-1
   ```

4. **Activer VPC Flow Logs** pour audit réseau

---

## 🔄 Mises à Jour

Pour déployer une nouvelle version :

```bash
# 1. Construire la nouvelle image
docker build -t freeda-backend:v2 .
docker tag freeda-backend:v2 $ECR_URI:v2
docker push $ECR_URI:v2

# 2. Mettre à jour la task definition
aws ecs update-service \
  --cluster freeda-cluster-production \
  --service freeda-service-production \
  --force-new-deployment \
  --region eu-west-1
```

---

## 🐛 Dépannage

### Service ne démarre pas

```bash
# Vérifier les logs
aws logs tail /ecs/freeda-production --follow --region eu-west-1

# Vérifier les événements du service
aws ecs describe-services \
  --cluster freeda-cluster-production \
  --services freeda-service-production \
  --region eu-west-1 \
  --query 'services[0].events[0:5]'
```

### Erreurs DynamoDB

```bash
# Vérifier les métriques
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --dimensions Name=TableName,Value=freeda-tickets-production \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region eu-west-1
```

---

## 📞 Support

Pour toute question :
- **Documentation AWS** : https://docs.aws.amazon.com/
- **Mistral AI** : https://docs.mistral.ai/

---

## 🎉 Félicitations !

Votre application Freeda est maintenant déployée sur AWS et prête pour la production ! 🚀
