# 🚀 Sales Agent Integration Setup Guide

This guide will help you complete the setup of your enhanced sales agent with Supabase and Google Sheets integration.

## 📋 Current Status

Based on the verification results:

- ✅ **OpenAI Integration**: Fully configured and working
- ✅ **Dependencies**: All required packages installed  
- ✅ **Routes & Schema**: All API routes and database schema ready
- ⚠️ **Supabase Integration**: Needs configuration
- ⚠️ **Google Sheets Integration**: Needs permission setup

## 🔧 Required Setup Steps

### 1. Supabase Database Setup

#### Step 1.1: Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and API keys

#### Step 1.2: Deploy Database Schema
1. In your Supabase dashboard, go to the SQL Editor
2. Copy and paste the contents of `database-schema.sql`
3. Run the SQL script to create all tables, functions, and sample data

#### Step 1.3: Configure Environment Variables
Add these to your `.env` file (or create one from `.dev.vars`):

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these values:**
- `SUPABASE_URL`: Project Settings → API → Project URL
- `SUPABASE_SERVICE_KEY`: Project Settings → API → service_role key (secret)
- `SUPABASE_ANON_KEY`: Project Settings → API → anon public key

### 2. Google Sheets Permission Setup

#### Current Issue
The Google Sheets service account needs permission to access your spreadsheet.

#### Solution
1. Open your Google Sheet: `https://docs.google.com/spreadsheets/d/1gQUIKFwP1zNLYOnF_3Gc4u9X9WnZSpsS9KT31sW2jjA/edit`
2. Click the "Share" button (top right)
3. Add the service account email with "Editor" permissions:
   ```
   agent-v1@agent-sheet-v1.iam.gserviceaccount.com
   ```
4. Make sure "Notify people" is unchecked
5. Click "Share"

### 3. Environment Variables Summary

Create/update your `.env` file with all necessary variables:

```env
# OpenAI Configuration (✅ Already configured)
OPENAI_API_KEY=your-open-ai-key
OPENAI_MODEL=gpt-4o
ASSISTANT_ID=your-assistant-id

# Supabase Configuration (⚠️ Needs your values)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# Google Sheets Configuration (✅ Already configured)
GOOGLE_SHEET_ID=1gQUIKFwP1zNLYOnF_3Gc4u9X9WnZSpsS9KT31sW2jjA
GOOGLE_SHEETS_SPREADSHEET_ID=1gQUIKFwP1zNLYOnF_3Gc4u9X9WnZSpsS9KT31sW2jjA
GOOGLE_SERVICE_ACCOUNT_EMAIL=agent-v1@agent-sheet-v1.iam.gserviceaccount.com
GOOGLE_SHEETS_CLIENT_EMAIL=agent-v1@agent-sheet-v1.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."  # Already configured
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."  # Already configured

# Messenger Configuration (✅ Already configured)
MESSENGER_VERIFY_TOKEN=salesagent
MESSENGER_ACCESS_TOKEN=EAAG8oCdCeCABO8o...  # Your token
MESSENGER_APP_SECRET=eb9c4a7a7f2a1b8c...  # Your secret

# WhatsApp Configuration (⚠️ Update with your values)
WHATSAPP_VERIFY_TOKEN=whatsapp_salesagent_verify
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here
WHATSAPP_APP_SECRET=your_whatsapp_app_secret_here
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_whatsapp_business_account_id_here

# Server Configuration
PORT=8787
NODE_ENV=development
BACKEND_PORT=8787

# Store Configuration
STORE_NAME=X Company Produits Bio
STORE_EMAIL=contact@xcompany.com
DEFAULT_LANGUAGE=fr
CURRENCY=EUR
LOW_STOCK_THRESHOLD=10
WELCOME_MESSAGE=Bienvenue chez X Company ! Nous sommes spécialisés dans les produits bio de qualité. Comment puis-je vous aider aujourd'hui ?
```

## 🧪 Testing Your Setup

### Run Verification Script
```bash
node verify-integrations.js
```

### Start the Server
```bash
npm run dev
```

### Test the Admin Dashboard
1. Open http://localhost:8787/admin.html
2. Check the system status indicators
3. Verify that all services show as "connected"

### Test API Endpoints
```bash
# Test health check
curl http://localhost:8787/api/admin/health

# Test products (should work with in-memory fallback)
curl http://localhost:8787/api/products

# Test orders
curl http://localhost:8787/api/orders
```

## 🎯 Expected Results After Setup

Once properly configured, you should see:

### Verification Script Results
```
🔍 Sales Agent Integration Verification
=====================================

📊 Verification Summary:
=======================
✅ PASS Supabase
✅ PASS GoogleSheets  
✅ PASS OpenAI
✅ PASS DatabaseSchema
✅ PASS WebhookRoutes
✅ PASS ApiRoutes
✅ PASS Dependencies

🎯 Overall Score: 7/7 tests passed

🎉 All integrations verified successfully!
✅ Your sales agent is ready for testing!
```

### System Features Available

1. **Real-time Database Operations**: 
   - Product management with Supabase
   - Customer tracking and history
   - Order processing with inventory management

2. **Enhanced Google Sheets Integration**:
   - Automatic order synchronization
   - Customer data export
   - Daily analytics and reporting
   - Inventory tracking

3. **Intelligent AI Agent**:
   - Real-time inventory awareness
   - Customer personalization
   - Order processing with validation
   - Multi-language support (French/Arabic)

4. **Admin Dashboard**:
   - Complete product management
   - Order tracking and status updates
   - Customer relationship management
   - Inventory management
   - Analytics and reporting

5. **Webhook Integration**:
   - Enhanced Messenger support
   - WhatsApp Business API integration
   - Customer session management
   - Interaction logging

## 🚨 Troubleshooting

### Supabase Connection Issues
- Verify your URL and keys are correct
- Check that the database schema is deployed
- Ensure RLS policies allow access

### Google Sheets Permission Issues
- Make sure the service account email is shared with the sheet
- Verify the email address is exactly: `agent-v1@agent-sheet-v1.iam.gserviceaccount.com`
- Check that it has "Editor" permissions

### Environment Variable Issues
- Make sure `.env` file is in the root directory
- Verify no extra spaces around the `=` signs
- Check that private keys are properly escaped with quotes

## 📞 Next Steps After Setup

1. **Configure Webhooks**: Set up Messenger and WhatsApp webhooks pointing to your server
2. **Add Real Products**: Use the admin dashboard to add your actual products
3. **Test Order Flow**: Create test orders through the chat interfaces
4. **Monitor Analytics**: Check Google Sheets for automated reporting
5. **Scale as Needed**: The system is designed to handle production workloads

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Run verification
node verify-integrations.js

# Start development server
npm run dev

# Start frontend only
npm run frontend

# Run both backend and frontend
npm run dev:both
```

---

**Ready to test your sales agent?** Complete the Supabase setup and Google Sheets permissions, then run the verification script to confirm everything is working! 