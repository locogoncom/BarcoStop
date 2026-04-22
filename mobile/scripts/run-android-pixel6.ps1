$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $scriptDir 'start-pixel6.ps1')

function Test-MetroReady {
	try {
		$status = Invoke-WebRequest -Uri 'http://127.0.0.1:8081/status' -UseBasicParsing -TimeoutSec 2
		$body = if ($status.Content -is [byte[]]) {
			[System.Text.Encoding]::UTF8.GetString($status.Content)
		} else {
			[string]$status.Content
		}
		return ($body -match 'packager-status:running')
	}
	catch {
		return $false
	}
}

function Wait-MetroReady {
	param(
		[int]$TimeoutSeconds = 120
	)

	$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
	while ((Get-Date) -lt $deadline) {
		if (Test-MetroReady) {
			return $true
		}
		Start-Sleep -Milliseconds 800
	}

	return $false
}

function Test-BackendReady {
	try {
		$r = Invoke-WebRequest -Uri 'http://127.0.0.1:5000/' -UseBasicParsing -TimeoutSec 2
		return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500)
	}
	catch {
		return $false
	}
}

function Wait-BackendReady {
	param(
		[int]$TimeoutSeconds = 30
	)

	$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
	while ((Get-Date) -lt $deadline) {
		if (Test-BackendReady) {
			return $true
		}
		Start-Sleep -Milliseconds 700
	}

	return $false
}

$sdk = $env:ANDROID_SDK_ROOT
if (-not $sdk) { $sdk = $env:ANDROID_HOME }
if (-not $sdk) { $sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }

$adb = Join-Path $sdk 'platform-tools\adb.exe'
if (-not (Test-Path $adb)) { throw "No se encontro adb.exe en: $adb" }

$deviceId = (& $adb devices | Select-String -Pattern '^\S+\s+device$' | ForEach-Object { ($_ -split '\s+')[0] } | Select-Object -First 1)
if (-not $deviceId) { throw 'No hay dispositivo Android conectado (USB o emulador).' }

Set-Location (Join-Path $scriptDir '..')

$mobileRoot = (Get-Location).Path
$repoRoot = (Resolve-Path (Join-Path $mobileRoot '..')).Path
$serverRoot = Join-Path $repoRoot 'server'

# Ensure backend is running so API calls do not fail with ERR_NETWORK.
if (-not (Test-BackendReady)) {
	if (-not (Test-Path $serverRoot)) {
		throw "No se encontro carpeta server: $serverRoot"
	}
	Start-Process powershell -ArgumentList @(
		'-NoProfile',
		'-ExecutionPolicy', 'Bypass',
		'-Command', "Set-Location '$serverRoot'; node index.js"
	) | Out-Null
	Write-Host '[barcostop] Backend no estaba activo, iniciando en 5000...'
}

if (-not (Wait-BackendReady)) {
	throw 'Backend no responde en http://127.0.0.1:5000/. Revisa errores de server/index.js y vuelve a ejecutar.'
}

# Ensure Metro is running from BarcoStop mobile workspace.
if (-not (Test-MetroReady)) {
	Start-Process powershell -ArgumentList @(
		'-NoProfile',
		'-ExecutionPolicy', 'Bypass',
		'-Command', "Set-Location '$mobileRoot'; npm run start"
	) | Out-Null
	Write-Host '[barcostop] Metro no estaba activo, iniciando...'
}

if (-not (Wait-MetroReady)) {
	throw 'Metro no responde en http://127.0.0.1:8081/status. Cierra procesos node react-native previos y vuelve a ejecutar.'
}

# Keep app identity isolated to BarcoStop regardless of other RN projects.
$gradleProps = Join-Path (Get-Location) 'android\gradle.properties'
$appId = 'com.barcostop.app'
if (Test-Path $gradleProps) {
	$line = Get-Content $gradleProps | Select-String -Pattern '^BARCOSTOP_APPLICATION_ID=' | Select-Object -First 1
	if ($line) {
		$appId = ($line.ToString().Split('=')[1]).Trim()
	}
}

$androidDir = Join-Path (Get-Location) 'android'
Push-Location $androidDir
try {
	$previousErrorActionPreference = $ErrorActionPreference
	$ErrorActionPreference = 'Continue'
	$installOutput = & cmd /c ".\gradlew.bat installDebug" 2>&1
	$installExitCode = $LASTEXITCODE
	$ErrorActionPreference = $previousErrorActionPreference
	if ($installExitCode -ne 0) {
		$joined = ($installOutput | Out-String)
		if ($joined -match 'INSTALL_FAILED_UPDATE_INCOMPATIBLE') {
			Write-Host "[barcostop] Firma incompatible detectada para $appId. Desinstalando app previa y reintentando..."
			& $adb -s $deviceId uninstall $appId | Out-Null
			$previousErrorActionPreference = $ErrorActionPreference
			$ErrorActionPreference = 'Continue'
			$installOutput = & cmd /c ".\gradlew.bat installDebug" 2>&1
			$installExitCode = $LASTEXITCODE
			$ErrorActionPreference = $previousErrorActionPreference
			if ($installExitCode -ne 0) {
				$installOutput | Write-Host
				throw 'installDebug fallo incluso despues de desinstalar la app previa.'
			}
		} else {
			$installOutput | Write-Host
			throw 'installDebug fallo. Revisa salida anterior.'
		}
	}
}
finally {
	Pop-Location
}

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$reverse8081Remove = & $adb -s $deviceId reverse --remove tcp:8081 2>&1
$reverse8081ExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousErrorActionPreference
if ($reverse8081ExitCode -ne 0 -and ($reverse8081Remove | Out-String) -notmatch "listener 'tcp:8081' not found") {
	$reverse8081Remove | Write-Host
	throw 'No se pudo limpiar adb reverse para tcp:8081.'
}
& $adb -s $deviceId reverse tcp:8081 tcp:8081 | Out-Null

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$reverse5000Remove = & $adb -s $deviceId reverse --remove tcp:5000 2>&1
$reverse5000ExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousErrorActionPreference
if ($reverse5000ExitCode -ne 0 -and ($reverse5000Remove | Out-String) -notmatch "listener 'tcp:5000' not found") {
	$reverse5000Remove | Write-Host
	throw 'No se pudo limpiar adb reverse para tcp:5000.'
}
& $adb -s $deviceId reverse tcp:5000 tcp:5000 | Out-Null
& $adb -s $deviceId shell monkey -p $appId -c android.intent.category.LAUNCHER 1 | Out-Null
Write-Output "BarcoStop abierto en $deviceId con paquete $appId"
