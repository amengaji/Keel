# step-fix-tailwind-postcss.ps1
# Creates the missing PostCSS config so Tailwind utilities compile correctly.

$ErrorActionPreference = "Stop"

$webRoot = Join-Path $PSScriptRoot "keel-web"
if (-not (Test-Path $webRoot)) {
  throw "keel-web folder not found. Run this script from your repo root."
}

$postcssPath = Join-Path $webRoot "postcss.config.cjs"

@'
// keel-web/postcss.config.cjs
// PostCSS configuration for Keel Web
// - Enables TailwindCSS + Autoprefixer
// IMPORTANT: Without this file, Tailwind directives in src/index.css will NOT compile.

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
'@ | Set-Content -Encoding UTF8 $postcssPath

Write-Host "Created: keel-web/postcss.config.cjs" -ForegroundColor Green
Write-Host "Next: restart dev server (stop and re-run npm run dev)." -ForegroundColor Cyan
