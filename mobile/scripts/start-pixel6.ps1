$ErrorActionPreference = 'Stop'

$sdk = $env:ANDROID_SDK_ROOT
if (-not $sdk) { $sdk = $env:ANDROID_HOME }
if (-not $sdk) { $sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }

$emulator = Join-Path $sdk 'emulator\emulator.exe'
$adb = Join-Path $sdk 'platform-tools\adb.exe'
$avdName = 'Pixel_6'

if (-not (Test-Path $emulator)) { throw "No se encontro emulator.exe en: $emulator" }
if (-not (Test-Path $adb)) { throw "No se encontro adb.exe en: $adb" }

$available = & $emulator -list-avds
if ($available -notcontains $avdName) {
  throw "No existe el AVD '$avdName'. Crea el emulador Pixel 6 en Android Studio Device Manager."
}

$running = & $adb devices | Select-String -Pattern '^emulator-\d+\s+device$'
if (-not $running) {
  Start-Process -FilePath $emulator -ArgumentList "@$avdName" | Out-Null
}

& $adb wait-for-device | Out-Null

for ($i = 0; $i -lt 90; $i++) {
  $boot = (& $adb shell getprop sys.boot_completed 2>$null).Trim()
  if ($boot -eq '1') {
    Write-Output 'Pixel 6 emulator listo.'
    exit 0
  }
  Start-Sleep -Seconds 2
}

throw 'El emulador no termino de iniciar dentro del tiempo esperado.'
