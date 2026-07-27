from database import engine
from models import Base

Base.metadata.drop_all(bind=engine)
print("Old tables dropped successfully!")

Base.metadata.create_all(bind=engine)
print("New tables created successfully!")