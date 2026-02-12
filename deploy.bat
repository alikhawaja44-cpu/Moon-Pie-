@echo off
echo Deploying Moon Pie...
cd "C:\Users\Jin\Desktop\Moon Pie"
git init
git add .
git commit -m "Deploy Moon Pie"
git branch -M main
git remote add origin https://github.com/alikhawaja44-cpu/moon-pie.git
git push -u origin main --force
echo Deployment Complete! ❤️
pause