# Semaine 4 : Company Service

## Réalisations

### Backend

1. **Company Service complet** (déjà existant) :
   - CRUD du profil entreprise (création, lecture, mise à jour, suppression)
   - Validation des entreprises par les admins
   - Fichiers :
     - [company.service.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/backend/apps/company-service/src/company.service.ts)
     - [company.controller.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/backend/apps/company-service/src/company.controller.ts)
     - [postgres.service.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/backend/apps/company-service/src/postgres.service.ts)
     - [app.module.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/backend/apps/company-service/src/app.module.ts)

2. **API Gateway** :
   - Proxy pour les endpoints entreprises (/api/companies/*)
   - Fichier : [company-proxy.controller.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/backend/apps/api-gateway/src/company-proxy.controller.ts)

### Frontend

1. **Service entreprise** :
   - [company.models.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/frontend/src/app/core/company/company.models.ts)
   - [company.service.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/frontend/src/app/core/company/company.service.ts)

2. **Page profil entreprise** :
   - [company-profile.page.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/frontend/src/app/pages/company-profile.page.ts)
   - [company-profile.page.html](file:///c:/Users/kebai/OneDrive/Desktop/stage4/frontend/src/app/pages/company-profile.page.html)
   - [company-profile.page.scss](file:///c:/Users/kebai/OneDrive/Desktop/stage4/frontend/src/app/pages/company-profile.page.scss)

3. **Mise à jour du tableau de bord** :
   - Ajout de la logique pour les utilisateurs entreprises
   - [dashboard.page.html](file:///c:/Users/kebai/OneDrive/Desktop/stage4/frontend/src/app/pages/dashboard.page.html)
   - [dashboard.page.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/frontend/src/app/pages/dashboard.page.ts)
   - Ajout de la route /company/profile
   - [app.routes.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/frontend/src/app/app.routes.ts)

## Fonctionnalités

- Profil entreprise avec nom, adresse, site web, description, secteur d'activité
- Statut de validation (en attente / validé) affiché sur le profil
- Interface responsive avec Angular Material
- Gestion du profil entreprise via le dashboard admin
