@echo off
For /f %%a in ('powershell -Command "Get-Date -format dd_MM_yyyy_HHMM"') do set datetime=%%a
set BACKUP_FILE=c:\JS\JSP\AAM\DB_BackUp\BackupDB_%datetime%h.sql
SET PGPASSWORD=5236
echo on
C:\"Program Files"\PostgreSQL\13\bin\pg_dump -h localhost -p 5432 -U postgres -F c -b -v -f %BACKUP_FILE% AAM_DB
