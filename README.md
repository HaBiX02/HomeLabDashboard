# HomeLab Dashboard

A modern, responsive, glassmorphism-styled dashboard for your local HomeLab services. Built with pure HTML, CSS, and Vanilla JavaScript — no build step required.

![Screenshot](img/screenshot.png)

---

## 🚀 Getting Started

Serve the project with any static file server. A server is required because `services.json` is loaded dynamically via `fetch`.

### Apache (recommended)

Place the project inside your web root and enable CGI so `runner.py` can execute commands:

```apache
<Directory /var/www/html/homelab>
    Options +ExecCGI
    AddHandler cgi-script .py
</Directory>
```

Enable the CGI module and reload:

```bash
sudo a2enmod cgi
sudo systemctl reload apache2
```

Make `runner.py` executable:

```bash
chmod +x /var/www/html/homelab/runner.py
```

Then open `http://<your-server>/homelab/` in your browser.

### Other servers (dev / quick test)

```bash
# Python built-in server (command cards won't work without runner.py CGI)
python3 -m http.server 8000
```

> **Note:** All service *URL* links automatically use the same IP/hostname from which you access the dashboard, so the same `services.json` works from any client IP.

---

## 🛠 Adding Services

Open `services.json` and add entries to the JSON array. There are **two types** of service card:

### Type 1 — URL service (opens in a new tab)

```json
{
    "name": "Portainer",
    "icon": "widgets",
    "port": 9443,
    "colorClass": "portainer-bg",
    "keywords": "portainer docker containers management"
}
```

### Type 2 — Command service (runs a bash command on the server)

```json
{
    "name": "Wake PC Escritorio",
    "icon": "settings_power",
    "command": "wakeonlan AA:BB:CC:DD:EE:FF",
    "description": "Encender PC escritorio (WoL)",
    "colorClass": "hass-bg",
    "keywords": "wake on lan wol pc desktop"
}
```

Command cards are visually distinguished with a small **CMD** badge and show a toast notification with the result after execution.

---

## 📋 `services.json` — Field Reference

| Field         | Type     | Applies to      | Required | Description |
|---------------|----------|-----------------|----------|-------------|
| `name`        | `string` | Both            | ✅        | Display name shown on the card. |
| `icon`        | `string` | Both            | ❌        | [Material Symbols](https://fonts.google.com/icons) icon name (e.g. `dns`, `sync_alt`, `terminal`). Defaults to `dns` for URL cards and `terminal` for command cards. |
| `port`        | `number` | URL service     | ✅*       | TCP port the service listens on. The dashboard uses the current browser hostname + this port to build the link. Use `80`/`443` to omit the port from the URL. |
| `command`     | `string` | Command service | ✅*       | Bash command executed on the server via `runner.py`. Any valid shell syntax is accepted (`&&`, pipes, variables, etc.). |
| `description` | `string` | Command service | ❌        | Human-readable subtitle shown on the card instead of the raw command. If omitted, the raw `command` string is shown. |
| `colorClass`  | `string` | Both            | ❌        | CSS class applied to the icon background for service branding. See [Color Classes](#-color-classes) below. |
| `keywords`    | `string` | Both            | ❌        | Extra search terms (space-separated). Defaults to the service name in lowercase. Useful when a service has alternative names. |

> \* A card must have **either** `port` **or** `command` — not both. `port` takes priority if both are present.

---

## 🎨 Color Classes

Several classes are predefined in `css/style.css`:

| Class             | Color   | Designed for   |
|-------------------|---------|----------------|
| `portainer-bg`    | Blue    | Portainer      |
| `pihole-bg`       | Red     | Pi-hole        |
| `plex-bg`         | Amber   | Plex           |
| `grafana-bg`      | Orange  | Grafana        |
| `hass-bg`         | Cyan    | Home Assistant |
| `jellyfin-bg`     | Purple  | Jellyfin       |
| `nextcloud-bg`    | Blue    | Nextcloud      |
| `syncthing-bg`    | Teal    | Syncthing      |
| `overleaf-bg`     | Green   | Overleaf       |
| `proxmox-bg`      | Accent  | Proxmox        |
| `transmission-bg` | Accent  | Transmission   |

### Adding a custom color

1. Define the CSS variable and class in `css/style.css`:

```css
:root {
    --myservice-color: #e91e63;
}

.myservice-bg {
    color: var(--myservice-color);
    background: rgba(233, 30, 99, 0.1);
}
```

2. Use `"colorClass": "myservice-bg"` in `services.json`.

---

## 🖥 Command Execution — `runner.py`

`runner.py` is a **CGI script** executed directly by Apache. When a command card is clicked, the browser POSTs to `./runner.py` (same origin, no CORS issues) and Apache runs the script under the web-server user.

### How it works

```
Browser click → POST ./runner.py  {"command": "wakeonlan AA:BB:CC:...""}
                       ↓
              Apache (mod_cgi) executes runner.py
                       ↓
              runner.py runs the bash command
                       ↓
              JSON response → toast shown in dashboard
```

### Security considerations

- Commands are executed **as the Apache user** (`www-data` on Debian/Ubuntu). Make sure that user has the permissions required by your commands (e.g. `sudo`, `wakeonlan` in `$PATH`).
- The runner has **no authentication**. It is intended for use on a trusted local network. Do **not** expose it to the Internet.
- To restrict which commands can run, you can add an allowlist check at the top of `runner.py`.

### Changing the runner path

By default the dashboard calls `./runner.py` (relative to the page). If you deploy the script elsewhere, update the constant at the top of `js/app.js`:

```js
const RUNNER_URL = './runner.py';   // ← change this
```

---

## 🎨 Customizing Icons

Find an icon at [Google Fonts — Material Symbols](https://fonts.google.com/icons) and use the name as the `icon` value (e.g. `dns`, `movie`, `cloud`, `sync_alt`, `terminal`).

---

## 🖌 Styling (CSS)

Customize the global theme in `css/style.css` by editing the `:root` variables:

```css
:root {
    --bg-color: #0d1117;
    --card-bg: rgba(22, 27, 34, 0.7);
    --text-main: #c9d1d9;
    --text-accent: #58a6ff;
    /* ... */
}
```

---

## 📂 Project Structure

```
HomeLabDashboard/
├── index.html        # Main dashboard (no services hardcoded here)
├── services.json     # Service definitions (name, icon, port/command, color)
├── runner.py         # CGI script — executes bash commands from command cards
├── css/
│   └── style.css     # Styles, animations, color classes, toast & badge
├── js/
│   └── app.js        # Clock, dynamic service loading, command execution, search
└── img/
    └── screenshot.png
```

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
