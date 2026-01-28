@echo off

title Limpeza de Logs de Atualizacoes
color 1E

echo Limpando logs de atualizacoes do Windows...
del /q /f /s "%windir%\SoftwareDistribution\DataStore\Logs\*" >nul 2>&1
del /q /f /s "%windir%\Logs\CBS\*" >nul 2>&1
echo Limpeza concluida!
pause
exit
