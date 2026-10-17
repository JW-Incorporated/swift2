param(
  [Parameter(Mandatory = $true)]
  [string]$EnvFilePath,

  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$ReaderArgs
)

$ErrorActionPreference = 'Continue'

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..\..')).Path
$artifacts = Join-Path $repoRoot '.artifacts'
New-Item -ItemType Directory -Force -Path $artifacts | Out-Null
$log = Join-Path $artifacts 'home-reddit-reader.log'
$reader = Join-Path $PSScriptRoot 'reader.mjs'

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$node = if ($nodeCmd) { $nodeCmd.Source } else { 'C:\Program Files\nodejs\node.exe' }

Add-Content -LiteralPath $log -Value "[$(Get-Date -Format o)] start"
Set-Location -LiteralPath $repoRoot
$code = 1
try {
  & $node "--env-file=$EnvFilePath" --import tsx $reader @ReaderArgs 2>&1 | ForEach-Object { "$_" } | Out-File -LiteralPath $log -Append -Encoding utf8
  $code = $LASTEXITCODE
} catch {
  Add-Content -LiteralPath $log -Value "error: $($_.Exception.Message)"
}
Add-Content -LiteralPath $log -Value "[$(Get-Date -Format o)] exit $code"
exit $code
