# Script de déploiement — ÉpicerieList
# Exécutez dans PowerShell depuis le dossier du projet

Write-Host "=== ÉpicerieList — Déploiement ===" -ForegroundColor Green

# 1. Vérifier Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git non trouvé. Installez-le: winget install Git.Git" -ForegroundColor Red
    exit 1
}

# 2. Configurer Git (si pas déjà fait)
$gitName = git config user.name 2>$null
$gitEmail = git config user.email 2>$null
if (-not $gitName -or -not $gitEmail) {
    Write-Host "`nConfigurez votre identité Git:" -ForegroundColor Yellow
    $name = Read-Host "Votre nom"
    $email = Read-Host "Votre email GitHub"
    git config user.name $name
    git config user.email $email
}

# 3. Commit initial (si pas déjà fait)
if (-not (git rev-parse HEAD 2>$null)) {
    git add .
    git commit -m "Initial commit — ÉpicerieList"
    git branch -M main
}

# 4. GitHub CLI — connexion
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "GitHub CLI non trouvé. Installez-le: winget install GitHub.cli" -ForegroundColor Red
    exit 1
}

$ghAuth = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nConnectez-vous à GitHub:" -ForegroundColor Yellow
    gh auth login
}

# 5. Créer le repo et pousser
$repoName = Read-Host "Nom du repo GitHub (ex: epicerielist)"
Write-Host "Création du repo et push..." -ForegroundColor Cyan
gh repo create $repoName --public --source=. --remote=origin --push

Write-Host "`n=== Prochaines étapes Vercel ===" -ForegroundColor Green
Write-Host "1. Allez sur https://vercel.com/new"
Write-Host "2. Importez le repo: $repoName"
Write-Host "3. Ajoutez les variables d'environnement:"
Write-Host "   - DATABASE_URL (Neon)"
Write-Host "   - AUTH_SECRET (openssl rand -base64 32)"
Write-Host "   - AUTH_URL et NEXTAUTH_URL (URL Vercel)"
Write-Host "4. Après déploiement: npx prisma migrate deploy"
Write-Host "`nRepo GitHub créé avec succès!" -ForegroundColor Green
