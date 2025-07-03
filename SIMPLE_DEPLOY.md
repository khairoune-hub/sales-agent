# 🚀 Simple Deployment Guide

## Frontend → Vercel | Backend → Cloudflare

---

## 🌐 Deploy Frontend to Vercel (HTML files only)

### Quick Deploy
```bash
# 1. Login to Vercel
vercel login

# 2. Deploy only the public folder
vercel --prod
```

### What gets deployed:
- ✅ `public/index.html` → Landing page
- ✅ `public/admin.html` → Admin interface  
- ✅ `public/chat.html` → Customer chat
- ❌ No backend files
- ❌ No node_modules
- ❌ No configuration files

---

## ☁️ Deploy Backend to Cloudflare (API only)

### Quick Deploy
```bash
# 1. Login to Cloudflare
wrangler login

# 2. Deploy the backend
npm run deploy
```

### What gets deployed:
- ✅ `src/backend.js` → API endpoints
- ✅ Environment variables from `.dev.vars`
- ❌ No frontend files
- ❌ No public folder

---

## 🔗 Connect Frontend to Backend

After both deployments:

1. **Get your Cloudflare Worker URL** (something like):
   ```
   https://x-company-bio-products.your-name.workers.dev
   ```

2. **Update frontend files** with the real backend URL:
   - Edit `public/index.html`
   - Edit `public/admin.html` 
   - Edit `public/chat.html`
   
   Replace:
   ```javascript
   let BACKEND_URL = 'http://localhost:3000';
   ```
   
   With your actual URL:
   ```javascript
   let BACKEND_URL = 'http://localhost:3000';
   ```

3. **Redeploy frontend**:
   ```bash
   vercel --prod
   ```

---

## ✅ Final Result

### Frontend (Vercel)
- 🌐 `https://your-project.vercel.app/` - Landing page
- 👨‍💼 `https://your-project.vercel.app/admin` - Admin interface
- 💬 `https://your-project.vercel.app/chat` - Customer chat

### Backend (Cloudflare)
- 🔌 `https://your-worker.workers.dev/api/test-env` - Test endpoint
- 🤖 `https://your-worker.workers.dev/api/chat/message` - Chat API

---

## 🎯 Commands Summary

```bash
# Frontend only
vercel login
vercel --prod

# Backend only  
wrangler login
npm run deploy

# Test
curl https://your-worker.workers.dev/api/test-env
```

That's it! Clean separation of frontend and backend. 🎉 