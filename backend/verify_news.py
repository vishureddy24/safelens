import os
import requests
import re

TRUSTED_SOURCES = [
    "reuters.com", "bloomberg.com", "cnbc.com", "wsj.com", "ft.com", "forbes.com",
    "nytimes.com", "theguardian.com", "bbc.co.uk", "economictimes.indiatimes.com",
    "moneycontrol.com", "livemint.com", "business-standard.com", "ndtv.com",
    "indiatoday.in", "hindustantimes.com", "timesofindia.indiatimes.com"
]

def verify_news(headline: str) -> dict:
    NEWSAPI_KEY = os.getenv("NEWS_API_KEY")
    FINNHUB_KEY = os.getenv("FINNHUB_API_KEY")
    OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
    reasons = []
    status = "FAKE"
    risk_score = 80

    # 1. NewsAPI check
    newsapi_url = f"https://newsapi.org/v2/everything?q={headline}&apiKey={NEWSAPI_KEY}"
    newsapi_resp = requests.get(newsapi_url).json()
    for article in newsapi_resp.get("articles", []):
        if any(domain in (article.get("url") or "") for domain in TRUSTED_SOURCES):
            reasons.append("Matched trusted source (NewsAPI)")
            status = "REAL"
            risk_score = 10
            break

    # 2. Finnhub check (if not already real)
    if status != "REAL":
        finnhub_url = f"https://finnhub.io/api/v1/news?category=general&token={FINNHUB_KEY}"
        finnhub_resp = requests.get(finnhub_url).json()
        for article in finnhub_resp:
            if headline.lower() in (article.get("headline", "").lower()):
                if any(domain in (article.get("url") or "") for domain in TRUSTED_SOURCES):
                    reasons.append("Matched trusted source (Finnhub)")
                    status = "REAL"
                    risk_score = 10
                    break

    # 3. Clickbait/suspicious patterns
    clickbait_words = ["guaranteed", "100%", "free money", "secret", "exclusive", "download now", "act now"]
    if any(word in headline.lower() for word in clickbait_words):
        reasons.append("Clickbait or suspicious claims")
        risk_score = max(risk_score, 70)
        status = "FAKE"

    # 4. OpenRouter AI check (if still not real)
    if status != "REAL":
        prompt = (
            f"Given this news: {headline}, analyze whether it is fake or misleading. "
            "Return only: REAL or FAKE with a confidence score 0-100."
        )
        openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {"Authorization": f"Bearer {OPENROUTER_KEY}", "Content-Type": "application/json"}
        data = {
            "model": "openai/gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}]
        }
        resp = requests.post(openrouter_url, headers=headers, json=data)
        if resp.ok:
            ai_result = resp.json()["choices"][0]["message"]["content"].strip().upper()
            if "REAL" in ai_result:
                status = "REAL"
                risk_score = min(risk_score, 20)
                reasons.append("AI model predicts REAL")
            elif "FAKE" in ai_result:
                status = "FAKE"
                match = re.search(r"([0-9]{1,3})", ai_result)
                if match:
                    risk_score = max(risk_score, int(match.group(1)))
                reasons.append("AI model predicts FAKE")

    # Final adjustment
    if status == "REAL":
        risk_score = min(risk_score, 20)
    else:
        risk_score = max(risk_score, 70)

    return {
        "headline": headline,
        "status": status,
        "risk_score": risk_score,
        "reasons": reasons or ["No strong indicators found"]
    }