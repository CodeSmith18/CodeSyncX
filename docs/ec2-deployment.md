# EC2 Deployment Guide

This guide deploys the full CodeSyncX project on one AWS EC2 instance:

- React frontend served by Nginx.
- Express API and Socket.IO on `127.0.0.1:5000`.
- Execution worker managed by PM2.
- Redis on localhost.
- Docker runner image for sandboxed code execution.
- MongoDB Atlas for persistence.

## 1. EC2 Security Group

Open only these inbound ports:

```text
22   SSH from your IP only
80   HTTP from anywhere
443  HTTPS from anywhere
```

Do not expose:

```text
5000  backend
6379  Redis
27017 MongoDB
```

## 2. DNS

Create an `A` record:

```text
Name:  codesyncx
Value: YOUR_EC2_PUBLIC_IP
```

The app URL becomes:

```text
https://codesyncx.ritik.online
```

## 3. Install Server Dependencies

On Ubuntu EC2:

```bash
sudo apt update
sudo apt install -y nginx docker.io docker-compose-plugin certbot python3-certbot-nginx
sudo systemctl enable --now nginx docker
```

Install Node.js 20 and PM2:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 4. Upload Project

Place the project at:

```text
/var/www/codesyncx
```

Then:

```bash
cd /var/www/codesyncx
npm run install:all
```

## 5. Production Env Files

Create backend env:

```bash
cp deploy/backend.env.production.example backend/.env
nano backend/.env
```

Use:

```env
HOST=127.0.0.1
CLIENT_ORIGIN=https://codesyncx.ritik.online
GITHUB_CALLBACK_URL=https://codesyncx.ritik.online/login
EXECUTION_MODE=docker
REDIS_RATE_LIMIT_ENABLED=true
```

Create frontend env before building:

```bash
cp deploy/client.env.production.example client/.env
nano client/.env
```

Use:

```env
REACT_APP_BACKEND_URL=https://codesyncx.ritik.online
```

## 6. Build Frontend And Runner

```bash
npm run build:client
docker compose up -d redis
npm run build:runner
```

## 7. Start API And Worker

```bash
npm run pm2:start
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup`.

Check:

```bash
pm2 status
pm2 logs
```

## 8. Configure Nginx

Copy the template:

```bash
sudo cp deploy/nginx-codesyncx.conf /etc/nginx/sites-available/codesyncx
sudo ln -s /etc/nginx/sites-available/codesyncx /etc/nginx/sites-enabled/codesyncx
sudo nginx -t
sudo systemctl reload nginx
```

Enable HTTPS:

```bash
sudo certbot --nginx -d codesyncx.ritik.online
```

## 9. GitHub OAuth App

Set the GitHub OAuth callback URL to:

```text
https://codesyncx.ritik.online/login
```

## 10. Verify Deployment

Open:

```text
https://codesyncx.ritik.online
https://codesyncx.ritik.online/health
https://codesyncx.ritik.online/health/redis
```

Test code execution with:

```python
print("hello from docker sandbox")
```

The compile response should eventually report Docker runtime through the queued execution path.

## 11. Updating The App

After uploading new code:

```bash
cd /var/www/codesyncx
npm install --prefix backend
npm install --prefix client
npm run build:client
npm run build:runner
npm run pm2:reload
sudo systemctl reload nginx
```
