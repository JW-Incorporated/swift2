$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$taskName = 'Long Live Weekly Facebook Export'
$logSetup = '$log = Join-Path $env:LOCALAPPDATA ''longlive-fb\fb-export.log''; New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null; '
$logPipe = ' 2>&1 | ForEach-Object { Add-Content -LiteralPath $log -Value (''{0:o} {1}'' -f (Get-Date), $_); $_ }; exit $LASTEXITCODE'
$command = "$logSetup" + "Set-Location -LiteralPath '$($repoRoot.Replace("'", "''"))'; & '$($npm.Replace("'", "''"))' run knowledge:fb-export" + $logPipe

$action = New-ScheduledTaskAction `
  -Execute 'powershell.exe' `
  -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command `"$command`""
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At '11:00 PM'
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 5)
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

Write-Output "Registered '$taskName' for Sundays at 23:00 local time (wake + run after missed start enabled)."
