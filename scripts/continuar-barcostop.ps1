$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$mobileRoot = Join-Path $repoRoot 'mobile'
$activateScript = Join-Path $mobileRoot 'scripts\activate-barcostop.ps1'

if (-not (Test-Path $activateScript)) {
  throw "No se encontro el script de activacion: $activateScript"
}

Set-Location $mobileRoot
Write-Host '[barcostop] Continuando sesion de BarcoStop...'
& $activateScript
