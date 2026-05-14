import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path='backend/.env')

MONGODB_URI = os.getenv('MONGODB_URI')

if not MONGODB_URI:
    print("Error: MONGODB_URI not found in .env file.")
    exit(1)

try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client['gps_tracking']
    
    collections = ['users', 'devices', 'locations', 'geofences', 'alerts']
    
    for collection_name in collections:
        result = db[collection_name].delete_many({})
        print(f"Deleted {result.deleted_count} documents from '{collection_name}' collection.")
        
    print("\nDatabase cleared successfully.")

except Exception as e:
    print(f"An error occurred: {e}")
finally:
    client.close()

