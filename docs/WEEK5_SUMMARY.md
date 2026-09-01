# Semaine 5 - Gestion des Offres de Stage

## Fonctionnalités Implémentées

### Backend - Offer Service
- Création du service `offer-service` avec NestJS
- Implémentation des endpoints CRUD pour les offres de stage :
  - POST /offers : Créer une nouvelle offre
  - PUT /offers/:offerId : Mettre à jour une offre
  - GET /offers/company/:companyId : Récupérer les offres d'une entreprise
  - GET /offers/:offerId : Récupérer une offre par son ID
  - GET /offers : Récupérer toutes les offres
  - DELETE /offers/:offerId : Supprimer une offre
- Intégration avec PostgreSQL via `postgres.service.ts`

### API Gateway
- Ajout du proxy `offer-proxy.controller.ts` pour router les requêtes vers le service d'offres
- Mise à jour de `app.module.ts` pour inclure le nouveau proxy

### Frontend
- Création des modèles TypeScript pour les offres (`offer.models.ts`)
- Création du service Angular `offer.service.ts` pour les appels API
- Création des pages :
  - `offer-list.page.ts` : Liste toutes les offres de stage
  - `offer-create.page.ts` : Formulaire de création d'offres (pour entreprises)
  - `offer-detail.page.ts` : Affichage des détails d'une offre
- Mise à jour des routes (`app.routes.ts`)
- Ajout d'un lien vers les offres dans le tableau de bord

## Technologies Utilisées
- Backend : NestJS, PostgreSQL, pg
- Frontend : Angular, Angular Material, RxJS
- Architecture : Microservices avec API Gateway

## Points Clés
- Les entreprises doivent avoir un profil complété avant de publier des offres
- Le design utilise le même gradient bleu/violet que les autres pages pour une cohérence visuelle
- Les offres incluent des informations comme le titre, description, technologies, durée, type de stage, nombre de places et date limite
