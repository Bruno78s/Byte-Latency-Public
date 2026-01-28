@echo off

title Limpeza de Cache de Impressoras
color 0C
echo Limpando cache de impressoras...
net stop spooler
del /q /f /s "%windir%\System32\spool\PRINTERS\*" >nul 2>&1
net start spooler
echo Limpeza concluida!
pause
exit
