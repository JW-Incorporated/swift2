param(
  [Parameter(Mandatory = $true)]
  [string]$EnvFilePath,

  [string]$Script = 'scripts\home\reddit-reader\reader.mjs',

  [string]$LogName = 'home-reddit-reader',

  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$ReaderArgs
)

$ErrorActionPreference = 'Continue'

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..\..')).Path
$artifacts = Join-Path $repoRoot '.artifacts'
New-Item -ItemType Directory -Force -Path $artifacts | Out-Null
$log = Join-Path $artifacts "$LogName.log"
$reader = Join-Path $repoRoot $Script

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
