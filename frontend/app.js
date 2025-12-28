// API Configuration
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api/v1'
    : '/api/v1';

// State Management
let currentUser = null;
let authToken = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

// Initialize Application
function initializeApp() {
    // Check for saved auth token
    authToken = localStorage.getItem('authToken');
    if (authToken) {
        fetchUserProfile();
    }

    // Load statistics
    loadStatistics();
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('href');
            scrollToSection(target);
        });
    });

    // Auth Buttons
    document.getElementById('loginBtn')?.addEventListener('click', () => openModal('loginModal'));
    document.getElementById('registerBtn')?.addEventListener('click', () => openModal('registerModal'));
    document.getElementById('getStartedBtn')?.addEventListener('click', () => openModal('registerModal'));
    document.getElementById('learnMoreBtn')?.addEventListener('click', () => scrollToSection('#features'));

    // Modal Close Buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.target.getAttribute('data-modal');
            closeModal(modalId);
        });
    });

    // Modal Switch Links
    document.getElementById('switchToRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('loginModal');
        openModal('registerModal');
    });

    document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('registerModal');
        openModal('loginModal');
    });

    // Forms
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);

    // Dashboard Actions
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    document.getElementById('checkInBtn')?.addEventListener('click', handleCheckIn);
    document.getElementById('donateBtn')?.addEventListener('click', handleDonate);
    document.getElementById('viewNeedsBtn')?.addEventListener('click', viewNeeds);
    document.getElementById('addMasjidBtn')?.addEventListener('click', addMasjid);

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Scroll to Section
function scrollToSection(target) {
    const element = document.querySelector(target);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// Auth Functions
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            currentUser = data.user;

            closeModal('loginModal');
            showDashboard();
            showNotification('Login successful!', 'success');
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Connection error. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const fullName = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fullName, email, phone, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            currentUser = data.user;

            closeModal('registerModal');
            showDashboard();
            showNotification('Registration successful!', 'success');
        } else {
            showNotification(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Connection error. Please try again.', 'error');
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');

    hideDashboard();
    showNotification('Logged out successfully', 'success');
}

async function fetchUserProfile() {
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showDashboard();
        } else {
            handleLogout();
        }
    } catch (error) {
        console.error('Profile fetch error:', error);
    }
}

function checkAuthStatus() {
    if (authToken) {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('registerBtn').style.display = 'none';
    }
}

// Dashboard Functions
function showDashboard() {
    document.querySelector('.hero').classList.add('hidden');
    document.querySelector('.features').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');

    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.fullName || 'User';
    }

    loadNearbyMasajid();
    loadRecentActivity();
}

function hideDashboard() {
    document.querySelector('.hero').classList.remove('hidden');
    document.querySelector('.features').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');

    document.getElementById('loginBtn').style.display = 'inline-block';
    document.getElementById('registerBtn').style.display = 'inline-block';
}

// Load Statistics
async function loadStatistics() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        if (response.ok) {
            const data = await response.json();
            animateCounter('masjidCount', data.masajidCount || 0);
            animateCounter('userCount', data.userCount || 0);
            document.getElementById('donationCount').textContent = `$${(data.totalDonations || 0).toLocaleString()}`;
        }
    } catch (error) {
        console.error('Stats error:', error);
        // Set default values
        animateCounter('masjidCount', 0);
        animateCounter('userCount', 0);
    }
}

// Animate Counter
function animateCounter(elementId, target) {
    const element = document.getElementById(elementId);
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = Math.round(target);
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current);
        }
    }, 30);
}

// Load Nearby Masajid
async function loadNearbyMasajid() {
    const container = document.getElementById('nearbyMasajid');

    try {
        const response = await fetch(`${API_URL}/masajid`, {
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });

        if (response.ok) {
            const data = await response.json();
            const masajid = data.masajid || [];

            if (masajid.length === 0) {
                container.innerHTML = '<p class="empty-state">No masajid found. Be the first to add one!</p>';
            } else {
                container.innerHTML = masajid.map(masjid => `
                    <div class="masjid-card">
                        <h4>🕌 ${masjid.name}</h4>
                        <p>${masjid.address || 'Address not available'}</p>
                        <p class="distance">${masjid.distance ? `${masjid.distance} km away` : ''}</p>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Masajid load error:', error);
        container.innerHTML = '<p class="empty-state">Unable to load masajid</p>';
    }
}

// Load Recent Activity
async function loadRecentActivity() {
    const container = document.getElementById('recentActivity');

    try {
        const response = await fetch(`${API_URL}/users/activity`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const activities = data.activities || [];

            if (activities.length === 0) {
                container.innerHTML = '<p class="empty-state">No recent activity</p>';
            } else {
                container.innerHTML = activities.map(activity => `
                    <div class="activity-item">
                        <span class="activity-icon">${activity.icon}</span>
                        <span class="activity-text">${activity.description}</span>
                        <span class="activity-time">${formatTime(activity.createdAt)}</span>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Activity load error:', error);
    }
}

// Dashboard Actions
function handleCheckIn() {
    showNotification('Prayer check-in feature coming soon!', 'info');
}

function handleDonate() {
    showNotification('Donation feature coming soon!', 'info');
}

function viewNeeds() {
    showNotification('Mosque needs feature coming soon!', 'info');
}

function addMasjid() {
    showNotification('Add masjid feature coming soon!', 'info');
}

// Utility Functions
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 24px;
        background: ${type === 'success' ? '#2D5F3F' : type === 'error' ? '#8B3A3A' : '#3A5A7A'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .masjid-card {
        background: var(--bg-hover);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: 16px;
        margin-bottom: 12px;
    }
    
    .masjid-card h4 {
        margin-bottom: 8px;
        color: var(--text-primary);
    }
    
    .masjid-card p {
        color: var(--text-secondary);
        font-size: 14px;
        margin: 4px 0;
    }
    
    .distance {
        color: var(--secondary) !important;
        font-weight: 600;
    }
    
    .activity-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: var(--bg-hover);
        border-radius: var(--radius-md);
        margin-bottom: 8px;
    }
    
    .activity-icon {
        font-size: 24px;
    }
    
    .activity-text {
        flex: 1;
        color: var(--text-secondary);
    }
    
    .activity-time {
        color: var(--text-muted);
        font-size: 12px;
    }
`;
document.head.appendChild(style);
