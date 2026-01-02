# step-fix-tailwind-postcss-v4.ps1
# Fixes Tailwind PostCSS plugin for newer Tailwind versions
# - Installs @tailwindcss/postcss
# - Updates keel-web/postcss.config.cjs to use '@tailwindcss/postcss' instead of 'tailwindcss'
# - You MUST restart Vite after this

$ErrorActionPreference = "Stop"

$webRoot = Join-Path $PSScriptRoot "keel-web"
if (-not (Test-Path $webRoot)) {
  throw "keel-web folder not found. Run this from your repo root."
}

Set-Location $webRoot

Write-Host "1) Installing @tailwindcss/postcss..." -ForegroundColor Yellow
npm install -D @tailwindcss/postcss

Write-Host "2) Writing PostCSS config (Tailwind v4 compatible)..." -ForegroundColor Yellow

@'
// keel-web/postcss.config.cjs
// PostCSS configuration for Keel Web
// - Tailwind PostCSS plugin (new package): @tailwindcss/postcss
// - Autoprefixer for cross-browser CSS compatibility
//
// NOTE:
// Tailwind's PostCSS plugin moved out of 'tailwindcss'.
// If you use 'tailwindcss' here, Vite will throw:
// "trying to use tailwindcss directly as a PostCSS plugin..."

module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
'@ | Set-Content -Encoding UTF8 ".\postcss.config.cjs"

Write-Host "Done. Now restart Vite: stop dev server (Ctrl+C) and run npm run dev again." -ForegroundColor Green
