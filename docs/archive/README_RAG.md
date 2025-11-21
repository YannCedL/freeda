# 🧠 Système RAG (Retrieval-Augmented Generation) pour Freeda

Ce module permet d'enrichir les réponses de l'assistant Freeda en utilisant une base de connaissances locale (FAQ Free).

## 🚀 Fonctionnalités

- **Scraping automatique** de la FAQ publique de Free
- **Génération de données synthétiques** pour compléter les manques
- **Vectorisation** des documents avec Mistral Embed
- **Recherche sémantique** avec ChromaDB (local)
- **Injection de contexte** dans les prompts Mistral

## 🛠️ Installation

1. Installer les dépendances :
```bash
pip install chromadb beautifulsoup4
```

2. Configurer `.env` :
```env
ENABLE_RAG=true
MISTRAL_API_KEY=votre_clé_api
```

## 📚 Initialisation de la base de connaissances

Avant d'utiliser le RAG, vous devez initialiser la base de connaissances :

```bash
python backend/init_knowledge_base.py
```

Ce script va :
1. Scraper `free.fr/assistance`
2. Générer des questions/réponses synthétiques
3. Créer les embeddings via l'API Mistral
4. Stocker le tout dans `./chroma_db`

## 🔄 Mise à jour

Pour mettre à jour la base de connaissances (par exemple si la FAQ Free change), relancez simplement le script d'initialisation :

```bash
python backend/init_knowledge_base.py --reset
```

## 🔍 Comment ça marche ?

1. L'utilisateur pose une question (ex: "Ma box clignote rouge")
2. Le système cherche les 3 documents les plus pertinents dans ChromaDB
3. Ces documents sont ajoutés au prompt système ("Voici des informations contextuelles...")
4. Mistral utilise ces informations pour générer une réponse précise

## 💰 Coûts

- **Stockage (ChromaDB)** : Gratuit (local)
- **Embeddings (Mistral)** : ~$0.10 pour l'initialisation (une seule fois)
- **Requêtes (Mistral)** : Réduit les coûts car les conversations sont plus courtes et efficaces (moins d'allers-retours)

## 🐛 Dépannage

Si vous avez des erreurs `ModuleNotFoundError`, assurez-vous d'avoir activé votre environnement virtuel :

```powershell
.\venv\Scripts\Activate.ps1
```
