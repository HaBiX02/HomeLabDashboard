/**
 * HomeLab Dashboard Logic
 * Loads services from services.json, renders cards dynamically,
 * and handles real-time clock and service filtering.
 */

document.addEventListener('DOMContentLoaded', () => {
    initClock();
    loadServices();
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
 */
function createServiceCard(service) {
    const card = document.createElement('a');
    card.href = buildServiceUrl(service.port);
    card.target = '_blank';
    card.className = 'card';
    card.setAttribute('data-name', service.keywords || service.name.toLowerCase());

    const iconDiv = document.createElement('div');
    iconDiv.className = `card-icon ${service.colorClass || ''}`;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'material-symbols-outlined';
    iconSpan.textContent = service.icon || 'dns';
    iconDiv.appendChild(iconSpan);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'card-info';

    const title = document.createElement('h3');
    title.textContent = service.name;

    const port = document.createElement('p');
    port.textContent = `:${service.port}`;

    infoDiv.appendChild(title);
    infoDiv.appendChild(port);

    card.appendChild(iconDiv);
    card.appendChild(infoDiv);

    return card;
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
