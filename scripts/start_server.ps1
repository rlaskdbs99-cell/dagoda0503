$port = 5173
$root = "C:\Users\FAMILY\Desktop\포트폴리오"

$connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($connections) {
  $pid = $connections[0].OwningProcess
  if ($pid) {
    Stop-Process -Id $pid -Force
  }
}

Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $root
Write-Output "Server started at http://localhost:$port"
