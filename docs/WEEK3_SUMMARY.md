# Semaine 3 : Student Service

## Réalisations

### Backend

1. **Student Service complet** :
   - CRUD du profil étudiant (création, lecture, mise à jour, suppression)
   - Gestion du CV (upload, lecture, suppression)
   - Fichiers :
     - [student.service.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/backend/apps/student-service/src/student.service.ts)
     - [student.controller.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/backend/apps/student-service/src/student.controller.ts)
     - [postgres.service.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/backend/apps/student-service/src/postgres.service.ts)
     - [app.module.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/backend/apps/student-service/src/app.module.ts)

2. **API Gateway** :
   - Proxy pour les endpoints étudiants (/api/students/*)
   - Fichier : [student-proxy.controller.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/backend/apps/api-gateway/src/student-proxy.controller.ts)

### Frontend

1. **Service étudiant** :
   - [student.models.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/frontend/src/app/core/student/student.models.ts)
   - [student.service.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/frontend/src/app/core/student/student.service.ts)

2. **Page profil étudiant** :
   - [student-profile.page.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/frontend/src/app/pages/student-profile.page.ts)
   - [student-profile.page.html](file:///c:/Users/kebai/OneDrive/Desktop/stage4/frontend/src/app/pages/student-profile.page.html)
   - [student-profile.page.scss](file:///c:/Users/kebai/OneDrive/Desktop/stage4/frontend/src/app/pages/student-profile.page.scss)

3. **Mise à jour du tableau de bord** :
   - Ajout d'un lien vers la page profil étudiant
   - [dashboard.page.html](file:///c:/Users/kebai/OneDrive/Desktop/stage4/frontend/src/app/pages/dashboard.page.html)
   - [dashboard.page.ts](file:///c:/Users/kebai/OneDrive/Desktop/stage4/frontend/src/app/pages/dashboard.page.ts)
   - [dashboard.page.scss](file:///c:/Users/kebai/OneDrive/Desktop/stage4/frontend/src/app/pages/dashboard.page.scss)

## Fonctionnalités

- Profil étudiant avec prénom, nom, téléphone, LinkedIn, GitHub, compétences
- Gestion de CV (upload, affichage, suppression)
- Interface responsive avec Angular Material
