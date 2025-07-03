@echo off
echo Checking git status...
git status

echo Adding all files...
git add .

echo Committing changes...
git commit -m "Initial commit: Complete AI Sales Agent platform with frontend, backend, and deployment configurations"

echo Pushing to GitHub...
git push -u origin main

echo Done!
pause 