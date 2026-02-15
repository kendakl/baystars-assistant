@echo off
echo.
echo ========================================================
echo   PUBLIC ACCESS MODE (Internet Tunneling)
echo ========================================================
echo.
echo This window will generate a URL starting with "https://..."
echo You can use that URL on your smartphone (4G/5G) to access this app.
echo.
echo [IMPORTANT]
echo 1. Keep this window OPEN. If you close it, the URL stops working.
echo 2. If it asks "Are you sure you want to continue connecting?", type "yes" and hit Enter.
echo.
echo Connecting to public relay server...
echo.
ssh -R 80:localhost:8080 serveo.net
pause
