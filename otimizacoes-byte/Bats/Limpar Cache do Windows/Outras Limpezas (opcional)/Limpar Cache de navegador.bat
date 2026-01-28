@echo off

mode con: cols=67 lines=16
color 1E
title Limpador de Cache de Navegadores

:menu
cls
echo.
echo.
echo 	 ===============================================
echo       			  LIMPEZA DE CACHE
echo 	 ===============================================
echo 		[1] Limpar cache do Google Chrome
echo 		[2] Limpar cache do Microsoft Edge
echo 		[3] Limpar cache do Mozilla Firefox
echo 		[4] Limpar cache do Opera
echo 		[5] Limpar cache do Brave
echo 		[6] Limpar cache de TODOS
echo 		[7] Sair
echo 	 ===============================================
set /p escolha="Escolha uma opcao: "

if "%escolha%"=="1" goto chrome
if "%escolha%"=="2" goto edge
if "%escolha%"=="3" goto firefox
if "%escolha%"=="4" goto opera
if "%escolha%"=="5" goto brave
if "%escolha%"=="6" goto todos
if "%escolha%"=="7" goto sair

:chrome
echo Limpando cache do Google Chrome...
del /q /f /s "%localappdata%\Google\Chrome\User Data\Default\Cache\*"
echo Limpeza concluida!
pause
goto menu

:edge
echo Limpando cache do Microsoft Edge...
del /q /f /s "%localappdata%\Microsoft\Edge\User Data\Default\Cache\*"
echo Limpeza concluida!
pause
goto menu

:firefox
echo Limpando cache do Mozilla Firefox...
del /q /f /s "%appdata%\Mozilla\Firefox\Profiles\*.default-release\cache2\entries\*"
echo Limpeza concluida!
pause
goto menu

:opera
echo Limpando cache do Opera...
del /q /f /s "%appdata%\Opera Software\Opera Stable\Cache\*"
echo Limpeza concluida!
pause
goto menu

:brave
echo Limpando cache do Brave...
del /q /f /s "%localappdata%\BraveSoftware\Brave-Browser\User Data\Default\Cache\*"
echo Limpeza concluida!
pause
goto menu

:todos
echo Limpando cache de todos os navegadores...
del /q /f /s "%localappdata%\Google\Chrome\User Data\Default\Cache\*"
del /q /f /s "%localappdata%\Microsoft\Edge\User Data\Default\Cache\*"
del /q /f /s "%appdata%\Mozilla\Firefox\Profiles\*.default-release\cache2\entries\*"
del /q /f /s "%appdata%\Opera Software\Opera Stable\Cache\*"
del /q /f /s "%localappdata%\BraveSoftware\Brave-Browser\User Data\Default\Cache\*"
echo Limpeza de todos os navegadores concluida!
pause
goto menu

:sair
echo Saindo do programa...
timeout /t 2 >nul
exit
