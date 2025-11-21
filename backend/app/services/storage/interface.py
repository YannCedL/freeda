"""
Interface abstraite pour le stockage des tickets.
Permet de basculer facilement entre JSON et DynamoDB.
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional


class TicketStorage(ABC):
    """Interface abstraite pour le stockage des tickets."""

    @abstractmethod
    async def save_ticket(self, ticket: dict) -> None:
        """Sauvegarder un ticket."""
        pass

    @abstractmethod
    async def get_ticket(self, ticket_id: str) -> dict:
        """Récupérer un ticket par son ID."""
        pass

    @abstractmethod
    async def list_tickets(
        self,
        status: Optional[str] = None,
        channel: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> List[dict]:
        """Lister les tickets avec filtres optionnels."""
        pass

    @abstractmethod
    async def update_ticket_status(
        self, ticket_id: str, status: str, closed_at: Optional[str] = None
    ) -> dict:
        """Mettre à jour le statut d'un ticket."""
        pass

    @abstractmethod
    async def ticket_exists(self, ticket_id: str) -> bool:
        """Vérifier si un ticket existe."""
        pass

    @abstractmethod
    async def close(self) -> None:
        """Fermer les connexions et libérer les ressources."""
        pass
