Sunga eKonsulta - local server
1. Install Node.js LTS (nodejs.org) if not installed.
2. Double-click tools\setup-app.bat (one time; it asks for admin).
3. Double-click "eKonsulta" on the Desktop. The site opens at http://localhost:3000
   and the app hides in the tray icons (^) by the clock. Right-click it for
   Open / Copy LAN address / Restart / View log / Stop server and exit.
   It does NOT start with Windows; open it again after turning the laptop on.

eKonsulta.exe         the tray app
stop-server.bat       stop the website and tray app
rebuild.bat           after any change: stop, rebuild, reopen the app
tools\                app source (eKonsulta.pyw, logo, setup-app.bat)
backup-to-github.bat  back up code to GitHub + local data copy
schedule-backup.bat   turn on the daily 6:00 PM backup (run once)
RESTORE.txt           how to restore on a new laptop
logs\app.log          output / errors

YAKAP Assistant (chat button, bottom right)
- Built-in answers work with no setup.
- Optional AI answers: in Notepad create a file named .env.local inside
  ekonsulta-next containing one line:
      ANTHROPIC_API_KEY=your-key-here
  then run rebuild.bat.
  Only summary counts and statuses are sent to the AI, not patient names.
  Keep .env.local private; never share or upload it.
- Long-term memory: the assistant saves each user's chat and notes in
  ekonsulta-next\data\memory\<username>.json (survives restarts).
  Commands: "remember that ...", "what do you remember", "forget 2",
  "forget everything", "clear chat". Back up the data folder if needed.
  Do not store patient details in notes.
- Shared learning: every account's questions are logged in
  ekonsulta-next\data\knowledge.json. Teach the assistant in chat with
      teach: question => answer
  Admin/Super Admin answers are shared at once; other roles' answers wait
  for approval under Administration > Assistant Knowledge, which also lists
  unanswered and popular questions.
