# 🚀 Déploiement Rapide - Freeda Backend sur AWS

## ⚡ Quick Start (5 minutes)

### Prérequis
```bash
# Installer AWS CLI
# Windows: https://aws.amazon.com/cli/
# Mac: brew install awscli
# Linux: sudo apt install awscli

# Configurer AWS
aws configure
# Entrer: Access Key, Secret Key, Region (eu-west-1), Output (json)
```

### Étape 1 : Créer la Table DynamoDB
```bash
cd backend/infrastructure

aws cloudformation create-stack \
  --stack-name freeda-dynamodb-production \
  --template-body file://dynamodb-table.yaml \
  --parameters ParameterKey=Environment,ParameterValue=production \
  --region eu-west-1

# Attendre 2-3 minutes
aws cloudformation wait stack-create-complete \
  --stack-name freeda-dynamodb-production \
  --region eu-west-1
```

### Étape 2 : Construire et Pousser l'Image Docker
```bash
cd ..

# Créer le repository ECR
aws ecr create-repository \
  --repository-name freeda-backend \
  --region eu-west-1

# Récupérer l'URI
ECR_URI=$(aws ecr describe-repositories \
  --repository-names freeda-backend \
  --region eu-west-1 \
  --query 'repositories[0].repositoryUri' \
  --output text)

# Login Docker
aws ecr get-login-password --region eu-west-1 | \
  docker login --username AWS --password-stdin $ECR_URI

# Build & Push
docker build -t freeda-backend:latest .
docker tag freeda-backend:latest $ECR_URI:latest
docker push $ECR_URI:latest

echo "✅ Image pushed to: $ECR_URI:latest"
```

### Étape 3 : Déployer sur ECS Fargate
```bash
cd infrastructure

# Créer parameters.json avec vos valeurs
cat > parameters.json << EOF
[
  {"ParameterKey": "Environment", "ParameterValue": "production"},
  {"ParameterKey": "VpcId", "ParameterValue": "vpc-XXXXXXXX"},
  {"ParameterKey": "SubnetIds", "ParameterValue": "subnet-XXXXX,subnet-YYYYY"},
  {"ParameterKey": "MistralApiKey", "ParameterValue": "VOTRE_CLE_MISTRAL"},
  {"ParameterKey": "DynamoDBTableName", "ParameterValue": "freeda-tickets-production"},
  {"ParameterKey": "ContainerImage", "ParameterValue": "$ECR_URI:latest"}
]
EOF

# Déployer
aws cloudformation create-stack \
  --stack-name freeda-ecs-production \
  --template-body file://ecs-fargate.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_IAM \
  --region eu-west-1

# Attendre 10-15 minutes
aws cloudformation wait stack-create-complete \
  --stack-name freeda-ecs-production \
  --region eu-west-1
```

### Étape 4 : Récupérer l'URL et Tester
```bash
# Récupérer l'URL du Load Balancer
ALB_URL=$(aws cloudformation describe-stacks \
  --stack-name freeda-ecs-production \
  --region eu-west-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text)

echo "🎉 Application déployée sur: http://$ALB_URL"

# Tester
curl http://$ALB_URL/health
curl http://$ALB_URL/health/ready
```

---

## 📊 Vérifier le Déploiement

```bash
# Voir les logs
aws logs tail /ecs/freeda-production --follow --region eu-west-1

# Voir les services ECS
aws ecs describe-services \
  --cluster freeda-cluster-production \
  --services freeda-service-production \
  --region eu-west-1

# Compter les tickets dans DynamoDB
aws dynamodb scan \
  --table-name freeda-tickets-production \
  --select COUNT \
  --region eu-west-1
```

---

## 🔄 Mettre à Jour l'Application

```bash
# 1. Modifier le code
# 2. Rebuild & push
docker build -t freeda-backend:v2 .
docker tag freeda-backend:v2 $ECR_URI:v2
docker push $ECR_URI:v2

# 3. Update service (rolling update)
aws ecs update-service \
  --cluster freeda-cluster-production \
  --service freeda-service-production \
  --force-new-deployment \
  --region eu-west-1
```

---

## 🗑️ Supprimer Tout (Cleanup)

```bash
# Supprimer ECS
aws cloudformation delete-stack \
  --stack-name freeda-ecs-production \
  --region eu-west-1

# Supprimer DynamoDB
aws cloudformation delete-stack \
  --stack-name freeda-dynamodb-production \
  --region eu-west-1

# Supprimer ECR
aws ecr delete-repository \
  --repository-name freeda-backend \
  --force \
  --region eu-west-1
```

---

## 📚 Documentation Complète

- **Guide de déploiement détaillé** : `docs/AWS_DEPLOYMENT.md`
- **Résumé des améliorations** : `../PRODUCTION_READY.md`
- **Architecture** : Voir diagrammes dans les docs

---

## 💰 Coûts

~$54/mois pour 10,000 tickets/mois
~$25/mois avec optimisations (FARGATE_SPOT)

---

## 🆘 Aide

**Problème de VPC/Subnet ?**
```bash
# Lister vos VPCs
aws ec2 describe-vpcs --region eu-west-1

# Lister vos subnets
aws ec2 describe-subnets --region eu-west-1
```

**Erreur de permissions ?**
```bash
# Vérifier vos credentials
aws sts get-caller-identity
```

**Service ne démarre pas ?**
```bash
# Voir les logs d'erreur
aws logs tail /ecs/freeda-production --follow --region eu-west-1
```
