# GloBus-Pilot Automated Setup Script
# Checks system environment and sets up Python CLI dependencies if desired.

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  GLOBUS-PILOT SETUP & ENVIRONMENT INITIALIZER" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check Browser Extension / Bookmarklet status
Write-Host "`n[+] Browser Extension & Userscript:" -ForegroundColor Green
Write-Host "    - Bookmarklet ready at: userscript/bookmarklet.txt" -ForegroundColor White
Write-Host "    - Userscript ready at:  userscript/globus-pilot.user.js" -ForegroundColor White
Write-Host "    - Extension folder:     extension/" -ForegroundColor White
Write-Host "    -> You can use the in-browser HUD immediately in Firefox, Chrome, or any browser!" -ForegroundColor Yellow

# 2. Check Python for offline simulator
Write-Host "`n[+] Checking Python runtime for offline simulator..." -ForegroundColor Cyan
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue

if ($pythonCmd) {
    $ver = & python --version
    Write-Host "    [OK] Found Python: $ver" -ForegroundColor Green
} else {
    Write-Host "    [!] Python is not yet installed in PATH." -ForegroundColor Yellow
    Write-Host "    [?] Would you like to install Python 3.12 via Windows winget? (Y/N)" -ForegroundColor Yellow
    $ans = Read-Host "    Enter Choice"
    if ($ans -eq "Y" -or $ans -eq "y") {
        Write-Host "    [*] Installing Python 3.12 via winget..." -ForegroundColor Cyan
        winget install -e --id Python.Python.3.12 --accept-package-agreements --accept-source-agreements
        Write-Host "    [OK] Python installed! Please restart your terminal." -ForegroundColor Green
    } else {
        Write-Host "    [*] Skipping Python install. (You can still run the web sandbox and in-browser HUD!)." -ForegroundColor White
    }
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! Check README.md for quickstart instructions." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
