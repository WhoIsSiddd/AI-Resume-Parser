# Reset Ports Script (Windows)
# This script kills any process using port 3001 or 8000

$ports = @(3001, 8000)

foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "Cleaning up port $port (PID: $($process.OwningProcess))..." -ForegroundColor Yellow
        Stop-Process -Id $process.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "Port $port is now free." -ForegroundColor Green
    } else {
        Write-Host "Port $port is already free." -ForegroundColor Gray
    }
}

Write-Host "`nAll ports reset! You can now start your servers." -ForegroundColor Cyan
