@echo off
rem ONE-TIME SETUP. Right-click this file and choose "Run as administrator".
net session >nul 2>&1
if errorlevel 1 (
  echo Please right-click setup-server.bat and choose "Run as administrator".
  pause
  exit /b 1
)
set PORT=3000
cd /d C:\Yakap\ekonsulta-next
echo === Installing packages ===
call npm install
if errorlevel 1 (echo npm install failed & pause & exit /b 1)
echo === Building the website ===
call npm run build
if errorlevel 1 (echo build failed & pause & exit /b 1)
echo === Opening firewall port %PORT% for the local network ===
netsh advfirewall firewall delete rule name="Yakap Website" >nul 2>&1
netsh advfirewall firewall add rule name="Yakap Website" dir=in action=allow protocol=TCP localport=%PORT% profile=private
echo === Creating auto-start task (runs when Windows starts) ===
schtasks /Create /TN "YakapServer" /TR "C:\Yakap\start-server.bat" /SC ONSTART /RU SYSTEM /RL HIGHEST /F
echo === Starting the server now ===
schtasks /Run /TN "YakapServer"
echo.
echo Done. Open http://localhost:%PORT%
echo Other computers on your network: http://YOUR-LAPTOP-IP:%PORT%  (find the IP with ipconfig)
pause
