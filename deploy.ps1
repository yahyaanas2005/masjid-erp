# 🚀 Quick Deploy Script for Masjid ERP
# This script helps you deploy your Masjid ERP to production

Write-Host "🕌 Masjid ERP - Quick Deployment Script" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Check if Git is installed
Write-Host "Checking prerequisites..." -ForegroundColor Cyan
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git is not installed. Please install Git first." -ForegroundColor Red
    Write-Host "Download from: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Git is installed`n" -ForegroundColor Green

# Step 1: Initialize Git Repository
Write-Host "Step 1: Initializing Git Repository..." -ForegroundColor Cyan
if (-not (Test-Path ".git")) {
    git init
    Write-Host "✅ Git repository initialized`n" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Git repository already exists`n" -ForegroundColor Yellow
}

# Step 2: Add all files
Write-Host "Step 2: Adding files to Git..." -ForegroundColor Cyan
git add .
Write-Host "✅ Files added`n" -ForegroundColor Green

# Step 3: Commit
Write-Host "Step 3: Creating initial commit..." -ForegroundColor Cyan
git commit -m "Initial commit - Masjid ERP v1.0"
Write-Host "✅ Commit created`n" -ForegroundColor Green

# Step 4: Instructions for GitHub
Write-Host "`n📋 Next Steps:" -ForegroundColor Green
Write-Host "=============" -ForegroundColor Green
Write-Host ""
Write-Host "1. Create a new repository on GitHub:" -ForegroundColor Yellow
Write-Host "   - Go to https://github.com/new" -ForegroundColor White
Write-Host "   - Name: masjid-erp" -ForegroundColor White
Write-Host "   - Keep it Private (recommended)" -ForegroundColor White
Write-Host "   - Don't initialize with README" -ForegroundColor White
Write-Host ""
Write-Host "2. After creating the repository, run these commands:" -ForegroundColor Yellow
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/masjid-erp.git" -ForegroundColor White
Write-Host "   git branch -M main" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "3. Deploy to Vercel:" -ForegroundColor Yellow
Write-Host "   - Go to https://vercel.com" -ForegroundColor White
Write-Host "   - Click 'Add New' → 'Project'" -ForegroundColor White
Write-Host "   - Import your GitHub repository" -ForegroundColor White
Write-Host "   - Add environment variables (see DEPLOYMENT_GUIDE.md)" -ForegroundColor White
Write-Host "   - Click 'Deploy'" -ForegroundColor White
Write-Host ""
Write-Host "4. Initialize Database:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor White
Write-Host "   node scripts/init-db.js" -ForegroundColor White
Write-Host ""
Write-Host "📖 For detailed instructions, see DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Your code is ready for deployment!" -ForegroundColor Green
