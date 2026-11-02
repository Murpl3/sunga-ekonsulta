# Sunga Hospital — YAKAP / eKonsulta System

A clinic system for PhilHealth **YAKAP / Konsulta**. It covers registration sync, the FPE (Health Screening & Assessment), consultations with the 13 lab tests, diagnostics and referrals, GAMOT medicines, eKAS and ePresS slips, transmittals (Prepare → Validate → Send), the Konsulta XML export, tranches and PhilHealth payments, and 5 user roles.

Built with Next.js 14 (React 18), Tailwind CSS and lucide-react. Data is stored on the server in JSON files (`data/db`), and passwords are stored as hashes (scrypt).

> ⚠️ Sending to PhilHealth is **simulated**. Real submission needs a PhilHealth-certified EMR connection. Until then, use the XML export through the HCI Portal.

---

## 1. Requirements
- **Node.js 20 or 22 LTS** (https://nodejs.org). Check with `node -v`.
- Windows, macOS or Linux. Port **3000** must be free.

## 2. Install and run
```bash
git clone https://github.com/Murpl3/sunga-ekonsulta.git
cd sunga-ekonsulta
npm install
npm run build
npm start                # opens on http://localhost:3000
```
For development with live reload, use `npm run dev`.

On the first sign-in, the database is created in `data/db/` and filled with **demo patients**. To start empty instead, set `DEMO_DATA=0` (see section 3) before the first sign-in.

## 3. Settings (optional)
Copy **`env.example.txt`** to a new file named **`.env.local`** in the project folder, fill in what you need, then run `npm run build` and `npm start` again.
Never commit `.env.local`. It is excluded by `.gitignore`.

| Setting | What it does |
|---|---|
| `REGISTRY_URL`, `REGISTRY_API_KEY`, `REGISTRY_NAME` | Pulls clients from the partner registration website. See **REGISTRY-API.md**. Without it, a demo list is used. |
| `LAB_DB_TYPE`, `LAB_DB_HOST`, `LAB_DB_PORT`, `LAB_DB_NAME`, `LAB_DB_USER`, `LAB_DB_PASSWORD`, `LAB_DB_QUERY`, `LAB_DB_PATIENT_QUERY` | Read-only connection to the laboratory database (MySQL or SQL Server). Without it, demo results are used. |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Optional AI answers for the YAKAP Assistant. Without it, built-in answers are used. |
| `DB_DIR` | Where the database files are stored (default `data/db`). |
| `DEMO_DATA=0` | Start with an empty database instead of demo patients. |
| `SESSION_IDLE_MIN` | Minutes of inactivity before sign-out (default 30). |
| `TZ` | Time zone for audit timestamps (default Asia/Manila). |

## 4. First sign-in — change the passwords
The first run creates 5 accounts, with their default passwords defined in `lib/store.js`:

| Role | Username |
|---|---|
| Super Admin | `superadmin` |
| Admin | `admin` |
| Encoder / IT | `encoder` |
| Nurse | `nurse` |
| Doctor | `doctor` |

**The default passwords are public, because they are in this repository. Change every one right after the first sign-in** (My profile → Change password). An amber key button in the header stays visible until you do. Create named accounts for real staff in **User Accounts**.

Security built in:
- server-side sessions in an HttpOnly cookie, ending after 30 minutes of inactivity;
- a 5-minute lockout after 5 wrong passwords;
- role checks on the server;
- an audit log of sign-ins, changes and failed attempts.

## 5. Data and backups
- **Patient data and passwords never go to GitHub:** `data/` and `.env*` are excluded by `.gitignore`.
- **Daily snapshots:** the server keeps one in `data/db/snapshots/` for 30 days.
- **Backups:** back up the `data/` folder yourself. The Windows scripts in `deploy/` do this, along with server auto-start and a daily GitHub code backup.

## 6. Windows server scripts (`deploy/`)
These were written for `C:\Yakap` on the Sunga Hospital laptop. Change the paths if you install elsewhere.
- `setup-server.bat`: first-time setup and auto-start at log-on.
- `start-server.bat`, `stop-server.bat`, `rebuild.bat` (install, build and restart after an update).
- `backup-to-github.bat`, `schedule-backup.bat`: code backup to GitHub, plus a local data backup.

## 7. Project layout
```
app/page.js                  the app page
components/EKonsultaApp.jsx  all screens (single client component)
lib/store.js                 database, passwords, sessions, audit
app/api/auth/*               login, logout, me, password, profile
app/api/users                account management (Admin / Super Admin)
app/api/data                 load and save records (merged by id)
app/api/registry             partner registration site connector
app/api/lab-results          laboratory database connector (read-only)
app/api/chat, memory, knowledge   YAKAP Assistant
REGISTRY-API.md              what the partner registration site must provide
```

## 8. Using it with real patient data
Before entering real patients:
1. change all default passwords;
2. set `DEMO_DATA=0` on a fresh `data/db`, or clear the demo data;
3. serve it over HTTPS if anyone reaches it from outside the clinic network;
4. keep the `data/` backups somewhere safe.

This follows the Data Privacy Act (RA 10173).
