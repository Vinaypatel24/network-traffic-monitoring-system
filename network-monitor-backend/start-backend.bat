@echo off
echo =========================================================
echo  Network Monitor - Backend Launcher (H2 / No DB needed)
echo =========================================================
echo.

set MAVEN_HOME=%~dp0apache-maven-3.9.8
set PATH=%MAVEN_HOME%\bin;%PATH%

echo [1/2] Starting Spring Boot backend with H2 dev profile...
echo       Backend will be available at: http://localhost:8080
echo       H2 Console available at:      http://localhost:8080/h2-console
echo.
echo [NOTE] You must run this as Administrator for Npcap packet capture.
echo        If Npcap is not installed, capture will fail but login/dashboard will work.
echo.

"%MAVEN_HOME%\bin\mvn.cmd" spring-boot:run -Dspring-boot.run.profiles=dev -Dspring.profiles.active=dev

pause
