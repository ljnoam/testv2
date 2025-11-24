# MyFinance Tracker

Une application de gestion financière personnelle sécurisée, construite avec React et Firebase.

## 🚀 Déploiement sur Vercel

Ce projet est optimisé pour être déployé sur [Vercel](https://vercel.com).

1. **Forkez/Clonez** ce dépôt sur votre GitHub.
2. Créez un nouveau projet sur **Vercel** et importez votre dépôt.
3. Dans la configuration du projet sur Vercel, allez dans **Environment Variables**.
4. Ajoutez les variables suivantes (trouvées dans votre Console Firebase > Project Settings).
   **Important :** Utilisez le préfixe `VITE_` pour que l'application fonctionne correctement.

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Votre clé API Web |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domaine Auth (ex: projet.firebaseapp.com) |
| `VITE_FIREBASE_PROJECT_ID` | ID du projet |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID expéditeur (numérique) |
| `VITE_FIREBASE_APP_ID` | ID de l'application (1:...) |
| `VITE_FIREBASE_MEASUREMENT_ID` | ID Analytics (G-...) |

5. Une fois les variables ajoutées, **Redéployez** le projet (onglet Deployments > Redeploy) pour qu'elles soient prises en compte.

## 🛠️ Installation Locale

1. Clonez le projet :
   ```bash
   git clone <url-du-repo>
   cd myfinance-tracker
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Créez un fichier `.env.local` à la racine (utilisez `.env.example` comme modèle) et remplissez vos clés Firebase avec le préfixe `VITE_`.

4. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

## ✨ Fonctionnalités

- **Authentification** : Email/Mot de passe via Firebase Auth.
- **Base de données** : Firestore temps réel sécurisé.
- **Zéro Stockage** : Les avatars sont générés via DiceBear, aucun Firebase Storage requis.
- **PWA** : Installable sur mobile.
- **Dark Mode** : Support natif thème clair/sombre.