# Climate Buddy

**Climate Buddy** is a climate action web app that helps users track their carbon footprint, discover personalized eco-tips, and contribute to community sustainability challenges. Built for Tech for Social Good hackathon - empowers individuals to make measurable environmental impact through gamified tracking and AI recommendations.

## 🚀 Features

- **Carbon Footprint Calculator**: Track daily activities (transport, food, energy) → personalized CO2 score
- **AI Eco Recommendations**: Smart suggestions based on your habits ("Switch to cycling → save 2kg CO2/week")
- **Community Challenges**: Join global/local sustainability quests with leaderboards
- **Impact Visualization**: Charts showing your progress + global context
- **Local-First AI**: Ollama-powered insights without cloud dependency

## 🛠 Tech Stack

| Frontend | Backend | AI/ML | Data |
|----------|---------|-------|------|
| React.js, TailwindCSS, Chart.js | FastAPI, SQLAlchemy | Ollama (llama3.2), LangChain | SQLite |

## 🎯 Demo Workflow

```
1. User Profile → Daily inputs: "Drove 20km, ate chicken dinner"
↓
2. AI Calculator → "Your footprint: 4.2kg CO2 (avg: 3.8kg)"
↓
3. Smart Tips → "Try public transport (save 1.5kg) + veggie meals"
↓
4. Dashboard → Charts + "You've saved 12kg CO2 this month!"
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10+, Node.js 18+
- Ollama: `ollama pull llama3.2`

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload  # http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

## 📊 Sample Data

**Daily Activity Impact:**
| Activity | CO2 (kg) |
|----------|----------|
| Car 20km | 4.2 |
| Beef meal | 5.0 |
| Flight 100km | 25.0 |
| Cycling | 0.0 |


## 👥 Acknowledgments

- **Tech for Social Good Hackathon** prototype by Neha Chikle
- [GitHub](https://github.com/ChikleNeha)

***

*Track your climate impact, get smart tips, join the movement!* 🌍✨
