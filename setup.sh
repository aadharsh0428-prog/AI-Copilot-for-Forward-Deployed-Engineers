#!/bin/bash
# Dataleap Workshop Copilot — Setup & Start Script
# Usage: ./setup.sh

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ██████╗  █████╗ ████████╗ █████╗ ██╗     ███████╗ █████╗ ██████╗ "
echo "  ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██║     ██╔════╝██╔══██╗██╔══██╗"
echo "  ██║  ██║███████║   ██║   ███████║██║     █████╗  ███████║██████╔╝"
echo "  ██║  ██║██╔══██║   ██║   ██╔══██║██║     ██╔══╝  ██╔══██║██╔═══╝ "
echo "  ██████╔╝██║  ██║   ██║   ██║  ██║███████╗███████╗██║  ██║██║     "
echo "  ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝     "
echo ""
echo "  FIELD AGENT — Workshop-to-Agent Builder"
echo -e "${NC}"

# Check Ollama
echo -e "${YELLOW}[1/5] Checking Ollama...${NC}"
if command -v ollama &> /dev/null; then
    echo -e "${GREEN}  ✓ Ollama installed${NC}"
    if ollama list | grep -q "llama3.1"; then
        echo -e "${GREEN}  ✓ llama3.1 model ready${NC}"
    else
        echo -e "${YELLOW}  → Pulling llama3.1 (this may take a few minutes)...${NC}"
        ollama pull llama3.1
    fi
else
    echo -e "${RED}  ✗ Ollama not found. Install from: https://ollama.ai${NC}"
    echo -e "${YELLOW}  → Continuing without Ollama (will use OpenAI fallback or stubs)${NC}"
fi

# Backend setup
echo -e "${YELLOW}[2/5] Setting up backend...${NC}"
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}  ✓ Virtual environment created${NC}"
fi
source venv/bin/activate
pip install -r requirements.txt -q
echo -e "${GREEN}  ✓ Backend dependencies installed${NC}"

# Copy env if not exists
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}  ✓ .env created from template${NC}"
    echo -e "${YELLOW}  → Edit backend/.env to add OPENAI_API_KEY for Whisper transcription${NC}"
fi
cd ..

# Frontend setup
echo -e "${YELLOW}[3/5] Setting up frontend...${NC}"
cd frontend
npm install --silent
echo -e "${GREEN}  ✓ Frontend dependencies installed${NC}"
cd ..

echo -e "${YELLOW}[4/5] Starting services...${NC}"

# Start Ollama if available
if command -v ollama &> /dev/null; then
    ollama serve &>/dev/null &
    echo -e "${GREEN}  ✓ Ollama serving on :11434${NC}"
fi

# Start backend
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo -e "${GREEN}  ✓ Backend running on http://localhost:8000${NC}"
cd ..

# Start frontend
cd frontend
npm start &
FRONTEND_PID=$!
echo -e "${GREEN}  ✓ Frontend starting on http://localhost:3000${NC}"
cd ..

echo ""
echo -e "${CYAN}[5/5] All services running!${NC}"
echo ""
echo -e "  ${GREEN}Frontend:${NC}  http://localhost:3000"
echo -e "  ${GREEN}Backend:${NC}   http://localhost:8000"
echo -e "  ${GREEN}API Docs:${NC}  http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}  Press Ctrl+C to stop all services${NC}"

# Wait and cleanup
trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait
