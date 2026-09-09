@echo off
title Network Monitor Launcher
echo ========================================================
echo   Starting Network Traffic Monitoring System
echo   (Hardware Disk Storage + Unified UI on Port 8080)
echo ========================================================
echo.

set ROOT_DIR=%~dp0

echo [1/2] Launching Network Monitor Engine & UI (Port 8080)...
start "Network Monitor System" cmd /k "cd /d "%ROOT_DIR%network-monitor-backend" && start-backend.bat"

echo [2/2] Waiting for application to initialize...
timeout /t 7 /nobreak >nul

echo.
echo ========================================================
echo   Application ready!
echo   Dashboard:  http://localhost:8080
echo   H2 Console: http://localhost:8080/h2-console
echo ========================================================
echo Opening browser...
start http://localhost:8080

exit
