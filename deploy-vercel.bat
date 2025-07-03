@echo off
echo ========================================
echo X Company Bio Products - Vercel Deploy
echo ========================================
echo.

echo 1. Logging into Vercel...
vercel login

echo.
echo 2. Deploying frontend to Vercel...
vercel --prod

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Your frontend is now live on Vercel!
echo Don't forget to:
echo 1. Update the backend URL in your frontend files
echo 2. Deploy your backend to Cloudflare Workers
echo 3. Update CORS settings if needed
echo.
pause 