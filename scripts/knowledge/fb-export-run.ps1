param(
  [Parameter(Mandatory = $true)][ValidateSet('daily', 'weekly')][string]$Cadence,
  [Parameter(Mandatory = $true)][string]$TopGroups
)

# Run by the Facebook export scheduled tasks (via the windowless ~/bin/hidden launcher): logs to
# %LOCALAPPDATA%\longlive-fb\fb-export.log and returns the npm exit code.
$ErrorActionPreference = 'Stop'
$log = Join-Path $env:LOCALAPPDATA 'longlive-fb\fb-export.log'
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
Set-Location -LiteralPath $repoRoot

# Native stderr under 2>&1 must not terminate the run (PS 5.1 raises NativeCommandError when Stop).
$ErrorActionPreference = 'Continue'
& $npm run knowledge:fb-export -- --cadence $Cadence --top-groups $TopGroups 2>&1 |
  ForEach-Object { Add-Content -LiteralPath $log -Value ('{0:o} {1}' -f (Get-Date), $_); $_ }
exit $LASTEXITCODE
