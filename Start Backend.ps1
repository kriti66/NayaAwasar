# Start Naya Awasar backend - run this in PowerShell or double-click
Set-Location $PSScriptRoot\backend
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting BACKEND - keep this window OPEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
npm run dev
Read-Host "Press Enter to close"
