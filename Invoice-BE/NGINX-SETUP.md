# 🌐 Configuration Nginx pour Invoice API

## 🚀 Installation rapide

### 1. Installer Nginx (si pas déjà installé)
```bash
sudo apt update
sudo apt install nginx -y
```

### 2. Copier la configuration
```bash
# Sur votre machine locale, copiez nginx.conf vers le serveur
scp nginx.conf user@41.230.15.72:~/invoice-nginx.conf

# Sur le serveur
sudo mv ~/invoice-nginx.conf /etc/nginx/sites-available/invoice-api
```

Ou créez directement sur le serveur :
```bash
sudo nano /etc/nginx/sites-available/invoice-api
```
Et collez le contenu de `nginx.conf`

### 3. Activer le site
```bash
sudo ln -s /etc/nginx/sites-available/invoice-api /etc/nginx/sites-enabled/
```

### 4. Tester la configuration
```bash
sudo nginx -t
```

### 5. Redémarrer Nginx
```bash
sudo systemctl restart nginx
```

### 6. Configurer SSL avec Let's Encrypt
```bash
# Installer certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtenir le certificat SSL
sudo certbot --nginx -d invoice.celestialwavedigital.com

# Suivez les instructions (entrez votre email, acceptez les termes)
```

### 7. Vérifier le renouvellement automatique
```bash
sudo certbot renew --dry-run
```

## 🔍 Vérification

Après la configuration, testez :

```bash
# Test HTTP (sera redirigé vers HTTPS après certbot)
curl http://invoice.celestialwavedigital.com/api/docs

# Test HTTPS (après certbot)
curl https://invoice.celestialwavedigital.com/api/docs
```

## 📊 Commandes utiles

```bash
# Voir les logs Nginx
sudo tail -f /var/log/nginx/invoice-api-access.log
sudo tail -f /var/log/nginx/invoice-api-error.log

# Recharger la config (sans downtime)
sudo nginx -s reload

# Redémarrer Nginx
sudo systemctl restart nginx

# Vérifier le status
sudo systemctl status nginx

# Voir les sites activés
ls -la /etc/nginx/sites-enabled/
```

## 🔧 Troubleshooting

### Port 80/443 déjà utilisé
```bash
# Voir ce qui utilise le port
sudo lsof -i :80
sudo lsof -i :443

# Arrêter apache si installé
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### Nginx ne démarre pas
```bash
# Vérifier la syntaxe
sudo nginx -t

# Voir les logs d'erreur
sudo journalctl -u nginx -n 50
```

### Le domaine ne résout pas
```bash
# Vérifier les DNS
nslookup invoice.celestialwavedigital.com
dig invoice.celestialwavedigital.com

# Le domaine doit pointer vers votre IP serveur (41.230.15.72)
```

## 🔐 Sécurité supplémentaire (optionnel)

### Rate limiting
Ajoutez dans `/etc/nginx/nginx.conf` (dans le bloc `http`) :
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

Puis dans votre site config :
```nginx
location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    # ... reste de la config
}
```

### Bloquer les IPs
```nginx
# Dans le bloc server
deny 192.168.1.1;
allow all;
```

## ✅ Checklist finale

- [ ] Nginx installé
- [ ] Configuration copiée dans `/etc/nginx/sites-available/invoice-api`
- [ ] Lien symbolique créé dans `/etc/nginx/sites-enabled/`
- [ ] Configuration testée avec `nginx -t`
- [ ] Nginx redémarré
- [ ] Domaine pointe vers le serveur (DNS configuré)
- [ ] SSL configuré avec certbot
- [ ] Test HTTPS fonctionne
- [ ] Auto-renouvellement SSL activé

## 🌐 URLs finales

Une fois tout configuré :
- **Swagger UI**: https://invoice.celestialwavedigital.com/api/docs
- **API Base**: https://invoice.celestialwavedigital.com
- **Health Check**: https://invoice.celestialwavedigital.com/api/docs

## 📝 Note importante

Le certificat SSL Let's Encrypt expire tous les 90 jours mais certbot configure un renouvellement automatique. Vérifiez avec :
```bash
sudo systemctl status certbot.timer
```
