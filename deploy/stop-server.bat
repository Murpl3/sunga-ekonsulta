@echo off
rem Stops the website (whatever is listening on port 3000).
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr LISTENING') do taskkill /PID %%a /F
echo Stopped.
pause
