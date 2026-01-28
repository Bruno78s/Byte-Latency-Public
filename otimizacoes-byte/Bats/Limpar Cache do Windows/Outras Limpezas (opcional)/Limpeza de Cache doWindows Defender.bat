@echo off

title Limpeza de Cache do Windows Defender
color 0E

echo Limpando cache do Windows Defender...
cd %ProgramData%\Microsoft\Windows Defender\Scans\History
del /q /f /s *.*
echo Limpeza concluida!
pause
exit
