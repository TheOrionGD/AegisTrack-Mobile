import os
import json
import math
import secrets
from datetime import datetime, timedelta
from urllib.parse import quote_plus

from dotenv import load_dotenv
from flask import Flask, request, jsonify
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
CORS(app, supports_credentials=True)
jwt = JWTManager(app)
sock = Sock(app)

MONGODB_URI = os.getenv('MONGODB_URI',
    'mongodb://MTS:MTS@ac-eaefaxg-shard-00-00.mzv9tpk.mongodb.net:27017,'
    'ac-eaefaxg-shard-00-01.mzv9tpk.mongodb.net:27017,'
    'ac-eaefaxg-shard-00-02.mzv9tpk.mongodb.net:27017/'
    '?ssl=true&replicaSet=atlas-w6r3kg-shard-0&authSource=admin&appName=MTS-NEW'
)

mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
db = mongo_client['gps_tracking']
users = db['users']
devices = db['devices']
locations = db['locations']
geofences = db['geofences']
alerts = db['alerts']

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


@app.route('/')
def home():
    return jsonify({'message': 'GPS Tracking Backend API', 'status': 'running'})


@app.route('/auth/register', methods=['POST'])
def register_user():
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
        'created_at': datetime.utcnow()
    })

    return jsonify({'message': 'User registered successfully'}), 201


@app.route('/auth/login', methods=['POST'])
def login_user():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'username and password are required'}), 400

    user = users.find_one({'username': username})
    if not user or not verify_password(password, user['password']):
        return jsonify({'error': 'Invalid username or password'}), 401

    access_token = create_access_token(identity=username)
    registered_devices = list(devices.find({'owner': username}, {'_id': 0, 'device_id': 1, 'api_key': 1}))

    return jsonify({
        'access_token': access_token,
        'devices': registered_devices,
        'message': 'Login successful'
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
        'created_at': datetime.utcnow(),
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

    device_id = data['device_id']
    if not api_key:
        return jsonify({'error': 'Missing API key header'}), 401

    if not verify_device_for_user(device_id, api_key, username):
        return jsonify({'error': 'Unauthorized device or API key'}), 403

    location_doc = {
        'device_id': device_id,
        'latitude': float(data['latitude']),
        'longitude': float(data['longitude']),
        'accuracy': float(data['accuracy']),
        'timestamp': data['timestamp'],
        'created_at': datetime.utcnow()
    }
    locations.insert_one(location_doc)

    latest_fields = {
        'latitude': location_doc['latitude'],
        'longitude': location_doc['longitude'],
        'accuracy': location_doc['accuracy'],
        'timestamp': location_doc['timestamp'],
        'last_updated': datetime.utcnow()
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
                'message': f'Device left the allowed area ({round(distance,1)} meters away)',
                'created_at': datetime.utcnow()
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

    return jsonify({'message': 'Location updated successfully', 'device_id': device_id}), 200


@app.route('/location/<device_id>', methods=['GET'])
@jwt_required()
def get_location(device_id):
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
            'created_at': datetime.utcnow()
        }},
        upsert=True
    )

    return jsonify({'message': 'Geofence configured successfully', 'device_id': device_id}), 200


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


@sock.route('/ws')
def websocket(ws):
    token = request.args.get('token')
    username = user_from_token(token)
    if not username:
        ws.send(json.dumps({'event': 'error', 'payload': {'message': 'Invalid or missing token'}}))
        return

    client_info = {'sock': ws, 'user': username}
    active_sockets.append(client_info)

    try:
        while True:
            message = ws.receive()
            if message is None:
                break
            try:
                incoming = json.loads(message)
                if incoming.get('type') == 'ping':
                    ws.send(json.dumps({'event': 'pong', 'payload': {'timestamp': datetime.utcnow().isoformat()}}))
            except Exception:
                continue
    finally:
        if client_info in active_sockets:
            active_sockets.remove(client_info)


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()}), 200


if __name__ == '__main__':
    ssl_cert = os.getenv('SSL_CERT_PATH')
    ssl_key = os.getenv('SSL_KEY_PATH')
    print('Starting GPS Tracking Backend Server...')
    print('API Endpoints:')
    print('POST /auth/register - Register user')
    print('POST /auth/login - User login')
    print('POST /devices/register - Register device and get API key')
    print('POST /location - Receive location updates')
    print('GET /location/<device_id> - Get device location')
    print('GET /devices - List tracked devices')
    print('POST /geofence - Create device geofence')
    print('GET /alerts - Get device alerts')
    print('GET /health - Health check')
    if ssl_cert and ssl_key:
        print('Running with HTTPS')
        app.run(host='0.0.0.0', port=5000, debug=True, ssl_context=(ssl_cert, ssl_key))
    else:
        app.run(host='0.0.0.0', port=5000, debug=True)
