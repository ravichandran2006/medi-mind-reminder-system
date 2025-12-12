# Commands to Run Frontend and Backend

## Option 1: Run in Separate Terminals (Recommended)

### Terminal 1 - Backend:
```powershell
cd backend
npm run dev
```

### Terminal 2 - Frontend:
```powershell
npm run dev
```

---

## Option 2: Run Backend in Background, then Frontend

### Single Terminal:
```powershell
# Start backend in background
cd backend; Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Start frontend
npm run dev
```

---

## Option 3: Using npm-run-all (if installed)

If you have `npm-run-all` installed globally:
```powershell
npm install -g npm-run-all
```

Then create a script in root package.json:
```json
"scripts": {
  "dev:all": "npm-run-all --parallel dev:frontend dev:backend",
  "dev:frontend": "vite",
  "dev:backend": "cd backend && npm run dev"
}
```

Then run:
```powershell
npm run dev:all
```

---

## Default Ports:
- **Frontend**: Usually runs on `http://localhost:5173` (Vite default)
- **Backend**: Check `backend/server.js` for the port (usually `http://localhost:3000` or `5000`)

