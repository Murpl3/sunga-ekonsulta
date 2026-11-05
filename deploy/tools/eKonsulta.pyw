"""
Sunga Hospital eKonsulta / YAKAP - tray launcher (mockup)

Double-click: starts the Next.js mockup hidden (no console window), opens the
browser, and stays in the system tray (hidden icons ^), not the taskbar.

Requires:  pip install pystray pillow
"""
import os
import socket
import subprocess
import sys
import threading
import time
import webbrowser

import pystray
from PIL import Image, ImageDraw

# ---- settings -------------------------------------------------------------
APP_DIR = r"C:\Yakap\ekonsulta-next"
PORT = 3000
URL = f"http://localhost:{PORT}"
START_CMD = f"npm run start -- -p {PORT} -H 0.0.0.0"   # LAN reachable
LOG_FILE = r"C:\Yakap\logs\app.log"
LOCK_PORT = 47300                     # keeps only one launcher running
# ---------------------------------------------------------------------------

NO_WINDOW = 0x08000000  # CREATE_NO_WINDOW
server_proc = None
started_by_us = False


def port_open(port, host="127.0.0.1"):
    with socket.socket() as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0


def lan_ip():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"


def single_instance():
    """Return a bound socket, or None if another launcher already runs."""
    s = socket.socket()
    try:
        s.bind(("127.0.0.1", LOCK_PORT))
        return s
    except OSError:
        return None


def start_server():
    global server_proc, started_by_us
    if port_open(PORT):           # already running (e.g. auto-start with Windows)
        started_by_us = False
        return True
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    log = open(LOG_FILE, "a", encoding="utf-8")
    # first run / after a failed rebuild: build the site before starting
    if not os.path.exists(os.path.join(APP_DIR, ".next", "BUILD_ID")):
        log.write("No build found - running npm run build\n"); log.flush()
        subprocess.run("npm run build", cwd=APP_DIR, shell=True, stdout=log,
                       stderr=subprocess.STDOUT, creationflags=NO_WINDOW)
    log.write(f"\n--- start {time.ctime()} ---\n")
    log.flush()
    server_proc = subprocess.Popen(
        START_CMD, cwd=APP_DIR, shell=True,
        stdout=log, stderr=subprocess.STDOUT,
        creationflags=NO_WINDOW,
    )
    started_by_us = True
    for _ in range(90):           # wait up to 90 s
        if port_open(PORT):
            return True
        if server_proc.poll() is not None:
            return False
        time.sleep(1)
    return False


def stop_server():
    global server_proc
    if server_proc and server_proc.poll() is None:
        subprocess.run(["taskkill", "/PID", str(server_proc.pid), "/T", "/F"],
                       creationflags=NO_WINDOW, capture_output=True)
    else:
        # server was not started by us: stop whatever listens on PORT
        out = subprocess.run(["netstat", "-ano"], capture_output=True, text=True,
                             creationflags=NO_WINDOW).stdout
        for line in out.splitlines():
            parts = line.split()
            if len(parts) >= 5 and parts[1].endswith(f":{PORT}") and parts[3] == "LISTENING":
                subprocess.run(["taskkill", "/PID", parts[4], "/T", "/F"],
                               creationflags=NO_WINDOW, capture_output=True)
    server_proc = None


LOGO_FILE = r"C:\Yakap\tools\logo.png"


def make_icon(color=None):
    """Hospital logo; a small dot shows status (yellow = starting, red = error)."""
    try:
        img = Image.open(LOGO_FILE).convert("RGBA").resize((64, 64), Image.LANCZOS)
    except OSError:
        img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        d.rounded_rectangle((2, 2, 62, 62), radius=14, fill="#0bb9b5")
    if color:
        d = ImageDraw.Draw(img)
        d.ellipse((40, 40, 63, 63), fill=color, outline="white", width=3)
    return img


# ---- tray actions ---------------------------------------------------------
def on_open(icon, item):
    webbrowser.open(URL)


def on_copy_lan(icon, item):
    addr = f"http://{lan_ip()}:{PORT}"
    subprocess.run("clip", input=addr, text=True, shell=True, creationflags=NO_WINDOW)
    icon.notify(f"Copied: {addr}", "eKonsulta")


def on_restart(icon, item):
    def work():
        icon.icon = make_icon("#b8860b")
        icon.title = "eKonsulta - restarting..."
        stop_server()
        time.sleep(2)
        ok = start_server()
        icon.icon = make_icon() if ok else make_icon("#b22222")
        icon.title = "eKonsulta - running" if ok else "eKonsulta - failed (see log)"
        icon.notify("Restarted" if ok else "Could not start. See C:\\Yakap\\logs\\app.log", "eKonsulta")
    threading.Thread(target=work, daemon=True).start()


def on_log(icon, item):
    if os.path.exists(LOG_FILE):
        os.startfile(LOG_FILE)


def on_exit_stop(icon, item):
    stop_server()
    icon.stop()


def main():
    lock = single_instance()
    if lock is None:               # already in tray: just open the browser
        webbrowser.open(URL)
        return

    icon = pystray.Icon(
        "ekonsulta", make_icon("#b8860b"), "eKonsulta - starting...",
        menu=pystray.Menu(
            pystray.MenuItem("Open eKonsulta", on_open, default=True),  # double-click icon
            pystray.MenuItem("Copy LAN address", on_copy_lan),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Restart server", on_restart),
            pystray.MenuItem("View log", on_log),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Stop server and exit", on_exit_stop),
        ),
    )

    def boot(icon):
        icon.visible = True
        ok = start_server()
        icon.icon = make_icon() if ok else make_icon("#b22222")
        icon.title = "eKonsulta - running" if ok else "eKonsulta - failed (see log)"
        if ok:
            webbrowser.open(URL)
        else:
            icon.notify("Could not start. See C:\\Yakap\\logs\\app.log", "eKonsulta")

    icon.run(setup=boot)


if __name__ == "__main__":
    main()
