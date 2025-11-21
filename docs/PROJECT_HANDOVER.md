# Documentation Technique & Handover - Projet Freeda

Ce document sert de référence technique complète pour le projet **Freeda**, un assistant de support client intelligent pour Free. Il est destiné aux développeurs intervenant sur le code afin de garantir la cohérence et la stabilité du projet.

---

## 1. Vue d'ensemble
Freeda est une application fullstack composée d'un **Chatbot Client** (Frontend) et d'un **Backend API** intelligent.
- **Objectif** : Automatiser le support niveau 1, analyser le sentiment client en temps réel, et assister les agents humains.
- **Particularité** : Architecture hybride (WebSocket + REST) avec une couche d'abstraction pour le stockage (JSON local / DynamoDB).

---

## 2. Stack Technique (A à Z)

### Frontend (`/src`)
- **Framework** : React 18 (avec TypeScript).
- **Build Tool** : Vite.
- **Styling** : TailwindCSS (Utility-first).
- **Icônes** : Lucide React.
- **Communication** : 
  - `fetch` pour les requêtes REST (POST, PATCH).
  - `WebSocket` natif pour le temps réel (messages, statuts).

### Backend (`/backend`)
- **Langage** : Python 3.9+.
- **Framework API** : FastAPI (Asynchrone).
- **Serveur** : Uvicorn.
- **IA & NLP** : 
  - **Mistral AI** (via API) pour la génération de réponses et l'analyse de sentiment.
  - Prompt Engineering avancé pour le contexte "Support Free".
- **Authentification** : JWT (JSON Web Tokens) + Passlib (Bcrypt) pour l'accès admin (`/private`).

### Stockage de Données
- **Développement** : Fichier local `backend/data/tickets.json` (implémentation `JSONStorage`).
- **Production (Prévu)** : AWS DynamoDB (implémentation `DynamoDBStorage`).
- **Abstraction** : Interface `TicketStorage` (Pattern Strategy) permettant de changer de stockage via la variable d'env `STORAGE_TYPE`.

---

## 3. Installation & Démarrage Rapide (Après `git clone`)

Si vous récupérez le projet depuis Git, suivez ces étapes pour le faire fonctionner localement.

### Prérequis
- **Python 3.9+**
- **Node.js 18+**
- Une clé API **Mistral AI** (pour l'intelligence du chat).

### 1. Configuration du Backend
```bash
cd backend

# 1. Créer un environnement virtuel
python -m venv venv

# 2. Activer l'environnement
# Windows :
.\venv\Scripts\Activate
# Mac/Linux :
source venv/bin/activate

# 3. Installer les dépendances
pip install -r requirements.txt

# 4. Configurer les variables d'environnement
cp .env.example .env
# ⚠️ OUVREZ .env ET AJOUTEZ VOTRE MISTRAL_API_KEY !
```

### 2. Configuration du Frontend
Revenez à la racine du projet :
```bash
cd ..
npm install
```

### 3. Lancer le Projet (Développement)
Il faut deux terminaux :

**Terminal 1 - Backend :**
```bash
# Depuis la racine
uvicorn backend.main:app --reload
# Le serveur démarrera sur http://localhost:8000
```

**Terminal 2 - Frontend :**
```bash
# Depuis la racine
npm run dev
# Le client sera accessible sur http://localhost:3000
```

---

## 4. Architecture du Code

### Structure Backend
```
backend/
├── app/
│   ├── core/           # Config, Sécurité, Container d'injection
│   ├── models/         # Schémas Pydantic (Validation)
│   ├── routers/        # Endpoints API
│   │   ├── public/     # Accessible par le client (Chatbot)
│   │   └── private/    # Accessible par l'admin (Dashboard)
│   ├── services/       # Logique métier
│   │   ├── ai/         # Mistral Client, Analytics, Smart Reply
│   │   └── storage/    # Interface et implémentations (JSON/DynamoDB)
│   └── main.py         # Point d'entrée, Config CORS, WebSocket Manager
```

### Points Critiques de l'Architecture
1.  **Séparation Public/Privé** : Les routes `/public` ne demandent pas d'auth mais sont limitées (Rate Limiting). Les routes `/private` sont protégées par JWT.
2.  **Service Container** : Les services (Storage, AI) sont initialisés dans `main.py` et injectés. Ne jamais instancier `JSONStorage` directement dans les routes, utiliser `services.storage`.
3.  **Gestion des Imports** : Utilisation de "Lazy Imports" dans `services/storage/interface.py` pour éviter les dépendances circulaires.

---

## 4. Fonctionnalités Clés & Implémentation

### Chat Temps Réel
- **Flux** : Le client envoie un message via REST (`POST`). Le backend traite, sauvegarde, et diffuse le message via WebSocket (`manager.broadcast`).
- **Optimistic UI** : Le frontend affiche le message de l'utilisateur *immédiatement* sans attendre le serveur.
- **Déduplication** : Le frontend possède une logique pour fusionner le message "optimiste" avec le message confirmé par le WebSocket (basé sur le contenu et le timestamp < 10s).

### Analyse & Smart Reply
- Chaque message utilisateur déclenche une analyse asynchrone (Sentiment, Urgence, Churn Risk).
- Si le sentiment est négatif ou l'urgence haute, le ticket est flaggé.
- L'IA génère une réponse contextuelle basée sur l'historique de la conversation (RAG léger via le prompt système).

---

## 5. Stratégie de Déploiement (Roadmap)

### Conteneurisation
- Un `Dockerfile` doit être utilisé pour packager le backend.
- Le frontend doit être buildé (`npm run build`) et servi soit par Nginx, soit comme fichiers statiques via FastAPI (moins recommandé pour la charge), soit sur un CDN (Vercel/Netlify/S3).

### Scripts de Déploiement Automatisé
Le projet contient des scripts "clé en main" pour déployer sur AWS :
- **Windows** : `deploy-all.ps1` (Recommandé)
- **Linux/Mac** : `deploy-all.sh`

Ces scripts gèrent :
1.  La création de l'infrastructure (DynamoDB, ECS, S3, CloudFront) via CloudFormation.
2.  Le build et push Docker.
3.  Le déploiement du Frontend.

Usage : `.\deploy-all.ps1 -Environment production`

### Infrastructure Cible (AWS)
1.  **Compute** : AWS App Runner ou ECS (Elastic Container Service) pour le backend Python.
2.  **Database** : DynamoDB (Table `Tickets`).
    - Partition Key : `ticket_id`.
    - GSI (Global Secondary Indexes) pour les requêtes par `status` ou `date`.
3.  **Environment** :
    - `STORAGE_TYPE=dynamodb`
    - `AWS_REGION=eu-west-3` (Paris)
    - `MISTRAL_API_KEY` (Injecté via Secrets Manager)

### Étapes de Migration
1.  Configurer les credentials AWS (IAM User avec droits DynamoDB).
2.  Créer la table DynamoDB.
3.  Changer `STORAGE_TYPE` dans `.env`.
4.  Tester la connectivité.

---

## 6. Guide de Maintenance pour Développeurs

⚠️ **RÈGLES D'OR À RESPECTER IMPÉRATIVEMENT** ⚠️

1.  **Ne jamais casser l'interface `TicketStorage`** :
    - Si vous ajoutez une méthode dans `JSONStorage`, vous **DEVEZ** l'ajouter dans `TicketStorage` (interface) ET dans `DynamoDBStorage` (même si c'est un `pass` temporaire).
    - L'erreur classique est `AttributeError: 'JSONStorage' object has no attribute '...'`.

2.  **Attention aux Race Conditions (Écrasement de données)** :
    - Dans le backend, lors de l'ajout d'un message + analyse IA :
    - **NE PAS** faire : `save(ticket)` -> `analyse` -> `save(ticket_avec_analyse)`. Si un message arrive entre temps, il est perdu.
    - **FAIRE** : Modifier l'objet ticket en mémoire, tout préparer, et faire un seul `save(ticket)` final.

3.  **Frontend Optimistic UI** :
    - Si vous touchez à `ChatBot.tsx`, rappelez-vous que les messages s'affichent deux fois (local + websocket). La logique de déduplication (lignes ~100) est CRITIQUE. Ne la supprimez pas.

4.  **URLs API** :
    - Toujours utiliser `/public/...` pour le ChatBot.
    - Toujours utiliser `/private/...` pour le Dashboard Admin.

5.  **Gestion des Erreurs** :
    - Le backend ne doit jamais crasher (500). Utilisez des blocs `try/except` autour des appels IA (Mistral) et Analytics, car ce sont des services externes faillibles. Le chat doit continuer de fonctionner même si l'IA est down.

### Tests
Des tests unitaires et d'intégration sont disponibles dans `backend/tests`.
Pour les lancer :
```bash
cd backend
pytest
```
Assurez-vous que l'environnement virtuel est activé et les dépendances installées.

---
