@echo off
rem Stops the website and closes the tray app.
taskkill /IM eKonsulta.exe /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":3000 " ^| findstr LISTENING') do taskkill /PID %%a /T /F >nul 2>&1
echo Stopped.
pause
