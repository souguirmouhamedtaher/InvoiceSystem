# Invoice Backend - Docker & Deployment

## 📦 Docker Setup

### Development (avec MongoDB et MinIO locaux)
```bash
docker-compose -f docker-compose-dev.yaml up -d
```

### Production (avec nerdctl)
```bash
nerdctl compose up -d
```

## 🚀 GitHub Actions Secrets Required

Configurez ces secrets dans votre repository GitHub (Settings > Secrets and variables > Actions) :

### Docker Hub
- `DOCKER_USERNAME` : Votre username Docker Hub (ex: `louayelaroui`)
- `DOCKER_PASSWORD` : Votre password ou access token Docker Hub

### Server SSH
- `SSH_PRIVATE_KEY` : Votre clé SSH privée pour se connecter au serveur
- `SERVER_HOST` : IP ou domaine du serveur (ex: `41.230.15.72`)
- `SERVER_USER` : Username SSH (ex: `root` ou `ubuntu`)

## 📝 Préparer le Serveur

Sur votre serveur de production, créez le dossier :

```bash
mkdir -p ~/prod/invoice-be
cd ~/prod/invoice-be
```

Créez le fichier `.env` avec vos variables d'environnement :

```bash
nano .env
```

Contenu du `.env` (ajustez selon vos valeurs) :
```env
NODE_ENV=production
PORT=3000
BASE_URL=https://invoice.celestialwavedigital.com
MONGO_CONNECTION_STRING=mongodb://cwdadmin:cwdpassword123@41.230.15.72:27017/invoiceDB

JWT_ACCESS_SECRET=your-secret-here
JWT_ACCESS_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-secret-here
JWT_REFRESH_EXPIRES_IN=7d
JWT_RESET_SECRET=your-secret-here
JWT_RESET_EXPIRES_IN=7d

MAILER_HOST=smtp.gmail.com
MAILER_PORT=465
MAILER_USER=your-email@gmail.com
MAILER_PASSWORD=your-app-password
MAILER_SENDER=your-email@gmail.com

SPACE_ENDPOINT=https://invoice-app-files.fra1.digitaloceanspaces.com
SPACE_PUBLIC_ENDPOINT=https://invoice-app-files.fra1.digitaloceanspaces.com
SPACE_REGION=us-east-1
SPACE_ACCESS_KEY=your-access-key
SPACE_SECRET_KEY=your-secret-key
SPACE_BUCKET=invoice-app-files

BASE_URL=https://your-domain.com
```

## 🔧 Installation de nerdctl sur le serveur

Si nerdctl n'est pas installé :

```bash
# Télécharger nerdctl
wget https://github.com/containerd/nerdctl/releases/download/v1.7.0/nerdctl-1.7.0-linux-amd64.tar.gz
sudo tar Cxzvvf /usr/local/bin nerdctl-1.7.0-linux-amd64.tar.gz

# Vérifier l'installation
nerdctl version
```

## 🌐 Configuration Nginx (Reverse Proxy)

Si vous utilisez Nginx comme reverse proxy :

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Puis configurez SSL avec Let's Encrypt :
```bash
sudo certbot --nginx -d invoice.celestialwavedigital.com
```

## 🔄 Workflow de Déploiement

1. **Push sur main** : `git push origin main`
2. **GitHub Actions** :
   - Build l'image Docker
   - Scan de sécurité avec Trivy
   - Push sur Docker Hub
   - Deploy sur le serveur avec nerdctl
3. **Vérification automatique** du health check

## 📊 Commandes Utiles

### Sur le serveur
```bash
# Voir les logs
nerdctl compose logs -f

# Voir les containers
nerdctl compose ps

# Redémarrer
nerdctl compose restart

# Arrêter
nerdctl compose down

# Mettre à jour manuellement
nerdctl pull louayelaroui/invoice-backend:prod
nerdctl compose up -d
```

### En local
```bash
# Build l'image
docker build -t invoice-backend .

# Run en local
docker run -p 3000:3000 --env-file .env invoice-backend

# Test avec docker-compose dev
docker-compose -f docker-compose-dev.yaml up
```

## 🔍 Health Check

L'API expose un endpoint Swagger à :
- Production : `https://invoice.celestialwavedigital.com/api/docs`
- Local : `http://localhost:3000/api/docs`

Le health check vérifie cet endpoint toutes les 30 secondes.

## 📌 Notes Importantes

- MongoDB tourne sur le serveur à `41.230.15.72:27017`
- Le backend se connecte à cette base externe
- Les fichiers sont stockés sur DigitalOcean Spaces
- Le port 3000 est utilisé pour l'API
- SSL/TLS doit être géré par Nginx ou un reverse proxy
