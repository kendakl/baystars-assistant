const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

// Target URL: SportsNavi Professional Baseball Top (Change to specific game URL when live)
const SPONAVI_URL = 'https://baseball.yahoo.co.jp/npb/';

// Mock Data for off-season/night testing
const MOCK_GAME_DATA = {
    isLive: true,
    inning: "9回裏",
    score: { home: 3, visitor: 2 },
    count: { b: 3, s: 2, o: 2 },
    runners: { first: true, second: true, third: true }, // Bases loaded!
    batter: { name: "牧", stat: ".295 25本" },
    pitcher: { name: "大勢", stat: "1.54 30S" },
    text: "一打サヨナラのチャンス！"
};

app.get('/api/game', async (req, res) => {
    try {
        // NOTE: In a real scenario, we would scrape the URL here.
        // For this demo (since there is no live game right now), we return the MOCK DATA.
        // If you want to test scraping, you can uncomment the block below, 
        // but it will likely fail or return "no game" during off-hours.

        /*
        const response = await axios.get(SPONAVI_URL, {
             headers: { 'User-Agent': 'Mozilla/5.0 ...' } 
        });
        const $ = cheerio.load(response.data);
        // Scraping logic would go here...
        */

        // Return Mock Data to demonstrate "Real Data Integration" architecture
        // In production, this object would be populated by the cheerio scraping result.
        console.log('Fetching game data... (Returning Mock for Demo)');
        res.json(MOCK_GAME_DATA);

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch game data' });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
    console.log(`API Endpoint: http://localhost:${PORT}/api/game`);
});
