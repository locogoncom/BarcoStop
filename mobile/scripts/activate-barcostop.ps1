$ErrorActionPreference = 'Stop'

$mobileRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$repoRoot = (Resolve-Path (Join-Path $mobileRoot '..')).Path
$serverRoot = Join-Path $repoRoot 'server'

Set-Location $mobileRoot
Write-Host '[barcostop] Activating app...'

# Start backend only when port 5000 is not already listening.
$backendListening = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($backendListening) {
  Write-Host '[barcostop] Backend already running on port 5000.'
} elseif (Test-Path $serverRoot) {
  Start-Process powershell -ArgumentList @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-Command', "Set-Location '$serverRoot'; node index.js"
  ) | Out-Null
  Write-Host '[barcostop] Backend started on port 5000.'
  Start-Sleep -Seconds 2
} else {
  Write-Host "[barcostop] Backend path missing: $serverRoot"
}

# Start Metro if needed so app launch is reliable from a single command.
$metroListening = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
if (-not $metroListening) {
  Start-Process powershell -ArgumentList @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-Command', "Set-Location '$mobileRoot'; npx react-native start"
  ) | Out-Null
  Write-Host '[barcostop] Metro started on port 8081.'
  Start-Sleep -Seconds 4
} else {
  Write-Host '[barcostop] Metro already running on port 8081.'
}

& (Join-Path $PSScriptRoot 'run-android-pixel6.ps1')
