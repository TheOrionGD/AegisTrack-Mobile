// GPS Tracker JavaScript

let trackingInterval;
let isTracking = false;
let deviceId = '';
let accessToken = '';
let apiKey = '';
let socket = null;

const BACKEND_URL = 'http://10.171.58.245:5000';
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const registerDeviceBtn = document.getElementById('registerDeviceBtn');
const syncLocationBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const deviceIdInput = document.getElementById('deviceId');
const statusEl = document.getElementById('status');
const onlineIndicator = document.getElementById('onlineIndicator');
const latitudeEl = document.getElementById('latitude');
const longitudeEl = document.getElementById('longitude');
const accuracyEl = document.getElementById('accuracy');
const timestampEl = document.getElementById('timestamp');
const activityLog = document.getElementById('activityLog');
const authStatus = document.getElementById('authStatus');
const apiKeyDisplay = document.getElementById('apiKeyDisplay');
const geofenceStatus = document.getElementById('geofenceStatus');
const geoLatInput = document.getElementById('geoLat');
const geoLngInput = document.getElementById('geoLng');
const geoRadiusInput = document.getElementById('geoRadius');
const setGeofenceBtn = document.getElementById('setGeofenceBtn');
const requestPermissionBtn = document.getElementById('requestPermissionBtn');
const permissionStatus = document.getElementById('permissionStatus');
const revokeBtn = document.getElementById('revokeBtn');
const copyTokenBtn = document.getElementById('copyTokenBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const aiResponseEl = document.getElementById('aiResponse');
const sidebarLinks = document.querySelectorAll('.side-links a, .side-footer a');
const currentSectionTitle = document.getElementById('currentSectionTitle');

// Check if geolocation is supported
if (!navigator.geolocation) {
    showError('Geolocation is not supported by this browser.');
    startBtn.disabled = true;
}

loginBtn.addEventListener('click', loginUser);
registerBtn.addEventListener('click', registerUser);
startBtn.addEventListener('click', startTracking);
stopBtn.addEventListener('click', stopTracking);
registerDeviceBtn.addEventListener('click', registerDevice);
setGeofenceBtn.addEventListener('click', setGeofence);
revokeBtn.addEventListener('click', revokeTrackingPermission);
requestPermissionBtn.addEventListener('click', requestLocationPermission);
syncLocationBtn.addEventListener('click', fetchManualLocation);
copyTokenBtn.addEventListener('click', copyTokenToClipboard);
analyzeBtn.addEventListener('click', runAIAnalysis);

// Sidebar Navigation Logic
sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        sidebarLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const title = link.getAttribute('title');
        currentSectionTitle.innerHTML = `MTS <span class="sep">//</span> ${title.toUpperCase()}`;
        logActivity(`NAVIGATING_TO_${title.replace(' ', '_').toUpperCase()}`, 'INFO');
    });
});

function loginUser() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        showError('Please enter username and password.');
        return;
    }

    fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.access_token) {
                accessToken = data.access_token;
                authStatus.textContent = 'Session Active. Tracking permitted.';
                copyTokenBtn.style.display = 'inline-block';
                logActivity(`OPERATOR_${username.toUpperCase()} ACCESS_GRANTED`, 'SUCCESS');
                connectSocket();
            } else {
                showError(data.error || 'Login failed.');
            }
        })
        .catch(error => showError(`Login error: ${error.message}`));
}

function copyTokenToClipboard() {
    if (!accessToken) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(accessToken).then(() => {
            notifyCopy();
        }).catch(() => fallbackCopy(accessToken));
    } else {
        fallbackCopy(accessToken);
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        notifyCopy();
    } catch (err) {
        showError('Manual Copy Required: ' + text);
    }
    document.body.removeChild(textArea);
}

function notifyCopy() {
    const originalText = copyTokenBtn.textContent;
    copyTokenBtn.textContent = 'TOKEN COPIED!';
    setTimeout(() => copyTokenBtn.textContent = originalText, 2000);
}

function registerUser() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        showError('Please enter username and password.');
        return;
    }

    fetch(`${BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                authStatus.textContent = 'Registration successful. You can now log in.';
                clearError();
            } else {
                showError(data.error || 'Registration failed.');
            }
        })
        .catch(error => showError(`Registration error: ${error.message}`));
}

function registerDevice() {
    deviceId = deviceIdInput.value.trim();
    if (!deviceId) {
        showError('Please enter a device ID or registered identifier.');
        return;
    }
    if (!accessToken) {
        showError('Please login first.');
        return;
    }

    fetch(`${BACKEND_URL}/devices/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ device_id: deviceId })
    })
        .then(response => response.json())
        .then(data => {
            if (data.api_key) {
                apiKey = data.api_key;
                apiKeyDisplay.textContent = apiKey;
                logActivity(`HARDWARE_LINK_${deviceId.toUpperCase()}_INITIALIZED`, 'SUCCESS');
            } else {
                showError(data.error || 'Device registration failed.');
            }
        })
        .catch(error => showError(`Device registration error: ${error.message}`));
}

function connectSocket() {
    if (!accessToken) {
        return;
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//10.171.58.245:5000/ws?token=${encodeURIComponent(accessToken)}`;
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        statusEl.textContent = 'Status: Live connection established';
        onlineIndicator.textContent = 'Yes';
        onlineIndicator.classList.add('online');
        logActivity('LIVE_TELEMETRY_LINK_ESTABLISHED', 'SOCKET');
    };

    socket.onmessage = event => {
        const message = JSON.parse(event.data);
        if (message.event === 'location_updated') {
            handleSocketLocationUpdate(message.payload);
        }
        if (message.event === 'geofence_alert') {
            showError(`Geofence alert: ${message.payload.message || 'Device left allowed area'}`);
        }
    };

    socket.onerror = () => {
        showError('WebSocket connection error.');
    };

    socket.onclose = () => {
        statusEl.textContent = 'Status: Disconnected from live updates';
        onlineIndicator.textContent = 'No';
        onlineIndicator.classList.remove('online');
    };
}

function handleSocketLocationUpdate(payload) {
    if (payload.device_id === deviceId) {
        latitudeEl.textContent = parseFloat(payload.latitude).toFixed(6);
        longitudeEl.textContent = parseFloat(payload.longitude).toFixed(6);
        accuracyEl.textContent = parseFloat(payload.accuracy).toFixed(1);
        timestampEl.textContent = payload.timestamp;
    }
}

function fetchManualLocation() {
    if (!apiKey) {
        showError('Please register or link a device first.');
        return;
    }

    if (permissionStatus.textContent !== 'Permission: Granted') {
        showError('Please grant location access before fetching location.');
        return;
    }

    statusEl.textContent = 'LOG: Requesting fresh telemetry...';
    logActivity('GPS_SIGNAL_REQUEST_SENT', 'SYNC');
    navigator.geolocation.getCurrentPosition(
        updateLocation,
        handleLocationError,
        { 
            enableHighAccuracy: true, 
            timeout: 15000, 
            maximumAge: 0 
        }
    );
}

function startTracking() {}
function stopTracking() {
    isTracking = false;
    clearInterval(trackingInterval);
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusEl.textContent = 'Status: Tracking Stopped';
    onlineIndicator.textContent = 'No';
    onlineIndicator.classList.remove('online');
}

function revokeTrackingPermission() {
    stopTracking();
    permissionStatus.textContent = 'Permission: Not Granted';
    permissionStatus.style.color = 'red';
    statusEl.textContent = 'Status: Tracking stopped. To revoke browser permission, disable location access for this site in browser settings.';
    showError('Tracking stopped. To revoke location permission, update your browser site settings.');
}

function requestLocationPermission() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by this browser.');
        return;
    }

    permissionStatus.textContent = 'STATUS: REQUESTING...';
    permissionStatus.style.color = 'orange';

    navigator.geolocation.getCurrentPosition(
        () => {
            permissionStatus.textContent = 'Permission: Granted';
            permissionStatus.style.color = 'green';
            clearError();
        },
        error => {
            let msg = 'Error';
            if (error.code === error.PERMISSION_DENIED) msg = 'Denied';
            else if (error.code === error.POSITION_UNAVAILABLE) msg = 'Hardware Unavail';
            else if (error.code === error.TIMEOUT) msg = 'Timed Out';
            
            permissionStatus.textContent = 'Permission: ' + msg;
            permissionStatus.style.color = 'red';
            handleLocationError(error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function updateLocation(position) {
    const { latitude, longitude, accuracy } = position.coords;
    const timestamp = new Date().toISOString();

    latitudeEl.textContent = latitude.toFixed(6);
    longitudeEl.textContent = longitude.toFixed(6);
    accuracyEl.textContent = accuracy.toFixed(1);
    timestampEl.textContent = new Date(timestamp).toLocaleString();

    sendLocationToBackend(latitude, longitude, accuracy, timestamp);
}

async function sendLocationToBackend(lat, lng, acc, ts) {
    try {
        const response = await fetch(`${BACKEND_URL}/location`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-API-KEY': apiKey
            },
            body: JSON.stringify({
                device_id: deviceId,
                latitude: lat,
                longitude: lng,
                accuracy: acc,
                timestamp: ts
            })
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.error || `HTTP error ${response.status}`);
        }

        logActivity('TELEMETRY_UPLINK_SUCCESS', 'DATA');
    } catch (error) {
        showError(`Failed to send location: ${error.message}`);
    }
}

function setGeofence() {
    const centerLat = parseFloat(geoLatInput.value.trim());
    const centerLng = parseFloat(geoLngInput.value.trim());
    const radius = parseFloat(geoRadiusInput.value.trim());

    if (!deviceId) {
        showError('Please enter a device ID before setting a geofence.');
        return;
    }
    if (!accessToken) {
        showError('Please login first.');
        return;
    }
    if (Number.isNaN(centerLat) || Number.isNaN(centerLng) || Number.isNaN(radius)) {
        showError('Please enter valid geofence center and radius values.');
        return;
    }

    fetch(`${BACKEND_URL}/geofence`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            device_id: deviceId,
            center_lat: centerLat,
            center_lng: centerLng,
            radius_meters: radius
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                geofenceStatus.textContent = `Geofence active: ${radius}m around ${centerLat}, ${centerLng}`;
                clearError();
            } else {
                showError(data.error || 'Unable to set geofence.');
            }
        })
        .catch(error => showError(`Geofence error: ${error.message}`));
}

function handleLocationError(error) {
    let errorMessage = '';
    switch (error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user. Please allow location permission.';
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
        case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        default:
            errorMessage = 'An unknown error occurred.';
            break;
    }
    showError(errorMessage);
    stopTracking();
}

function logActivity(message, type = 'INFO') {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `<span style="color: var(--text-secondary)">[${time}]</span> <span style="color: ${type === 'ERROR' ? 'var(--accent-red)' : 'var(--accent-cyan)'}">[${type}]</span> ${message}`;
    activityLog.prepend(entry);
}

function showError(message) {
    logActivity(message, 'ERROR');
}

function clearError() {
    // Deprecated, we keep history now
}

window.addEventListener('online', () => {
    if (isTracking) {
        onlineIndicator.textContent = 'Yes';
        onlineIndicator.classList.add('online');
    }
});

window.addEventListener('offline', () => {
    onlineIndicator.textContent = 'No';
    onlineIndicator.classList.remove('online');
    if (isTracking) {
        showError('Lost internet connection. Tracking paused.');
    }
});
// Update UTC Time in footer
function updateUTCTime() {
    const utcTimeEl = document.getElementById('utcTime');
    if (utcTimeEl) {
        const now = new Date();
        const day = String(now.getUTCDate()).padStart(2, '0');
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const year = now.getUTCFullYear();
        const hours = String(now.getUTCHours()).padStart(2, '0');
        const mins = String(now.getUTCMinutes()).padStart(2, '0');
        const secs = String(now.getUTCSeconds()).padStart(2, '0');
        utcTimeEl.innerHTML = `<i class="fa-regular fa-clock"></i> UTC ${day}/${month}/${year} ${hours}:${mins}:${secs}`;
    }
}
setInterval(updateUTCTime, 1000);
async function runAIAnalysis() {
    const lat = latitudeEl.textContent;
    const lng = longitudeEl.textContent;
    const acc = accuracyEl.textContent;

    if (lat === '--') {
        showError('No telemetry data available for analysis.');
        return;
    }

    aiResponseEl.textContent = 'NEURAL_SCAN_IN_PROGRESS...';
    logActivity('AI_NEURAL_SCAN_INITIATED', 'AI');

    try {
        const response = await fetch(`${BACKEND_URL}/proxy/groq`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                model: "mixtral-8x7b-32768",
                messages: [{
                    role: "system",
                    content: "You are the MTS AI Analytics core. Provide a short, tactical, 2-sentence analysis of the current GPS telemetry. Use cyberpunk/military style."
                }, {
                    role: "user",
                    content: `Current Telemetry: Lat ${lat}, Lng ${lng}, Accuracy ${acc}M. Status: Online.`
                }],
                temperature: 0.7,
                max_tokens: 100
            })
        });

        const data = await response.json();
        const analysis = data.choices[0].message.content;
        aiResponseEl.textContent = analysis;
        logActivity('AI_SCAN_COMPLETE', 'SUCCESS');
    } catch (error) {
        aiResponseEl.textContent = 'NEURAL_LINK_FAILED. Check API Key or Connection.';
        showError('AI Analysis failed: ' + error.message);
    }
}

// Copy API Key Listener (Moved for consistency)
document.querySelector('.key-display i').addEventListener('click', () => {
    const key = document.getElementById('apiKeyDisplay').textContent;
    if (key !== 'NULL_VOID') {
        navigator.clipboard.writeText(key);
        logActivity('ENCRYPTION_KEY_COPIED_TO_CLIPBOARD', 'SUCCESS');
    }
});
