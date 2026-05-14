# 📱 Real-Time GPS Tracking System

A complete real-time browser-based GPS tracking system with live location monitoring, secure backend API, and desktop dashboard.

## ✨ Features

* 🌐 **Browser GPS Tracker**: Real-time location tracking using `navigator.geolocation`
* 🔐 **Authentication**: JWT login and device registration with API keys
* 💾 **MongoDB Storage**: Persistent data across backend restarts
* 📡 **WebSocket Live Updates**: Real-time location and geofence alerts
* 🛰️ **Geofencing**: Leave-area alerts when a device exits a configured zone
* 🗺️ **Google Maps Integration**: Open live locations in Google Maps
* ✅ **Explicit Consent**: Browser tracking requires user agreement and supports stop tracking/revoke controls
* 🖥️ **Desktop Dashboard**: JavaFX monitoring tool with live updates

## 🏗️ Architecture

```
gps-tracking-system/
├── frontend/          # Browser GPS tracker UI + WebSocket / auth logic
├── backend/           # Flask REST API + MongoDB + WebSocket + JWT auth
└── java-dashboard/    # JavaFX dashboard with JWT support and live updates
```

## 📂 Project Structure

```
gps-tracking-system/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── .env.example
├── java-dashboard/
│   ├── GPSDashboard.java
│   └── pom.xml
└── README.md
```

## 🛠️ Tech Stack

### Frontend
* HTML, CSS, JavaScript
* `navigator.geolocation`
* WebSockets for real-time updates

### Backend
* Python 3.8+
* Flask, Flask-CORS, Flask-JWT-Extended, Flask-Sock
* MongoDB via `pymongo`
* JWT authentication and secure device API keys

### Desktop Dashboard
* Java 11+
* JavaFX UI
* `HttpClient` REST + WebSocket client
* Jackson JSON parsing

## 🚀 Quick Start (Windows)

The easiest way to run the entire system is using the provided batch script:

1.  Connect your laptop to your phone's hotspot.
2.  Double-click **`run-system.bat`** in the root directory.
3.  The script will start the Backend, Frontend, and open your browser automatically.
4.  Follow the on-screen instructions to access the system from your phone.

---

## 🚀 Manual Setup Instructions

### 1. Backend Setup

```bash
cd backend
python -m pip install -r requirements.txt
```

Create a `.env` file in `backend/` by copying `.env.example` and updating values.

```bash
copy .env.example .env
```

Start the backend server:

```bash
python app.py
```

To use HTTPS locally, set `SSL_CERT_PATH` and `SSL_KEY_PATH` in `.env` and restart. Otherwise, `localhost` is accepted for browser geolocation.

### 2. Frontend Setup

Open `frontend/index.html` with your browser, or serve the directory with a local static server:

```bash
cd frontend
python -m http.server 8000
```

Then browse to `http://localhost:8000`.

### 3. Java Dashboard Setup

```bash
cd java-dashboard
mvn clean compile javafx:run
```

Or package into an executable JAR:

```bash
mvn clean package
java -jar target/gps-dashboard-1.0.0.jar
```

### 4. Mobile Testing (Hotspot Setup)

To track a real phone while running the backend on your laptop:

1.  **Find your Laptop IP:** Run `ipconfig` in CMD and look for the IPv4 Address under "Wireless LAN adapter Wi-Fi".
2.  **Update Configs:** (Already done for current setup) Ensure `frontend/script.js` and `java-dashboard/GPSDashboard.java` use this IP instead of `localhost`.
3.  **Access from Phone:** Open your phone's browser and go to `http://<YOUR_IP>:8000`.
4.  **Allow GPS:** You must grant location permissions when prompted by the mobile browser.

> [!NOTE]
> Ensure your Windows Firewall allows inbound connections on ports `5000` (Backend) and `8000` (Frontend).

## 🔐 Usage

### Browser Tracker

1. Register a new user.
2. Login to obtain a JWT.
3. Enter a device ID or registered identifier.
4. Register the device to receive an API key.
5. Start tracking and grant location permission.
6. Configure a geofence if needed.

### Desktop Dashboard

1. Enter the JWT access token from the browser login.
2. Click `Connect Live` for WebSocket updates.
3. Fetch device locations and open in Google Maps.

## 📡 New Production-Ready Improvements

* JWT authentication for all protected endpoints
* Device registration with API keys for location posts
* MongoDB persistence for devices, location history, geofences, and alerts
* Standard WebSocket support for true live updates
* Optional HTTPS support via environment variables
* Geofence breach detection and alert events
* Explicit consent flow and stop/revoke tracking controls in the browser UI

## 📜 Consent & Privacy

This system is designed for authorized device tracking use cases such as family safety, lost device recovery, registered device tracking, and fleet monitoring. It is not intended for hidden or covert surveillance.

* Data collected: device identifier, latitude, longitude, accuracy, timestamp, and authenticated user/device registration metadata.
* Data use: location data is used only to display live tracking, generate geofence alerts, and provide authorized device monitoring.
* Consent: users must explicitly agree to share live location before tracking starts.
* Stop tracking: users can stop tracking at any time and are advised to revoke browser location permission in site settings.
* Retention: location history is stored in MongoDB until deleted or purged by backend policies. For production, implement a retention policy that meets privacy requirements.

## 📌 Backend Endpoints

* `POST /auth/register` - Register new user
* `POST /auth/login` - Login and get JWT
* `POST /devices/register` - Register device and get API key
* `POST /location` - Send authenticated location update
* `GET /location/<device_id>` - Get latest location for device
* `GET /devices` - List tracked devices for user
* `POST /geofence` - Configure geofence for a device
* `GET /alerts` - Read recent alerts
* `GET /health` - Health check
* `GET /ws` - WebSocket endpoint for live updates

## ⚠️ Notes

* Use `localhost` or HTTPS for browser geolocation to work reliably.
* If using remote access, configure `BACKEND_URL` in `frontend/script.js` and `java-dashboard/GPSDashboard.java`.
* The system is now secure enough for portfolio and prototype use, but production deployment should still include HTTPS certificates, rate limiting, and stronger secrets management.

## 📄 License

This project is for educational and prototyping purposes. Feel free to extend and improve it.
