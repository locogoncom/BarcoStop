$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$launcher = Join-Path $repoRoot 'apps\Keep\open.ps1'

if (-not (Test-Path $launcher)) {
  throw "No se encontro launcher de Keep en: $launcher"
}

Write-Host "[keeplay] Continuando sesion desde launcher canonico..."
& $launcher