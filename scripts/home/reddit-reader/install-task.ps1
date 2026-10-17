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
$wrapperPath = Join-Path $PSScriptRoot 'run-task.ps1'
$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

# The env path is its own argument; run-task.ps1 builds --env-file= itself.
$action = New-ScheduledTaskAction `
  -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$wrapperPath`" -EnvFilePath `"$($envFile.Path)`"" `
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
