from flask import Flask, request, jsonify, Response, send_from_directory
import requests
from bs4 import BeautifulSoup
import json
import random
import os

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/proxy/npb')
def proxy_npb():
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        resp = requests.get('https://baseball.yahoo.co.jp/npb/', headers=headers)
        
        if resp.status_code != 200:
            return Response("Upstream Error", status=resp.status_code)

        resp.encoding = resp.apparent_encoding
        content = resp.text

        if '<head>' in content:
            content = content.replace('<head>', '<head><base href="https://baseball.yahoo.co.jp/npb/">')
        
        return Response(content, mimetype='text/html')
    except Exception as e:
        return Response(f"Proxy Error: {e}", status=500)

@app.route('/api/baystars-match')
def baystars_match():
    # Simplistic heuristic for finding a game.
    # In a real app, you'd parse the schedule more robustly.
    return jsonify({"url": "https://baseball.yahoo.co.jp/npb/"})

@app.route('/api/game')
def game_data():
    target_url = request.args.get('url')
    
    # Real data scraping omitted for stability in demo
    # Falling back to Mock Data
    
    mock_data = {
        "isLive": False,
        "inning": "-",
        "score": { "home": 0, "visitor": 0 },
        "runners": { "first": False, "second": False, "third": False }, 
        "count": { "b": 0, "s": 0, "o": 0 }, 
        "batter": { "name": "-", "stat": "" },
        "pitcher": { "name": "-", "stat": "" },
        "text": "現在は試合が行われていません。次の試合を楽しみに待ちましょう！"
    }
        
    return jsonify(mock_data)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)
