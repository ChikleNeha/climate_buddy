import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Scenario, Option, DATABASE_URL
from models import Base


with open("D:/projects/climate_buddy/backend/scenarios.json", "r") as f:
    data = json.load(f)

# DB Setup
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Create tables
Base.metadata.drop_all(bind=engine)  # clear old data
Base.metadata.create_all(bind=engine)

# Insert scenarios + options
for scenario in data:
    scen = Scenario(
        id=scenario["id"],
        type=scenario.get("type", "misc"),  # assign "misc" if no type
        prompt=scenario["prompt"]
    )
    db.add(scen)
    for opt in scenario["options"]:
        option = Option(
            id=opt["id"],
            scenario_id=scenario["id"],
            text=opt["text"],
            co2_impact=opt["co2_impact"]
        )
        db.add(option)

db.commit()
print("✅ Database seeded with scenarios and options.")
