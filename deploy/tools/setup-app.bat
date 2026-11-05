@echo off
rem ONE-TIME: turns off auto-start with Windows, builds eKonsulta.exe and puts a shortcut on the Desktop.
net session >nul 2>&1
if errorlevel 1 (
  powershell -NoProfile -Command "Start-Process '%~f0' -Verb RunAs"
  exit /b
)
cd /d C:\Yakap\tools

echo === 1. Turning off auto-start (server now only runs when you open the app) ===
schtasks /Delete /TN "YakapServer" /F >nul 2>&1
taskkill /IM eKonsulta.exe /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":3000 " ^| findstr LISTENING') do taskkill /PID %%a /T /F >nul 2>&1
echo    Done. (Firewall rule kept so other PCs can still connect while the app is open.)

echo === 2. Checking Python ===
where python >nul 2>&1
if errorlevel 1 (
  echo Python is not installed. Install it from https://www.python.org/downloads/
  echo  ^(tick "Add python.exe to PATH"^), then run tools\setup-app.bat again.
  pause & exit /b 1
)

echo === 3. Building eKonsulta.exe ===
python -m pip install --upgrade pystray pillow pyinstaller
python -m PyInstaller --noconsole --onefile --name eKonsulta --icon C:\Yakap\tools\logo.ico --distpath C:\Yakap --workpath "%TEMP%\ek-build" --specpath "%TEMP%\ek-build" eKonsulta.pyw
if not exist C:\Yakap\eKonsulta.exe (echo Build of eKonsulta.exe failed. & pause & exit /b 1)

echo === 4. Desktop shortcut ===
powershell -NoProfile -Command "$d=[Environment]::GetFolderPath('Desktop'); $s=(New-Object -ComObject WScript.Shell).CreateShortcut(\"$d\eKonsulta.lnk\"); $s.TargetPath='C:\Yakap\eKonsulta.exe'; $s.WorkingDirectory='C:\Yakap'; $s.IconLocation='C:\Yakap\tools\logo.ico'; $s.Save()"

echo.
echo All set. Double-click "eKonsulta" on your Desktop to start.
echo It lives in the hidden icons (^^^) next to the clock and stops when the laptop shuts down.
pause
