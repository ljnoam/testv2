# MyFinance Tracker

Une application de gestion financière personnelle sécurisée, construite avec React et Firebase.

## 🚀 Déploiement sur Vercel

Ce projet est optimisé pour être déployé sur [Vercel](https://vercel.com).

1. **Forkez/Clonez** ce dépôt sur votre GitHub.
2. Créez un nouveau projet sur **Vercel** et importez votre dépôt.
3. Dans la configuration du projet sur Vercel, allez dans **Environment Variables**.
4. Ajoutez les variables suivantes (trouvées dans votre Console Firebase > Project Settings) :

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Votre clé API Web |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Domaine Auth (ex: projet.firebaseapp.com) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID du projet |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ID expéditeur (numérique) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ID de l'application (1:...) |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | ID Analytics (G-...) |

> **⚠️ Important** : Si vous rencontrez une erreur `auth/invalid-api-key` ou un écran blanc, vérifiez que ces variables sont bien définies dans Vercel et que vous avez redéployé le projet après les avoir ajoutées.

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

3. Créez un fichier `.env.local` à la racine (utilisez `.env.example` comme modèle) et remplissez vos clés Firebase.

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
