@echo off

echo [1/4] Stopping any running instances...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo [2/4] Running the application...
call npm run dev

echo.
echo [3/4] Application is running in development mode.

echo.
echo [4/4] To stop the application, press Ctrl+C.

pause