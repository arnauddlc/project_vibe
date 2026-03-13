$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

$ImageName = "pm-app"
$ContainerName = "pm-app"
$Foreground = $env:PM_FOREGROUND -eq "1"
$EnvFile = Join-Path $RootDir ".env"
$EnvArgs = @()

if (Test-Path $EnvFile) {
  $EnvArgs = @("--env-file", $EnvFile)
} else {
  Write-Host "Warning: .env not found. OPENROUTER_API_KEY will be unavailable."
}

if (docker ps -a --format "{{.Names}}" | Select-String -SimpleMatch $ContainerName) {
  docker rm -f $ContainerName | Out-Null
}

docker build -t $ImageName .

if ($Foreground) {
  Write-Host "Starting server at http://localhost:8000"
  docker run --rm --name $ContainerName -p 8000:8000 @EnvArgs $ImageName
} else {
  docker run -d --name $ContainerName -p 8000:8000 @EnvArgs $ImageName | Out-Null
  Write-Host "Server running at http://localhost:8000"
}
