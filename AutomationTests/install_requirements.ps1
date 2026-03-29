if (!(Test-Path "venv")) {
    python -m venv venv
    Write-Host "Created virtual environment."
}
.\venv\Scripts\python.exe -m pip install -r requirements.txt
Write-Host "Installation complete."
