FROM python:3.10.4

WORKDIR /code

# Ensure latest pip + system deps
RUN apt-get update && apt-get install -y \
    espeak \
    libespeak1 \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --upgrade pip

# Environment variable fix for matplotlib
ENV MPLCONFIGDIR=/tmp

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Force install latest Groq client to avoid old "proxies" versions
RUN pip install --upgrade groq

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
