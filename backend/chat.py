# from contextlib import asynccontextmanager
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from sqlalchemy import Column, Integer, String, Text, DateTime, create_engine
# from sqlalchemy.orm import sessionmaker, declarative_base
# from datetime import datetime
# from langchain_ollama.chat_models import ChatOllama
# from langchain_core.messages import HumanMessage, SystemMessage

# DATABASE_URL = "sqlite:///./chat3.db"
# Base = declarative_base()
# engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
# SessionLocal = sessionmaker(bind=engine)

# class ChatMessage(Base):
#     __tablename__ = "chat_messages"
#     id = Column(Integer, primary_key=True, index=True)
#     role = Column(String, index=True)
#     content = Column(Text, nullable=False)
#     timestamp = Column(DateTime, default=datetime.utcnow)

# # Ensure tables are created on app startup
# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     Base.metadata.create_all(bind=engine)
#     yield

# app = FastAPI(lifespan=lifespan)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:5173",
#         "http://127.0.0.1:5173",
#         "http://localhost:8000",
#         "http://127.0.0.1:8000"
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
#     expose_headers=["*"], 
# )


# class MessageIn(BaseModel):
#     message: str

# class MessageOut(BaseModel):
#     reply: str


# llm = ChatOllama(model="gemma3:1b")

# @app.post("/chat", response_model=MessageOut)
# async def chat(message_in: MessageIn):
#     user_message = message_in.message.strip()
#     if not user_message:
#         raise HTTPException(status_code=400, detail="Empty message")

#     db = SessionLocal()
#     try:
#         # Save user message
#         db_msg_user = ChatMessage(role="user", content=user_message)
#         db.add(db_msg_user)
#         db.commit()
#         db.refresh(db_msg_user)

#         # Generate reply with system prompt for Markdown
#         messages = [
#             SystemMessage(content="You are a climate educator chatbot and Respond in well-formatted Markdown, using headings, bold, italics, lists, and code blocks where appropriate for clarity and readability. keep your responses short but sweet."),
#             HumanMessage(content=user_message)
#         ]
#         response = await llm.agenerate([messages])
#         assistant_reply = response.generations[0][0].message.content

#         # Save assistant message
#         db_msg_assistant = ChatMessage(role="assistant", content=assistant_reply)
#         db.add(db_msg_assistant)
#         db.commit()
#         db.refresh(db_msg_assistant)

#         return MessageOut(reply=assistant_reply)
#     finally:
#         db.close()


from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import json
import os
from langchain_ollama.chat_models import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import PromptTemplate
import asyncio


DATABASE_URL = "sqlite:///./lessons2.db"
Base = declarative_base()
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

class Lesson(Base):
    __tablename__ = "lessons"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True, index=True)
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    quizzes = relationship("Quiz", back_populates="lesson")

class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    question = Column(Text)
    options = Column(Text)        # JSON string (list)
    correct_answer = Column(String)
    lesson = relationship("Lesson", back_populates="quizzes")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, index=True)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:8001",
        "http://localhost:8001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"], 
)


OLLAMA_MODEL = "llama3.2"
llm = ChatOllama(model=OLLAMA_MODEL)

# Load lessons from JSON
with open("lessons.json") as f:
    lesson_topics = json.load(f)  # list of dicts with id and title

# Pydantic models
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

class GenerateRequest(BaseModel):
    topic_index: int

class GenerateResponse(BaseModel):
    lesson_id: int
    title: str
    content: str

class QuizQuestion(BaseModel):
    id: int
    question: str
    options: list[str]

class QuizResponse(BaseModel):
    questions: list[QuizQuestion]

class QuizSubmitRequest(BaseModel):
    answers: list[str]

class QuizResult(BaseModel):
    results: list[bool]
    correct_count: int


class FeedbackIn(BaseModel):
    feedback: str

class FeedbackOut(BaseModel):
    reply: str

class DashboardData(BaseModel):
    categories: list

class InsightsResponse(BaseModel):
    markdown: str

# ----- Chat endpoint -----
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    user_message = request.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Empty message")
    db = SessionLocal()
    try:
        db.add(ChatMessage(role="user", content=user_message))
        db.commit()

        system_msg = SystemMessage(content="You are a helpful tutor. Answer in well-formatted Markdown.")
        response = await llm.agenerate([[system_msg, HumanMessage(content=user_message)]])
        reply = response.generations[0][0].message.content

        db.add(ChatMessage(role="assistant", content=reply))
        db.commit()
        return ChatResponse(reply=reply)
    finally:
        db.close()

# ----- Lesson Generate -----
async def generate_lesson_content(title: str) -> str:
    prompt = PromptTemplate.from_template("you are a climate educator ,teach the topic '{title}' for a beginner student. Use clear sections. keep your response short and sweet. Dont inform about what you are going to do just start teaching right away.")
    chain = prompt | llm
    response = await chain.ainvoke({"title": title})
    return response.content

@app.post("/generate", response_model=GenerateResponse)
async def generate_lesson(request: GenerateRequest):
    if request.topic_index < 0 or request.topic_index >= len(lesson_topics):
        raise HTTPException(400, "Invalid topic index")

    topic = lesson_topics[request.topic_index]["title"]
    db = SessionLocal()
    try:
        lesson = db.query(Lesson).filter(Lesson.title == topic).first()
        if lesson:
            return GenerateResponse(lesson_id=lesson.id, title=lesson.title, content=lesson.content)

        content = await generate_lesson_content(topic)
        lesson = Lesson(title=topic, content=content)
        db.add(lesson)
        db.commit()
        db.refresh(lesson)
        return GenerateResponse(lesson_id=lesson.id, title=lesson.title, content=lesson.content)
    finally:
        db.close()

# ----- Generate Quiz -----
async def generate_quiz_questions(lesson_content: str) -> list[dict]:
    prompt = PromptTemplate.from_template(
        "Based on this lesson: {content}\nGenerate 3 MCQs. Each with question, 4 options, and correct_answer (as option text). Output as JSON list."
    )
    chain = prompt | llm
    response = await chain.ainvoke({"content": lesson_content})
    try:
        return json.loads(response.content)
    except Exception:
        raise HTTPException(500, "Quiz JSON format error")

@app.get("/quiz/{lesson_id}", response_model=QuizResponse)
async def get_quiz(lesson_id: int):
    db = SessionLocal()
    try:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(404, "Lesson not found")
        if not lesson.quizzes:
            quiz_data = await generate_quiz_questions(lesson.content)
            for q in quiz_data:
                quiz = Quiz(
                    lesson_id=lesson.id,
                    question=q["question"],
                    options=json.dumps(q["options"]),
                    correct_answer=q["correct_answer"]
                )
                db.add(quiz)
            db.commit()
        questions = [
            QuizQuestion(id=q.id, question=q.question, options=json.loads(q.options))
            for q in lesson.quizzes
        ]
        return QuizResponse(questions=questions)
    finally:
        db.close()

@app.post("/quiz/{lesson_id}/submit", response_model=QuizResult)
async def submit_quiz(lesson_id: int, request: QuizSubmitRequest):
    db = SessionLocal()
    try:
        quizzes = db.query(Quiz).filter(Quiz.lesson_id == lesson_id).order_by(Quiz.id).all()
        if len(quizzes) != len(request.answers):
            raise HTTPException(400, "Invalid number of answers")
        results = []
        correct_count = 0
        for quiz, user_answer in zip(quizzes, request.answers):
            is_correct = user_answer == quiz.correct_answer
            results.append(is_correct)
            if is_correct:
                correct_count += 1
        return QuizResult(results=results, correct_count=correct_count)
    finally:
        db.close()


@app.post("/sarcastic_feedback", response_model=FeedbackOut)
async def sarcastic_feedback(request: FeedbackIn):
    system = SystemMessage(content=(
      "You are a funny eco-friendly assistant. Respond to the user's choices in a subtle, witty, but informative sarcastic tone. "
      "Be funny while giving real feedback on their carbon impact. Feel free to use exaggeration and playful language.keep it short(2-3 lines). dispaly the co2e numbers and give feedback based on it. different style for different questions dont make the response same for every question. dont say the same thing over and over again, make important words bold or italic. "))
    user = HumanMessage(content=f"The user's carbon/behavioral summary: {request.feedback}\nNow give your sarcastic reply:")
    response = await llm.agenerate([[system, user]])
    reply = response.generations[0][0].message.content
    return FeedbackOut(reply=reply)


