Set WshShell = CreateObject("WScript.Shell")
' Run start.bat in invisible mode (0)
WshShell.Run "start.bat", 0, False
Set WshShell = Nothing
