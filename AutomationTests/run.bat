@echo off
REM run.bat - Quick runner for SCEMS Selenium tests
echo Activating SCEMS Automation Suite...
powershell -ExecutionPolicy Bypass -File .\run_tests.ps1
pause
