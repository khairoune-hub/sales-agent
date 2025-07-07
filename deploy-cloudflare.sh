#!/bin/bash

# Cloudflare Workers Deployment Script for Lingerie Sales Agent
# This script handles the complete deployment process to Cloudflare Workers

set -e

echo "🚀 Starting Cloudflare Workers Deployment for Lingerie Sales Agent"
echo "=================================================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in to Cloudflare
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please run:"
    echo "   wrangler login"
    exit 1
fi

echo "✅ Cloudflare authentication verified"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set environment variables (secrets)
echo "🔑 Setting up environment variables..."
echo "Note: You'll be prompted to enter sensitive values for Cloudflare secrets"

# Define all required secrets
SECRETS=(
    "OPENAI_API_KEY"
    "ASSISTANT_ID"
    "OPENAI_MODEL"
    "GOOGLE_SHEETS_CLIENT_EMAIL"
    "GOOGLE_SHEETS_SPREADSHEET_ID"
    "GOOGLE_SHEET_ID"
    "GOOGLE_SERVICE_ACCOUNT_EMAIL"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_KEY"
    "MESSENGER_VERIFY_TOKEN"
    "MESSENGER_ACCESS_TOKEN"
    "MESSENGER_APP_SECRET"
    "WHATSAPP_VERIFY_TOKEN"
    "WHATSAPP_ACCESS_TOKEN"
    "WHATSAPP_APP_SECRET"
    "WHATSAPP_PHONE_NUMBER_ID"
    "WHATSAPP_BUSINESS_ACCOUNT_ID"
)

# Check if .dev.vars exists for local values
if [ -f ".dev.vars" ]; then
    echo "📋 Found .dev.vars file. Using values for secrets setup..."
    
    for secret in "${SECRETS[@]}"; do
        # Extract value from .dev.vars
        value=$(grep "^${secret}=" .dev.vars | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//')
        
        if [ -n "$value" ] && [ "$value" != "your_${secret,,}_here" ]; then
            echo "Setting $secret..."
            echo "$value" | wrangler secret put "$secret" --env production
        else
            echo "⚠️  $secret not found in .dev.vars or has placeholder value"
            echo "Please set it manually: wrangler secret put $secret --env production"
        fi
    done
else
    echo "⚠️  .dev.vars file not found. You'll need to set secrets manually:"
    for secret in "${SECRETS[@]}"; do
        echo "   wrangler secret put $secret --env production"
    done
fi

# Deploy to staging first (optional)
read -p "🤔 Deploy to staging first? (y/N): " deploy_staging
if [[ $deploy_staging =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to staging environment..."
    wrangler deploy --env staging
    
    echo "✅ Staging deployment complete!"
    echo "🌐 Staging URL: https://lingerie-sales-agent-staging.your-subdomain.workers.dev"
    
    read -p "🤔 Continue with production deployment? (y/N): " continue_prod
    if [[ ! $continue_prod =~ ^[Yy]$ ]]; then
        echo "⏹️  Deployment stopped at staging."
        exit 0
    fi
fi

# Deploy to production
echo "🚀 Deploying to production..."
wrangler deploy --env production

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "✅ Production URL: https://lingerie-sales-agent-prod.your-subdomain.workers.dev"
echo ""
echo "📋 Next Steps:"
echo "1. Test the API endpoints:"
echo "   - Health Check: GET /health"
echo "   - API Docs: GET /api"
echo "   - Test Environment: GET /api/test-env"
echo ""
echo "2. Configure webhook URLs in:"
echo "   - Facebook Developer Console (Messenger): /webhook/messenger"
echo "   - WhatsApp Business API: /whatsapp/webhook"
echo ""
echo "3. Set up custom domain (optional):"
echo "   - Update wrangler.toml [route] section"
echo "   - Run: wrangler deploy"
echo ""
echo "4. Monitor logs:"
echo "   - wrangler tail --env production"
echo ""
echo "🔧 Useful Commands:"
echo "   - View secrets: wrangler secret list --env production"
echo "   - Update secret: wrangler secret put SECRET_NAME --env production"
echo "   - View logs: wrangler tail --env production"
echo "   - Rollback: wrangler rollback --env production"
echo ""

# Test the deployment
echo "🧪 Testing deployment..."
sleep 5

# Get the worker URL
WORKER_URL=$(wrangler whoami 2>/dev/null | grep -o 'https://.*workers.dev' || echo "https://lingerie-sales-agent-prod.your-subdomain.workers.dev")

# Test health endpoint
echo "Testing health endpoint..."
curl -s "$WORKER_URL/health" | jq '.' || echo "❌ Health check failed"

echo ""
echo "✅ Deployment script completed!"
echo "🌐 Your Lingerie Sales Agent is now live on Cloudflare Workers!"
