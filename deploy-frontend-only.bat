@echo off
echo ========================================
echo X Company Bio Products - Frontend Only
echo ========================================
echo.

echo 📁 Preparing frontend files for Vercel...

REM Create a temporary deployment directory
if exist "vercel-deploy" rmdir /s /q "vercel-deploy"
mkdir "vercel-deploy"

REM Copy only the frontend files
copy "public\index.html" "vercel-deploy\"
copy "public\admin.html" "vercel-deploy\"
copy "public\chat.html" "vercel-deploy\"
copy "vercel.json" "vercel-deploy\"

echo ✅ Frontend files prepared

echo.
echo 🚀 Deploying to Vercel...
cd vercel-deploy

echo 1. Login to Vercel (if needed)...
vercel login

echo.
echo 2. Deploying frontend...
vercel --prod

echo.
echo 🧹 Cleaning up...
cd ..
rmdir /s /q "vercel-deploy"

echo.
echo ========================================
echo Frontend Deployment Complete!
echo ========================================
echo.
echo Your frontend is now live on Vercel!
echo Only the HTML files from public/ folder were deployed.
echo.
pause 