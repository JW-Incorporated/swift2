[CmdletBinding(SupportsShouldProcess)]
param(
  [Parameter(Mandatory = $true)]
  [string]$EnvFilePath,

  [string]$TaskName = 'Long Live Reddit Reader',

  [string]$OutcomesTaskName = 'Long Live Reddit Outcomes'
)

$ErrorActionPreference = 'Stop'

$envFile = Resolve-Path -LiteralPath $EnvFilePath
if (-not (Test-Path -LiteralPath $envFile -PathType Leaf)) {
  throw 'EnvFilePath must identify an existing local file.'
}

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..\..')
$wrapperPath = Join-Path $PSScriptRoot 'run-task.ps1'
Get-Command node.exe -ErrorAction Stop | Out-Null
$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

# The env path is its own argument; run-task.ps1 builds --env-file= itself.
$readerAction = New-ScheduledTaskAction `
  -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$wrapperPath`" -EnvFilePath `"$($envFile.Path)`"" `
  -WorkingDirectory $repoRoot.Path
$minerAction = New-ScheduledTaskAction `
  -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$wrapperPath`" -EnvFilePath `"$($envFile.Path)`" -Script scripts\community\theory-miner.mjs -LogName home-theory-miner" `
  -WorkingDirectory $repoRoot.Path
$outcomesAction = New-ScheduledTaskAction `
  -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$wrapperPath`" -EnvFilePath `"$($envFile.Path)`" -Script scripts\home\reddit-reader\outcomes.mjs -LogName home-reddit-outcomes -PlainNode" `
  -WorkingDirectory $repoRoot.Path
$readerRepeat = New-ScheduledTaskTrigger -Daily -At '12:00 AM'
$readerRepeat.Repetition = (New-ScheduledTaskTrigger -Once -At '12:00 AM' `
  -RepetitionInterval (New-TimeSpan -Hours 1) `
  -RepetitionDuration (New-TimeSpan -Days 1)).Repetition
$outcomesRepeat = New-ScheduledTaskTrigger -Daily -At '12:30 AM'
$outcomesRepeat.Repetition = (New-ScheduledTaskTrigger -Once -At '12:30 AM' `
  -RepetitionInterval (New-TimeSpan -Hours 2) `
  -RepetitionDuration (New-TimeSpan -Days 1)).Repetition
$startup = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -WakeToRun `
  -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 55)
$principal = New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
$readerTask = New-ScheduledTask `
  -Action @($readerAction, $minerAction) `
  -Trigger @($readerRepeat, $startup) `
  -Settings $settings `
  -Principal $principal `
  -Description 'Anonymous Reddit reader and capped fan-theory miner for Long Live.'
$outcomesTask = New-ScheduledTask `
  -Action $outcomesAction `
  -Trigger $outcomesRepeat `
  -Settings $settings `
  -Principal $principal `
  -Description 'Anonymous Reddit comment outcomes reader and weekly community report for Long Live.'

if ($PSCmdlet.ShouldProcess($TaskName, 'Register Windows scheduled task')) {
  Register-ScheduledTask -TaskName $TaskName -InputObject $readerTask -Force | Out-Null
  Write-Output "Registered scheduled task '$TaskName'."
}
if ($PSCmdlet.ShouldProcess($OutcomesTaskName, 'Register Windows scheduled task')) {
  Register-ScheduledTask -TaskName $OutcomesTaskName -InputObject $outcomesTask -Force | Out-Null
  Write-Output "Registered scheduled task '$OutcomesTaskName'."
}
