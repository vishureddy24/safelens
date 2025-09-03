import os
import requests
import json
import time

TRUSTED_SOURCES = [
    "reuters.com", "bloomberg.com", "cnbc.com", "wsj.com", "ft.com", "forbes.com",
    "nytimes.com", "theguardian.com", "bbc.co.uk", "economictimes.indiatimes.com",
    "moneycontrol.com", "livemint.com", "business-standard.com", "ndtv.com",
    "indiatoday.in", "hindustantimes.com", "timesofindia.indiatimes.com"
]

def analyze_news_with_ai(headline, source, content, openrouter_key):
    prompt = f'Given this news: "{headline}" from "{source}". Content: "{content}". Analyze whether it is fake or misleading. Return JSON: {{"classification": "REAL or FAKE", "riskScore": int, "reasons": [ ... ]}}'
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {"Authorization": f"Bearer {openrouter_key}", "Content-Type": "application/json"}
    data = {
        "model": "openai/gpt-3.5-turbo",
        "messages": [{"role": "user", "content": prompt}]
    }
    resp = requests.post(url, headers=headers, json=data)
    if resp.ok:
        try:
            return json.loads(resp.json()["choices"][0]["message"]["content"])
        except Exception as e:
            return {"classification": "UNKNOWN", "riskScore": 50, "reasons": ["AI response parse error"]}
    return {"classification": "UNKNOWN", "riskScore": 50, "reasons": ["AI request failed"]}

def fetch_and_analyze_news():
    NEWSAPI_KEY = os.getenv("NEWS_API_KEY")
    FINNHUB_KEY = os.getenv("FINNHUB_API_KEY")
    OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
    results = []
    # Fetch news from Finnhub
    finnhub_url = f"https://finnhub.io/api/v1/news?category=general&token={FINNHUB_KEY}"
    finnhub_resp = requests.get(finnhub_url).json()
    for article in finnhub_resp:
        headline = article.get("headline", "")
        source = article.get("source", "")
        content = article.get("summary", "")
        publishedAt = article.get("datetime", "")
        news_id = article.get("id", str(int(time.time()*1000)))
        ai_result = analyze_news_with_ai(headline, source, content, OPENROUTER_KEY)
        results.append({
            "id": news_id,
            "headline": headline,
            "source": source,
            "riskScore": ai_result.get("riskScore", 50),
            "reasons": ai_result.get("reasons", []),
            "classification": ai_result.get("classification", "UNKNOWN"),
            "publishedAt": publishedAt
        })
        time.sleep(1)  # avoid rate limits
    # Save results to a local JSON file (simulate DB)
    with open("analyzed_news.json", "w") as f:
        json.dump(results, f, indent=2)
    print(f"Analyzed and saved {len(results)} news articles to analyzed_news.json")

if __name__ == "__main__":
    fetch_and_analyze_news()
