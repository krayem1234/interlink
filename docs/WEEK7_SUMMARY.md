# Semaine 7 - IA, conventions et documents

- Analyse CV locale avec extraction des compétences et coordonnées (`POST /api/week7/analyze-cv`).
- Matching CV/offre avec score de compatibilité et compétences manquantes (`POST /api/week7/match`).
- Génération d'une convention de stage PDF téléchargeable (`POST /api/week7/convention`).
- Évaluation de fin de stage avec moyenne et décision (`POST /api/week7/evaluation`).
- Page frontend dédiée : `/week7`, accessible depuis « IA & documents ».
- Les pièces jointes de messagerie (semaine 6) sont stockées dans PostgreSQL et prévisualisables/téléchargeables.

Le mode local d'analyse fonctionne sans clé externe. Si `GEMINI_API_KEY` est configurée, la réponse indique le fournisseur Gemini pour permettre son branchement ultérieur.
