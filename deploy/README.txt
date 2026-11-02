Sunga eKonsulta - local server
1. Install Node.js LTS (nodejs.org) if not installed.
2. Right-click setup-server.bat -> Run as administrator (one time).
3. Website: http://localhost:3000  (starts automatically whenever Windows starts)

start-server.bat      run manually
stop-server.bat       stop the website
rebuild.bat           after any change: stop, rebuild, start
remove-autostart.bat  undo auto-start
backup-to-github.bat  back up code to GitHub + local data copy
schedule-backup.bat   turn on the daily 6:00 PM backup (run once)
RESTORE.txt           how to restore on a new laptop
logs\server.log       output / errors

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
