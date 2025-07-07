#!/bin/bash

echo "🚀 Vercel Deployment Script"
echo "=========================="

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "📝 Please login to Vercel:"
    vercel login
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️ No .env file found. Please create one based on .env.example"
    echo "📝 Copy .env.example to .env and fill in your values:"
    echo "   cp .env.example .env"
    echo "   nano .env"
    read -p "Press Enter after creating .env file..."
fi

# Ask for deployment type
echo "🎯 Choose deployment type:"
echo "1. Preview deployment (for testing)"
echo "2. Production deployment"
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo "🔄 Starting preview deployment..."
        vercel
        ;;
    2)
        echo "🔄 Starting production deployment..."
        vercel --prod
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo "✅ Deployment completed!"
echo "📋 Don't forget to:"
echo "   1. Set up environment variables in Vercel dashboard"
echo "   2. Update webhook URLs in your integrations"
echo "   3. Test all endpoints"
echo "   4. Check logs with: vercel logs"
