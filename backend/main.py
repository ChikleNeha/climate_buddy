from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from models import Scenario, Option, Choice, SessionLocal, UserSettings
from typing import Optional
import pandas as pd 
import sqlite3
import random
# from sqlalchemy.dialects.sqlite import JSON as SQLITE_JSON  
import json

app = FastAPI()

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://127.0.0.1:8000","http://127.0.0.1:8000/settings"],  # Use the URL where your React app runs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCreate(BaseModel):
    name: str
    # language: str
    # mode: str

class UserResponse(BaseModel):
    id: int
    name: str
    # language: str
    # mode: str

    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    name: str
    language: str
    mode: str

# class LessonById(BaseModel):
#     id: int
#     title: str

# --------------------
# Pydantic Schemas
# --------------------
class OptionOut(BaseModel):
    id: str
    text: str
    co2_impact: float

    class Config:
        orm_mode = True

class ScenarioOut(BaseModel):
    id: str
    type: str
    prompt: str
    options: list[OptionOut]

    class Config:
        orm_mode = True

class PlayRequest(BaseModel):
    scenario_id: str
    option_id: str

class PlayResponse(BaseModel):
    message: str
    saved_co2e: float
    used_co2e: float

class UserSettingsCreate(BaseModel):
    username: str
    mode: str
    language: str

    class Config:
        orm_mode = True

class UserSettingsUpdate(BaseModel):
    username: str
    mode: str
    language: str

    class Config:
        orm_mode = True
  

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# , language=user.language, mode=user.mode
# @app.post('/users/', response_model=UserResponse)
# def create_user(user:UserCreate, db:Session=Depends(get_db)):
#     db_user = User(name=user.name)
#     db.add(db_user)
#     db.commit()
#     db.refresh(db_user)
#     return db_user


# @app.get('/users/', response_model=list[UserResponse])
# def get_users(db:Session=Depends(get_db)):
#     users = db.query(User).all()
#     return users

# @app.get('/users/{user_id}', response_model=UserResponse)
# def get_user_by_id(user_id:int, db:Session=Depends(get_db)):
#     user = db.query(User).filter(User.id == user_id).first()
#     if user is None:
#         raise HTTPException(status_code=404, detail='User not found')
#     return user

# @app.put('/users/{user_id}', response_model=UserResponse)
# def update_user(user_id:int, user:UserUpdate, db:Session=Depends(get_db)):
#     db_user = db.query(User).filter(User.id == user_id).first()
#     if db_user is None:
#         raise HTTPException(status_code=404, detail='User not found')
#     db_user.name = user.name if user.name is not None else db_user.name
#     db_user.email = user.email if user.email is not None else db_user.email
#     db.commit()
#     db.refresh(db_user)
#     return db_user


# Load JSON data (save the provided payload as lessons.json)
with open("D:/projects/climate_buddy/backend/lessons.json", "r", encoding="utf-8") as f:
    lessons = json.load(f)

@app.get('/')
def home():
    return {'backned':'is working'}

@app.get('/lessons/')
def get_lessons():
    return lessons

@app.get('/lessons/{lesson_id}')
def get_lessons_by_id(lesson_id:int):
    for lesson in lessons:
        if lesson['id']== lesson_id:
            return lesson 
    raise HTTPException (status_code=404, detail='User not found')



@app.get("/next_scenario", response_model=ScenarioOut)
def get_next_scenario(db: Session = Depends(get_db)):
    scenarios = db.query(Scenario).all()
    if not scenarios:
        raise HTTPException(status_code=404, detail="No scenarios found")
    scenario = random.choice(scenarios)  # random for MVP
    return scenario

@app.post("/play", response_model=PlayResponse)
def play(req: PlayRequest, db: Session = Depends(get_db)):
    scenario = db.query(Scenario).filter(Scenario.id == req.scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    chosen_option = db.query(Option).filter(
        Option.id == req.option_id,
        Option.scenario_id == scenario.id
    ).first()
    if not chosen_option:
        raise HTTPException(status_code=404, detail="Option not found")

    # Get all options to compare
    all_options = db.query(Option).filter(Option.scenario_id == scenario.id).all()
    min_co2e = min(opt.co2_impact for opt in all_options)
    max_co2e = max(opt.co2_impact for opt in all_options)

    saved = max(0, max_co2e - min_co2e)  # difference vs. best option
    actually_saved = max(0, max_co2e - chosen_option.co2_impact) 

    # Save play history (store actual used co2e + scenario type)
    play_record = Choice(
        scenario_id=scenario.id,
        option_id=chosen_option.id,
        chosen_co2e=chosen_option.co2_impact,
        scenario_type=scenario.type,
        saved_co2e=saved
    )
    db.add(play_record)
    db.commit()
    db.refresh(play_record)

    # Message logic
    if chosen_option.co2_impact == min_co2e:
        message = f"You used {chosen_option.co2_impact:.2f} kg CO₂e. and saved {saved:.2f} kg CO₂e today by making the best choice!"
    else:
        message = f"You used {chosen_option.co2_impact:.2f} kg CO₂e. The best choice could have saved you {saved:.2f} kg CO₂e."

    return PlayResponse(
        message=message,
        saved_co2e=actually_saved,
        used_co2e=chosen_option.co2_impact
    )

@app.get("/choices")
def get_choices(db: Session = Depends(get_db)):
    choices = db.query(Choice).all()
    return [
        {
            "scenario_id": c.scenario_id,
            "option_id": c.option_id,
            "chosen_co2e": c.chosen_co2e,
            "scenario_type": c.scenario_type,
        }
        for c in choices
    ]


@app.get("/co2e-summary/")
def get_co2e_summary():
    conn = sqlite3.connect("r.db")
    cursor = conn.cursor()
    cursor.execute("""
        SELECT scenario_type,
               SUM(chosen_co2e) AS used_co2e,
               SUM(saved_co2e) AS saved_co2e
        FROM choices
        GROUP BY scenario_type
    """)
    result = [
        {"scenario_type": row[0], "used_co2e": row[1], "saved_co2e": row[2]}
        for row in cursor.fetchall()
    ]
    conn.close()
    return result


file_path = "carbon-monitor-GLOBAL-maingraphdatas.xlsx"

@app.get("/emissions")
def get_emissions():
    try:
        df = pd.read_excel(file_path, sheet_name="datas")
        pivot = df.groupby(["country", "sector"])["MtCO2 per day"].sum().reset_index()
        pivoted = pivot.pivot(index="country", columns="sector", values="MtCO2 per day").fillna(0).reset_index()
        return pivoted.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/emissions/{country}")
def get_country_emissions(country: str):
    df = pd.read_excel(file_path, sheet_name="datas")
    country_df = df[df["country"].str.lower() == country.lower()]
    if country_df.empty:
        return {"error": "Country not found"}

    # Aggregate per date + sector
    grouped = country_df.groupby(["date", "sector"])["MtCO2 per day"].sum().reset_index()
    pivoted = grouped.pivot(index="date", columns="sector", values="MtCO2 per day").fillna(0).reset_index()
    return pivoted.to_dict(orient="records")

# Create tables on startup

@app.post("/settings")
def create_user_settings(
    settings: UserSettingsCreate, db: Session = Depends(get_db)
):
    db_settings = UserSettings(**settings.dict())
    db.add(db_settings)
    db.commit()
    db.refresh(db_settings)
    return db_settings


# @app.put("/settings/{id}")
# def update_settings(id: int, settings: UserSettingsUpdate, db: Session = Depends(get_db)):
#     db_settings = db.query(UserSettings).filter(UserSettings.id == id).first()
#     if db_settings is None:
#         raise HTTPException(status_code=404, detail="Settings not found")
#     db_settings.username = settings.username
#     db_settings.mode = settings.mode
#     db_settings.language = settings.language
#     db.commit()
#     db.refresh(db_settings)
#     return db_settings

@app.put("/settings/update/{user_id}")
def update_settings(user_id: int, settings: UserSettingsUpdate, db: Session = Depends(get_db)):
    existing = db.query(UserSettings).filter(UserSettings.id == user_id).first()
    if existing is None:
        raise HTTPException(status_code=404, detail="User ID does not exist")
    existing.username = settings.username
    existing.mode = settings.mode
    existing.language = settings.language
    db.commit()
    db.refresh(existing)
    return {"message": "Settings updated", "user": existing}