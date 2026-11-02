@echo off
rem Starts the Sunga eKonsulta website (production mode) on port 3000, reachable on the LAN.
set PORT=3000
cd /d C:\Yakap\ekonsulta-next
if not exist C:\Yakap\logs mkdir C:\Yakap\logs
echo [%date% %time%] starting on port %PORT% >> C:\Yakap\logs\server.log
call npm run start -- -p %PORT% -H 0.0.0.0 >> C:\Yakap\logs\server.log 2>&1
