@echo off
ECHO Starting backend and frontend development servers...

REM Start the backend in a new terminal window
start cmd /k "cd backend && npm run dev"

REM Start the frontend in a new terminal window
start cmd /k "cd frontend && npm start"

ECHO Both servers are starting in separate windows.
