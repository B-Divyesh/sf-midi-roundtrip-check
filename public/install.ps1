$ErrorActionPreference = "Stop"
$repo = "B-Divyesh/sf-midi-roundtrip-check"
$base = "https://github.com/$repo/releases/latest/download"
$manifest = Invoke-RestMethod "$base/latest.json"
$url = $manifest.assets.windows.url
if (-not $url) { throw "Release manifest has no Windows build." }
$name = Split-Path $url -Leaf
$target = Join-Path $env:TEMP $name
Invoke-WebRequest $url -OutFile $target
$sums = (Invoke-WebRequest "$base/SHA256SUMS").Content
$expected = (($sums -split "`n" | Where-Object { $_ -match [regex]::Escape($name) }) -split '\s+')[0]
$actual = (Get-FileHash $target -Algorithm SHA256).Hash.ToLower()
if ($actual -ne $expected.ToLower()) { Remove-Item $target; throw "SHA256 verification failed." }
Write-Host "Verified $name. Starting the unsigned installer; Windows may show a SmartScreen notice."
Start-Process $target
