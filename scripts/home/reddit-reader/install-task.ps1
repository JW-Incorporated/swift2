[CmdletBinding(SupportsShouldProcess)]
param(
  [Parameter(Mandatory = $true)]
  [string]$EnvFilePath,

  [string]$TaskName = 'Long Live Reddit Reader'
)

$ErrorActionPreference = 'Stop'

$envFile = Resolve-Path -LiteralPath $EnvFilePath
if (-not (Test-Path -LiteralPath $envFile -PathType Leaf)) {
  throw 'EnvFilePath must identify an existing local file.'
}

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..\..')
$readerPath = Join-Path $PSScriptRoot 'reader.mjs'
$node = Get-Command node.exe -ErrorAction Stop
$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

$quotedEnv = '"' + $envFile.Path.Replace('"', '\"') + '"'
$quotedReader = '"' + $readerPath.Replace('"', '\"') + '"'
$action = New-ScheduledTaskAction `
  -Execute $node.Source `
  -Argument "--env-file=$quotedEnv --import tsx $quotedReader" `
  -WorkingDirectory $repoRoot.Path

$repeat = New-ScheduledTaskTrigger `
  -Once `
  -At ((Get-Date).AddMinutes(1)) `
  -RepetitionInterval (New-TimeSpan -Minutes 60) `
  -RepetitionDuration ([TimeSpan]::MaxValue)
$startup = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -WakeToRun `
  -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 15)
$principal = New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
$task = New-ScheduledTask `
  -Action $action `
  -Trigger @($repeat, $startup) `
  -Settings $settings `
  -Principal $principal `
  -Description 'Anonymous RSS and public JSON Reddit reader for Long Live.'

if ($PSCmdlet.ShouldProcess($TaskName, 'Register Windows scheduled task')) {
  Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force | Out-Null
  Write-Output "Registered scheduled task '$TaskName'."
}
