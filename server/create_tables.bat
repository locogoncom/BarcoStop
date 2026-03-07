@echo off
cd /d C:\BarcoStop\server
mysql -u locogon -p$8B8!!y7?!W0nY94 locogon_db0 < database\init.sql
if %errorlevel% equ 0 (
    echo Tablas creadas exitosamente
) else (
    echo Error al crear tablas
)
pause
