# Cloudflare Workers Deployment - Quick Start

## 🚀 One-Command Deployment

```bash
# Setup all secrets and deploy
./deploy-cloudflare.sh
```

## 📋 Prerequisites

1. **Cloudflare Account** - Free account at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI** - `npm install -g wrangler`
3. **Environment Variables** - Copy `.dev.vars.example` to `.dev.vars` and fill with your values

## 🔑 Required Environment Variables

### OpenAI
- `OPENAI_API_KEY` - Your OpenAI API key
- `ASSISTANT_ID` - Your OpenAI Assistant ID

### Google Sheets
- `GOOGLE_SHEETS_SPREADSHEET_ID` - Google Sheets ID (already configured)
- `GOOGLE_SHEETS_PRIVATE_KEY` - Service account private key
- `GOOGLE_SHEETS_CLIENT_EMAIL` - Service account email

### Messenger
- `MESSENGER_VERIFY_TOKEN` - Choose any secure string
- `MESSENGER_ACCESS_TOKEN` - Facebook Page Access Token
- `MESSENGER_APP_SECRET` - Facebook App Secret

### WhatsApp
- `WHATSAPP_VERIFY_TOKEN` - Choose any secure string
- `WHATSAPP_ACCESS_TOKEN` - WhatsApp Business API token
- `WHATSAPP_APP_SECRET` - WhatsApp App Secret
- `WHATSAPP_PHONE_NUMBER_ID` - WhatsApp Phone Number ID
- `WHATSAPP_BUSINESS_ACCOUNT_ID` - WhatsApp Business Account ID

### Supabase
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key

## 🛠️ Manual Setup Commands

```bash
# 1. Login to Cloudflare
wrangler login

# 2. Install dependencies
npm install

# 3. Setup environment variables
./setup-secrets.sh

# 4. Deploy to production
npm run cloudflare:deploy

# 5. Deploy to staging (optional)
npm run cloudflare:deploy:staging
```

## 🔗 Important URLs After Deployment

- **Health Check**: `https://your-worker.workers.dev/health`
- **API Docs**: `https://your-worker.workers.dev/api`
- **Messenger Webhook**: `https://your-worker.workers.dev/webhook/messenger`
- **WhatsApp Webhook**: `https://your-worker.workers.dev/whatsapp/webhook`

## 🎯 Next Steps

1. **Configure Webhooks**:
   - Facebook Developer Console: Use `/webhook/messenger`
   - WhatsApp Business API: Use `/whatsapp/webhook`

2. **Test the Deployment**:
   ```bash
   curl https://your-worker.workers.dev/health
   ```

3. **Monitor Logs**:
   ```bash
   npm run cloudflare:logs
   ```

## 🆘 Troubleshooting

- **Check secrets**: `npm run cloudflare:secrets`
- **View logs**: `npm run cloudflare:logs`
- **Rollback**: `npm run cloudflare:rollback`

## 📱 Features Included

✅ Messenger Integration  
✅ WhatsApp Business API  
✅ Product Management  
✅ Order Processing  
✅ Customer Management  
✅ Google Sheets Integration  
✅ OpenAI Sales Assistant  
✅ Supabase Database  
✅ Global CDN (Cloudflare)  
✅ Automatic HTTPS  
✅ 99.9% Uptime  

Your Lingerie Sales Agent is now ready to handle customer inquiries 24/7! 🎉
