@echo off
rem Creates a daily automatic GitHub backup at 6:00 PM (runs as you, so it can use your GitHub sign-in).
schtasks /Create /TN "YakapGitHubBackup" /TR "C:\Yakap\backup-to-github.bat auto" /SC DAILY /ST 18:00 /F
if errorlevel 1 (echo Could not create the scheduled backup. & pause & exit /b 1)
echo.
echo Daily backup scheduled at 6:00 PM. Running a first backup now...
call C:\Yakap\backup-to-github.bat
