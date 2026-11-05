@echo off
rem Backs up the website to GitHub (code + server scripts) and keeps local copies of app data.
rem The server keeps running on this laptop; GitHub is only the backup.
setlocal
if not exist C:\Yakap\logs mkdir C:\Yakap\logs
set LOG=C:\Yakap\logs\backup.log
cd /d C:\Yakap\ekonsulta-next
if not exist .git (
  echo [%date% %time%] ERROR: C:\Yakap\ekonsulta-next is not a Git repository. >> %LOG%
  echo ERROR: this folder is not connected to GitHub yet. See C:\Yakap\RESTORE.txt
  goto end
)

rem 0. The folder may be owned by Administrators (created during setup); tell Git it is safe for this user.
git config --global --get-all safe.directory | findstr /I /C:"C:/Yakap/ekonsulta-next" >nul || git config --global --add safe.directory C:/Yakap/ekonsulta-next

rem 1. Copy the server scripts and guides into the project so GitHub has them too.
if not exist deploy mkdir deploy
copy /Y C:\Yakap\*.bat deploy\ >nul
copy /Y C:\Yakap\*.txt deploy\ >nul
if not exist deploy\tools mkdir deploy\tools
copy /Y C:\Yakap\tools\*.* deploy\tools\ >nul 2>&1

rem 2. Local backup of app data (chatbot memory, assistant knowledge). NOT uploaded to GitHub.
if exist data (
  if not exist C:\Yakap\backups mkdir C:\Yakap\backups
  powershell -NoProfile -Command "Compress-Archive -Path 'C:\Yakap\ekonsulta-next\data\*' -DestinationPath ('C:\Yakap\backups\data-' + (Get-Date -Format 'yyyyMMdd-HHmm') + '.zip') -Force; Get-ChildItem 'C:\Yakap\backups\data-*.zip' | Sort-Object LastWriteTime -Descending | Select-Object -Skip 14 | Remove-Item"
)

rem 3. Commit and push code changes (secrets in .env.local and the data folder are excluded by .gitignore).
git add -A >> %LOG% 2>&1
if errorlevel 1 (
  echo [%date% %time%] ERROR: git add failed - see messages above. >> %LOG%
  echo ERROR: Git could not read the project folder. Details are in C:\Yakap\logs\backup.log
  goto end
)
git diff --cached --quiet
if not errorlevel 1 (
  echo [%date% %time%] No code changes. Data copy saved locally. >> %LOG%
  echo No code changes to back up. Local data copy saved in C:\Yakap\backups.
  goto end
)
git commit -m "Automatic backup %date% %time%" >> %LOG% 2>&1
git push origin HEAD >> %LOG% 2>&1
if errorlevel 1 (
  echo [%date% %time%] ERROR: push to GitHub failed - check internet / GitHub sign-in. >> %LOG%
  echo ERROR: could not push to GitHub. Details are in C:\Yakap\logs\backup.log (last lines).
  goto end
)
echo [%date% %time%] Backup pushed to GitHub. >> %LOG%
echo Backup pushed to GitHub.

:end
endlocal
if "%1"=="" pause
