# 🌿 X Company Bio Products - Frontend

Static frontend deployment for X Company Bio Products platform.

## 🚀 Quick Deploy to Vercel

```bash
npm run deploy
```

## 📁 Project Structure

```
frontend-deploy/
├── public/
│   ├── index.html      # Landing page
│   ├── admin.html      # Admin interface
│   └── chat.html       # Customer chat
├── package.json        # Frontend dependencies
├── vercel.json         # Vercel configuration
└── README.md           # This file
```

## 🌐 Live URLs

After deployment, your site will be available at:
- **Production**: `https://x-company-bio-products-frontend.vercel.app`

### Page Routes
- `/` - Landing page with backend configuration
- `/admin` - Admin interface for product management
- `/chat` - Customer chat interface

## 🔧 Backend Integration

The frontend connects to your Cloudflare Workers backend:
- **API URL**: `https://x-company-bio-products.bcos-assistant.workers.dev`

## 📱 Features

✅ **Responsive Design** - Works on all devices  
✅ **Multi-language** - French and Arabic support  
✅ **Real-time Chat** - AI-powered customer assistance  
✅ **Admin Panel** - Product and order management  
✅ **Security Headers** - Built-in security features  
✅ **Global CDN** - Fast loading worldwide  

## 🛠️ Development

### Local Testing
```bash
# Serve files locally (you can use any static server)
python -m http.server 3000
# or
npx serve public
```

### Deploy Preview
```bash
npm run deploy:preview
```

### Deploy Production
```bash
npm run deploy
```

## 🔒 Security

- HTTPS everywhere (automatic)
- Security headers configured
- XSS protection enabled
- Content type sniffing disabled

## 📊 Performance

- Global CDN distribution
- Automatic compression
- Optimized for mobile
- Fast Time to First Byte (TTFB)

## 🎯 Architecture

```
USER → Vercel CDN → Static Files (HTML/CSS/JS)
                        ↓ API Calls
                   Cloudflare Workers Backend
``` 