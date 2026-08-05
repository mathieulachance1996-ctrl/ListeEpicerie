# Guide de déploiement rapide

## Étape 1 — Git + GitHub (5 min)

Ouvrez un **terminal PowerShell** dans ce dossier et exécutez :

```powershell
# Configurer Git (une seule fois)
git config user.name "Votre Nom"
git config user.email "votre@email.com"

# Commit
git add .
git commit -m "Initial commit — ÉpicerieList"
git branch -M main

# Se connecter à GitHub (ouvre le navigateur)
gh auth login
# → GitHub.com → HTTPS → Login with a web browser

# Créer le repo et pousser
gh repo create epicerielist --public --source=. --remote=origin --push
```

**Ou** lancez le script automatisé :

```powershell
.\scripts\deploy.ps1
```

---

## Étape 2 — Base de données Neon (3 min)

1. Créez un compte sur [console.neon.tech](https://console.neon.tech)
2. **New Project** → copiez la connection string PostgreSQL
3. Dans le **SQL Editor** Neon, exécutez le contenu de :
   `prisma/migrations/20250805180000_init/migration.sql`

---

## Étape 3 — Vercel (5 min)

1. Allez sur [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → sélectionnez `epicerielist`
3. Ajoutez ces **Environment Variables** :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | `postgresql://...` (Neon) |
| `AUTH_SECRET` | Générez avec : `[Convert]::ToBase64String((1..32 \| ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])` |
| `AUTH_URL` | `https://votre-app.vercel.app` (après déploiement) |
| `NEXTAUTH_URL` | même URL |

4. Cliquez **Deploy**
5. Une fois déployé, mettez à jour `AUTH_URL` et `NEXTAUTH_URL` avec l'URL réelle, puis **Redeploy**

---

## Étape 4 — Vérification

Visitez votre URL Vercel et testez :
- [ ] Créer un compte (`/signup`)
- [ ] Se connecter
- [ ] Créer une liste d'épicerie
- [ ] Exporter en PDF
- [ ] Voir l'historique

---

## Développement local

```powershell
cp .env.example .env
# Remplir DATABASE_URL et AUTH_SECRET
npx prisma db push
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)
