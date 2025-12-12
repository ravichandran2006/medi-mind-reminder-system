<#
Non-interactive wrapper to run clean-index and push the repo.

Usage:
  powershell -ExecutionPolicy Bypass -File .\scripts\push-all.ps1

This script:
- Runs the interactive `clean-index.ps1` in non-interactive mode where possible
- Ensures .gitignore and .gitattributes are staged
- Commits any staged changes with a standard message
- Pulls with rebase from origin/main
- Pushes to origin/main

IMPORTANT: This script runs commands that modify your local git index and pushes to remote.
Ensure you have local backups or are comfortable with these operations before running.
#>

Set-StrictMode -Version Latest

function Abort-WithMessage($msg) {
    Write-Host "ERROR: $msg" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path .git)) {
    Abort-WithMessage "Not a git repository root. Run from the repository root."
}

Write-Host "Running cleanup script (clean-index.ps1)..." -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File .\scripts\clean-index.ps1
if ($LASTEXITCODE -ne 0) {
    Abort-WithMessage "clean-index.ps1 failed or exited with an error. Resolve issues and retry."
}

Write-Host "Staging any remaining changes..." -ForegroundColor Cyan
git add -A

$staged = git diff --cached --name-only
if ($staged) {
    Write-Host "Committing changes..." -ForegroundColor Green
    git commit -m "chore(repo): update ignores and cleanup" || Write-Host "Commit returned non-zero (maybe nothing to commit)" -ForegroundColor Yellow
} else {
    Write-Host "No staged changes to commit." -ForegroundColor Yellow
}

Write-Host "Fetching and rebasing onto origin/main..." -ForegroundColor Cyan
git fetch origin || Abort-WithMessage "git fetch failed"
try {
    git pull --rebase origin main
} catch {
    Write-Host "Rebase failed. Resolve conflicts manually then run 'git rebase --continue' or run the interactive script." -ForegroundColor Red
    Abort-WithMessage "Rebase failed"
}

Write-Host "Pushing to origin/main..." -ForegroundColor Cyan
git push origin main || Abort-WithMessage "Push failed. You may need to run 'git push --force-with-lease' if you understand the implications."

Write-Host "Push complete." -ForegroundColor Green
