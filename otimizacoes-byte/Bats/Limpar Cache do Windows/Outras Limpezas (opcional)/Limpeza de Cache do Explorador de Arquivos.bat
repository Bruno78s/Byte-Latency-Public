@echo off

title Limpeza de Cache do Explorador de Arquivos

color 0B
echo Limpando cache do explorador de arquivos...
del /q /f "%localappdata%\Microsoft\Windows\Explorer\thumbcache_*.db" >nul 2>&1
del /q /f "%appdata%\Microsoft\Windows\Recent\*" >nul 2>&1
echo Limpeza concluida!
pause
exit
