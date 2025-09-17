from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from models import Scenario, Option, Choice, SessionLocal, UserSettings, Lesson, Quiz, UserResponse, Chat
import pandas as pd 
import sqlite3
import random
import ollama
import re
import json
import requests

app = FastAPI(debug=True)

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

class UserOut(BaseModel):
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

# New endpoint: Save a generated lesson
class LessonCreate(BaseModel):
    title: str
    content: dict  # The generated JSON

class LessonRequest(BaseModel):
    topic: str

def repair_json(json_str: str) -> str:
    """Simple function to fix common JSON issues like trailing commas."""
    # Remove trailing commas in arrays and objects
    json_str = re.sub(r',\s*([}\]])', r'\1', json_str)
    # Remove any leading/trailing backticks or 'json' labels
    json_str = re.sub(r'^``````$', '', json_str.strip())
    return json_str

@app.post("/generate-lesson")
async def generate_lesson(request: LessonRequest):
    try:
        # Generate a random seed for uniqueness
        random_seed = random.randint(1, 1000000)
        
        # Generate with Ollama, with improved prompt including an explicit quiz example
        response = ollama.chat(
            model='gemma3:1b',
            messages=[
                {'role': 'system', 'content': 'You are a helpful assistant that generates structured lessons in valid JSON format only. Do not add extra text, backticks, or explanations outside the JSON. Start directly with the JSON object. Ensure every quiz object includes "correct_index" as a number (0-3). Example quiz structure: "quiz": [{"question": "Which gas is a greenhouse gas?", "options": ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], "correct_index": 2}]'},
                {'role': 'user', 'content': f"Generate a unique, tailored lesson on {request.topic} as JSON. Make content specific to this topic without repeating from others. Include: 'introduction' (1-2 paragraphs as a Markdown-formatted string with bold/italics for emphasis), 'key_concepts' (array of 3-5 Markdown-formatted strings, e.g., '**Term:** Definition'), 'examples' (array of 2-3 Markdown-formatted strings, e.g., '- Example description'), 'quiz' (array of 3 objects with 'question' (string), 'options' (array of 4 strings), 'correct_index' (number 0-3)). Keep concise, 400-600 words. Engaging for educational game."}
            ],
            options={
                'temperature': 0.8,  # For more varied outputs
                'seed': random_seed  # For uniqueness
            }
        )
        
        if 'message' not in response or 'content' not in response['message']:
            raise ValueError("Unexpected response format from Ollama")
        
        generated_content = response['message']['content'].strip()
        
        # String-based extraction: Find first '{' and last '}', slice between them
        start = generated_content.find('{')
        end = generated_content.rfind('}') + 1  # Include the closing brace
        if start == -1 or end == 0:
            raise ValueError("No valid JSON object found in generated content")
        
        cleaned_content = generated_content[start:end]
        
        # Repair the JSON to fix issues like trailing commas
        repaired_content = repair_json(cleaned_content)
        
        # Now parse the repaired string
        try:
            lesson_json = json.loads(repaired_content)  # Parsed here—no file involved
            
            # Optional: Validate and fix if correct_index is missing
            for quiz in lesson_json.get("quiz", []):
                if "correct_index" not in quiz:
                    print(f"Warning: Missing correct_index in quiz: {quiz}")
                    quiz["correct_index"] = 0  # Default; adjust as needed
            
            return {"lesson": lesson_json}
        except json.JSONDecodeError as parse_error:
            raise HTTPException(status_code=500, detail=f"Failed to parse repaired content as JSON. Raw: {generated_content}. Cleaned: {cleaned_content}. Repaired: {repaired_content}. Error: {str(parse_error)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")

@app.post("/save-lesson")
async def save_lesson(lesson: LessonCreate, db: Session = Depends(get_db)):
    db_lesson = Lesson(title=lesson.title, content=lesson.content)
    db.add(db_lesson)
    try:
        db.commit()
        db.refresh(db_lesson)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error saving lesson: {str(e)} (title may already exist)")
    return {"id": db_lesson.id, "title": db_lesson.title}

class ResponseCreate(BaseModel):
    lesson_id: int
    user_id: int
    answers: dict
    score: int

@app.post("/save-response")
async def save_response(response: ResponseCreate, db: Session = Depends(get_db)):
    db_response = UserResponse(
        lesson_id=response.lesson_id,
        user_id=response.user_id,
        answers=response.answers,
        score=response.score
    )
    db.add(db_response)
    db.commit()
    db.refresh(db_response)
    return {"id": db_response.id, "lesson_id": db_response.lesson_id, "user_id": db_response.user_id}


# Ollama Config
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "gemma3:1b"
SYSTEM_PROMPT = (
    "You are Climate Buddy, an AI assistant dedicated to promoting climate awareness. "
    "Provide helpful, accurate advice on reducing carbon footprints, sustainable living, "
    "climate change facts, and eco-friendly tips. Keep responses engaging and positive."
)

class MessageRequest(BaseModel):
    chat_id: int | None = None  # If None, create new chat
    message: str

@app.post("/chat")
async def send_message(request: MessageRequest):
    with Session() as session:
        if request.chat_id is None:
            # Create new chat
            new_chat = Chat(title=f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}", messages=[])
            session.add(new_chat)
            session.commit()
            request.chat_id = new_chat.id

        chat = session.query(Chat).filter_by(id=request.chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        # Add user message
        chat.messages.append({"role": "user", "content": request.message})
        
        # Prepare full prompt with history and system prompt
        full_prompt = SYSTEM_PROMPT + "\n\n" + "\n".join(
            [f"{msg['role']}: {msg['content']}" for msg in chat.messages]
        )

        try:
            payload = {"model": MODEL, "prompt": full_prompt, "stream": False}
            response = requests.post(OLLAMA_URL, json=payload)
            response.raise_for_status()
            result = response.json()
            ai_response = result.get("response", "Sorry, I couldn't generate a response.")
                        # Add AI response
            chat.messages.append({"role": "assistant", "content": ai_response})
            session.commit()
            
            return {"chat_id": chat.id, "response": ai_response}
        except requests.RequestException as e:
            raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")

@app.get("/chats")
async def get_chats():
    with Session() as session:
        chats = session.query(Chat).all()
        return [
            {"id": c.id, "title": c.title, "created_at": c.created_at.isoformat()}
            for c in chats
        ]

@app.get("/chat/{chat_id}")
async def get_chat(chat_id: int):
    with Session() as session:
        chat = session.query(Chat).filter_by(id=chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        return {"id": chat.id, "messages": chat.messages}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)
