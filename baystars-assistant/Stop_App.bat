@echo off
echo Stopping BayStars Assistant...
taskkill /F /IM python.exe
echo Done.
timeout /t 2 >nul
