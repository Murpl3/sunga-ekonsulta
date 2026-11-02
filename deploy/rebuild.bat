@echo off
rem Run after changing any website file: stops the site, installs packages, rebuilds, starts again.
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1
cd /d C:\Yakap\ekonsulta-next
call npm install --no-audit --no-fund
if errorlevel 1 (echo npm install failed. & pause & exit /b 1)
call npm run build
if errorlevel 1 (echo Build failed. & pause & exit /b 1)
start "Yakap Server" /min C:\Yakap\start-server.bat
echo.
echo Rebuilt and started. Open http://localhost:3000 and press Ctrl+Shift+R.
pause
