@echo off
rem Run as administrator. Removes the auto-start task and firewall rule.
schtasks /Delete /TN "YakapServer" /F
netsh advfirewall firewall delete rule name="Yakap Website"
pause
