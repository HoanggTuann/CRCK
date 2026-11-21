@echo off
chcp 65001 >nul
echo Dang cap nhat file1.rpgsave tu file1_readable.json...
cscript //nologo pack_save.js file1_readable.json file1.rpgsave
pause
