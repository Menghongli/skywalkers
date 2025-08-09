#!/usr/bin/env python3
"""
Script to create the first manager user.
Usage: python create_manager.py
"""

import sys
import os
from getpass import getpass

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

from app.database import SessionLocal, engine
from app.models.user import User
from app.database import Base
from app.auth.auth import get_password_hash

def create_user():
    """Create a user account"""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Creating user account...")
        
        # Get user details
        name = input("User name: ")
        email = input("User email: ")
        password = getpass("User password: ")
        
        if not name or not email or not password:
            print("Error: All fields are required")
            return
        
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print("Error: User with this email already exists")
            return
        
        # Create user
        user = User(
            name=name,
            email=email,
            password_hash=get_password_hash(password)
        )
        
        db.add(user)
        db.commit()
        
        print(f"User created successfully!")
        print(f"Name: {user.name}")
        print(f"Email: {user.email}")
        
    except Exception as e:
        print(f"Error creating user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_user()