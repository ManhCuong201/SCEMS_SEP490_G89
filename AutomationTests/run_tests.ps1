# AutomationTests/run_tests.ps1
# This script activates the virtual environment and runs pytest with the correct flags.

$venv_path = ".\AutomationTests\venv"
if (-Not (Test-Path $venv_path)) {
    Write-Host "Virtual environment not found. Please run install_requirements.ps1 first." -ForegroundColor Red
    exit
}

Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& $venv_path\Scripts\Activate.ps1

Write-Host "Running Selenium tests..." -ForegroundColor Green
pytest .\AutomationTests\ -v --step-delay 1.0 --junitxml=test_results.xml

Write-Host "Tests completed. Results saved to test_results.xml" -ForegroundColor Cyan
pause
