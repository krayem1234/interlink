# Semaine 6 - Messagerie et notifications

## Fonctionnalités livrées

- Service de messagerie persistant avec PostgreSQL.
- Conversations liées à une candidature entre étudiant et entreprise.
- Contrôle des participants : seuls l'étudiant candidat et l'entreprise de l'offre peuvent lire ou envoyer des messages.
- Création automatique d'une notification lorsqu'un message est envoyé.
- Service de notifications : liste, lecture individuelle et marquage global comme lu.
- Routes API Gateway : `/api/messages` et `/api/notifications`.
- Page frontend de conversation accessible depuis « Mes candidatures ».
- Bouton « Écrire à l'entreprise » sur chaque candidature étudiant.

## Vérification

- Build backend : OK.
- Build frontend : OK.
- Reconstruction Docker à relancer lorsque Docker Desktop est démarré :

```powershell
docker compose up -d --build api-gateway messaging-service notification-service
```
