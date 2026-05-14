#!/usr/bin/env python3
"""
HomeLab Dashboard — Command Runner (CGI)
=========================================
CGI script executed by Apache (mod_cgi / mod_cgid).
Place this file somewhere Apache can find it as CGI, for example:

    /var/www/html/homelab/runner.py        (with ExecCGI + Options +ExecCGI)
  or
    /usr/lib/cgi-bin/homelab-runner.py     (standard cgi-bin)

The dashboard's app.js calls:
    POST <same origin>/runner.py
    Content-Type: application/json
    Body: {"command": "<bash command>"}

The script responds with:
    200 OK  → {"ok": true,  "stdout": "...", "stderr": "...", "returncode": 0}
    400     → {"ok": false, "error": "Missing 'command' field"}
    500     → {"ok": false, "stdout": "...", "stderr": "...", "returncode": N}

Apache configuration (minimal example — adapt paths as needed):
----------------------------------------------------------------------
    <Directory /var/www/html/homelab>
        Options +ExecCGI
        AddHandler cgi-script .py
    </Directory>
----------------------------------------------------------------------
Make sure mod_cgi (or mod_cgid) is enabled:
    sudo a2enmod cgi
    sudo systemctl reload apache2
"""

import json
import os
import subprocess
import sys


def send_response(status_code: int, data: dict):
    """Writes a complete CGI HTTP response with JSON body."""
    payload = json.dumps(data)
    # CGI status line
    print(f"Status: {status_code}")
    print("Content-Type: application/json")
    # CORS headers so the browser doesn't block the request
    print("Access-Control-Allow-Origin: *")
    print("Access-Control-Allow-Methods: POST, OPTIONS")
    print("Access-Control-Allow-Headers: Content-Type")
    print()          # blank line separates headers from body
    print(payload)


def main():
    method = os.environ.get("REQUEST_METHOD", "").upper()

    # Handle CORS preflight
    if method == "OPTIONS":
        print("Status: 204")
        print("Access-Control-Allow-Origin: *")
        print("Access-Control-Allow-Methods: POST, OPTIONS")
        print("Access-Control-Allow-Headers: Content-Type")
        print()
        return

    if method != "POST":
        send_response(405, {"ok": False, "error": "Method Not Allowed"})
        return

    # Read and parse the JSON body
    try:
        content_length = int(os.environ.get("CONTENT_LENGTH", 0))
        raw_body = sys.stdin.read(content_length)
        body = json.loads(raw_body)
    except (ValueError, json.JSONDecodeError) as exc:
        send_response(400, {"ok": False, "error": f"Invalid request body: {exc}"})
        return

    command = body.get("command")
    if not command:
        send_response(400, {"ok": False, "error": "Missing 'command' field"})
        return

    # Execute the command in bash
    result = subprocess.run(
        command,
        shell=True,
        executable="/bin/bash",
        capture_output=True,
        text=True,
    )

    status = 200 if result.returncode == 0 else 500
    send_response(status, {
        "ok": result.returncode == 0,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "returncode": result.returncode,
    })


if __name__ == "__main__":
    main()
