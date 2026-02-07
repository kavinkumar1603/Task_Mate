@echo off
echo Installing Frontend Dependencies...
cd frontend
call npm install
echo.
echo Installing Backend Dependencies...
cd ..\backend\functions
call npm install
echo.
echo All dependencies installed successfully!
pause
