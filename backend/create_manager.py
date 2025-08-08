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
from app.models.user import User, UserRole
from app.database import Base
from app.auth.auth import get_password_hash

def create_manager():
    """Create the first manager user"""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if a manager already exists
        existing_manager = db.query(User).filter(User.role == UserRole.MANAGER).first()
        if existing_manager:
            print(f"Manager already exists: {existing_manager.email}")
            return
        
        print("Creating first manager account...")
        
        # Get manager details
        name = input("Manager name: ")
        email = input("Manager email: ")
        password = getpass("Manager password: ")
        
        if not name or not email or not password:
            print("Error: All fields are required")
            return
        
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print("Error: User with this email already exists")
            return
        
        # Create manager user
        manager = User(
            name=name,
            email=email,
            password_hash=get_password_hash(password),
            role=UserRole.MANAGER,
            is_verified=True  # Auto-verify the first manager
        )
        
        db.add(manager)
        db.commit()
        
        print(f"Manager created successfully!")
        print(f"Name: {manager.name}")
        print(f"Email: {manager.email}")
        print(f"Role: {manager.role.value}")
        
    except Exception as e:
        print(f"Error creating manager: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_manager()