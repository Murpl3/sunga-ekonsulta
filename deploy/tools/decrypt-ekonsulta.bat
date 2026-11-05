@echo off
cd /d "%~dp0"
if "%~1"=="" (
  echo Drag and drop the eKonsulta XML file onto this .bat file.
  pause & exit /b
)
node decrypt-ekonsulta.js "%~1"
pause
