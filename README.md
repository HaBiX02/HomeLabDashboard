# HomeLab Dashboard

A modern, responsive, and glassmorphism-styled dashboard for your local HomeLab services. Built with pure HTML, CSS, and Vanilla JavaScript. No build steps required.

![Screenshot](img/screenshot.png)

## 🚀 Getting Started

Serve the project with any static file server (e.g., Nginx, Apache, Python `http.server`). A server is required because the services are loaded dynamically via `fetch` from `services.json`.

```bash
# Example with Python
python3 -m http.server 8000
```

Then open `http://<your-ip>:8000` in your browser.

> **Note:** All service links automatically use the same IP/hostname with which you access the dashboard. This means you can connect from `192.168.1.X`, `10.0.0.X`, or `localhost` and all links will work correctly, redirecting to the corresponding port on the same host.

## 🛠 Adding New Services

To add a new service, open `services.json` and add a new entry to the array:

```json
{
    "name": "Service Name",
    "icon": "dns",
    "port": 9090,
    "colorClass": "custom-bg",
    "keywords": "search keywords for this service"
}
```

### Fields

| Field        | Type     | Required | Description                                                                                     |
| ------------ | -------- | -------- | ----------------------------------------------------------------------------------------------- |
| `name`       | `string` | ✅        | Display name shown on the card.                                                                 |
| `icon`       | `string` | ✅        | Material Symbols icon name (see [Google Fonts - Material Symbols](https://fonts.google.com/icons)). |
| `port`       | `number` | ✅        | Port number the service runs on.                                                                |
| `colorClass` | `string` | ❌        | CSS class for the icon background color (e.g., `syncthing-bg`). Defaults to a neutral style.    |
| `keywords`   | `string` | ❌        | Extra search keywords. Defaults to the service name in lowercase.                               |

### Example: Adding Portainer

1. Add the entry to `services.json`:

```json
{
    "name": "Portainer",
    "icon": "widgets",
    "port": 9443,
    "colorClass": "portainer-bg",
    "keywords": "portainer docker containers management"
}
```

2. (Optional) If you want a custom color, define it in `css/style.css`:

```css
:root {
    --portainer-color: #3f75d5;
}

.portainer-bg {
    color: var(--portainer-color);
    background: rgba(63, 117, 213, 0.1);
}
```

Several color classes are already predefined in the CSS: `syncthing-bg`, `overleaf-bg`, `portainer-bg`, `pihole-bg`, `plex-bg`, `grafana-bg`, `hass-bg`, `jellyfin-bg`, `nextcloud-bg`, and `proxmox-bg`.

## 🎨 Customizing Icons

Find an icon name at [Google Fonts - Material Symbols](https://fonts.google.com/icons) and use it as the `icon` value in `services.json` (e.g., `dns`, `movie`, `cloud`, `sync_alt`).

## 🖌 Styling (CSS)

You can customize the global theme in `css/style.css` by editing the `:root` variables at the top of the file:

```css
:root {
    --bg-color: #0d1117;
    --card-bg: rgba(22, 27, 34, 0.7);
    --text-main: #c9d1d9;
    --text-accent: #58a6ff;
    /* ... */
}
```

## 📂 Project Structure

```
HomeLabDashboard/
├── index.html        # Main dashboard (no services hardcoded here)
├── services.json     # Service definitions (name, icon, port, color)
├── css/
│   └── style.css     # Styles, animations, and responsive design
├── js/
│   └── app.js        # Clock, dynamic service loading, and search
└── img/
    └── screenshot.png
```

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
