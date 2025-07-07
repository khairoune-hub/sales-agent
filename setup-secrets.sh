#!/bin/bash

# Environment Setup Script for Cloudflare Workers
# Sets up all required secrets for the Lingerie Sales Agent

set -e

echo "🔑 Cloudflare Workers Environment Setup"
echo "======================================="

# Check if wrangler is installed and user is logged in
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please run: wrangler login"
    exit 1
fi

echo "✅ Wrangler CLI ready"

# Environment selection
ENV="production"
if [ "$1" = "staging" ]; then
    ENV="staging"
fi

echo "🎯 Setting up environment: $ENV"

# Function to set secret
set_secret() {
    local secret_name=$1
    local description=$2
    local example=$3
    
    echo ""
    echo "🔐 Setting $secret_name"
    echo "   Description: $description"
    if [ -n "$example" ]; then
        echo "   Example: $example"
    fi
    
    # Check if secret already exists
    if wrangler secret list --env "$ENV" 2>/dev/null | grep -q "$secret_name"; then
        read -p "   Secret $secret_name already exists. Update? (y/N): " update
        if [[ ! $update =~ ^[Yy]$ ]]; then
            echo "   ⏭️ Skipping $secret_name"
            return
        fi
    fi
    
    # Read from .dev.vars if available
    if [ -f ".dev.vars" ]; then
        local value=$(grep "^${secret_name}=" .dev.vars 2>/dev/null | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//' | sed 's/\\n/\n/g')
        if [ -n "$value" ] && [ "$value" != "your_${secret_name,,}_here" ]; then
            echo "   📋 Found value in .dev.vars"
            echo "$value" | wrangler secret put "$secret_name" --env "$ENV"
            echo "   ✅ $secret_name set successfully"
            return
        fi
    fi
    
    # Manual input
    echo "   Please enter the value for $secret_name:"
    wrangler secret put "$secret_name" --env "$ENV"
    echo "   ✅ $secret_name set successfully"
}

echo ""
echo "📋 Required Secrets for Lingerie Sales Agent"
echo "============================================="

# OpenAI Configuration
echo ""
echo "🤖 OpenAI Configuration"
echo "----------------------"
set_secret "OPENAI_API_KEY" "OpenAI API Key for GPT models" "sk-proj-..."
set_secret "ASSISTANT_ID" "OpenAI Assistant ID for the sales agent" "asst_..."

# Google Sheets Configuration
echo ""
echo "📊 Google Sheets Configuration"
echo "------------------------------"
set_secret "GOOGLE_SHEETS_PRIVATE_KEY" "Google Service Account Private Key (with \\n for newlines)" "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
set_secret "GOOGLE_SHEETS_CLIENT_EMAIL" "Google Service Account Email" "agent-v1@project.iam.gserviceaccount.com"

# Optional Google Sheets fields
read -p "🤔 Set optional Google Sheets Client ID? (y/N): " set_google_id
if [[ $set_google_id =~ ^[Yy]$ ]]; then
    set_secret "GOOGLE_SHEETS_CLIENT_ID" "Google Service Account Client ID" "123456789..."
fi

# Messenger Configuration
echo ""
echo "💬 Facebook Messenger Configuration"
echo "-----------------------------------"
set_secret "MESSENGER_VERIFY_TOKEN" "Messenger Webhook Verify Token (choose any secure string)" "your_secure_verify_token_123"
set_secret "MESSENGER_ACCESS_TOKEN" "Facebook Page Access Token" "EAAG..."
set_secret "MESSENGER_APP_SECRET" "Facebook App Secret" "abc123..."

# WhatsApp Configuration
echo ""
echo "📱 WhatsApp Business API Configuration"
echo "--------------------------------------"
set_secret "WHATSAPP_VERIFY_TOKEN" "WhatsApp Webhook Verify Token (choose any secure string)" "whatsapp_verify_token_456"
set_secret "WHATSAPP_ACCESS_TOKEN" "WhatsApp Business API Access Token" "EAAG..."
set_secret "WHATSAPP_APP_SECRET" "WhatsApp App Secret" "def456..."
set_secret "WHATSAPP_PHONE_NUMBER_ID" "WhatsApp Phone Number ID" "123456789012345"
set_secret "WHATSAPP_BUSINESS_ACCOUNT_ID" "WhatsApp Business Account ID" "123456789012345"

# Supabase Configuration
echo ""
echo "🗄️ Supabase Database Configuration"
echo "----------------------------------"
set_secret "SUPABASE_URL" "Supabase Project URL" "https://your-project.supabase.co"
set_secret "SUPABASE_SERVICE_KEY" "Supabase Service Role Key (service_role key, not anon key)" "eyJ..."

# Summary
echo ""
echo "🎉 Environment Setup Complete!"
echo "=============================="
echo ""
echo "✅ All secrets have been configured for environment: $ENV"
echo ""
echo "📋 Configured Secrets:"
wrangler secret list --env "$ENV" 2>/dev/null || echo "   (Unable to list secrets)"
echo ""
echo "🚀 Next Steps:"
echo "1. Deploy your worker: wrangler deploy --env $ENV"
echo "2. Test the deployment: curl https://your-worker-url.workers.dev/health"
echo "3. Configure webhooks in Facebook Developer Console and WhatsApp Business API"
echo ""
echo "🔧 Useful Commands:"
echo "   - List secrets: wrangler secret list --env $ENV"
echo "   - Update secret: wrangler secret put SECRET_NAME --env $ENV"
echo "   - Delete secret: wrangler secret delete SECRET_NAME --env $ENV"
echo "   - View logs: wrangler tail --env $ENV"
echo ""

# Verify deployment readiness
echo "🧪 Checking deployment readiness..."

# Check if all critical secrets are set
CRITICAL_SECRETS=("OPENAI_API_KEY" "MESSENGER_ACCESS_TOKEN" "WHATSAPP_ACCESS_TOKEN")
MISSING_SECRETS=()

for secret in "${CRITICAL_SECRETS[@]}"; do
    if ! wrangler secret list --env "$ENV" 2>/dev/null | grep -q "$secret"; then
        MISSING_SECRETS+=("$secret")
    fi
done

if [ ${#MISSING_SECRETS[@]} -eq 0 ]; then
    echo "✅ All critical secrets are configured!"
    echo "🚀 Ready for deployment!"
else
    echo "⚠️ Missing critical secrets:"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "   - $secret"
    done
    echo ""
    echo "❌ Please configure missing secrets before deployment"
fi

echo ""
echo "💡 Pro Tips:"
echo "- Keep your .dev.vars file secure and never commit it to version control"
echo "- Use strong, unique verify tokens for webhooks"
echo "- Regularly rotate your API keys for security"
echo "- Monitor your usage in Cloudflare Dashboard and OpenAI usage page"
echo ""
