@echo off

echo [1/3] Stopping any running instances...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo [2/3] Running the application...
call npm run start

echo.
echo [3/3] To stop the application, press Ctrl+C.

pause