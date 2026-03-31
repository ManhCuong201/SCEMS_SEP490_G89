# AutomationTests/run_tests.ps1
# This script activates the virtual environment and runs pytest with the correct flags.

$script_dir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$venv_path = Join-Path $script_dir "venv"

if (-Not (Test-Path $venv_path)) {
    Write-Host "Virtual environment not found in '$venv_path'. Please run install_requirements.ps1 first." -ForegroundColor Red
    exit
}

Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& $venv_path\Scripts\Activate.ps1

Write-Host "Running Selenium tests in '$script_dir'..." -ForegroundColor Green
$xml_path = Join-Path $script_dir "test_results.xml"
pytest $script_dir -v --step-delay 1.0 --junitxml="$xml_path"

Write-Host "Tests completed." -ForegroundColor Cyan
pause
