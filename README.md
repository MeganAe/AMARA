# AMORA Backend — Node.js / Express + Neon Postgres + Vercel

Backend API REST fonctionnel pour la plateforme de dons **AMORA** (Fondation caritative en République Démocratique du Congo), développé avec **Node.js, Express, Neon Postgres serverless, et Drizzle ORM**, déployé sur **Vercel Serverless Functions**.

---

## 🚀 Architecture & Stack Technique

- **API Framework** : Node.js + Express
- **Base de données** : Neon Postgres (PostgreSQL Serverless) via `@neondatabase/serverless`
- **ORM & Migrations** : Drizzle ORM (`drizzle-orm` & `drizzle-kit`)
- **Authentification & Sécurité** : Sessions via cookie `httpOnly` JWT (`amara_token`) + Hachage de mot de passe `bcryptjs`
- **Rate-Limiting** : `express-rate-limit` sur les endpoints publics (`/api/donations`, `/api/volunteers`, `/api/contact`)
- **Déploiement cible** : Vercel Serverless (`api/index.js` + `vercel.json`)

---

## 🛠️ Configuration des Variables d'Environnement

Copiez le fichier exemple `.env.example` vers `.env` :

```bash
cp .env.example .env
```

Renseignez les variables dans `.env` (ou sur la console Vercel) :

```env
# URL de connexion Neon Postgres (avec Connection Pooling / SSL)
DATABASE_URL="postgresql://user:password@ep-example-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Clé secrète JWT pour la signature des cookies de session
JWT_SECRET="votre_cle_secrete_super_securisee_2026"

# Identifiants du tout premier compte Administrateur (utilisés lors du seed)
ADMIN_EMAIL="admin@amora.org"
ADMIN_PASSWORD="AdminPassword2026!"

# Port de développement local
PORT=3000
```

---

## 📦 Installation & Migration de la Base de Données

1. **Installer les dépendances** :
   ```bash
   npm install
   ```

2. **Créer les tables sur Neon Postgres** :
   ```bash
   npm run db:migrate
   ```

3. **Exécuter le script de Seed (Projets & Admin)** :
   ```bash
   npm run db:seed
   ```
   > *Le script d'initialisation crée les 6 projets officiels d'AMORA avec leurs montants de départ, le compte admin défini dans `.env`, des rapports d'exemple et les dons initiaux.*

---

## 💻 Exécution en Local

Lancez le serveur Express localement avec rechargement automatique :

```bash
npm run dev
```

Accédez à l'application web dans votre navigateur :
`http://localhost:3000`

---

## 🔐 Attribution du Rôle Administrateur

- **Création publique** : Toute inscription via `POST /api/auth/register` crée obligatoirement un compte donateur (`role = 'donor'`). Aucun utilisateur ne peut s'auto-attribuer le rôle admin via le front.
- **Compte Admin d'Origine** : Généré automatiquement lors de l'exécution de `npm run db:seed` avec les identifiants issus des variables `ADMIN_EMAIL` et `ADMIN_PASSWORD`.
- **Promotion d'Utilisateurs** : Un utilisateur administrateur connecté peut promouvoir un autre utilisateur grâce à l'endpoint sécurisé :
  `PATCH /api/users/:id/role` avec le corps `{ "role": "admin" }`.

---

## 🌐 Déploiement sur Vercel

1. Importez le projet dans votre tableau de bord Vercel.
2. Ajoutez les variables d'environnement dans **Settings > Environment Variables** :
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
3. Déployez ! Vercel utilisera automatiquement la configuration serverless `vercel.json` et routra toutes les requêtes `/api/*` vers la fonction Express `api/index.js`.

---

## 📌 Liste des Endpoints API REST

### Authentification & Profil
- `POST /api/auth/register` — Création de compte donateur + cookie JWT `httpOnly`
- `POST /api/auth/login` — Connexion + cookie JWT `httpOnly`
- `POST /api/auth/logout` — Déconnexion (suppression du cookie)
- `GET /api/auth/me` — Profil de l'utilisateur connecté

### Projets & Statistiques
- `GET /api/projects` — Liste des projets avec totaux `raisedAmount` et `donorCount` calculés en SQL
- `GET /api/projects/:slug` — Détails d'un projet spécifique par slug avec stats SQL
- `GET /api/stats/transparency` — Agrégations globales SQL (`SUM`, `COUNT`) et ventilation par secteur

### Dons & Reçus
- `POST /api/donations` *(Limité par IP)* — Créer un don (supporte les donateurs invités avec création de compte à la volée)
- `GET /api/donations/me` *(Authentifié)* — Liste des dons de l'utilisateur connecté
- `GET /api/donations` *(Admin)* — Liste de tous les dons enregistrés en base
- `GET /api/donations/export.csv` *(Admin)* — Exportation au format CSV de tous les dons

### Formulaires Publics & Rapports
- `POST /api/volunteers` *(Limité par IP)* — Formulaire de candidature bénévolat
- `POST /api/contact` *(Limité par IP)* — Formulaire de contact
- `GET /api/reports` — Rapports financiers et d'impact

### Administration Utilisateurs
- `PATCH /api/users/:id/role` *(Admin)* — Modification du rôle d'un utilisateur
