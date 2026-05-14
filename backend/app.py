import os
import json
import math
import secrets
import base64
from datetime import datetime, timedelta, timezone
from urllib.parse import quote_plus
import requests

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from dotenv import load_dotenv
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    decode_token,
    get_jwt_identity,
    jwt_required,
)
from flask_sock import Sock
from passlib.hash import pbkdf2_sha256
from pymongo import MongoClient, errors

# Load environment variables from .env if available
load_dotenv()

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'change-this-secret')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=2)

# CYBERSECURITY: Rate Limiting to prevent brute force
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=["1000 per day", "200 per hour"],  # general limit
    storage_uri="memory://"
)

CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*", "allow_headers": "*", "methods": "*"}}) 
jwt = JWTManager(app)
sock = Sock(app)

# CYBERSECURITY: Vault Encryption Key Derivation
def get_vault_cipher():
    secret = app.config['JWT_SECRET_KEY'].encode()
    salt = b'mts_security_salt' # In production, use a unique salt from env
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(secret))
    return Fernet(key)

cipher = get_vault_cipher()

MONGODB_URI = os.getenv('MONGODB_URI')

mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
db = mongo_client['gps_tracking']
users = db['users']
devices = db['devices']
locations = db['locations']
geofences = db['geofences']
alerts = db['alerts']
vault_analytics = db['vault_analytics']
vault_threats = db['vault_threats']
vault_logs = db['vault_logs']
vault_files = db['vault_files']
vault_operators = db['vault_operators']
vault_config = db['vault_config']

# Create helpful indexes if they don't already exist
users.create_index('username', unique=True)
devices.create_index('device_id', unique=True)
locations.create_index([('device_id', 1), ('timestamp', -1)])
geofences.create_index('device_id', unique=True)

active_sockets = []
API_KEY_HEADER = 'X-API-KEY'


def to_json(doc):
    if not doc:
        return None
    result = {}
    for key, value in doc.items():
        if key == '_id':
            continue
        if isinstance(value, datetime):
            result[key] = value.isoformat()
        else:
            result[key] = value
    return result


def hash_password(password):
    return pbkdf2_sha256.hash(password)


def verify_password(password, hashed_password):
    return pbkdf2_sha256.verify(password, hashed_password)


def generate_api_key():
    return secrets.token_urlsafe(32)


def haversine(lat1, lon1, lat2, lon2):
    radius = 6371000
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius * c


def broadcast(event, payload, owner=None):
    message = json.dumps({'event': event, 'payload': payload})
    for ws_entry in active_sockets.copy():
        sock_obj = ws_entry.get('sock')
        if owner and ws_entry.get('user') != owner:
            continue
        try:
            sock_obj.send(message)
        except Exception:
            active_sockets.remove(ws_entry)


def user_from_token(token):
    try:
        decoded = decode_token(token)
        return decoded.get('sub') or decoded.get('identity')
    except Exception:
        return None


def get_device(device_id):
    return devices.find_one({'device_id': device_id})


def verify_device_for_user(device_id, api_key, username):
    device = get_device(device_id)
    return device and device.get('api_key') == api_key and device.get('owner') == username


# CYBERSECURITY: Security Headers & CORS Middleware
@app.after_request
def add_security_headers(response):
    # Fix CORS preflight issue: Explicitly allow headers
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-API-KEY'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self' http://*:* https://*:*; script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' cdnjs.cloudflare.com fonts.googleapis.com; font-src 'self' cdnjs.cloudflare.com fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' http://*:* https://*:* ws://*:* wss://*:*;"
    return response


@app.route('/')
def home():
    return jsonify({'message': 'MTS Cybersecurity Core API', 'status': 'PROTECTED'})


@app.route('/register', methods=['POST', 'OPTIONS'])
@app.route('/auth/register', methods=['POST', 'OPTIONS'])
@limiter.limit("5 per hour")
def register_user():
    if request.method == 'OPTIONS':
        return '', 200
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'username and password are required'}), 400

    if users.find_one({'username': username}):
        return jsonify({'error': 'Username already exists'}), 409

    users.insert_one({
        'username': username,
        'password': hash_password(password),
        'created_at': datetime.now(timezone.utc)
    })

    # CYBERSECURITY: Audit Log for Registration
    vault_logs.insert_one({
        'owner': username,
        'data': cipher.encrypt(json.dumps({'event': 'OPERATOR_PROVISIONED', 'ip': request.remote_addr}).encode()),
        'created_at': datetime.now(timezone.utc),
        'encrypted': True
    })
    
    vault_operators.insert_one({
        'owner': username,
        'data': {'name': username.upper(), 'role': 'System Administrator', 'status': 'Active'},
        'created_at': datetime.now(timezone.utc)
    })

    return jsonify({'message': 'Operator profile established in secure registry'}), 201


@app.route('/login', methods=['POST', 'OPTIONS'])
@app.route('/auth/login', methods=['POST', 'OPTIONS'])
@limiter.limit("10 per minute")
def login_user():
    if request.method == 'OPTIONS':
        return '', 200
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'username and password are required'}), 400

    user = users.find_one({'username': username})
    if not user or not verify_password(password, user['password']):
        # CYBERSECURITY: Log failed login attempt
        vault_logs.insert_one({
            'owner': 'SYSTEM',
            'data': cipher.encrypt(json.dumps({'event': 'AUTH_FAILURE', 'target': username, 'ip': request.remote_addr}).encode()),
            'created_at': datetime.now(timezone.utc),
            'encrypted': True
        })
        return jsonify({'error': 'Invalid username or password'}), 401

    access_token = create_access_token(identity=username)
    registered_devices = list(devices.find({'owner': username}, {'_id': 0, 'device_id': 1, 'api_key': 1}))

    # CYBERSECURITY: Audit Log for Success
    vault_logs.insert_one({
        'owner': username,
        'data': cipher.encrypt(json.dumps({'event': 'C2_ACCESS_GRANTED', 'ip': request.remote_addr}).encode()),
        'created_at': datetime.now(timezone.utc),
        'encrypted': True
    })

    return jsonify({
        'access_token': access_token,
        'devices': registered_devices,
        'message': 'C2 Access Granted. Session JWT issued.'
    }), 200


@app.route('/devices/register', methods=['POST'])
@jwt_required()
def register_device():
    username = get_jwt_identity()
    data = request.get_json() or {}
    device_id = data.get('device_id')

    if not device_id:
        return jsonify({'error': 'device_id is required'}), 400

    existing = devices.find_one({'device_id': device_id})
    if existing:
        if existing.get('owner') != username:
            return jsonify({'error': 'Device is owned by another account'}), 403
        return jsonify(to_json(existing)), 200

    api_key = generate_api_key()
    device_doc = {
        'device_id': device_id,
        'owner': username,
        'api_key': api_key,
        'created_at': datetime.now(timezone.utc),
        'latitude': None,
        'longitude': None,
        'accuracy': None,
        'timestamp': None,
        'last_updated': None,
        'geofence_inside': True
    }
    devices.insert_one(device_doc)
    return jsonify(to_json(device_doc)), 201


@app.route('/devices', methods=['GET'])
@jwt_required()
def list_devices():
    username = get_jwt_identity()
    device_cursor = devices.find({'owner': username}, {'_id': 0, 'device_id': 1, 'latitude': 1, 'longitude': 1, 'accuracy': 1, 'timestamp': 1, 'last_updated': 1, 'geofence_inside': 1})
    return jsonify({'devices': [to_json(device) for device in device_cursor]}), 200


@app.route('/location', methods=['POST'])
@jwt_required()
def receive_location():
    username = get_jwt_identity()
    data = request.get_json() or {}
    api_key = request.headers.get(API_KEY_HEADER)

    required_fields = ['device_id', 'latitude', 'longitude', 'accuracy', 'timestamp']
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400

    device_id = data.get('device_id')
    
    # CYBERSECURITY: Unauthorized device check
    if device_id != 'COMMAND_CONSOLE' and not verify_device_for_user(device_id, api_key, username):
        vault_logs.insert_one({
            'owner': username,
            'data': cipher.encrypt(json.dumps({'event': 'UNAUTHORIZED_NODE_INGEST', 'node': device_id, 'ip': request.remote_addr}).encode()),
            'created_at': datetime.now(timezone.utc),
            'encrypted': True
        })
        return jsonify({'error': 'Unauthorized device or API key'}), 403

    # CYBERSECURITY: Anomaly/Threat Detection (Impossible Travel)
    last_loc = locations.find_one({'device_id': device_id}, sort=[('timestamp', -1)])
    if last_loc:
        dist = haversine(float(data['latitude']), float(data['longitude']), last_loc['latitude'], last_loc['longitude'])
        # If speed > 500m/s (approx Mach 1.5), flag as threat
        try:
            t1 = datetime.fromisoformat(data['timestamp'].replace('Z', ''))
            t2 = last_loc['created_at']
            time_diff = abs((t1 - t2).total_seconds())
            if time_diff > 0 and (dist / time_diff) > 500:
                vault_threats.insert_one({
                    'owner': username,
                    'data': cipher.encrypt(json.dumps({
                        'event': 'IMPOSSIBLE_TRAVEL_DETECTED',
                        'node': device_id,
                        'speed': round(dist/time_diff, 2),
                        'ip': request.remote_addr
                    }).encode()),
                    'created_at': datetime.now(timezone.utc),
                    'encrypted': True
                })
                broadcast('security_threat', {'type': 'IMPOSSIBLE_TRAVEL', 'node': device_id}, owner=username)
        except: pass

    location_doc = {
        'device_id': device_id,
        'latitude': float(data['latitude']),
        'longitude': float(data['longitude']),
        'accuracy': float(data['accuracy']),
        'timestamp': data['timestamp'],
        'created_at': datetime.now(timezone.utc)
    }
    locations.insert_one(location_doc)

    latest_fields = {
        'latitude': location_doc['latitude'],
        'longitude': location_doc['longitude'],
        'accuracy': location_doc['accuracy'],
        'timestamp': location_doc['timestamp'],
        'last_updated': datetime.now(timezone.utc)
    }
    devices.update_one({'device_id': device_id}, {'$set': latest_fields})

    geofence = geofences.find_one({'device_id': device_id})
    alert_payload = None
    if geofence:
        distance = haversine(location_doc['latitude'], location_doc['longitude'], geofence['center_lat'], geofence['center_lng'])
        inside = distance <= geofence['radius_meters']
        if not inside and geofence.get('is_inside', True):
            alert_payload = {
                'device_id': device_id,
                'event': 'geofence_exit',
                'distance_meters': round(distance, 1),
                'center_lat': geofence['center_lat'],
                'center_lng': geofence['center_lng'],
                'radius_meters': geofence['radius_meters'],
                'timestamp': datetime.utcnow().isoformat()
            }
            geofences.update_one({'device_id': device_id}, {'$set': {'is_inside': False}})
            alerts.insert_one({
                'device_id': device_id,
                'type': 'geofence_exit',
                'message': f'Digital Perimeter Breach Detected ({round(distance,1)}m deviation)',
                'created_at': datetime.now(timezone.utc)
            })
        elif inside and not geofence.get('is_inside', True):
            geofences.update_one({'device_id': device_id}, {'$set': {'is_inside': True}})

    payload = {
        'device_id': device_id,
        'latitude': location_doc['latitude'],
        'longitude': location_doc['longitude'],
        'accuracy': location_doc['accuracy'],
        'timestamp': location_doc['timestamp']
    }
    broadcast('location_updated', payload, owner=username)
    if alert_payload:
        broadcast('geofence_alert', alert_payload, owner=username)

    return jsonify({'message': 'Telemetry packet ingested and verified', 'device_id': device_id}), 200


@app.route('/location/<device_id>', methods=['GET', 'OPTIONS'])
@jwt_required()
@limiter.limit("2000 per hour")  # High limit: live dashboard polling
def get_location(device_id):
    # Guard: reject sentinel/placeholder IDs
    if not device_id or device_id in ('none', 'null', 'undefined', 'NONE'):
        return jsonify({'error': 'Invalid device_id'}), 400
    username = get_jwt_identity()
    device = devices.find_one({'device_id': device_id})
    if not device or device.get('owner') != username:
        return jsonify({'error': 'Device not found or unauthorized'}), 404
    return jsonify(to_json(device)), 200


@app.route('/geofence', methods=['POST'])
@jwt_required()
def set_geofence():
    username = get_jwt_identity()
    data = request.get_json() or {}
    required_fields = ['device_id', 'center_lat', 'center_lng', 'radius_meters']
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400

    device_id = data['device_id']
    device = devices.find_one({'device_id': device_id})
    if not device or device.get('owner') != username:
        return jsonify({'error': 'Device not found or unauthorized'}), 404

    geofences.update_one(
        {'device_id': device_id},
        {'$set': {
            'device_id': device_id,
            'center_lat': float(data['center_lat']),
            'center_lng': float(data['center_lng']),
            'radius_meters': float(data['radius_meters']),
            'is_inside': True,
            'created_at': datetime.now(timezone.utc)
        }},
        upsert=True
    )

    return jsonify({'message': 'Digital perimeter established and armed', 'device_id': device_id}), 200


@app.route('/geofence/<device_id>', methods=['GET'])
@jwt_required()
def get_geofence(device_id):
    username = get_jwt_identity()
    device = devices.find_one({'device_id': device_id})
    if not device or device.get('owner') != username:
        return jsonify({'error': 'Device not found or unauthorized'}), 404

    geofence = geofences.find_one({'device_id': device_id})
    return jsonify(to_json(geofence)), 200


@app.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    username = get_jwt_identity()
    user_devices = [device['device_id'] for device in devices.find({'owner': username}, {'device_id': 1})]
    alert_cursor = alerts.find({'device_id': {'$in': user_devices}}, {'_id': 0}).sort('created_at', -1).limit(50)
    return jsonify({'alerts': [to_json(alert) for alert in alert_cursor]}), 200


@app.route('/vault/<module>', methods=['POST'])
@jwt_required()
def save_vault_data(module):
    username = get_jwt_identity()
    data = request.get_json() or {}
    
    collection_map = {
        'analytics': vault_analytics,
        'threats': vault_threats,
        'logs': vault_logs,
        'files': vault_files,
        'operators': vault_operators,
        'config': vault_config
    }
    
    if module not in collection_map:
        return jsonify({'error': f'Invalid module: {module}'}), 400
        
    collection = collection_map[module]
    
    # CYBERSECURITY: Symmetric Encryption of data at rest
    encrypted_data = cipher.encrypt(json.dumps(data).encode())
    
    doc = {
        'owner': username,
        'data': encrypted_data,
        'encrypted': True,
        'created_at': datetime.now(timezone.utc)
    }
    
    collection.insert_one(doc)
    return jsonify({'message': f'Segmented vault persistence successful: {module}'}), 201


@app.route('/vault/<module>', methods=['GET'])
@jwt_required()
def get_vault_data(module):
    username = get_jwt_identity()
    
    collection_map = {
        'analytics': vault_analytics,
        'threats': vault_threats,
        'logs': vault_logs,
        'files': vault_files,
        'operators': vault_operators,
        'config': vault_config
    }
    
    if module not in collection_map:
        return jsonify({'error': f'Invalid module: {module}'}), 400
        
    collection = collection_map[module]
    cursor = collection.find({'owner': username}, {'_id': 0}).sort('created_at', -1).limit(100)
    
    results = []
    for doc in cursor:
        clean_doc = to_json(doc)
        # CYBERSECURITY: On-the-fly Decryption
        if doc.get('encrypted'):
            try:
                decrypted_bytes = cipher.decrypt(doc['data'])
                clean_doc['data'] = json.loads(decrypted_bytes.decode())
            except Exception as e:
                clean_doc['data'] = {"error": "Decryption failed", "details": str(e)}
        results.append(clean_doc)
    
    return jsonify({module: results}), 200


@app.route('/proxy/groq', methods=['POST'])
@jwt_required()
def proxy_groq():
    """
    Proxy request to Groq API to keep the API Key secure on the server.
    """
    groq_api_key = os.getenv('GROQ_API_KEY')
    if not groq_api_key:
        return jsonify({'error': 'GROQ_API_KEY not configured on server'}), 500

    data = request.get_json()
    try:
        response = requests.post(
            'https://api.groq.com/openai/v1/chat/completions',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {groq_api_key}'
            },
            json=data,
            timeout=30
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@sock.route('/ws')
def websocket(ws):
    token = request.args.get('token')
    username = user_from_token(token)
    if not username:
        try:
            ws.send(json.dumps({'event': 'error', 'payload': {'message': 'Invalid or missing token'}}))
        except Exception:
            pass
        return

    client_info = {'sock': ws, 'user': username}
    active_sockets.append(client_info)

    try:
        while True:
            try:
                message = ws.receive(timeout=30)
            except Exception:
                # Connection reset, timeout, or binary frame — clean disconnect
                break

            if message is None:
                break

            # Ignore non-string frames (binary pings from browsers)
            if not isinstance(message, str):
                continue

            try:
                incoming = json.loads(message)
                if incoming.get('type') == 'ping':
                    ws.send(json.dumps({
                        'event': 'pong',
                        'payload': {'timestamp': datetime.now(timezone.utc).isoformat()}
                    }))
            except (json.JSONDecodeError, Exception):
                continue

    except Exception:
        pass  # Absorb any outer connection-level errors to prevent 500
    finally:
        if client_info in active_sockets:
            active_sockets.remove(client_info)


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now(timezone.utc).isoformat()}), 200


if __name__ == '__main__':
    ssl_cert = os.getenv('SSL_CERT_PATH')
    ssl_key = os.getenv('SSL_KEY_PATH')
    print('INITIALIZING MTS CYBERSECURITY KERNEL...')
    print('SECURE API ENDPOINTS ACTIVE:')
    print('POST /auth/register - Operator Provisioning')
    print('POST /auth/login - C2 Access Grant')
    print('POST /devices/register - Node Ingest Key Provisioning')
    print('POST /location - Telemetry Packet Ingestion')
    print('GET /location/<device_id> - Singular Node Status')
    print('GET /devices - Global Node Inventory')
    print('POST /geofence - Perimeter Configuration')
    print('GET /alerts - Threat Incident Retrieval')
    print('GET /health - Integrity Check')
    if ssl_cert and ssl_key:
        print('Running with HTTPS Hardening')
        app.run(host='0.0.0.0', port=5000, debug=True, ssl_context=(ssl_cert, ssl_key))
    else:
        app.run(host='0.0.0.0', port=5000, debug=True)
