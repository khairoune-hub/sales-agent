# Cloudflare Workers Deployment Guide
# Lingerie Sales Agent - Complete Setup

This guide provides complete instructions for deploying the Lingerie Sales Agent to Cloudflare Workers.

## 🚀 Quick Deployment

### Prerequisites
1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Node.js**: Version 18+ installed
3. **Wrangler CLI**: Cloudflare's command-line tool

### Step 1: Install Wrangler CLI
```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare
```bash
wrangler login
```

### Step 3: Clone and Setup
```bash
# Navigate to your project
cd /path/to/sales-agent

# Install dependencies
npm install

# Copy environment template
cp .dev.vars.example .dev.vars
```

### Step 4: Configure Environment Variables
Edit `.dev.vars` with your actual values:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key
ASSISTANT_ID=asst_your-assistant-id

# Google Sheets Configuration
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# Messenger Configuration
MESSENGER_VERIFY_TOKEN=your-messenger-verify-token
MESSENGER_ACCESS_TOKEN=your-messenger-page-access-token
MESSENGER_APP_SECRET=your-messenger-app-secret

# WhatsApp Configuration
WHATSAPP_VERIFY_TOKEN=your-whatsapp-verify-token
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_APP_SECRET=your-whatsapp-app-secret
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

### Step 5: Deploy Using Script
```bash
# Run the automated deployment script
./deploy-cloudflare.sh
```

OR manually:

```bash
# Set secrets in Cloudflare
wrangler secret put OPENAI_API_KEY --env production
wrangler secret put ASSISTANT_ID --env production
# ... (repeat for all secrets)

# Deploy to production
wrangler deploy --env production
```

## 🔧 Manual Configuration

### Environment Variables Setup
For each sensitive environment variable, use:

```bash
# Example for OpenAI API Key
wrangler secret put OPENAI_API_KEY --env production
# Enter your API key when prompted

# Repeat for all secrets listed in .dev.vars.example
```

### KV Namespace Setup
KV namespaces are already configured in `wrangler.toml`. If you need new ones:

```bash
# Create KV namespace
wrangler kv:namespace create "CACHE" --env production

# Update wrangler.toml with the returned ID
```

## 🌐 Custom Domain Setup

### Option 1: Cloudflare Route
1. Add domain to Cloudflare
2. Update `wrangler.toml`:
```toml
[route]
pattern = "api.yourdomain.com/*"
custom_domain = true
```

### Option 2: Workers Custom Domain
```bash
# Add custom domain
wrangler custom-domains add api.yourdomain.com --env production
```

## 🔗 Webhook Configuration

### Messenger Webhooks
1. **Facebook App Settings**:
   - Webhook URL: `https://your-worker-url.workers.dev/webhook/messenger`
   - Verify Token: Your `MESSENGER_VERIFY_TOKEN`
   - Subscribe to: `messages`, `messaging_postbacks`

### WhatsApp Webhooks
1. **WhatsApp Business API**:
   - Webhook URL: `https://your-worker-url.workers.dev/whatsapp/webhook`
   - Verify Token: Your `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to: `messages`

## 🧪 Testing Deployment

### Health Check
```bash
curl https://your-worker-url.workers.dev/health
```

### API Documentation
```bash
curl https://your-worker-url.workers.dev/api
```

### Environment Test
```bash
curl https://your-worker-url.workers.dev/api/test-env
```

## 📊 Monitoring and Logs

### View Logs
```bash
# Real-time logs
wrangler tail --env production

# With filtering
wrangler tail --env production --format pretty
```

### Metrics
- Visit Cloudflare Dashboard → Workers → Your Worker
- View analytics, performance metrics, and error rates

## 🔄 Updates and Rollbacks

### Deploy Updates
```bash
# Deploy new version
wrangler deploy --env production

# Deploy specific version
wrangler deploy --env production --compatibility-date 2024-01-15
```

### Rollback
```bash
# View deployments
wrangler deployments list --env production

# Rollback to previous version
wrangler rollback --env production
```

## 🚨 Troubleshooting

### Common Issues

1. **Environment Variables Not Set**:
   ```bash
   # List all secrets
   wrangler secret list --env production
   
   # Delete and recreate if needed
   wrangler secret delete SECRET_NAME --env production
   wrangler secret put SECRET_NAME --env production
   ```

2. **KV Namespace Issues**:
   ```bash
   # List KV namespaces
   wrangler kv:namespace list
   
   # Check KV data
   wrangler kv:key list --binding CACHE --env production
   ```

3. **Route Issues**:
   - Check DNS settings in Cloudflare Dashboard
   - Verify route patterns in `wrangler.toml`
   - Ensure SSL/TLS is set to "Full" or "Full (strict)"

### Debug Mode
Enable debug logging by setting:
```bash
wrangler secret put DEBUG_ENABLED --env production
# Enter "true" when prompted
```

## 📋 Required API Endpoints

The deployment includes these essential endpoints:

### Core API
- `GET /health` - Health check
- `GET /api` - API documentation
- `GET /api/test-env` - Environment validation

### Products & Orders
- `GET|POST /api/products` - Product management
- `GET|POST /api/orders` - Order management
- `GET|POST /api/customers` - Customer management

### Webhooks (Critical for Messenger/WhatsApp)
- `GET|POST /webhook/messenger` - Messenger webhook
- `GET|POST /whatsapp/webhook` - WhatsApp webhook

### Analytics & Admin
- `GET /api/analytics/*` - Analytics endpoints
- `GET /api/admin/*` - Admin panel endpoints
- `GET|POST /api/storage/*` - File storage endpoints

## 🔐 Security Considerations

1. **Secrets Management**: Never commit `.dev.vars` to version control
2. **CORS Configuration**: Configured for production domains
3. **Rate Limiting**: Built-in rate limiting for API endpoints
4. **Environment Isolation**: Separate staging and production environments

## 💡 Performance Optimization

1. **Edge Caching**: Configured KV storage for caching
2. **Global Distribution**: Cloudflare's global network
3. **Cold Start Optimization**: Minimal dependencies and efficient routing

## 📞 Support

For deployment issues:
1. Check Cloudflare Workers logs: `wrangler tail --env production`
2. Verify environment variables: `wrangler secret list --env production`
3. Test individual endpoints using curl or Postman
4. Review Cloudflare Dashboard for error analytics

---

## 🎉 Success!

Once deployed, your Lingerie Sales Agent will be:
- ✅ Running on Cloudflare's global network
- ✅ Handling Messenger and WhatsApp webhooks
- ✅ Processing orders and customer interactions
- ✅ Integrated with Google Sheets and Supabase
- ✅ Powered by OpenAI for intelligent responses

Your sales agent is now ready to handle customer inquiries and process orders through Messenger and WhatsApp!
