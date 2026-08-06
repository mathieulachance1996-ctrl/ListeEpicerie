# ÉpicerieList

Plateforme de gestion de listes d'épicerie avec authentification, export PDF et historique complet.

## Fonctionnalités

- **Authentification** — Inscription et connexion par email/mot de passe (NextAuth.js + bcrypt)
- **Listes d'épicerie** — Créer, éditer et supprimer des listes avec articles, quantités et catégories
- **Cocher en magasin** — Marquer les articles au fur et à mesure des courses
- **Export PDF** — PDF professionnel groupé par catégorie
- **Historique** — Consulter, rouvrir, dupliquer ou ré-exporter toutes les listes passées
- **Suggestions de repas** — Recettes québécoises (Ricardo Cuisine) selon les articles de la liste
- **Mobile-friendly** — Interface responsive optimisée pour le téléphone

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Base de données | PostgreSQL via [Neon](https://neon.tech) |
| ORM | Prisma |
| Authentification | NextAuth.js v5 (Auth.js) — Credentials |
| PDF | @react-pdf/renderer |
| Recettes | [Ricardo Cuisine](https://www.ricardocuisine.com) (recettes québécoises) |
| UI | Tailwind CSS + shadcn/ui |

## Prérequis

- Node.js 18+
- Compte [Neon](https://neon.tech) (gratuit)
- Compte [Vercel](https://vercel.com) (gratuit)

## Installation locale

### 1. Cloner et installer

```bash
git clone <votre-repo>
cd grocery-list-app
npm install
```

### 2. Configurer Neon

1. Créez un projet sur [console.neon.tech](https://console.neon.tech)
2. Copiez la connection string PostgreSQL (format `postgresql://...?sslmode=require`)

### 3. Variables d'environnement

```bash
cp .env.example .env
```

Remplissez `.env` :

```env
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
AUTH_SECRET="générez avec: openssl rand -base64 32"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

Les **suggestions de repas** utilisent [Ricardo Cuisine](https://www.ricardocuisine.com) (recettes québécoises). **Aucune clé API supplémentaire** n'est requise.

### 4. Initialiser la base de données

```bash
npx prisma migrate deploy
# ou en dev :
npx prisma db push
```

### 5. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Déploiement sur Vercel

### 1. Pousser le code sur GitHub

```bash
git init
git add .
git commit -m "Initial commit — ÉpicerieList"
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

### 2. Importer sur Vercel

1. Allez sur [vercel.com/new](https://vercel.com/new)
2. Importez votre dépôt GitHub
3. Vercel détecte automatiquement Next.js — laissez les paramètres par défaut

### 3. Variables d'environnement Vercel

Dans **Settings → Environment Variables**, ajoutez :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | Connection string Neon (Production) |
| `AUTH_SECRET` | Secret aléatoire (`openssl rand -base64 32`) |
| `AUTH_URL` | URL Vercel (ex: `https://votre-app.vercel.app`) |
| `NEXTAUTH_URL` | Même URL Vercel |

### 4. Connecter Neon à Vercel (recommandé)

1. Dans le dashboard Vercel, allez dans **Storage → Connect Database**
2. Choisissez **Neon** et suivez l'assistant
3. Vercel injecte automatiquement `DATABASE_URL`

### 5. Appliquer les migrations en production

Après le premier déploiement, exécutez les migrations depuis votre machine locale :

```bash
DATABASE_URL="votre-url-neon-production" npx prisma migrate deploy
```

Ou utilisez la Neon SQL Editor pour exécuter le contenu de `prisma/migrations/20250805180000_init/migration.sql`.

### 6. Vérifier le déploiement

Visitez votre URL Vercel, créez un compte et testez :
- Création de liste
- Ajout d'articles
- Export PDF
- Historique et duplication

## Structure du projet

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth handlers
│   │   ├── signup/               # Inscription
│   │   └── lists/                # CRUD + PDF + duplicate + suggestions
│   ├── dashboard/                # Tableau de bord
│   ├── history/                  # Historique complet
│   ├── lists/[id]/               # Édition de liste
│   ├── login/                    # Connexion
│   └── signup/                   # Inscription
├── components/
│   ├── ui/                       # Composants shadcn/ui
│   ├── list-editor.tsx           # Éditeur de liste
│   ├── list-card.tsx             # Carte de liste
│   └── navbar.tsx
├── lib/
│   ├── auth.ts                   # Config NextAuth
│   ├── db.ts                     # Client Prisma
│   └── pdf-document.tsx          # Template PDF
└── middleware.ts                 # Protection des routes
```

## Scripts disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build production
npm run start        # Démarrer en production
npm run db:push      # Pousser le schéma Prisma
npm run db:migrate   # Créer/appliquer migrations
npm run db:studio    # Interface Prisma Studio
```

## Licence

MIT
