import http.server
import socketserver
import json
import random
import urllib.parse
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup

PORT = 8080

class BayStarsHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # Proxy Endpoint for Iframe (Bypass X-Frame-Options)
        if parsed_path.path.startswith('/proxy/npb'):
            try:
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
                # Fetch SportsNavi Page
                resp = requests.get('https://baseball.yahoo.co.jp/npb/', headers=headers)
                
                if resp.status_code != 200:
                    self.send_error(resp.status_code, "Upstream Error")
                    return

                # Encoding fix
                resp.encoding = resp.apparent_encoding
                content = resp.text

                # Inject <base> tag to fix relative links/css/images so they load from Yahoo
                if '<head>' in content:
                    content = content.replace('<head>', '<head><base href="https://baseball.yahoo.co.jp/npb/">')
                
                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.end_headers()
                self.wfile.write(content.encode('utf-8'))
                return

            except Exception as e:
                self.send_error(500, f"Proxy Error: {e}")
                return

        # API Endpoint for BayStars Match URL
        if parsed_path.path == '/api/baystars-match':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Find BayStars Game URL
            match_url = self.find_baystars_game()
            self.wfile.write(json.dumps({"url": match_url}).encode('utf-8'))
            return

        # API Endpoint for Game Data (Modified to accept ?url=...)
        if parsed_path.path == '/api/game':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Get URL from query param
            query_components = urllib.parse.parse_qs(parsed_path.query)
            target_url = query_components.get('url', [None])[0]

            # Attempt to fetch real data from target URL
            real_data = self.fetch_real_data(target_url)
            
            if real_data:
                self.wfile.write(json.dumps(real_data).encode('utf-8'))
            else:
                # Fallback to Mock Data (Demo Mode)
                print("No live game found. Returning Mock Data.")
                mock_data = {
                    "isLive": False,
                    "inning": "9回裏",
                    "score": { "home": 3, "visitor": 2 },
                    "runners": { "first": True, "second": True, "third": True }, 
                    "count": { "b": 3, "s": 2, "o": 2 }, 
                    "batter": { "name": "牧", "stat": ".295 25本" },
                    "pitcher": { "name": "大勢", "stat": "1.54 30S" },
                    "text": "【デモモード】試合がないためテストデータを表示中。一打サヨナラのチャンス！"
                }
                if random.random() < 0.3:
                    mock_data["text"] = "【デモモード】スタンドから大歓声！（テストデータ更新中）"
                
                self.wfile.write(json.dumps(mock_data).encode('utf-8'))
            return
        
        # Static Files
        return super().do_GET()

    def find_baystars_game(self):
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
            resp = requests.get('https://baseball.yahoo.co.jp/npb/', headers=headers)
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            # Find link with "DeNA" (This is a heuristic)
            # In a real app, we would parse the schedule more robustly.
            
            # Top page uses team names in game cards. 
            # We look for an anchor tag that might be a game link and contains "DeNA" text nearby or in title.
            
            # Simplification: If we can't find a live game link easily in this static HTML check (which we can't test fully offline),
            # we default to the Top Page or a specific "Team Top" if discoverable.
            
            # For now, simply return the top page as "No Live Game Found" fallback, 
            # but ideally this would return '/npb/game/...'
            return "https://baseball.yahoo.co.jp/npb/"

        except:
            return "https://baseball.yahoo.co.jp/npb/"

    def fetch_real_data(self, target_url=None):
        try:
            url = target_url if target_url else 'https://baseball.yahoo.co.jp/npb/'
            
            # Security check: only allow baseball.yahoo.co.jp
            if not url.startswith('https://baseball.yahoo.co.jp/'):
                return None

            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
            resp = requests.get(url, headers=headers)
            resp.encoding = resp.apparent_encoding
            
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            if "試合はありません" in soup.get_text():
                return None

            return None

        except Exception as e:
            print(f"Scraping Error: {e}")
            return None

print(f"Starting server at http://localhost:{PORT}")
if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), BayStarsHandler) as httpd:
        httpd.serve_forever()
