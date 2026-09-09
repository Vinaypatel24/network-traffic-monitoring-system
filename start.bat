@echo off
title Network Monitor Launcher
echo ========================================================
echo   Starting Network Traffic Monitoring System
echo   (No Docker required - using local Java + Vite)
echo ========================================================
echo.

set ROOT_DIR=%~dp0

echo [1/3] Starting Backend (Spring Boot + H2 in dev profile)...
start "Network Monitor - Backend (Port 8080)" cmd /k "cd /d "%ROOT_DIR%network-monitor-backend" && start-backend.bat"

echo [2/3] Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo [3/3] Starting Frontend (Vite on Port 5173)...
start "Network Monitor - Frontend (Port 5173)" cmd /k "cd /d "%ROOT_DIR%network-monitor-frontend" && npm run dev"

echo.
echo ========================================================
echo   Services are launching!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8080
echo ========================================================
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173

exit
