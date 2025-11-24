@echo off
echo Preparing deployment packages...
echo.

for %%S in (lulu opti mini paso dojang) do (
    echo → Copying files to deployment\%%S...
    xcopy /E /I /Y src deployment\%%S\src >nul
    xcopy /E /I /Y dist deployment\%%S\dist >nul
    xcopy /E /I /Y node_modules deployment\%%S\node_modules >nul
    copy /Y package.json deployment\%%S\ >nul
    copy /Y tsconfig.json deployment\%%S\ >nul
    echo   ✓ %%S ready
)

echo.
echo ✅ All deployment packages ready!
echo.
echo Each deployment\{server}\ folder is now ready to copy to its server.
pause
