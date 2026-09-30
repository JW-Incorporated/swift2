$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$taskName = 'Long Live Weekly Facebook Export'
$command = "Set-Location -LiteralPath '$($repoRoot.Replace("'", "''"))'; & '$($npm.Replace("'", "''"))' run knowledge:fb-export"

$action = New-ScheduledTaskAction `
  -Execute 'powershell.exe' `
  -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command `"$command`""
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At '6:00 PM'
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -ExecutionTimeLimit (New-TimeSpan -Hours 3)
$userId = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Principal $principal `
  -Description 'Collect, validate, and upload the weekly Long Live Facebook group exports.' `
  -Force | Out-Null

Write-Output "Registered '$taskName' for Sundays at 18:00 local time (wake + run after missed start enabled)."
