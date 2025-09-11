<!-- Banner -->
<p align="center">
  <img src="https://img.shields.io/badge/AI%20for%20Good-🌱-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Top%2010-IEEE%20Tech%20Sangam%20Hackathon-blue?style=for-the-badge" />
</p>

<h1 align="center">🌍 EcoLens</h1>
<p align="center">AI-Powered Environmental Sustainability Analyzer </p>

<p align="center">
  <i>Redefining sustainability by revealing the hidden footprint of everyday products.</i>
</p>

---

## ✨ Overview  

Every day, millions of purchase decisions are made without understanding their **environmental cost**.  
**EcoLens** bridges this gap by analyzing ingredients, lifecycle impact, and packaging choices—empowering both **consumers** and **manufacturers** to make conscious, sustainable decisions.  

---

## 🚀 Key Features  

✅ **Scan-to-Insight** → Instantly uncover a product’s environmental footprint  
🧬 **Ingredient Intelligence** → Decode hidden formulations into sustainability metrics  
📊 **Lifecycle Assessment Engine** → Predict, compare, and optimize product sustainability  
🧠 **AI-Powered Reasoning** → Contextual insights powered by Groq’s LLaMA models + Tavily  
🎤 **Voice-First Experience** → Accessibility through Whisper + TTS  
💻 **Seamless Web App** → Built with React.js, Next.js, and MongoDB for scale  

---

## 🏆 Recognition  

🌱 **Top 10 Finalist** at *IEEE Tech Sangam Hackathon*  
🚀 Recognized for combining **AI, Sustainability, and Accessibility** to drive climate impact  

---

## ⚙️ Tech Stack  

| Layer       | Technologies |
|-------------|--------------|
| **Frontend** | React.js, Next.js, TailwindCSS |
| **Backend** | Python (Flask), MongoDB, Node.js (server.js), Express.js, |
| **ML Models** | Transformers, RandomForest, GradientBoosting |
| **AI Reasoning** | Groq LLaMA-3.1 + Tavily |
| **Voice AI** | OpenAI Whisper, TTS |
| **Infra** | Docker, REST APIs |

---

---

## 📂 Repository Structure  

```bash
EcoLens/
│── Frontend/                  # React + Next.js web app
│   ├── backend/               # Node.js + Express API for auth, uploads, products
│   ├── public/                # Static assets (logos, images, icons)
│   └── src/                   # App pages, components, chatbot, dashboards
│
│── ML-Backend/                # AI/ML engine + FastAPI backend
│   ├── Agents/                # AI agents (satellite analyst, sustainability reports)
│   ├── Alerts/                # Eco alerts + monitoring service (Node.js server)
│   ├── LCA/                   # Lifecycle Assessment models, results & comparisons
│   ├── chatbot/               # Voice & text chatbot powered by Whisper + LLaMA
│   ├── dataset_building/      # Scripts + datasets for eco-score generation
│   ├── ocr/                   # OCR + barcode/url-based product data extraction
│   ├── proportions-quantifier/# Ingredient proportion prediction models
│   ├── main.py                # Entry point for backend server
│   └── requirements.txt       # Python dependencies
│
└── README.md                  # Project documentation


