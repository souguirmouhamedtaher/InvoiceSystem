# 🐳 Docker & Deployment - Récapitulatif

## ✅ Fichiers créés/modifiés

### 1. **dockerfile** ✅ (Modifié)
- Image multi-stage optimisée
- Utilise distroless pour la sécurité
- pnpm 9.15.0
- Ne copie PAS le .env dans l'image

### 2. **compose.yaml** ✅ (Créé)
- Configuration production avec nerdctl
- Monte le .env depuis le serveur
- Health check sur /api/docs
- Port 3000

### 3. **.github/workflows/deploy.yaml** ✅ (Créé)
- CI/CD avec GitHub Actions
- Build et scan Trivy
- Push sur Docker Hub
- Déploiement automatique avec nerdctl
- Vérification du health check

### 4. **DEPLOYMENT.md** ✅ (Créé)
- Documentation complète du déploiement
- Configuration des secrets GitHub
- Commandes serveur
- Configuration Nginx

### 5. **.env.example** ✅ (Créé)
- Template des variables d'environnement
- Documentation de toutes les variables

### 6. **deploy.sh** ✅ (Créé)
- Script de déploiement manuel (Linux/Mac)
- Build, push, instructions

### 7. **deploy.ps1** ✅ (Créé)
- Script de déploiement manuel (Windows/PowerShell)
- Build, push, instructions

## 🚀 Étapes pour déployer

### Sur GitHub (Une seule fois)

1. **Configurer les Secrets** dans Settings > Secrets and variables > Actions:
   ```
   DOCKER_USERNAME=louayelaroui
   DOCKER_PASSWORD=your-docker-hub-password
   SSH_PRIVATE_KEY=your-ssh-private-key
   SERVER_HOST=41.230.15.72
   SERVER_USER=root
   ```

### Sur le Serveur (Une seule fois)

2. **Créer le dossier de production**:
   ```bash
   mkdir -p ~/prod/invoice-be
   cd ~/prod/invoice-be
   ```

3. **Créer le fichier .env**:
   ```bash
   nano .env
   ```
   Copiez le contenu de `.env.example` et remplissez avec vos vraies valeurs.

4. **Installer nerdctl** (si pas déjà installé):
   ```bash
   wget https://github.com/containerd/nerdctl/releases/download/v1.7.0/nerdctl-1.7.0-linux-amd64.tar.gz
   sudo tar Cxzvvf /usr/local/bin nerdctl-1.7.0-linux-amd64.tar.gz
   nerdctl version
   ```

### Déploiement Automatique

5. **Push sur GitHub**:
   ```bash
   git add .
   git commit -m "Setup Docker and CI/CD"
   git push origin main
   ```

   ➡️ GitHub Actions va automatiquement:
   - Build l'image
   - Scanner avec Trivy
   - Push sur Docker Hub
   - Déployer sur le serveur

### Déploiement Manuel (Alternative)

Si vous préférez déployer manuellement:

**Windows (PowerShell)**:
```powershell
.\deploy.ps1
```

**Linux/Mac (Bash)**:
```bash
chmod +x deploy.sh
./deploy.sh
```

Puis sur le serveur:
```bash
cd ~/prod/invoice-be
nerdctl pull louayelaroui/invoice-be:prod
nerdctl compose down
nerdctl compose up -d
```

## 🔍 Vérification

Après le déploiement, vérifiez:

```bash
# Sur le serveur
nerdctl compose ps
nerdctl compose logs -f

# Tester l'API
curl http://localhost:3000/api/docs
```

## 🌐 Configuration Nginx (Optionnel)

Si vous voulez exposer l'API via un domaine:

```nginx
server {
    listen 80;
    server_name invoice.celestialwavedigital.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Puis SSL avec certbot:
```bash
sudo certbot --nginx -d invoice.celestialwavedigital.com
```

## 📊 Commandes Utiles

```bash
# Voir les logs
nerdctl compose logs -f

# Redémarrer
nerdctl compose restart

# Arrêter
nerdctl compose down

# Mettre à jour
nerdctl pull louayelaroui/invoice-backend:prod
nerdctl compose up -d

# Nettoyer les anciennes images
nerdctl image prune -a
```

## 🎯 URLs

- **Swagger Docs**: `https://invoice.celestialwavedigital.com/api/docs`
- **API Base**: `https://invoice.celestialwavedigital.com`

## 📝 Notes

- Le `.env` est sur le serveur, pas dans l'image Docker (sécurité)
- MongoDB tourne sur `41.230.15.72:27017` (externe)
- Les fichiers sont sur DigitalOcean Spaces
- Le health check vérifie `/api/docs` toutes les 30s
- L'image utilise distroless (très petite et sécurisée)

## 🆘 Troubleshooting

**Problème: Container ne démarre pas**
```bash
nerdctl compose logs
```

**Problème: Health check fail**
```bash
nerdctl exec invoice-be-prod curl http://localhost:3000/api/docs
```

**Problème: Variables d'environnement**
```bash
nerdctl exec invoice-be-prod env | grep NODE_ENV
```

## ✨ Prêt!

Tout est configuré! Il suffit de push sur `main` et GitHub Actions s'occupe du reste. 🚀
