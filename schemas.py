from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
class UserLogin(BaseModel):
    email: EmailStr
    password: str    
class UserUpdate(BaseModel):
    age: int | None = None
    weight: int | None = None
    height: int | None = None
    goal: str | None = None