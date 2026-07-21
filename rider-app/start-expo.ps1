# Start Raydo rider-app for Expo Go (fixes wrong Windows IP issue)
# Usage: right-click -> Run with PowerShell, OR: powershell -ExecutionPolicy Bypass -File .\start-expo.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# Detect active Wi-Fi IPv4 (skip 169.254 link-local)
$wifiIp = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.InterfaceAlias -match "Wi-?Fi|WLAN|Wireless"
  } |
  Select-Object -ExpandProperty IPAddress -First 1

if (-not $wifiIp) {
  $wifiIp = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } |
    Select-Object -ExpandProperty IPAddress -First 1
}

if (-not $wifiIp) {
  Write-Host "Could not detect LAN IP. Starting with --tunnel instead..." -ForegroundColor Yellow
  npx expo start --tunnel
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "=== Raydo Rider ===" -ForegroundColor Cyan
Write-Host "Using Wi-Fi IP: $wifiIp" -ForegroundColor Green
Write-Host "In Expo Go, open: exp://${wifiIp}:8081" -ForegroundColor Green
Write-Host "If scan fails, type this URL manually in Expo Go." -ForegroundColor Yellow
Write-Host ""

$env:REACT_NATIVE_PACKAGER_HOSTNAME = $wifiIp
$env:EXPO_DEVTOOLS_LISTEN_ADDRESS = "0.0.0.0"

npx expo start --lan --port 8081
