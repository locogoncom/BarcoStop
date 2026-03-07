$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $scriptDir 'start-pixel6.ps1')

$sdk = $env:ANDROID_SDK_ROOT
if (-not $sdk) { $sdk = $env:ANDROID_HOME }
if (-not $sdk) { $sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }

$adb = Join-Path $sdk 'platform-tools\adb.exe'
if (-not (Test-Path $adb)) { throw "No se encontro adb.exe en: $adb" }

$deviceId = (& $adb devices | Select-String -Pattern '^emulator-\d+\s+device$' | ForEach-Object { ($_ -split '\s+')[0] } | Select-Object -First 1)
if (-not $deviceId) { throw 'No hay emulador Android conectado.' }

Set-Location (Join-Path $scriptDir '..')
npx react-native run-android --deviceId $deviceId
