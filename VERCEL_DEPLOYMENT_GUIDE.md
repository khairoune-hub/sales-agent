# Vercel Deployment Checklist

## Pre-deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Environment Variables Setup
You need to set up these environment variables in your Vercel dashboard or via CLI:

#### Required Variables:
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_MODEL` - Model to use (default: gpt-4-turbo-preview)
- `ASSISTANT_ID` - Your OpenAI Assistant ID

#### Optional but Recommended:
- `GOOGLE_SHEETS_SPREADSHEET_ID` - For data persistence
- `GOOGLE_SHEETS_PRIVATE_KEY` - Service account private key
- `GOOGLE_SHEETS_CLIENT_EMAIL` - Service account email
- `MESSENGER_ACCESS_TOKEN` - For Facebook Messenger integration
- `MESSENGER_VERIFY_TOKEN` - Webhook verification
- `WHATSAPP_ACCESS_TOKEN` - For WhatsApp integration
- `WHATSAPP_VERIFY_TOKEN` - Webhook verification
- `WHATSAPP_PHONE_NUMBER_ID` - WhatsApp phone number ID
- `SUPABASE_URL` - For file storage
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### 4. Set Environment Variables via CLI
```bash
# Set OpenAI variables
vercel env add OPENAI_API_KEY production
vercel env add ASSISTANT_ID production

# Set other variables as needed
vercel env add GOOGLE_SHEETS_SPREADSHEET_ID production
vercel env add GOOGLE_SHEETS_CLIENT_EMAIL production
# ... etc
```

## Deployment Commands

### Preview Deployment (for testing)
```bash
npm run vercel:deploy:preview
# or
vercel
```

### Production Deployment
```bash
npm run vercel:deploy
# or
vercel --prod
```

### Local Development with Vercel
```bash
npm run vercel:dev
# or
vercel dev
```

## Post-deployment Verification

1. **Health Check**: Visit `https://your-domain.vercel.app/health`
2. **API Documentation**: Visit `https://your-domain.vercel.app/api`
3. **Frontend**: Visit `https://your-domain.vercel.app/`
4. **Admin Panel**: Visit `https://your-domain.vercel.app/admin`
5. **Chat Interface**: Visit `https://your-domain.vercel.app/chat`

## Webhook Configuration

After deployment, update your webhook URLs in:

### Facebook Messenger
- Webhook URL: `https://your-domain.vercel.app/webhook/messenger`

### WhatsApp Business
- Webhook URL: `https://your-domain.vercel.app/whatsapp/webhook`

## Troubleshooting

### Common Issues:
1. **Environment Variables**: Make sure all required environment variables are set
2. **Function Timeout**: Vercel has a 10s timeout for Hobby plan, 30s for Pro
3. **Cold Starts**: First request might be slower due to serverless cold starts
4. **File Size**: Keep your deployment under size limits

### Logs:
```bash
vercel logs
```

### Domain Setup:
```bash
vercel domains add your-domain.com
```

## File Structure After Deployment
```
/
├── backend/                 # Server code
│   ├── server.js           # Main server file
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # External services
│   └── utils/              # Utilities
├── public/                 # Static files
│   ├── index.html          # Landing page
│   ├── admin.html          # Admin interface
│   └── chat.html           # Chat interface
├── package.json            # Dependencies and scripts
├── vercel.json             # Vercel configuration
└── .env.example            # Environment variables template
```
