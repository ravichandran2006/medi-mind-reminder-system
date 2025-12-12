# Start both Frontend and Backend
Write-Host "🚀 Starting Medi-Mind Reminder System..." -ForegroundColor Green
Write-Host ""

# Start Backend in a new window
Write-Host "📦 Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend: http://localhost:5001" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
npm run dev

