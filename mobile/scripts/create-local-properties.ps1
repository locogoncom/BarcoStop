$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobileRoot = Resolve-Path (Join-Path $scriptDir '..')
$androidDir = Join-Path $mobileRoot 'android'
$localPropertiesPath = Join-Path $androidDir 'local.properties'

$sdk = $env:ANDROID_SDK_ROOT
if (-not $sdk) { $sdk = $env:ANDROID_HOME }
if (-not $sdk -and $env:LOCALAPPDATA) { $sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }

if (-not $sdk) {
  throw "No se encontro Android SDK. Define ANDROID_SDK_ROOT o ANDROID_HOME."
}

if (-not (Test-Path $sdk)) {
  throw "La ruta del Android SDK no existe: $sdk"
}

$escapedSdk = $sdk.Replace('\', '\\')
"sdk.dir=$escapedSdk" | Set-Content -Path $localPropertiesPath -Encoding ASCII

Write-Output "Archivo creado: $localPropertiesPath"
Write-Output "sdk.dir=$escapedSdk"
