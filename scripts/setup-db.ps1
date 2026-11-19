# Crea el usuario y la base de datos de desarrollo a partir de DATABASE_URL (.env).
# Uso:  powershell -ExecutionPolicy Bypass -File scripts\setup-db.ps1
# psql pedirá la contraseña del superusuario "postgres" (no se guarda en ningún lado).

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$line = Get-Content (Join-Path $root ".env") | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
if (-not $line) { throw "No se encontró DATABASE_URL en .env" }
$url = ($line -replace '^DATABASE_URL=', '').Trim('"')
if ($url -notmatch '^postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/([^?]+)') { throw "DATABASE_URL con formato inesperado" }
$user = $Matches[1]; $pass = $Matches[2]; $dbHost = $Matches[3]; $port = $Matches[4]; $db = $Matches[5]

$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $psql)) { $psql = "psql" }

$sql = @"
DO `$`$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$user') THEN
    CREATE ROLE $user LOGIN PASSWORD '$pass' CREATEDB;
  ELSE
    ALTER ROLE $user WITH LOGIN PASSWORD '$pass' CREATEDB;
  END IF;
END `$`$;
"@

$sec = Read-Host "Contraseña del usuario 'postgres'" -AsSecureString
$env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))

$tmp = New-TemporaryFile
Set-Content -Path $tmp -Value $sql -Encoding ascii
Write-Host "Conectando como 'postgres' a $dbHost`:$port ..."
& $psql -U postgres -h $dbHost -p $port -d postgres -v ON_ERROR_STOP=1 -f $tmp
Remove-Item $tmp
& $psql -U postgres -h $dbHost -p $port -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$db'" | Out-String | ForEach-Object {
  if ($_.Trim() -ne "1") {
    & $psql -U postgres -h $dbHost -p $port -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $db OWNER $user;"
  }
}
Remove-Item Env:PGPASSWORD
Write-Host "Listo: usuario '$user' y base '$db' disponibles."
