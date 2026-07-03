@echo off
echo ====================================
echo Setting up Git locally...
echo ====================================

:: Инициализация
git init

:: Локальные конфиги (только для этой папки)
git config --local user.name "nordeveloper"
git config --local user.email "nordeveloper@gmail.com"

echo Git initialized and configured locally:
git config --local -l
echo.

:: Привязка удаленного репозитория (удаляем старый, если вдруг был, и пишем новый)
git remote remove origin 2>nul
git remote add origin https://github.com/nordevelopment/OpenPersonalAIAgent.git
echo Remote origin set to https://github.com/nordevelopment/OpenPersonalAIAgent.git
echo.

:: Переименование ветки в main
git branch -M main

:: Индексация файлов
echo Adding files to index (respecting .gitignore)...
git add .

:: Коммит
echo Creating initial commit...
git commit -m "Initial commit with local changes"

echo.
echo ====================================
echo DONE! Git is set up locally and linked to GitHub.
echo To force push and overwrite GitHub repository, run:
echo.
echo    git push -f -u origin main
echo.
echo ====================================
pause
