@echo off
title Email & SMS Spam Detection System - AI Sentinel
color 0b

echo ===============================================================
echo     EMAIL & SMS SPAM DETECTION SYSTEM // 3D NEURAL SENTINEL
echo ===============================================================
echo.

cd /d "%~dp0server"

if not exist "node_modules\" (
    echo [INFO] Installing required dependencies...
    call npm install
    echo.
)

echo [INFO] Starting Node.js Express Server on port 5000...
echo [INFO] Serving 3D WebGL Client at http://localhost:5000
echo.

start "" http://localhost:5000
node src/app.js

pause
