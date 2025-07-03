# 🌿 X Company Bio Products - Cloudflare Workers

Ultra-fast sales agent for X Company Bio Products hosted on Cloudflare Workers with edge computing performance.

## ⚡ Features

- **Ultra-Fast Performance**: Edge computing with <50ms latency worldwide
- **Global Deployment**: Instant deployment to 200+ locations
- **Auto-Scaling**: Handles millions of requests automatically
- **Enterprise Security**: Cloudflare DDoS protection and security
- **Cost-Effective**: Pay only for what you use
- **Zero Downtime**: 99.9% uptime guarantee

## 🚀 Quick Start

### Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Node.js**: Install from [nodejs.org](https://nodejs.org) (v18+)
3. **OpenAI API Key**: Get from [platform.openai.com](https://platform.openai.com)

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 3. Login to Cloudflare

```bash
wrangler login
```

### 4. Create KV Namespace

```bash
wrangler kv:namespace create CACHE
wrangler kv:namespace create CACHE --preview
```

Update `wrangler.toml` with the returned namespace IDs.

### 5. Set Environment Variables

```bash
wrangler secret put OPENAI_API_KEY
# Enter your OpenAI API key when prompted

wrangler secret put SPREADSHEET_ID
# Enter your Google Sheets ID (optional)
```

### 6. Deploy

#### Development
```bash
npm run dev
# Opens http://localhost:8787
```

#### Staging
```bash
npm run deploy:staging
```

#### Production
```bash
npm run deploy:production
```

## 🛠️ Easy Deployment (Windows)

Run the automated deployment script:

```bash
deploy-cloudflare.bat
```

This script will:
- ✅ Check prerequisites
- 📦 Install dependencies
- 🔐 Handle authentication
- 📊 Create KV namespaces
- 🔑 Set up secrets
- 🚀 Deploy to your chosen environment

## 📁 Project Structure

```
├── src/
│   └── index.js          # Main Cloudflare Worker
├── wrangler.toml         # Cloudflare configuration
├── package.json          # Dependencies and scripts
├── deploy-cloudflare.bat # Windows deployment script
└── README_CLOUDFLARE.md  # This file
```

## ⚙️ Configuration

### wrangler.toml

```toml
name = "x-company-bio-products"
main = "src/index.js"
compatibility_date = "2024-01-15"
compatibility_flags = ["nodejs_compat"]

# KV Namespaces for caching
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"

# Custom domain (optional)
[[routes]]
pattern = "x-company-bio.your-domain.com/*"
zone_name = "your-domain.com"
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | ✅ Yes |
| `SPREADSHEET_ID` | Google Sheets ID for data | ❌ Optional |
| `ADMIN_USERNAME` | Admin username | ❌ Optional |
| `ADMIN_PASSWORD` | Admin password | ❌ Optional |

## 🌍 Global Performance

Cloudflare Workers runs your code in 200+ locations worldwide:

- **North America**: 50+ locations
- **Europe**: 60+ locations  
- **Asia Pacific**: 40+ locations
- **Latin America**: 20+ locations
- **Africa**: 10+ locations
- **Middle East**: 15+ locations

## 📊 Monitoring & Logs

### View Real-time Logs
```bash
npm run logs
```

### Monitor Performance
- Cloudflare Dashboard: Analytics & Performance
- Real-time metrics: Requests, errors, latency
- Geographic distribution of traffic

### Debug Issues
```bash
wrangler tail --format pretty
```

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Deploy to staging
npm run deploy:staging

# Deploy to production  
npm run deploy:production

# View logs
npm run logs

# Create KV namespace
npm run kv:create

# List secrets
wrangler secret list

# Delete secret
wrangler secret delete SECRET_NAME
```

## 🌿 Bio Products Features

### Product Categories
- 💊 **Supplements**: Protein powder, vitamins, omega-3
- 🍯 **Organic Foods**: Honey, coconut oil, chia seeds
- 🍃 **Natural Beverages**: Organic green tea

### Multi-language Support
- 🇫🇷 **French**: Primary interface language
- 🇸🇦 **Arabic**: Full Arabic support
- 🇬🇧 **English**: Fallback language

### Sales Features
- ✅ Product availability checking
- 📞 Customer data collection (name + phone)
- 🛒 Order processing with DA currency
- 📊 Admin sales reports
- 📱 Mobile-responsive interface

## 🚀 Performance Benefits

### Cloudflare Workers vs Traditional Hosting

| Feature | Cloudflare Workers | Traditional Server |
|---------|-------------------|-------------------|
| **Cold Start** | <5ms | 100-1000ms |
| **Global Latency** | <50ms | 100-500ms |
| **Scaling** | Automatic | Manual |
| **Uptime** | 99.9% | 95-99% |
| **DDoS Protection** | Included | Extra cost |
| **SSL/TLS** | Free | Extra cost |

### Cost Comparison

- **Free Tier**: 100,000 requests/day
- **Paid**: $5/month for 10M requests
- **Traditional VPS**: $20-100/month
- **Serverless**: Pay per request only

## 🔒 Security Features

- **DDoS Protection**: Automatic mitigation
- **WAF**: Web Application Firewall
- **Bot Management**: Block malicious bots
- **Rate Limiting**: Prevent abuse
- **SSL/TLS**: End-to-end encryption
- **Zero Trust**: Network security

## 🌐 Custom Domain Setup

1. **Add Domain to Cloudflare**
   ```bash
   # Add your domain to Cloudflare dashboard
   ```

2. **Update wrangler.toml**
   ```toml
   [[routes]]
   pattern = "bio-products.yourdomain.com/*"
   zone_name = "yourdomain.com"
   ```

3. **Deploy**
   ```bash
   npm run deploy:production
   ```

## 📈 Scaling & Limits

### Cloudflare Workers Limits

| Resource | Free Plan | Paid Plan |
|----------|-----------|-----------|
| **Requests/day** | 100,000 | Unlimited |
| **CPU Time** | 10ms | 50ms |
| **Memory** | 128MB | 128MB |
| **Script Size** | 1MB | 10MB |
| **KV Storage** | 1GB | 1GB+ |

### Auto-Scaling
- Handles traffic spikes automatically
- No configuration required
- Scales to millions of requests
- Global load distribution

## 🛠️ Troubleshooting

### Common Issues

**1. Authentication Error**
```bash
wrangler login
```

**2. KV Namespace Not Found**
```bash
wrangler kv:namespace create CACHE
# Update wrangler.toml with returned ID
```

**3. OpenAI API Error**
```bash
wrangler secret put OPENAI_API_KEY
# Enter valid API key
```

**4. Deployment Failed**
```bash
# Check wrangler.toml syntax
wrangler validate
```

### Debug Mode
```bash
wrangler dev --local
# Runs locally for debugging
```

### Log Analysis
```bash
wrangler tail --format json | jq
# Parse logs with jq for analysis
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## 📞 Support

### Resources
- 📖 [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- 🎯 [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- 💬 [Cloudflare Community](https://community.cloudflare.com/)
- 🐛 [Report Issues](https://github.com/your-repo/issues)

### Contact
- 📧 Email: support@x-company-bio.com
- 💬 Discord: X Company Bio Products
- 🐦 Twitter: @XCompanyBio

## 📄 License

MIT License - see LICENSE file for details.

---

🌿 **X Company Bio Products** - Premium organic and bio products with ultra-fast Cloudflare Workers hosting! 