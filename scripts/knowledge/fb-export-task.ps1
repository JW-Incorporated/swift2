param(
  [string[]]$TopGroupSlugs = @(
    'taylor-swifts-vault',
    'kulto-ni-taylor-swift',
    'taylor-swifts-vault-2-0'
  )
)

$ErrorActionPreference = 'Stop'
if (($TopGroupSlugs | Select-Object -Unique).Count -ne 3) {
  throw 'TopGroupSlugs must contain exactly three unique checklist slugs.'
}

. (Join-Path $env:USERPROFILE 'bin\hidden\HiddenTask.ps1')
$runner = Join-Path $PSScriptRoot 'fb-export-run.ps1'
$topGroups = $TopGroupSlugs -join ','
$principal = New-ScheduledTaskPrincipal -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 5)

function Register-FacebookExportTask($Name, $Cadence, $Trigger, $Description) {
  $action = New-HiddenTaskAction -Execute 'powershell.exe' -Argument @('-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', $runner, '-Cadence', $Cadence, '-TopGroups', $topGroups)
  Register-ScheduledTask -TaskName $Name -Action $action -Trigger $Trigger -Settings $settings -Principal $principal -Description $Description -Force | Out-Null
}

Register-FacebookExportTask 'Long Live Daily Facebook Export' 'daily' (New-ScheduledTaskTrigger -Daily -At '11:00 PM') 'Collect the configured top three Facebook groups daily.'
Register-FacebookExportTask 'Long Live Weekly Facebook Export' 'weekly' (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At '11:30 PM') 'Collect all Facebook groups except the configured top three weekly.'

Write-Output "Registered daily top-three and weekly-rest Facebook exports. Top three: $topGroups"
