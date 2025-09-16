from sqlalchemy import create_engine, Column, Integer,String, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship

DATABASE_URL = 'sqlite:///./r.db'

engine = create_engine(DATABASE_URL, connect_args={'check_same_thread':False})
SessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)
Base = declarative_base()

# class User(Base):
#     __tablename__= 'users'
#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, index=True)
#     # language = Column(String,  index=True)
#     # mode = Column(String,  index=True)

class UserSettings(Base):
    __tablename__ = "user_settings"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False)
    mode = Column(String, nullable=False)
    language = Column(String, nullable=False)
    
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
    scenario_id = Column(String)
    option_id = Column(String)
    chosen_co2e = Column(Float)   # <-- store the original co2_impact value
    scenario_type = Column(String)
    saved_co2e = Column(Float)


Base.metadata.create_all(bind=engine)
