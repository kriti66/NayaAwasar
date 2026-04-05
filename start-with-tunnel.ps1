param()

$ErrorActionPreference = "Stop"

$repoRoot = $PSScriptRoot
$backendDir = Join-Path $PSScriptRoot "backend"
$frontendDir = Join-Path $PSScriptRoot "frontend"
$recommendationDir = Join-Path $PSScriptRoot "recommendation-service"

function Ensure-Url([string]$value, [string]$name) {
    if ([string]::IsNullOrWhiteSpace($value)) {
        throw "$name cannot be empty."
    }
    if (-not ($value -match '^https?://')) {
        throw "$name must start with http:// or https://"
    }
}

function Upsert-EnvVar([string]$filePath, [string]$key, [string]$value) {
    if (-not (Test-Path $filePath)) {
        New-Item -Path $filePath -ItemType File -Force | Out-Null
    }

    $raw = Get-Content -Path $filePath -Raw
    if ($null -eq $raw) { $raw = "" }
    $lines = @()
    if ($raw.Length -gt 0) {
        $lines = $raw -split "`r?`n"
    }

    $updated = $false
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^$([Regex]::Escape($key))=") {
            $lines[$i] = "$key=$value"
            $updated = $true
        }
    }
    if (-not $updated) {
        $lines += "$key=$value"
    }

    $final = ($lines -join "`r`n").TrimEnd("`r", "`n") + "`r`n"
    Set-Content -Path $filePath -Value $final -Encoding UTF8
}

Write-Host "Starting recommendation-service in a new terminal..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$recommendationDir'; python main.py"
)

Write-Host "Starting backend in a new terminal..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$backendDir'; npm run dev"
)

Write-Host ""
Write-Host "Create dev tunnels and paste the URLs below." -ForegroundColor Yellow
$backendTunnelUrl = Read-Host "Enter BACKEND dev tunnel URL (maps to backend port 5001)"
$recommendationTunnelUrl = Read-Host "Enter RECOMMENDATION dev tunnel URL (maps to port 8000)"

Ensure-Url -value $backendTunnelUrl -name "Backend dev tunnel URL"
Ensure-Url -value $recommendationTunnelUrl -name "Recommendation dev tunnel URL"

$frontendEnv = Join-Path $frontendDir ".env"
$backendEnv = Join-Path $backendDir ".env"

Upsert-EnvVar -filePath $frontendEnv -key "VITE_API_URL" -value $backendTunnelUrl
Upsert-EnvVar -filePath $backendEnv -key "FLASK_AI_URL" -value $recommendationTunnelUrl
Upsert-EnvVar -filePath $backendEnv -key "PYTHON_SERVICE_URL" -value $recommendationTunnelUrl

Write-Host ""
Write-Host "Updated environment files:" -ForegroundColor Green
Write-Host " - $frontendEnv (VITE_API_URL)"
Write-Host " - $backendEnv (FLASK_AI_URL, PYTHON_SERVICE_URL)"

Write-Host "Restarting backend with updated .env in a new terminal..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$backendDir'; npm run dev"
)

Write-Host "Starting frontend in a new terminal..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$frontendDir'; npm run dev"
)

Write-Host ""
Write-Host "Done. Use the new frontend URL and test API calls over dev tunnels." -ForegroundColor Green
