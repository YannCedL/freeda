# Guide de migration vers DynamoDB

Ce guide explique comment migrer le stockage des tickets de JSON vers DynamoDB pour une scalabilité en production.

## Prérequis

1. **Compte AWS** avec accès à DynamoDB
2. **AWS CLI** configuré avec vos credentials
3. **boto3** installé : `pip install boto3`

---

## Étape 1 : Créer les tables DynamoDB

### Table principale : `freeda-tickets`

```bash
aws dynamodb create-table \
    --table-name freeda-tickets \
    --attribute-definitions \
        AttributeName=ticket_id,AttributeType=S \
        AttributeName=status,AttributeType=S \
        AttributeName=created_at,AttributeType=S \
        AttributeName=channel,AttributeType=S \
    --key-schema \
        AttributeName=ticket_id,KeyType=HASH \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"status-created_at-index\",
                \"KeySchema\": [
                    {\"AttributeName\":\"status\",\"KeyType\":\"HASH\"},
                    {\"AttributeName\":\"created_at\",\"KeyType\":\"RANGE\"}
                ],
                \"Projection\": {\"ProjectionType\":\"ALL\"},
                \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
            },
            {
                \"IndexName\": \"channel-created_at-index\",
                \"KeySchema\": [
                    {\"AttributeName\":\"channel\",\"KeyType\":\"HASH\"},
                    {\"AttributeName\":\"created_at\",\"KeyType\":\"RANGE\"}
                ],
                \"Projection\": {\"ProjectionType\":\"ALL\"},
                \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
            }
        ]" \
    --billing-mode PAY_PER_REQUEST \
    --region eu-west-1
```

**Note** : Utilisez `PAY_PER_REQUEST` pour commencer (pas de coûts fixes, paiement à l'usage).

---

## Étape 2 : Implémenter DynamoDBStorage

Le fichier `dynamodb_storage.py` contient déjà la structure. Voici l'implémentation complète :

```python
import boto3
from boto3.dynamodb.conditions import Key, Attr
from typing import List, Optional
from fastapi import HTTPException
from .storage_interface import TicketStorage

class DynamoDBStorage(TicketStorage):
    def __init__(self, table_name: str, region: str = "eu-west-1"):
        self.dynamodb = boto3.resource('dynamodb', region_name=region)
        self.table = self.dynamodb.Table(table_name)
    
    async def save_ticket(self, ticket: dict) -> None:
        self.table.put_item(Item=ticket)
    
    async def get_ticket(self, ticket_id: str) -> dict:
        response = self.table.get_item(Key={'ticket_id': ticket_id})
        if 'Item' not in response:
            raise HTTPException(status_code=404, detail="Ticket non trouvé")
        return response['Item']
    
    async def list_tickets(
        self,
        status: Optional[str] = None,
        channel: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> List[dict]:
        # Utiliser les index secondaires pour performance
        if status:
            response = self.table.query(
                IndexName='status-created_at-index',
                KeyConditionExpression=Key('status').eq(status)
            )
        elif channel:
            response = self.table.query(
                IndexName='channel-created_at-index',
                KeyConditionExpression=Key('channel').eq(channel)
            )
        else:
            response = self.table.scan()
        
        items = response.get('Items', [])
        
        # Filtrer par dates si nécessaire
        if date_from:
            items = [t for t in items if t.get('created_at', '') >= date_from]
        if date_to:
            items = [t for t in items if t.get('created_at', '') <= date_to]
        
        # Trier par date
        items.sort(key=lambda t: t.get('created_at', ''), reverse=True)
        return items
    
    async def update_ticket_status(
        self, ticket_id: str, status: str, closed_at: Optional[str] = None
    ) -> dict:
        update_expr = "SET #status = :status"
        expr_attr_names = {"#status": "status"}
        expr_attr_values = {":status": status}
        
        if closed_at:
            update_expr += ", closed_at = :closed_at"
            expr_attr_values[":closed_at"] = closed_at
        
        response = self.table.update_item(
            Key={'ticket_id': ticket_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_attr_names,
            ExpressionAttributeValues=expr_attr_values,
            ReturnValues="ALL_NEW"
        )
        
        return response['Attributes']
    
    async def ticket_exists(self, ticket_id: str) -> bool:
        response = self.table.get_item(Key={'ticket_id': ticket_id})
        return 'Item' in response
    
    async def close(self) -> None:
        pass  # Rien à faire pour boto3
```

---

## Étape 3 : Migrer les données JSON vers DynamoDB

Script de migration :

```python
import json
import boto3
from pathlib import Path

def migrate_json_to_dynamodb():
    # Charger les tickets JSON
    tickets_file = Path("backend/tickets.json")
    with open(tickets_file, 'r', encoding='utf-8') as f:
        tickets = json.load(f)
    
    # Connexion DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name='eu-west-1')
    table = dynamodb.Table('freeda-tickets')
    
    # Migrer chaque ticket
    for ticket_id, ticket in tickets.items():
        print(f"Migrating ticket {ticket_id}...")
        table.put_item(Item=ticket)
    
    print(f"Migration complete: {len(tickets)} tickets migrated")

if __name__ == "__main__":
    migrate_json_to_dynamodb()
```

Exécuter :
```bash
cd backend
python migrate_to_dynamodb.py
```

---

## Étape 4 : Configurer l'environnement

Mettre à jour `.env` :

```env
# Changer le type de storage
STORAGE_TYPE=dynamodb

# Configuration DynamoDB
AWS_REGION=eu-west-1
DYNAMODB_TABLE_TICKETS=freeda-tickets
```

---

## Étape 5 : Configurer les permissions IAM

Créer une policy IAM pour l'application :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:eu-west-1:*:table/freeda-tickets",
        "arn:aws:dynamodb:eu-west-1:*:table/freeda-tickets/index/*"
      ]
    }
  ]
}
```

---

## Étape 6 : Tester

1. **Redémarrer le backend** :
```bash
cd backend
uvicorn main:app --reload
```

2. **Vérifier le health endpoint** :
```bash
curl http://localhost:8000/health
```

3. **Créer un ticket de test** :
```bash
curl -X POST http://localhost:8000/tickets \
  -H "Content-Type: application/json" \
  -d '{"initial_message": "Test DynamoDB"}'
```

4. **Vérifier dans DynamoDB** :
```bash
aws dynamodb scan --table-name freeda-tickets --region eu-west-1
```

---

## Rollback (retour au JSON)

Si besoin de revenir au JSON :

1. Changer `.env` :
```env
STORAGE_TYPE=json
```

2. Redémarrer le backend

---

## Coûts estimés

### DynamoDB (Pay-per-request)
- **Lectures** : $0.25 par million de requêtes
- **Écritures** : $1.25 par million de requêtes
- **Stockage** : $0.25 par GB/mois

### Exemple pour 10,000 tickets/mois :
- Écritures : 10,000 × $1.25 / 1,000,000 = **$0.0125**
- Lectures : 50,000 × $0.25 / 1,000,000 = **$0.0125**
- Stockage (1 GB) : **$0.25**
- **Total : ~$0.28/mois**

---

## Optimisations

### 1. Utiliser DynamoDB Streams
Pour synchroniser avec d'autres services en temps réel.

### 2. Activer Point-in-Time Recovery
Pour backup automatique :
```bash
aws dynamodb update-continuous-backups \
    --table-name freeda-tickets \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

### 3. Monitoring avec CloudWatch
Activer les métriques détaillées pour surveiller les performances.

---

## Support

Pour toute question sur la migration, consultez :
- [Documentation DynamoDB](https://docs.aws.amazon.com/dynamodb/)
- [Boto3 Documentation](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)
