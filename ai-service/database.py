import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://kritibista:kriti123@cluster0.mongodb.net/nayaawasar?retryWrites=true&w=majority")
DB_NAME = "test" # the db name is likely 'test' based on standard mongoose connection unless specified, let's connect and assume nayaawasar database name is actually extracted from the uri.

def get_db():
    try:
        # Pymongo will automatically use the database provided in the URI 
        # e.g., mongodb+srv://.../nayaawasar?retryWrites... would use 'nayaawasar'
        client = MongoClient(MONGO_URI)
        # Extract default db name from URI or fallback to a standard one
        db_name = client.get_database().name if client.get_database().name else "test"
        db = client[db_name]
        
        # Determine actual collection names
        # Some are plural, some might be singular. Let's list collections and find the correct ones
        return client, db
    except Exception as e:
        print(f"MongoDB Connection Error: {e}")
        return None, None
