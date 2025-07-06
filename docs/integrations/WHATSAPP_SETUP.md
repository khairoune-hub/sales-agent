# WhatsApp Business API Setup Guide

This guide will help you configure WhatsApp Business API integration for your sales agent to receive and respond to messages through WhatsApp.

## Overview

Your sales agent is now integrated with WhatsApp Business API, allowing customers to:
- Send messages to your WhatsApp Business number
- Receive AI-powered responses about your bio products
- Place orders directly through WhatsApp
- Get personalized product recommendations

## Prerequisites

1. **WhatsApp Business Account**: You need a verified WhatsApp Business account
2. **Meta Business Manager**: Access to Meta Business Manager 
3. **Phone Number**: A dedicated phone number for WhatsApp Business
4. **Webhook URL**: Your server must be accessible via HTTPS (we'll use ngrok for development)

## Step 1: Facebook Developer Account Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing app
3. Select "Business" as the app type
4. Fill in your app details:
   - App name: "Your Company WhatsApp Bot"
   - App contact email: your-email@example.com
   - Business Manager Account: Select your business account

## Step 2: WhatsApp Business API Setup

1. **Add WhatsApp Product to Your App**:
   - In your Facebook app dashboard, click "Add Product"
   - Find "WhatsApp" and click "Set up"

2. **Configure WhatsApp Business API**:
   - Go to WhatsApp > API Setup
   - You'll see your **Phone Number ID** (save this for environment variables)
   - You'll see your **WhatsApp Business Account ID** (save this for environment variables)

## Step 3: Phone Number Configuration

1. **Add Phone Number**:
   - In WhatsApp > API Setup, click "Add phone number"
   - Enter your dedicated phone number
   - Complete the phone number verification process
   - Note: This phone number will be used for receiving WhatsApp messages

2. **Generate Access Token**:
   - In WhatsApp > API Setup, find "Access tokens"
   - Click "Generate token"
   - Copy the **Permanent Access Token** (save this for environment variables)

## Step 4: Environment Variables Configuration

Update your `.dev.vars` file with your WhatsApp credentials:

```env
# WhatsApp Business API Configuration
WHATSAPP_VERIFY_TOKEN=whatsapp_salesagent_verify
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token_here
WHATSAPP_APP_SECRET=your_app_secret_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
```

### Where to find these values:

- **WHATSAPP_VERIFY_TOKEN**: Set this to `whatsapp_salesagent_verify` (or any secure string)
- **WHATSAPP_ACCESS_TOKEN**: From WhatsApp > API Setup > Access tokens
- **WHATSAPP_APP_SECRET**: From App Settings > Basic > App Secret
- **WHATSAPP_PHONE_NUMBER_ID**: From WhatsApp > API Setup (Phone number ID)
- **WHATSAPP_BUSINESS_ACCOUNT_ID**: From WhatsApp > API Setup (Business Account ID)

## Step 5: Webhook Configuration

1. **Start Your Server**:
   ```bash
   node backend/server.js
   ```

2. **Setup ngrok** (for development):
   ```bash
   # Install ngrok if you haven't already
   npm install -g ngrok
   
   # Expose port 8787 to the internet
   ngrok http 8787
   ```

3. **Configure Webhook in Facebook**:
   - Go to WhatsApp > Configuration > Webhooks
   - Click "Edit" next to webhook URL
   - Enter your webhook URL:
     ```
     https://your-ngrok-url.ngrok.io/whatsapp/webhook
     ```
   - Enter verify token: `whatsapp_salesagent_verify`
   - Click "Verify and save"

4. **Subscribe to Webhook Events**:
   - In webhook configuration, subscribe to:
     - `messages` - To receive incoming messages
     - `message_deliveries` - To get delivery confirmations
     - `message_reads` - To get read confirmations
     - `messaging_postbacks` - For button interactions

## Step 6: Test Your Integration

1. **Check Webhook Verification**:
   - Your server logs should show:
     ```
     ✅ WhatsApp webhook verification successful
     ```

2. **Send Test Message**:
   - Use WhatsApp to send a message to your business number
   - Check your server logs for message processing
   - You should receive an AI-powered response

3. **Expected Server Output**:
   ```
   📱 WhatsApp webhook verification request received
   ✅ WhatsApp webhook verification successful
   📩 WhatsApp webhook message received
   ✅ WhatsApp business account notification confirmed
   💬 Processing WhatsApp message from [PHONE_NUMBER]
   ✅ WhatsApp message processed successfully
   ```

## Step 7: WhatsApp Business Profile Setup

1. **Configure Business Profile**:
   - Go to WhatsApp > Business Profile
   - Add your business information:
     - Business name
     - Category (e.g., "Health & Beauty")
     - Description
     - Address
     - Website
     - Email

2. **Add Profile Picture**:
   - Upload your company logo
   - This will be visible to customers

## Step 8: Message Templates (Optional)

1. **Create Message Templates**:
   - Go to WhatsApp > Message Templates
   - Create templates for:
     - Welcome messages
     - Order confirmations
     - Product catalogs
     - Customer support responses

2. **Template Categories**:
   - **MARKETING**: For promotional messages
   - **UTILITY**: For order updates, notifications
   - **AUTHENTICATION**: For OTP and verification codes

## WhatsApp Business API Features

Your integration supports:

### Message Types:
- ✅ **Text messages**: Basic conversation
- ✅ **Interactive messages**: Buttons and quick replies
- ✅ **Media messages**: Images, documents, audio, video
- ✅ **Template messages**: Pre-approved message templates

### Bot Capabilities:
- 🤖 **AI-powered responses** using OpenAI GPT
- 📱 **Multi-language support** (Arabic, French, English)
- 🛍️ **Product recommendations** from your bio catalog
- 📊 **Order management** with Google Sheets integration
- 👤 **Customer profiling** and session management

### Business Features:
- 📈 **Analytics and insights** on message performance
- 🔄 **Automated responses** during business hours
- 📞 **Escalation to human agents** when needed
- 🎯 **Personalized product suggestions**

## Production Deployment

For production use:

1. **SSL Certificate**: Ensure your server has a valid SSL certificate
2. **Webhook URL**: Use your production domain instead of ngrok
3. **Rate Limiting**: WhatsApp has rate limits for messaging
4. **Business Verification**: Complete WhatsApp Business verification
5. **Compliance**: Follow WhatsApp Business Policy guidelines

## Troubleshooting

### Common Issues:

1. **Webhook Verification Failed**:
   - Check that your verify token matches in both Facebook and your code
   - Ensure your server is accessible via HTTPS
   - Verify ngrok is running and URL is correct

2. **Messages Not Received**:
   - Check webhook subscription events
   - Verify your phone number is correctly configured
   - Check server logs for error messages

3. **Cannot Send Messages**:
   - Verify your access token is valid
   - Check that you have the correct phone number ID
   - Ensure your WhatsApp Business account is approved

4. **Signature Verification Error**:
   - Currently disabled for testing
   - For production, ensure your app secret is correctly configured

### Debug Endpoints:

- **WhatsApp Configuration**: `GET /whatsapp/debug/config`
- **Active Sessions**: `GET /whatsapp/debug/sessions`
- **Server Status**: `GET /health`

## Support

For additional help:
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Meta Business Help Center](https://business.facebook.com/help)
- [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy)

## Next Steps

1. ✅ Complete the setup following this guide
2. ✅ Test message sending and receiving
3. ✅ Customize your bot responses
4. ✅ Set up business profile
5. ✅ Create message templates
6. ✅ Deploy to production with proper SSL

Your WhatsApp Business API integration is ready to help customers discover and purchase your bio products through WhatsApp conversations! 