/**
 * BayStars Assistant Logic
 * Includes: Game Data Manager, Auto-Redirect, and Ultra-Biased AI Chat
 */

class GameDataManager {
    constructor() {
        this.apiUrl = 'http://localhost:8080/api/game';
        this.data = null;
        this.pollInterval = 5000;
        this.currentGameUrl = null;
    }

    async autoRedirectBaystars() {
        try {
            addMessage("ai", "今日のベイスターズ戦を探しています... 待っててね！");
            const response = await fetch('http://localhost:8080/api/baystars-match');
            const data = await response.json();

            if (data.url) {
                console.log("Redirecting to:", data.url);
                this.currentGameUrl = data.url;

                const iframe = document.getElementById('game-iframe');
                // Force reload of iframe via proxy
                iframe.src = "/proxy/npb";

                addMessage("ai", "見つけました！ベイスターズの試合を表示します！\n絶対勝つぞ！ベイスターズ！");
            }
        } catch (error) {
            console.error("Auto-redirect failed:", error);
            addMessage("ai", "試合情報が見つかりませんでした... トップページを表示します。");
        }
    }

    async fetchGameStatus() {
        try {
            // Pass current URL (if known) for context-aware scraping
            const fetchUrl = this.currentGameUrl
                ? `${this.apiUrl}?url=${encodeURIComponent(this.currentGameUrl)}`
                : this.apiUrl;

            const response = await fetch(fetchUrl);
            const data = await response.json();

            if (data) {
                this.data = data;
                this.updateUI(data);
                this.updateMentalBars(data);
                this.checkAutoComment(data);
            }
        } catch (error) {
            console.error("Error fetching game data:", error);
            document.getElementById('ai-ticker-text').textContent = "データ取得エラー";
        }
    }

    updateUI(data) {
        // Update Live Indicator
        const liveIndicator = document.querySelector('.live-indicator');
        if (data.isLive) {
            liveIndicator.innerHTML = 'LIVE <span class="blink">●</span>';
            liveIndicator.style.color = '#ff4d4d'; // Red for Live
            document.getElementById('ai-ticker-text').textContent = data.text;
        } else {
            liveIndicator.innerHTML = 'DEMO MODE';
            liveIndicator.style.color = '#ECB819'; // Gold for Demo
            document.getElementById('ai-ticker-text').textContent = data.text;
        }

        // Update Names
        document.getElementById('pitcher-name').textContent = data.pitcher.name || "--";
        document.getElementById('batter-name').textContent = data.batter.name || "--";
    }

    updateMentalBars(data) {
        // Simple logic to visualize "pressure" based on game situation
        // In a real app, this would be more complex based on scraped data
        let pressure = 50;
        let focus = 50;

        // Mock Calculation based on base runners/outs
        const runnerCount = Object.values(data.runners).filter(Boolean).length;
        if (runnerCount >= 2) pressure += 30; // High pressure if runners on base
        if (data.count.o === 2) focus += 20; // High focus with 2 outs

        // Update Widths
        document.querySelector('.pitcher .fill').style.width = `${focus}%`;
        document.querySelector('.batter .fill').style.width = `${pressure}%`;
    }

    checkAutoComment(data) {
        // AI speaks automatically on big events (mock implementation)
        if (Math.random() < 0.05) { // 5% chance per tick to verify not too annoying
            this.generateAIResponse("auto_comment", data);
        }
    }

    generateAIResponse(userMessage, gameData) {
        // --- BAYSTARS BIASED AI LOGIC ---
        // The AI is a die-hard Yokohama DeNA BayStars fan.

        const isDeNA = true; // Assume we are rooting for DeNA (Logic to detect who is attacking needed in real scraping)
        const isChance = gameData.runners.second || gameData.runners.third;
        const isPinch = !isDeNA && isChance; // Simplified logic

        let response = "";

        if (userMessage === "auto_comment") {
            if (isChance) response = `ここが勝負どころ！${gameData.batter.name}、決めてくれえええ！！`;
            else if (isPinch) response = `ふんばれ${gameData.pitcher.name}！ここを抑えれば流れが変わる！`;
            else response = "集中していこう！";
        }
        else if (userMessage.includes("状況")) {
            response = `${gameData.inning}、${gameData.score.home}-${gameData.score.visitor}。`;
            if (gameData.score.home > gameData.score.visitor) response += " 勝ってるよ！このまま押し切ろう！";
            else if (gameData.score.home < gameData.score.visitor) response += " 負けてるけど、ここからがベイスターズの野球だ！逆転するぞ！";
            else response += " 同点！ハラハラするね…！";
        }
        else if (userMessage.includes("勝つため")) {
            if (isPinch) response = `まずはこのピンチを${gameData.pitcher.name}が断ち切ること！そうすれば流れが来るはず！`;
            else if (isChance) response = `このチャンスで${gameData.batter.name}が最低でも犠牲フライを打つこと！一点ずつ返していこう！`;
            else response = "相手投手の球数が増えてきたし、粘ってファーボールを選ぶのが鍵になると思うよ！";
        }
        else if (userMessage.includes("相性")) {
            // Biased Mock Matchup Data
            const goodMatchup = Math.random() < 0.6; // 60% chance to say it's good for DeNA
            if (goodMatchup) {
                response = `${gameData.batter.name}はこのピッチャー得意なはず！去年も打ってるし、期待大だよ！`;
            } else {
                response = `データだと少し苦手にしてるかも…。でも今日の${gameData.batter.name}なら打ってくれるはず！`;
            }
        }
        else {
            // Default Chat Logic
            response = "うんうん、そうだね！\nとにかく今日は絶対勝つぞ！I☆YOKOHAMA！";
        }

        addMessage("ai", response);
    }
}

// Global Message Function
function addMessage(sender, text) {
    const chatMessages = document.getElementById('chat-messages');

    // Create Message Element
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);

    // Avatar
    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('avatar');
    // Set Avatar Image
    if (sender === 'ai') {
        const img = document.createElement('img');
        img.src = "https://placehold.co/40x40/004583/ffffff?text=B"; // DeNA Blue
        avatarDiv.appendChild(img);
    } else {
        avatarDiv.textContent = "ME"; // Simple text for user
    }

    // Bubble
    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('bubble');
    bubbleDiv.innerText = text; // Secure text insertion

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(bubbleDiv);

    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendQuickMessage(text) {
    addMessage("user", text);
    // Simulate AI thinking delay
    setTimeout(() => {
        if (gameManager && gameManager.data) {
            gameManager.generateAIResponse(text, gameManager.data);
        } else {
            addMessage("ai", "ごめん、ちょっとデータ読み込み中...");
        }
    }, 800);
}

// Event Listeners
document.getElementById('send-btn').addEventListener('click', () => {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (text) {
        sendQuickMessage(text);
        input.value = '';
    }
});

document.getElementById('user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('send-btn').click();
    }
});

// Initialization
let gameManager;
document.addEventListener('DOMContentLoaded', () => {
    gameManager = new GameDataManager();
    gameManager.autoRedirectBaystars(); // Auto-find BayStars Game

    // Start Polling Loop
    setInterval(() => {
        gameManager.fetchGameStatus();
    }, gameManager.pollInterval);
});
