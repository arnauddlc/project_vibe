$ImageName = "pm-app"
$ContainerName = "pm-app"

if (docker ps -a --format "{{.Names}}" | Select-String -SimpleMatch $ContainerName) {
  docker rm -f $ContainerName | Out-Null
}

docker build -t $ImageName .
docker run -d --name $ContainerName -p 8000:8000 $ImageName | Out-Null

Write-Host "Server running at http://localhost:8000"
