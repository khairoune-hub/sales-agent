@echo off
echo Checking git status...
git status

echo Adding all files...
git add .

echo Committing changes...
git commit -m "Complete AI Sales Agent platform - all files"

echo Pushing to GitHub on master branch...
git push -u origin master

echo Done!
pause 