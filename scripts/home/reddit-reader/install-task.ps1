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
$minerPath = Join-Path $repoRoot.Path 'scripts\community\theory-miner.mjs'
$node = Get-Command node.exe -ErrorAction Stop
$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

$quotedEnv = '"' + $envFile.Path.Replace('"', '\"') + '"'
$quotedReader = '"' + $readerPath.Replace('"', '\"') + '"'
$quotedMiner = '"' + $minerPath.Replace('"', '\"') + '"'
$readerAction = New-ScheduledTaskAction `
  -Execute $node.Source `
  -Argument "--env-file=$quotedEnv --import tsx $quotedReader" `
  -WorkingDirectory $repoRoot.Path
$minerAction = New-ScheduledTaskAction `
  -Execute $node.Source `
  -Argument "--env-file=$quotedEnv --import tsx $quotedMiner" `
  -WorkingDirectory $repoRoot.Path

$repeat = New-ScheduledTaskTrigger -Daily -At '12:00 AM'
$repeat.Repetition = (New-ScheduledTaskTrigger -Once -At '12:00 AM' `
  -RepetitionInterval (New-TimeSpan -Hours 1) `
  -RepetitionDuration (New-TimeSpan -Days 1)).Repetition
$startup = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -WakeToRun `
  -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 55)
$principal = New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
$task = New-ScheduledTask `
  -Action @($readerAction, $minerAction) `
  -Trigger @($repeat, $startup) `
  -Settings $settings `
  -Principal $principal `
  -Description 'Anonymous Reddit reader and capped fan-theory miner for Long Live.'

if ($PSCmdlet.ShouldProcess($TaskName, 'Register Windows scheduled task')) {
  Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force | Out-Null
  Write-Output "Registered scheduled task '$TaskName'."
}
