$ContainerName = "pm-app"

docker stop $ContainerName | Out-Null
if ($LASTEXITCODE -eq 0) {
  docker rm $ContainerName | Out-Null
}

Write-Host "Server stopped."
