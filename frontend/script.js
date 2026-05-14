// GPS Tracker JavaScript

let trackingInterval;
let isTracking = false;
let deviceId = '';
let accessToken = '';
let apiKey = '';
let socket = null;

const BACKEND_URL = 'http://10.171.58.245:5000';
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const deviceIdInput = document.getElementById('deviceId');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const registerDeviceBtn = document.getElementById('registerDeviceBtn');
const statusEl = document.getElementById('status');
const onlineIndicator = document.getElementById('onlineIndicator');
const latitudeEl = document.getElementById('latitude');
const longitudeEl = document.getElementById('longitude');
const accuracyEl = document.getElementById('accuracy');
const timestampEl = document.getElementById('timestamp');
const errorDisplay = document.getElementById('errorDisplay');
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
                authStatus.textContent = 'Logged in successfully. Tracking is only permitted for authorized registered devices.';
                clearError();
                connectSocket();
            } else {
                showError(data.error || 'Login failed.');
            }
        })
        .catch(error => showError(`Login error: ${error.message}`));
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
                clearError();
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
        clearError();
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

function startTracking() {
    deviceId = deviceIdInput.value.trim();
    if (!deviceId) {
        showError('Please enter a device ID or registered identifier.');
        return;
    }

    if (permissionStatus.textContent !== 'Permission: Granted') {
        showError('Please grant location access before starting tracking.');
        return;
    }

    if (!accessToken) {
        showError('Please login and register your device.');
        return;
    }

    if (!apiKey) {
        showError('Please register your device to obtain an API key.');
        return;
    }

    if (!navigator.onLine) {
        showError('No internet connection. Please check your network.');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            isTracking = true;
            startBtn.disabled = true;
            stopBtn.disabled = false;
            statusEl.textContent = 'Status: Tracking Active';
            onlineIndicator.textContent = 'Yes';
            onlineIndicator.classList.add('online');

            updateLocation(position);

            trackingInterval = setInterval(() => {
                if (navigator.onLine) {
                    navigator.geolocation.getCurrentPosition(
                        updateLocation,
                        handleLocationError,
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    );
                } else {
                    showError('Lost internet connection.');
                    stopTracking();
                }
            }, 10000);
        },
        handleLocationError,
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

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

    navigator.geolocation.getCurrentPosition(
        () => {
            permissionStatus.textContent = 'Permission: Granted';
            permissionStatus.style.color = 'green';
            clearError();
        },
        error => {
            permissionStatus.textContent = 'Permission: Denied';
            permissionStatus.style.color = 'red';
            handleLocationError(error);
        }
    );
}

function updateLocation(position) {
    const { latitude, longitude, accuracy } = position.coords;
    const timestamp = new Date().toLocaleString();

    latitudeEl.textContent = latitude.toFixed(6);
    longitudeEl.textContent = longitude.toFixed(6);
    accuracyEl.textContent = accuracy.toFixed(1);
    timestampEl.textContent = timestamp;

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

        clearError();
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

function showError(message) {
    errorDisplay.textContent = message;
    errorDisplay.style.display = 'block';
}

function clearError() {
    errorDisplay.textContent = '';
    errorDisplay.style.display = 'none';
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
