# 📘 API Documentation - Frontend ADMIN (Privé)

**Documentation pour le développeur du frontend admin**

Cette API est protégée par JWT. Toutes les requêtes doivent inclure un token d'authentification.

---

## 🔐 Authentification

### 1. Login

**Endpoint** : `POST /auth/login`

**Description** : Se connecter et obtenir un token JWT

**Request** :
```json
{
  "email": "agent@freeda.com",
  "password": "agent123"
}
```

**Response** :
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "email": "agent@freeda.com",
    "name": "Agent Support",
    "role": "agent"
  }
}
```

**Exemple d'utilisation (JavaScript)** :
```javascript
const login = async (email, password) => {
  const response = await fetch('http://backend-url/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (response.ok) {
    const data = await response.json();
    
    // Sauvegarder le token
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } else {
    throw new Error('Login failed');
  }
};
```

---

### 2. Vérifier la Session

**Endpoint** : `GET /auth/me`

**Headers** : 
```
Authorization: Bearer <token>
```

**Response** :
```json
{
  "email": "agent@freeda.com",
  "name": "Agent Support",
  "role": "agent"
}
```

**Exemple** :
```javascript
const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://backend-url/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    // Token expiré, rediriger vers login
    localStorage.removeItem('token');
    window.location.href = '/login';
    return null;
  }

  return response.json();
};
```

---

### 3. Logout

**Méthode côté frontend** :
```javascript
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};
```

---

## 🎫 Gestion des Tickets

### 1. Liste de Tous les Tickets

**Endpoint** : `GET /private/tickets/`

**Headers** : `Authorization: Bearer <token>`

**Query Params** (optionnels) :
- `status` : Filtrer par statut (nouveau, en cours, fermé)
- `channel` : Filtrer par canal (chat, phone, email, etc.)
- `assigned_to` : Filtrer par agent assigné
- `urgency` : Filtrer par urgence (haute, normale, basse)
- `limit` : Nombre maximum de tickets (défaut: 100)

**Response** :
```json
[
  {
    "ticket_id": "FRE-A1B2C3D4",
    "initial_message": "Mon wifi ne marche pas",
    "customer_name": "Jean Dupont",
    "channel": "chat",
    "status": "nouveau",
    "created_at": "2025-01-21T10:30:00Z",
    "messages": [...],
    "analytics": {
      "sentiment": "négatif",
      "urgency": "haute",
      "category": "technique"
    },
    "age_hours": 2.5,
    "message_count": 3,
    "assigned_to": null
  },
  ...
]
```

**Exemple** :
```javascript
const getAllTickets = async (filters = {}) => {
  const token = localStorage.getItem('token');
  
  // Construire les query params
  const params = new URLSearchParams(filters).toString();
  const url = `http://backend-url/private/tickets/?${params}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
};

// Utilisation
const nouveauxTickets = await getAllTickets({ status: 'nouveau' });
const ticketsUrgents = await getAllTickets({ urgency: 'haute' });
```

---

### 2. Détails d'un Ticket

**Endpoint** : `GET /private/tickets/{ticket_id}`

**Headers** : `Authorization: Bearer <token>`

**Response** :
```json
{
  "ticket_id": "FRE-A1B2C3D4",
  "initial_message": "Mon wifi ne marche pas",
  "customer_name": "Jean Dupont",
  "channel": "chat",
  "status": "nouveau",
  "created_at": "2025-01-21T10:30:00Z",
  "updated_at": "2025-01-21T12:15:00Z",
  "assigned_to": "agent@freeda.com",
  "messages": [
    {
      "message_id": "msg-1",
      "content": "Mon wifi ne marche pas",
      "author": "Jean Dupont",
      "timestamp": "2025-01-21T10:30:00Z",
      "type": "client"
    },
    {
      "message_id": "msg-2",
      "content": "Bonjour, pouvez-vous redémarrer votre box ?",
      "author": "Agent Support",
      "author_email": "agent@freeda.com",
      "timestamp": "2025-01-21T12:15:00Z",
      "type": "agent",
      "internal": false
    }
  ],
  "analytics": {
    "sentiment": "négatif",
    "urgency": "haute",
    "category": "technique",
    "keywords": ["wifi", "connexion", "problème"]
  }
}
```

**Exemple** :
```javascript
const getTicket = async (ticketId) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://backend-url/private/tickets/${ticketId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
};
```

---

### 3. Modifier un Ticket

**Endpoint** : `PATCH /private/tickets/{ticket_id}`

**Headers** : 
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request** :
```json
{
  "status": "en cours",
  "assigned_to": "agent@freeda.com",
  "priority": "haute",
  "notes": "Client rappelé, box redémarrée"
}
```

**Response** :
```json
{
  "ticket_id": "FRE-A1B2C3D4",
  "status": "en cours",
  "assigned_to": "agent@freeda.com",
  "updated_at": "2025-01-21T12:30:00Z",
  "updated_by": "agent@freeda.com"
}
```

**Exemple** :
```javascript
const updateTicket = async (ticketId, updates) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://backend-url/private/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  return response.json();
};

// Utilisation
await updateTicket('FRE-A1B2C3D4', {
  status: 'fermé',
  notes: 'Problème résolu'
});
```

---

### 4. Ajouter un Message (Agent)

**Endpoint** : `POST /private/tickets/{ticket_id}/messages`

**Headers** : 
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request** :
```json
{
  "content": "Bonjour, pouvez-vous redémarrer votre box ?",
  "internal": false
}
```

**Params** :
- `content` : Contenu du message
- `internal` : `true` pour note interne (non visible par le client), `false` pour message visible

**Response** :
```json
{
  "message": "Message ajouté avec succès",
  "message_id": "msg-12345",
  "ticket_status_updated": true
}
```

**Exemple** :
```javascript
const addAgentMessage = async (ticketId, content, isInternal = false) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    `http://backend-url/private/tickets/${ticketId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content,
        internal: isInternal
      })
    }
  );

  return response.json();
};

// Message visible par le client
await addAgentMessage('FRE-A1B2C3D4', 'Bonjour, je peux vous aider ?', false);

// Note interne (non visible)
await addAgentMessage('FRE-A1B2C3D4', 'Client déjà rappelé 2 fois', true);
```

---

### 5. Assigner un Ticket

**Endpoint** : `POST /private/tickets/{ticket_id}/assign`

**Headers** : 
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request** :
```json
{
  "agent_email": "agent@freeda.com"
}
```

**Response** :
```json
{
  "message": "Ticket assigné à agent@freeda.com",
  "ticket_id": "FRE-A1B2C3D4",
  "assigned_to": "agent@freeda.com"
}
```

**Exemple** :
```javascript
const assignTicket = async (ticketId, agentEmail) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    `http://backend-url/private/tickets/${ticketId}/assign`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_email: agentEmail
      })
    }
  );

  return response.json();
};
```

---

### 6. Supprimer un Ticket (Admin uniquement)

**Endpoint** : `DELETE /private/tickets/{ticket_id}`

**Headers** : `Authorization: Bearer <token>`

**Permissions** : Admin uniquement

**Response** :
```json
{
  "message": "Ticket supprimé avec succès",
  "ticket_id": "FRE-A1B2C3D4",
  "deleted_by": "admin@freeda.com",
  "deleted_at": "2025-01-21T14:00:00Z"
}
```

**Exemple** :
```javascript
const deleteTicket = async (ticketId) => {
  const token = localStorage.getItem('token');
  
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce ticket ?')) {
    return;
  }
  
  const response = await fetch(`http://backend-url/private/tickets/${ticketId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
};
```

---

### 7. Historique du Ticket

**Endpoint** : `GET /private/tickets/{ticket_id}/history`

**Headers** : `Authorization: Bearer <token>`

**Response** :
```json
[
  {
    "type": "created",
    "timestamp": "2025-01-21T10:30:00Z",
    "description": "Ticket créé par Jean Dupont",
    "data": {
      "channel": "chat",
      "initial_message": "Mon wifi ne marche pas"
    }
  },
  {
    "type": "assigned",
    "timestamp": "2025-01-21T12:00:00Z",
    "description": "Assigné à agent@freeda.com",
    "data": {
      "assigned_by": "manager@freeda.com"
    }
  },
  {
    "type": "message",
    "timestamp": "2025-01-21T12:15:00Z",
    "description": "Message de Agent Support",
    "data": {
      "content": "Bonjour, pouvez-vous redémarrer votre box ?",
      "type": "agent",
      "internal": false
    }
  },
  {
    "type": "closed",
    "timestamp": "2025-01-21T14:00:00Z",
    "description": "Fermé par agent@freeda.com",
    "data": {
      "resolution_time": 12600
    }
  }
]
```

---

## 🔒 Gestion des Erreurs

### Codes HTTP

| Code | Description |
|------|-------------|
| `200` | Succès |
| `201` | Créé |
| `400` | Requête invalide |
| `401` | Non authentifié (token manquant/invalide) |
| `403` | Non autorisé (permissions insuffisantes) |
| `404` | Ressource non trouvée |
| `500` | Erreur serveur |

### Gestion des Erreurs 401 (Token Expiré)

**Recommandation** : Intercepter les erreurs 401 et rediriger vers le login

```javascript
// apiClient.js
class ApiClient {
  async request(url, options = {}) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    // Si 401, rediriger vers login
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expirée');
    }

    return response.json();
  }

  get(url) {
    return this.request(url, { method: 'GET' });
  }

  post(url, data) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  patch(url, data) {
    return this.request(url, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  delete(url) {
    return this.request(url, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
```

**Utilisation** :
```javascript
import { api } from './apiClient';

const tickets = await api.get('/private/tickets');
const ticket = await api.get('/private/tickets/FRE-A1B2C3D4');
await api.patch('/private/tickets/FRE-A1B2C3D4', { status: 'fermé' });
```

---

## 📊 Rôles et Permissions

| Endpoint | Agent | Manager | Admin |
|----------|:-----:|:-------:|:-----:|
| `GET /private/tickets/` | ✅ | ✅ | ✅ |
| `GET /private/tickets/{id}` | ✅ | ✅ | ✅ |
| `PATCH /private/tickets/{id}` | ✅ | ✅ | ✅ |
| `POST /private/tickets/{id}/messages` | ✅ | ✅ | ✅ |
| `POST /private/tickets/{id}/assign` | ❌ | ✅ | ✅ |
| `DELETE /private/tickets/{id}` | ❌ | ❌ | ✅ |

---

## 🎯 Comptes de Test

| Email | Password | Rôle |
|-------|----------|------|
| `agent@freeda.com` | `agent123` | Agent |
| `manager@freeda.com` | `manager123` | Manager |
| `admin@freeda.com` | `admin123` | Admin |

**⚠️ IMPORTANT** : Changez ces mots de passe en production !

---

## 🚀 URL de l'API

**Development** : `http://localhost:8000`  
**Production** : `http://backend-url.elb.amazonaws.com` (ou votre URL)

---

## 📞 Contact

Pour toute question sur l'intégration de l'API :
- Vérifiez d'abord cette documentation
- Testez avec les endpoints publics (plus simple)
- Utilisez les comptes de test ci-dessus

**Bonne intégration ! 🎯**
