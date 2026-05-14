/**
 * HomeLab Dashboard Logic
 * Loads services from services.json, renders cards dynamically,
 * and handles real-time clock and service filtering.
 *
 * Services can be of two types:
 *   - URL services  → define `port`; clicking opens the service in a new tab.
 *   - Command services → define `command`; clicking sends the command to the
 *     runner server (runner.py) via POST /run.
 */

/**
 * Relative path to runner.py (served as CGI by Apache).
 * Change only if you deploy runner.py under a different URL.
 */
const RUNNER_URL = './runner.py';

document.addEventListener('DOMContentLoaded', () => {
    initClock();
    loadServices();
    initToast();
});

function initClock() {
    const clockElement = document.getElementById('clock');
    const updateTime = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    };

    // Update immediately then every second
    updateTime();
    setInterval(updateTime, 1000);

    // Also update year in footer
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

/**
 * Builds the URL for a service using the current browser hostname/IP
 * so that regardless of which IP the user connects from, all links
 * redirect to the same host but on different ports.
 */
function buildServiceUrl(port) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // If port is 80 (http) or 443 (https), omit it from the URL
    if ((protocol === 'http:' && port === 80) || (protocol === 'https:' && port === 443)) {
        return `${protocol}//${hostname}`;
    }
    return `${protocol}//${hostname}:${port}`;
}

/**
 * Creates a single service card element from a service config object.
 * If the service has a `command` field it renders a clickable button card
 * that POSTs to runner.py; otherwise it renders a link card that opens
 * the service URL in a new tab.
 */
function createServiceCard(service) {
    const isCommand = Boolean(service.command);

    // Use <div> for command cards (buttons), <a> for URL cards (links)
    const card = document.createElement(isCommand ? 'div' : 'a');

    if (isCommand) {
        card.style.cursor = 'pointer';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.addEventListener('click', () => runCommand(service));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') runCommand(service);
        });
    } else {
        card.href = buildServiceUrl(service.port);
        card.target = '_blank';
    }

    card.className = 'card';
    card.setAttribute('data-name', service.keywords || service.name.toLowerCase());

    const iconDiv = document.createElement('div');
    iconDiv.className = `card-icon ${service.colorClass || ''}`;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'material-symbols-outlined';
    iconSpan.textContent = service.icon || (isCommand ? 'terminal' : 'dns');
    iconDiv.appendChild(iconSpan);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'card-info';

    const title = document.createElement('h3');
    title.textContent = service.name;

    const subtitle = document.createElement('p');
    if (isCommand) {
        subtitle.textContent = service.description || service.command;
        subtitle.title = service.command;  // Full command on hover
    } else {
        subtitle.textContent = `:${service.port}`;
    }

    infoDiv.appendChild(title);
    infoDiv.appendChild(subtitle);

    card.appendChild(iconDiv);
    card.appendChild(infoDiv);

    // Command-type badge
    if (isCommand) {
        const badge = document.createElement('span');
        badge.className = 'command-badge';
        badge.textContent = 'CMD';
        card.appendChild(badge);
    }

    return card;
}

/**
 * Sends a command to runner.py and shows a toast with the result.
 * @param {object} service - The service config object with a `command` field.
 */
async function runCommand(service) {
    showToast(`⚙️ Ejecutando: ${service.name}…`, 'info');

    try {
        const response = await fetch(RUNNER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: service.command }),
        });

        const data = await response.json();

        if (data.ok) {
            showToast(`✅ ${service.name}: OK`, 'success');
        } else {
            const msg = data.stderr?.trim() || data.stdout?.trim() || `Código ${data.returncode}`;
            showToast(`❌ ${service.name}: ${msg}`, 'error');
        }
    } catch (err) {
        showToast(`❌ No se pudo conectar con runner.py`, 'error');
        console.error('[runCommand]', err);
    }
}

/**
 * Fetches services.json and renders all service cards into the grid.
 * After rendering, initializes the search filter.
 */
async function loadServices() {
    const grid = document.getElementById('servicesGrid');

    try {
        const response = await fetch('services.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const services = await response.json();

        services.forEach(service => {
            const card = createServiceCard(service);
            grid.appendChild(card);
        });

        // Initialize search after cards are rendered
        initSearch();

    } catch (error) {
        console.error('Error loading services:', error);
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; opacity: 0.6;">
                <span class="material-symbols-outlined" style="font-size: 3rem; display: block; margin-bottom: 1rem;">error</span>
                <p>No se pudieron cargar los servicios.<br>Comprueba que <code>services.json</code> existe y es válido.</p>
            </div>
        `;
    }
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const cards = document.querySelectorAll('.card');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();

        cards.forEach(card => {
            const name = card.getAttribute('data-name') || '';
            const title = card.querySelector('h3').textContent.toLowerCase();
            const desc = card.querySelector('p').textContent.toLowerCase();

            if (name.includes(query) || title.includes(query) || desc.includes(query)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// --------------------------------------------------------------------------- //
// Toast notification system                                                     //
// --------------------------------------------------------------------------- //

let toastTimeout = null;

/**
 * Creates the toast container element and appends it to the body.
 */
function initToast() {
    if (document.getElementById('toast')) return;
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
}

/**
 * Displays a temporary toast message at the bottom of the screen.
 * @param {string} message - Text to display.
 * @param {'info'|'success'|'error'} type - Visual style.
 * @param {number} duration - Milliseconds before the toast disappears.
 */
function showToast(message, type = 'info', duration = 3500) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast toast--${type} toast--visible`;

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('toast--visible');
    }, duration);
}
