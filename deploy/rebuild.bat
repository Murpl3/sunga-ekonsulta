@echo off
rem Run after changing any website file: closes the app, installs packages, rebuilds, reopens the tray app.
echo Closing eKonsulta...
taskkill /IM eKonsulta.exe /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":3000 " ^| findstr LISTENING') do taskkill /PID %%a /T /F >nul 2>&1
cd /d C:\Yakap\ekonsulta-next
echo === Installing packages ===
call npm install --no-audit --no-fund
if errorlevel 1 (echo npm install failed. & pause & exit /b 1)
echo === Building ===
call npm run build
if errorlevel 1 (echo Build failed - the old version was NOT replaced. & pause & exit /b 1)
echo.
if exist C:\Yakap\eKonsulta.exe (
  start "" C:\Yakap\eKonsulta.exe
  echo Rebuilt. eKonsulta is starting again in the hidden icons ^(^^^).
) else (
  start "" C:\Yakap\tools\setup-app.bat
  echo eKonsulta.exe not found - running setup-app.bat to create it.
)
echo Press Ctrl+Shift+R in the browser to see the changes.
pause
