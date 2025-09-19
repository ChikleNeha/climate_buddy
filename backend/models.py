from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, JSON, DateTime
from sqlalchemy.orm import sessionmaker, Session, relationship, declarative_base
from datetime import datetime, timezone
from sqlalchemy.ext.mutable import MutableList

DATABASE_URL = 'sqlite:///./climate.db'
engine = create_engine(DATABASE_URL, connect_args={'check_same_thread': False})
SessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    settings = relationship("UserSettings", back_populates="user", uselist=False)
    responses = relationship("UserResponse", back_populates="user")
    choices = relationship("Choice", back_populates="user")
    chats = relationship("Chat", back_populates="user")

class UserSettings(Base):
    __tablename__ = "user_settings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    username = Column(String, nullable=False)
    mode = Column(String, nullable=False)
    language = Column(String, nullable=False)
    user = relationship("User", back_populates="settings")

# --------------------
# Database Models
# --------------------
class Scenario(Base):
    __tablename__ = "scenarios"
    id = Column(String, primary_key=True)
    type = Column(String)
    prompt = Column(String)
    options = relationship("Option", back_populates="scenario")

class Option(Base):
    __tablename__ = "options"
    id = Column(String, primary_key=True)
    scenario_id = Column(String, ForeignKey("scenarios.id"))
    text = Column(String)
    co2_impact = Column(Float)
    scenario = relationship("Scenario", back_populates="options")

class Choice(Base):
    __tablename__ = "choices"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scenario_id = Column(String, ForeignKey("scenarios.id"))
    option_id = Column(String, ForeignKey("options.id"))
    chosen_co2e = Column(Float)  # Store the original co2_impact value
    scenario_type = Column(String)
    saved_co2e = Column(Float)
    user = relationship("User", back_populates="choices")
    scenario = relationship("Scenario")
    option = relationship("Option")

class Lesson(Base):
    __tablename__ = 'lessons'
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True)
    content = Column(JSON)  # Stores generated lesson JSON
    quizzes = relationship("Quiz", back_populates="lesson")

class Quiz(Base):
    __tablename__ = 'quizzes'
    id = Column(Integer, primary_key=True)
    lesson_id = Column(Integer, ForeignKey('lessons.id'))
    questions = Column(JSON)  # Array of MCQs
    lesson = relationship("Lesson", back_populates="quizzes")

class UserResponse(Base):
    __tablename__ = 'user_responses'
    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey('lessons.id'))
    user_id = Column(Integer, ForeignKey('users.id'))
    answers = Column(JSON)  # e.g., {"q1": 0, "q2": 2, "q3": 1}
    score = Column(Integer)  # Number of correct answers
    user = relationship("User", back_populates="responses")
    lesson = relationship("Lesson")

class Chat(Base):
    __tablename__ = "chats"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    messages = Column(MutableList.as_mutable(JSON), default=list)
    user = relationship("User", back_populates="chats")

Base.metadata.create_all(bind=engine)
