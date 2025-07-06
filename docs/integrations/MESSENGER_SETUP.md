# 🤖 Messenger Webhook Integration Setup

This guide will help you configure your sales agent to work with Facebook Messenger through webhooks.

## 📋 Prerequisites

1. **Facebook Developer Account** - Sign up at [developers.facebook.com](https://developers.facebook.com)
2. **Facebook App** - Create a new app for your business
3. **Facebook Page** - The page that will receive messages
4. **OpenAI API Key** - Already configured in your existing setup

## 🔧 Configuration Steps

### 1. Environment Variables

Add these variables to your `.env` file:

```env
# Facebook Messenger Webhook Configuration
MESSENGER_VERIFY_TOKEN=your-unique-verify-token
MESSENGER_ACCESS_TOKEN=your-page-access-token
MESSENGER_APP_SECRET=your-app-secret
```

### 2. Facebook App Setup

1. **Create a Facebook App:**
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Create a new app for Business
   - Add the "Messenger" product

2. **Generate Page Access Token:**
   - In the Messenger settings, generate a page access token
   - Copy this token to `MESSENGER_ACCESS_TOKEN`

3. **Set App Secret:**
   - In App Settings > Basic
   - Copy the App Secret to `MESSENGER_APP_SECRET`

4. **Create Verify Token:**
   - Generate a unique random string (e.g., `my-sales-agent-webhook-2024`)
   - Set this as `MESSENGER_VERIFY_TOKEN`

### 3. Webhook Setup

1. **Configure Webhook URL:**
   - In Messenger > Settings > Webhooks
   - Set Callback URL: `https://your-domain.com/webhook/messenger`
   - Set Verify Token: (the same token you set in `MESSENGER_VERIFY_TOKEN`)

2. **Subscribe to Page Events:**
   - Subscribe to these webhook fields:
     - `messages`
     - `messaging_postbacks`
     - `messaging_optins`
     - `message_deliveries`
     - `message_reads`

3. **Subscribe Your Page:**
   - Select your page to subscribe to webhook events

## 🚀 Testing the Setup

### 1. Verify Configuration

Check if your configuration is correct:

```bash
# Check webhook configuration
curl http://localhost:8787/webhook/debug/config

# Check active sessions
curl http://localhost:8787/webhook/debug/sessions
```

### 2. Test Webhook Verification

Facebook will send a verification request to your webhook URL. The logs will show:

```
📱 Messenger webhook verification request received
✅ Webhook verification successful
```

### 3. Send Test Messages

1. Go to your Facebook Page
2. Send a message to your page
3. Check the logs for message processing:

```
📩 Messenger webhook message received
💬 Processing message from [user-id]
✅ Message processed successfully
```

## 🎯 Features Included

### Message Processing
- ✅ Text messages from users
- ✅ Attachments (images, files)
- ✅ Location sharing
- ✅ Quick replies
- ✅ Postback buttons

### AI Integration
- ✅ OpenAI Assistant integration
- ✅ Context-aware conversations
- ✅ Product recommendations
- ✅ Order processing
- ✅ Customer support

### User Experience
- ✅ Typing indicators
- ✅ Welcome messages
- ✅ Quick reply buttons
- ✅ Product catalogs
- ✅ Session management

## 📊 Monitoring

### Debug Endpoints

```bash
# View active sessions
GET /webhook/debug/sessions

# Check configuration
GET /webhook/debug/config

# View chat history
GET /api/chat/{threadId}/history
```

### Logs

The system provides detailed logging:

```bash
# Webhook verification
📱 Messenger webhook verification request received
✅ Webhook verification successful

# Message processing
📩 Messenger webhook message received
💬 Processing message from [user-id]
🔄 Processing text message: "Hello"
✅ Message processed successfully

# Session management
🆕 Creating new session for user
👤 User profile retrieved: John Doe
✅ Session created with thread: thread_abc123
```

## 🔒 Security

### Webhook Verification
- All webhook requests are verified using Facebook's signature verification
- App secret is used to validate request authenticity
- Invalid signatures are rejected with 403 Forbidden

### Rate Limiting
- Chat endpoints have rate limiting (10 requests per minute)
- Webhook endpoints are protected from abuse
- Session cleanup prevents memory leaks

## 🛠️ Troubleshooting

### Common Issues

1. **Webhook Verification Failed**
   - Check `MESSENGER_VERIFY_TOKEN` matches Facebook settings
   - Ensure webhook URL is publicly accessible
   - Verify SSL certificate is valid

2. **Messages Not Received**
   - Check webhook subscription settings
   - Verify page is subscribed to webhook
   - Check server logs for errors

3. **No AI Responses**
   - Verify `OPENAI_API_KEY` is set correctly
   - Check OpenAI service logs
   - Ensure sufficient OpenAI credits

### Debug Commands

```bash
# Test webhook endpoint
curl -X GET "http://localhost:8787/webhook/messenger?hub.mode=subscribe&hub.verify_token=your-token&hub.challenge=test"

# Check environment
curl http://localhost:8787/api/test-env

# View API documentation
curl http://localhost:8787/api
```

## 🔄 Production Deployment

1. **HTTPS Required:**
   - Facebook requires HTTPS for webhook URLs
   - Use SSL certificates (Let's Encrypt recommended)

2. **Domain Configuration:**
   - Update webhook URL in Facebook App settings
   - Configure DNS properly

3. **Environment Variables:**
   - Set all required variables in production
   - Use secure secrets management

4. **Rate Limiting:**
   - Production rate limits are more restrictive
   - Monitor API usage

## 📞 Support

If you encounter issues:

1. Check the server logs for detailed error messages
2. Use the debug endpoints to verify configuration
3. Test with Facebook's webhook testing tool
4. Review Facebook Developer documentation

## 🎉 Success!

Once configured, your sales agent will:

- ✅ Receive messages from Facebook Messenger
- ✅ Process them through your OpenAI assistant
- ✅ Respond naturally to customers
- ✅ Handle product inquiries and orders
- ✅ Provide excellent customer support

Your customers can now chat with your sales agent directly through Facebook Messenger! 🚀 