<#
Safe Git cleanup script for Windows PowerShell

What it does:
- Shows git status and prompts to continue
- Creates a backup branch `backup-main-before-clean-<timestamp>`
- Stashes uncommitted changes (optional)
- Fetches and rebases local `main` onto `origin/main`
- Untracks common noisy files (venv, node_modules, .env, nenv)
- Adds `.gitignore` and `.gitattributes`, renormalizes line endings
- Commits and pushes the result to `origin/main`

Usage:
  Open PowerShell at the repository root and run:
    powershell -ExecutionPolicy Bypass -File .\scripts\clean-index.ps1

Notes:
- This script does not rewrite history. If remote contains large files already committed,
  use a history-rewrite tool (BFG or git filter-repo) — contact me for guidance.
- If the rebase encounters conflicts, the script will stop and instruct next steps.
#>

function Abort-WithMessage($msg) {
    Write-Host "ERROR: $msg" -ForegroundColor Red
    exit 1
}

# Ensure we're in a git repo
if (-not (Test-Path .git)) {
    Abort-WithMessage "This script must be run from the repository root (where .git resides)."
}

Write-Host "== Git cleanup script starting ==" -ForegroundColor Cyan

git --version | Out-Null

Write-Host "Current git status:" -ForegroundColor Yellow
git status --porcelain

$confirm = Read-Host "Proceed with cleanup (creates backup branch, may stash, then pull/rebase)? (y/n)"
if ($confirm -ne 'y') { Abort-WithMessage "User cancelled." }

# Create backup branch
$timestamp = (Get-Date).ToString('yyyyMMdd_HHmmss')
$backupBranch = "backup-main-before-clean-$timestamp"
Write-Host "Creating backup branch: $backupBranch" -ForegroundColor Green
git branch $backupBranch || Abort-WithMessage "Failed to create backup branch"

# Detect uncommitted changes
$hasChanges = (git status --porcelain) -ne ''
if ($hasChanges) {
    $stashAnswer = Read-Host "Uncommitted changes detected. Stash them before proceeding? (y/n)"
    if ($stashAnswer -eq 'y') {
        git stash push -m "WIP: stash before clean-index $timestamp" | Out-Null
        Write-Host "Stashed changes." -ForegroundColor Green
    } else {
        Write-Host "Proceeding without stashing. Ensure you won't lose local edits." -ForegroundColor Yellow
    }
}

Write-Host "Fetching origin..." -ForegroundColor Cyan
git fetch origin || Abort-WithMessage "git fetch failed"

Write-Host "Rebasing local main onto origin/main..." -ForegroundColor Cyan
try {
    git checkout main || Abort-WithMessage "Failed to checkout main"
    git pull --rebase origin main
} catch {
    Write-Host "Rebase/pull failed. Resolve conflicts manually, then run: git rebase --continue" -ForegroundColor Red
    Abort-WithMessage "Rebase stopped due to conflicts"
}

Write-Host "Staging .gitignore and .gitattributes" -ForegroundColor Cyan
git add .gitignore .gitattributes

Write-Host "Untracking common unwanted files (venv, node_modules, .env, nenv)" -ForegroundColor Cyan
# Remove from index but keep locally
git rm -r --cached venv 2>$null
git rm -r --cached node_modules 2>$null
git rm -r --cached backend/node_modules 2>$null
git rm --cached .env 2>$null
git rm --cached backend/.env 2>$null
git rm --cached nenv 2>$null

Write-Host "Showing ignored-but-tracked files (if any):" -ForegroundColor Yellow
git ls-files -i --exclude-standard | Select-Object -First 50

Write-Host "Renormalizing line endings per .gitattributes..." -ForegroundColor Cyan
git add --renormalize .

Write-Host "Staging all changes..." -ForegroundColor Cyan
git add -A

# Only commit if there are staged changes
$staged = git diff --cached --name-only
if ($staged) {
    Write-Host "Committing staged changes..." -ForegroundColor Green
    git commit -m "Update .gitignore/.gitattributes; stop tracking venv/node_modules/.env; normalize line endings" || Abort-WithMessage "Commit failed"
} else {
    Write-Host "No changes to commit." -ForegroundColor Yellow
}

Write-Host "Pushing to origin/main..." -ForegroundColor Cyan
git push origin main || Abort-WithMessage "Push failed. You may need to resolve remote changes first."

Write-Host "Done. If you stashed earlier, run 'git stash pop' to restore your working changes." -ForegroundColor Green
