import Game from './Game.js';
import GameControl from './GameEngine/GameControl.js';
import Quiz from './Quiz.js';
import Inventory from "./Inventory.js";
import { defaultItems } from "./items.js";
import GameLevelEnd from './GameLevelEnd.js';

class StatsManager {
    constructor(game) {
        this.game = game;
        this.initStatsUI();
    }
    async getNpcProgress(personId) {
        try {
            const response = await fetch(`${this.game.javaURI}/bank/${personId}/npcProgress`, this.fetchOptions);
            if (!response.ok) {
                throw new Error("Failed to fetch questions");
            }
            const npcProgressDictionary = await response.json();
            console.log(npcProgressDictionary);
            return npcProgressDictionary
        } catch (error) {
            console.error("Error fetching Npc Progress:", error);
            return null;
        }
    }

    async updateNpcProgress(personId, npcId) {
        try {
            const response = await fetch(`${this.game.javaURI}/bank/updateNpcProgress`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ personId, npcId })
            });

            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error updating NPC progress", error);
            return "Error updating NPC progress";
        }
    }
    async fetchStats(personId) {
        const endpoints = {
            balance: this.game.javaURI + '/rpg_answer/getBalance/' + personId,
            questionAccuracy: this.game.javaURI + '/rpg_answer/getQuestionAccuracy/' + personId
        };
    
        for (let [key, url] of Object.entries(endpoints)) {
            try {
                const response = await fetch(url, this.game.fetchOptions);
                const data = await response.json();
                
                if (key === "questionAccuracy") {
                    const accuracyPercent = Math.round((data ?? 0) * 100);
                    document.getElementById(key).innerHTML = `${accuracyPercent}%`;
                    localStorage.setItem(key, `${accuracyPercent}%`);
                } else {
                    document.getElementById(key).innerHTML = data ?? 0;
                    localStorage.setItem(key, data ?? 0);
                }
            } catch (err) {
                console.error(`Error fetching ${key}:`, err);
            }
        }
    }

    async createStats(stats, gname, uid) {
        try {
            const response = await fetch(`${this.game.javaURI}/createStats`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid, gname, stats })
            });

            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error creating stats:", error);
            return "Error creating stats";
        }
    }

    async getStats(uid) {
        try {
            const response = await fetch(`${this.game.javaURI}/getStats/${uid}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching stats:", error);
            return "Error fetching stats";
        }
    }

    async updateStats(stats, gname, uid) {
        try {
            const response = await fetch(`${this.game.javaURI}/updateStats`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid, gname, stats })
            });

            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error updating stats:", error);
            return "Error updating stats";
        }
    }

    async updateStatsMCQ(questionId, choiceId, personId) {
        try {
            const response = await fetch(this.game.javaURI + '/rpg_answer/submitMCQAnswer', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionId, personId, choiceId })
            });

            if (!response.ok) throw new Error("Network response was not ok");
            if (!response.ok) throw new Error("Network response was not ok");
            return response;
        } catch (error) {
            console.error("Error submitting MCQ answer:", error);
            throw error;
        }
    }

    async transitionToWallstreet(personId) {
        try {
            const response = await fetch(`${this.game.javaURI}/question/transitionToWallstreet/${personId}`, this.game.fetchOptions);
            if (!response.ok) throw new Error("Failed to fetch questions");
            const questionsAnswered = await response.json();
            return questionsAnswered >= 12;
        } catch (error) {
            console.error("Error transitioning to Wallstreet:", error);
            return null;
        }
    }

    initStatsUI() {
        const statsWrapper = document.createElement('div');
        statsWrapper.id = 'stats-wrapper';
        Object.assign(statsWrapper.style, {
            position: 'fixed',
            top: '80px',
            right: '0',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
        });

        // Add pixel font if not present
        if (!document.getElementById('pixel-font-link')) {
            const fontLink = document.createElement('link');
            fontLink.id = 'pixel-font-link';
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
            document.head.appendChild(fontLink);
        }

        // Initialize audio toggle button
        this.initAudioToggle();
        
        // Initialize ambient sound system
        this.initAmbientSounds();
        // Add retro stats styles
        const style = document.createElement('style');
        style.textContent = `
            #stats-button {
                background: #000;
                border: 2px solid #fff;
                padding: 8px;
                cursor: pointer;
                transition: all 0.3s;
                position: relative;
                overflow: hidden;
                box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                animation: glowBorder 2s infinite alternate;
            }

            #stats-button::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 2px;
                background: rgba(255, 255, 255, 0.5);
                animation: scanline 2s linear infinite;
            }

            #stats-container {
                background: #000;
                border: 3px solid #fff;
                padding: 15px;
                margin-left: 10px;
                min-width: 250px;
                display: none;
                font-family: 'Press Start 2P', cursive;
                color: #fff;
                position: relative;
                box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
                animation: glowBorder 2s infinite alternate;
                opacity: 0;
                transform: translateX(-20px);
                transition: opacity 0.3s, transform 0.3s;
            }

            #stats-wrapper:hover #stats-container,
            #stats-container:focus-within {
                display: block;
                opacity: 1;
                transform: translateX(0);
            }

            #stats-wrapper.pinned #stats-container {
                display: block !important;
                opacity: 1 !important;
                transform: none !important;
            }

            #stats-button {
                background: #000;
                border: 2px solid #fff;
                padding: 8px;
                cursor: pointer;
                transition: all 0.3s;
                position: relative;
                overflow: hidden;
                box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                animation: glowBorder 2s infinite alternate;
                z-index: 10001;
            }

            #stats-wrapper.pinned #stats-button {
                display: none;
            }

            #stats-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                    transparent 50%,
                    rgba(0, 0, 0, 0.5) 50%
                );
                background-size: 100% 4px;
                pointer-events: none;
                z-index: 1;
            }

            .pixel-title {
                font-size: 14px;
                margin-bottom: 15px;
                text-align: center;
                color: #ffeb3b;
                text-shadow: 2px 2px #000;
                position: relative;
            }

            .pixel-stat-box {
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid #ffb300;
                margin: 8px 0;
                padding: 8px;
                display: flex;
                align-items: center;
                font-size: 11px;
                position: relative;
                overflow: hidden;
                transition: all 0.3s;
            }

            .pixel-stat-box:hover {
                transform: translateX(5px);
                background: rgba(255, 255, 255, 0.15);
                border-color: #ffd700;
            }

            .pixel-stat-box::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.2),
                    transparent
                );
                animation: shine 2s infinite;
            }

            #npcs-progress-bar-container {
                position: relative;
                height: 20px;
                background: #000;
                border: 2px solid #ffb300;
                margin-top: 12px;
                overflow: hidden;
            }

            #npcs-progress-bar {
                height: 100%;
                background: repeating-linear-gradient(
                    45deg,
                    #ffd700,
                    #ffd700 10px,
                    #ffb300 10px,
                    #ffb300 20px
                );
                transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                animation: progressPulse 2s infinite;
            }

            #npcs-progress-label {
                position: absolute;
                left: 0;
                right: 0;
                top: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: #fff;
                text-shadow: 1px 1px #000;
                z-index: 2;
            }

            @keyframes glowBorder {
                0% { box-shadow: 0 0 5px #fff, inset 0 0 5px #fff; }
                100% { box-shadow: 0 0 15px #fff, inset 0 0 8px #fff; }
            }

            @keyframes scanline {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
            }

            @keyframes shine {
                0% { left: -100%; }
                100% { left: 100%; }
            }

            @keyframes progressPulse {
                0% { opacity: 0.8; }
                50% { opacity: 1; }
                100% { opacity: 0.8; }
            }

            .pixel-icon {
                width: 18px !important;
                height: 18px !important;
                margin-right: 8px;
                animation: iconFloat 2s infinite alternate;
            }

            @keyframes iconFloat {
                0% { transform: translateY(0); }
                100% { transform: translateY(-3px); }
            }
        `;
        document.head.appendChild(style);

        // Get actual NPC cookies earned for dynamic progress
        const npcCookies = this.getAllNpcCookies();
        const npcCookiesCount = Object.keys(npcCookies).length;
        const dynamicTotal = Math.max(npcCookiesCount, 1); // At least 1 to avoid division by zero

        // List of available NPCs that can give cookies
        const availableNpcs = [
            'Stock-NPC', 'Crypto-NPC', 'Casino-NPC', 'Bank-NPC',
            'Fidelity', 'Schwab', 'Market Computer'
        ];
        const totalAvailable = availableNpcs.length;
        const progressPercentage = totalAvailable > 0 ? (npcCookiesCount / totalAvailable) * 100 : 0;

        // Calculate portfolio values safely
        let stockValue = '0';
        let cryptoValue = '0'; 
        let totalPortfolioValue = '0';
        let knowledgeLevel = 'Beginner';
        
        try {
            stockValue = this.calculateStockValue();
            cryptoValue = this.calculateCryptoValue();
            totalPortfolioValue = this.calculateTotalPortfolioValue();
            knowledgeLevel = this.getKnowledgeLevel();
        } catch (error) {
            console.log('Portfolio calculation error:', error);
        }

        // Pixel-art icons (using retro-style emojis)
        const coinIcon = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1fa99.png';
        const accuracyIcon = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f3af.png';
        const npcIcon = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f9d1-200d-1f3a4.png';
        const statsIcon = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f3ae.png';

        // Create the button with retro styling
        const statsButton = document.createElement('div');
        statsButton.id = 'stats-button';
        statsButton.innerHTML = `<img src="${statsIcon}" alt="Stats" title="Show Player Stats" style="width:38px;height:38px;image-rendering:pixelated;" />`;

        // Create the panel with retro styling
        const statsContainer = document.createElement('div');
        statsContainer.id = 'stats-container';
        statsContainer.tabIndex = 0;

        statsContainer.innerHTML = `
            <div class="pixel-title">
                <img class="pixel-icon" src="${statsIcon}" alt="Game" style="width:22px;height:22px;margin-right:8px;vertical-align:middle;" />
                <span>PLAYER STATS</span>
                <img class="pixel-icon" src="${statsIcon}" alt="Game" style="width:22px;height:22px;margin-left:8px;vertical-align:middle;" />
            </div>
            <div class="pixel-stat-box">
                <img class="pixel-icon" src="${coinIcon}" alt="Coin" style="width:22px;height:22px;vertical-align:middle;" />
                <span style="color: #ffb300;">Balance:</span> <span id="balance" style="margin-left: 6px;">0</span>
            </div>
            <div class="pixel-stat-box">
                <img class="pixel-icon" src="${accuracyIcon}" alt="Accuracy" style="width:22px;height:22px;vertical-align:middle;" />
                <span style="color: #ffb300;">Question Accuracy:</span> <span id="questionAccuracy" style="margin-left: 6px;">0%</span>
            </div>
            <div class="pixel-stat-box">
                <img class="pixel-icon" src="${npcIcon}" alt="NPC" style="width:22px;height:22px;vertical-align:middle;" />
                <span style="color: #ffb300;">NPC Cookies:</span> <span id="npcsTalkedTo" style="margin-left: 6px;">${npcCookiesCount}</span>
            </div>
            <div id="npcs-progress-bar-container">
                <div id="npcs-progress-bar" style="width: ${progressPercentage}%;"></div>
                <span id="npcs-progress-label">${npcCookiesCount} / ${totalAvailable}</span>
            </div>
            
            <!-- Portfolio Button Section -->
            <div style="margin-top: 12px; padding-top: 12px; border-top: 2px solid #ffb300;">
                <div class="pixel-stat-box" style="justify-content: center; cursor: pointer;" id="portfolio-analysis-btn" onclick="gameEnv.game.showPortfolioAnalysisOverlay()">
                    <span style="color: #ffb300;">💼 Portfolio</span>
                    <span style="margin-left: 8px; color: #4CAF50; font-size: 10px;">► Click to analyze</span>
                </div>
            </div>
        `;

        // Add a pin button with retro styling
        const pinButton = document.createElement('button');
        pinButton.id = 'stats-pin-btn';
        pinButton.innerHTML = '📌';
        pinButton.title = 'Pin/unpin';
        Object.assign(pinButton.style, {
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '22px',
            cursor: 'pointer',
            zIndex: '10002',
            color: '#fff',
            textShadow: '2px 2px #000',
            transition: 'transform 0.2s, color 0.2s'
        });

        pinButton.addEventListener('mouseenter', () => {
            pinButton.style.transform = 'scale(1.2)';
            pinButton.style.color = '#ffd700';
        });
        pinButton.addEventListener('mouseleave', () => {
            pinButton.style.transform = '';
            pinButton.style.color = '#fff';
        });
        pinButton.addEventListener('click', (e) => {
            e.stopPropagation();
            setPinnedState(!pinned);
            // Play retro click sound
            const click = new Audio('data:audio/wav;base64,UklGRXEAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUQAAAB/f39/gICAgICAgH9/f39/f39/f39/f4CAgICAgIB/f39/f39/f39/f3+AgICAgICAgICAgH9/f39/f39/f39/f39/f39/f39/fw==');
            click.volume = 0.3;
            click.play();
        });

        statsContainer.appendChild(pinButton);
        statsWrapper.appendChild(statsButton);
        statsWrapper.appendChild(statsContainer);
        document.body.appendChild(statsWrapper);

        // Add event listener for portfolio analysis button
        setTimeout(() => {
            const portfolioAnalysisBtn = document.getElementById('portfolio-analysis-btn');
            console.log('Looking for portfolio button:', portfolioAnalysisBtn); // Debug log
            if (portfolioAnalysisBtn) {
                console.log('Portfolio button found, adding event listener'); // Debug log
                portfolioAnalysisBtn.addEventListener('click', (e) => {
                    console.log('Portfolio button clicked!'); // Debug log
                    e.preventDefault();
                    e.stopPropagation();
                    this.showPortfolioAnalysisOverlay();
                });
                
                portfolioAnalysisBtn.addEventListener('mouseenter', () => {
                    portfolioAnalysisBtn.style.background = 'rgba(255, 179, 0, 0.2)';
                    portfolioAnalysisBtn.style.transform = 'scale(1.02)';
                    portfolioAnalysisBtn.style.borderColor = '#ffd700';
                });
                
                portfolioAnalysisBtn.addEventListener('mouseleave', () => {
                    portfolioAnalysisBtn.style.background = 'rgba(255, 255, 255, 0.1)';
                    portfolioAnalysisBtn.style.transform = 'scale(1)';
                    portfolioAnalysisBtn.style.borderColor = '#ffb300';
                });
            } else {
                console.log('Portfolio button not found!'); // Debug log
            }
        }, 200); // Increased timeout to ensure DOM is ready

        // Add hover sound effect
        const hoverSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
        hoverSound.volume = 0.2;

        // Add hover effects with sound
        const statBoxes = statsContainer.querySelectorAll('.pixel-stat-box');
        statBoxes.forEach(box => {
            box.addEventListener('mouseenter', () => {
                hoverSound.currentTime = 0;
                hoverSound.play();
            });
        });

        // --- PINNED STATE LOGIC ---
        let pinned = false;
        function setPinnedState(isPinned) {
            pinned = isPinned;
            if (pinned) {
                statsWrapper.classList.add('pinned');
                pinButton.classList.add('pinned');
                statsContainer.style.position = 'fixed';
                statsContainer.style.right = '0';
                statsContainer.style.left = '';
                statsContainer.style.display = 'block';
                statsContainer.style.opacity = '1';
                statsContainer.style.transform = 'none';
                statsContainer.style.pointerEvents = 'auto';
                statsContainer.style.padding = '18px 28px';
                statsContainer.style.overflow = 'visible';
                statsContainer.style.zIndex = '10002';
            } else {
                statsWrapper.classList.remove('pinned');
                pinButton.classList.remove('pinned');
                statsContainer.style.position = '';
                statsContainer.style.right = '';
                statsContainer.style.left = '';
                statsContainer.style.display = '';
                statsContainer.style.opacity = '';
                statsContainer.style.transform = '';
                statsContainer.style.pointerEvents = '';
                statsContainer.style.padding = '';
                statsContainer.style.overflow = '';
                statsContainer.style.zIndex = '';
            }
            // Pin color/rotation
            pinButton.style.color = pinned ? '#ffb300' : '#fff';
            pinButton.style.transform = pinned ? 'rotate(-30deg)' : '';
        }

        // If pinned, prevent hover from closing
        statsWrapper.addEventListener('mouseleave', () => {
            if (!pinned) {
                statsContainer.style.display = 'none';
                statsContainer.style.opacity = '0';
                statsContainer.style.transform = 'translateX(-20px)';
            }
        });

        statsWrapper.addEventListener('mouseenter', () => {
            statsContainer.style.display = 'block';
            // Small delay to ensure display: block is applied before transition
            requestAnimationFrame(() => {
                statsContainer.style.opacity = '1';
                statsContainer.style.transform = 'translateX(0)';
            });
        });

        // Optional: clicking anywhere else unpins
        document.addEventListener('click', (e) => {
            if (pinned && !statsWrapper.contains(e.target)) {
                setPinnedState(false);
            }
        });
        // --- END PINNED STATE LOGIC ---
    }

    updateNpcsTalkedToUI(count) {
        const npcsSpan = document.getElementById('npcsTalkedTo');
        if (npcsSpan) {
            // Get actual NPC cookies count for waypoint NPCs only
            const waypointNpcs = [
                'Stock-NPC', 'Casino-NPC', 'Fidelity', 'Schwab', 
                'Crypto-NPC', 'Bank-NPC', 'Market Computer'
            ];
            const npcCookies = this.getAllNpcCookies();
            const npcCookiesCount = waypointNpcs.filter(npcId => npcCookies[npcId]).length;
            npcsSpan.textContent = npcCookiesCount;
        }
        // Update progress bar
        const bar = document.getElementById('npcs-progress-bar');
        const label = document.getElementById('npcs-progress-label');
        if (bar && label) {
            const waypointNpcs = [
                'Stock-NPC', 'Casino-NPC', 'Fidelity', 'Schwab', 
                'Crypto-NPC', 'Bank-NPC', 'Market Computer'
            ];
            const npcCookies = this.getAllNpcCookies();
            const npcCookiesCount = waypointNpcs.filter(npcId => npcCookies[npcId]).length;
            const totalAvailable = waypointNpcs.length;
            
            // Calculate percentage based on waypoint NPCs
            const percentage = totalAvailable > 0 ? (npcCookiesCount / totalAvailable) * 100 : 0;
            bar.style.width = `${Math.min(percentage, 100)}%`;
            label.textContent = `${npcCookiesCount} / ${totalAvailable}`;
        }
    }

    incrementNpcsTalkedTo() {
        // Get current count from cookies
        let npcsTalkedTo = 0;
        const cookies = document.cookie.split(';');
        const npcsCookie = cookies.find(cookie => cookie.trim().startsWith('npcsTalkedTo='));
        if (npcsCookie) {
            npcsTalkedTo = parseInt(npcsCookie.split('=')[1]) || 0;
        }
        npcsTalkedTo += 1;
        // Update cookie (expires in 30 days)
        document.cookie = `npcsTalkedTo=${npcsTalkedTo}; path=/; max-age=${60*60*24*30}`;
        this.updateNpcsTalkedToUI(npcsTalkedTo);
    }

    /**
     * Give a specific cookie for an NPC interaction
     * @param {string} npcId - The ID of the NPC
     * @param {string} reward - The reward/cookie value (optional, defaults to "completed")
     * @param {string} objective - The new objective to show (optional)
     */
    giveNpcCookie(npcId, reward = "completed", objective = null) {
        const cookieName = `npc_${npcId}`;
        const cookieValue = "completed"; // Always use "completed" for consistency
        const expiryDays = 30;
        
        // Check if this is the first time getting a cookie from this NPC
        const existingCookie = this.getNpcCookie(npcId);
        const isFirstTime = !existingCookie;
        
        // Set cookie (expires in 30 days)
        document.cookie = `${cookieName}=${cookieValue}; path=/; max-age=${60*60*24*expiryDays}`;
        
        // Only increment the general counter if this is the first interaction
        if (isFirstTime) {
            this.incrementNpcsTalkedTo();
        }
        
        // Show a notification that they received a cookie with objective
        // Use the original reward parameter for display purposes only
        this.showNpcCookieNotification(npcId, reward, objective);
        
        // Update the UI to reflect the new cookie count
        this.updateNpcsTalkedToUI(0); // Parameter doesn't matter anymore since we get count from cookies
        
        // Notify the waypoint arrow system if it exists
        if (window.waypointArrow && isFirstTime) {
            window.waypointArrow.onCookieEarned(npcId);
        }
        
        // Update progress bar
        if (isFirstTime) {
            setTimeout(() => {
                // this.game.updateProgressBar(); // Removed progress bar
            }, 500); // Slight delay for better visual timing
        }
        
        console.log(`NPC Cookie awarded: ${cookieName}=${cookieValue} (displayed as: ${reward})`);
    }

    /**
     * Check if user has a specific NPC cookie
     * @param {string} npcId - The ID of the NPC
     * @returns {string|null} - The cookie value if exists, null otherwise
     */
    getNpcCookie(npcId) {
        const cookies = document.cookie.split(';');
        const cookieName = `npc_${npcId}`;
        const npcCookie = cookies.find(cookie => cookie.trim().startsWith(`${cookieName}=`));
        if (npcCookie) {
            return npcCookie.split('=')[1];
        }
        return null;
    }

    /**
     * Get all NPC cookies
     * @returns {Object} - Object with npcId as key and cookie value as value
     */
    getAllNpcCookies() {
        const cookies = document.cookie.split(';');
        const npcCookies = {};
        
        cookies.forEach(cookie => {
            const trimmedCookie = cookie.trim();
            if (trimmedCookie.startsWith('npc_')) {
                const [name, value] = trimmedCookie.split('=');
                const npcId = name.replace('npc_', '');
                npcCookies[npcId] = value;
            }
        });
        
        return npcCookies;
    }

    /**
     * Show a notification when user receives an NPC cookie
     * @param {string} npcId - The ID of the NPC
     * @param {string} reward - The reward received
     * @param {string} objective - The new objective received
     */
    showNpcCookieNotification(npcId, reward, objective) {
        // Create particle effects first
        this.createCookieParticles();
        
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100%);
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            border: 3px solid #ffd700;
            box-shadow: 
                0 8px 32px rgba(0,0,0,0.4),
                0 0 20px rgba(255, 215, 0, 0.3),
                inset 0 1px 0 rgba(255,255,255,0.1);
            z-index: 10000;
            font-family: 'Press Start 2P', cursive;
            font-size: 12px;
            max-width: 450px;
            min-width: 350px;
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            backdrop-filter: blur(10px);
            animation: pulseGlow 2s infinite alternate;
        `;
        
        // Add glowing animation keyframes if not already present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes pulseGlow {
                    0% { 
                        box-shadow: 
                            0 8px 32px rgba(0,0,0,0.4),
                            0 0 20px rgba(255, 215, 0, 0.3),
                            inset 0 1px 0 rgba(255,255,255,0.1);
                    }
                    100% { 
                        box-shadow: 
                            0 8px 32px rgba(0,0,0,0.4),
                            0 0 30px rgba(255, 215, 0, 0.6),
                            inset 0 1px 0 rgba(255,255,255,0.2);
                    }
                }
                @keyframes slideUpFadeIn {
                    0% { 
                        transform: translateX(-50%) translateY(100%);
                        opacity: 0;
                    }
                    100% { 
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes slideDownFadeOut {
                    0% { 
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                    100% { 
                        transform: translateX(-50%) translateY(100%);
                        opacity: 0;
                    }
                }
                .notification-icon {
                    animation: bounce 1s infinite alternate;
                }
                @keyframes bounce {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-5px); }
                }
                .objective-text {
                    animation: typewriter 0.8s steps(40) 0.5s both;
                    border-right: 2px solid #4CAF50;
                    animation: typewriter 0.8s steps(40) 0.5s both, blink 1s infinite 1.3s;
                }
                @keyframes typewriter {
                    0% { width: 0; }
                    100% { width: 100%; }
                }
                @keyframes blink {
                    0%, 50% { border-color: #4CAF50; }
                    51%, 100% { border-color: transparent; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Build notification content
        const cookieEmoji = reward.includes('quiz') || reward.includes('question') ? '🧠' : 
                           reward.includes('dialogue') || reward.includes('talk') ? '💬' : 
                           reward.includes('casino') || reward.includes('game') ? '🎰' :
                           reward.includes('computer') || reward.includes('tech') ? '💻' :
                           reward.includes('bank') || reward.includes('finance') ? '🏦' : '🍪';
        const npcDisplayName = npcId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        notification.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <!-- Header with cookie earned -->
                <div style="display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #333; padding-bottom: 15px;">
                    <span class="notification-icon" style="font-size: 28px;">${cookieEmoji}</span>
                    <div style="flex: 1;">
                        <div style="color: #ffd700; font-size: 14px; margin-bottom: 5px;">
                            🎉 COOKIE EARNED!
                        </div>
                        <div style="color: #fff; font-size: 10px; line-height: 1.4;">
                            <strong>${npcDisplayName}</strong><br>
                            <span style="color: #4CAF50;">${reward.replace(/_/g, ' ')}</span>
                        </div>
                    </div>
                    <div style="background: #4CAF50; color: #000; padding: 5px 10px; border-radius: 10px; font-size: 8px; font-weight: bold;">
                        +1 XP
                    </div>
                </div>
                
                ${objective ? `
                    <!-- Objective section -->
                    <div style="background: rgba(76, 175, 80, 0.1); border: 2px solid #4CAF50; border-radius: 10px; padding: 15px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                            <span style="font-size: 16px;">🎯</span>
                            <span style="color: #4CAF50; font-size: 11px;">NEW OBJECTIVE</span>
                        </div>
                        <div class="objective-text" style="color: #fff; font-size: 9px; line-height: 1.5; overflow: hidden; white-space: nowrap;">
                            ${objective}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Progress indicator -->
                <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid #333;">
                    <div style="display: flex; gap: 5px;">
                        ${this.generateProgressDots()}
                    </div>
                    <div style="color: #888; font-size: 8px;">
                        Press Enter to continue
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.animation = 'slideUpFadeIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';
        }, 100);
        
        // Play success sound
        this.playNotificationSound();
        
        // Add keyboard listener to dismiss
        const dismissHandler = (e) => {
            // Only respond to Enter key
            if (e.key === 'Enter' || e.keyCode === 13) {
                this.dismissNotification(notification);
                document.removeEventListener('keydown', dismissHandler);
            }
        };
        document.addEventListener('keydown', dismissHandler);
        
        // Auto-dismiss after 8 seconds if not manually dismissed
        setTimeout(() => {
            if (notification.parentNode) {
                this.dismissNotification(notification);
                document.removeEventListener('keydown', dismissHandler);
            }
        }, 8000);
    }

    dismissNotification(notification) {
        notification.style.animation = 'slideDownFadeOut 0.4s ease-in forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 400);
    }

    generateProgressDots() {
        const allNpcCookies = this.getAllNpcCookies();
        const totalNpcs = 7; // Total available NPCs
        const earnedCount = Object.keys(allNpcCookies).length;
        
        let dots = '';
        for (let i = 0; i < totalNpcs; i++) {
            const isEarned = i < earnedCount;
            dots += `<div style="
                width: 8px; 
                height: 8px; 
                border-radius: 50%; 
                background: ${isEarned ? '#4CAF50' : '#333'};
                border: 1px solid ${isEarned ? '#4CAF50' : '#666'};
                ${isEarned ? 'box-shadow: 0 0 5px #4CAF50;' : ''}
            "></div>`;
        }
        return dots;
    }

    playNotificationSound() {
        // Create a more pleasant notification sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Play a nice ascending chord
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        frequencies.forEach((freq, index) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.setValueAtTime(freq, audioContext.currentTime);
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0, audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1 + index * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5 + index * 0.1);
            
            osc.start(audioContext.currentTime + index * 0.1);
            osc.stop(audioContext.currentTime + 0.5 + index * 0.1);
        });
    }

    createCookieParticles() {
        // Create multiple sparkle particles
        const particles = [];
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                bottom: 200px;
                left: 50%;
                width: 8px;
                height: 8px;
                background: ${this.getRandomSparkleColor()};
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                box-shadow: 0 0 6px ${this.getRandomSparkleColor()};
            `;
            
            document.body.appendChild(particle);
            particles.push(particle);
            
            // Animate each particle
            this.animateParticle(particle, i);
        }
        
        // Clean up particles after animation
        setTimeout(() => {
            particles.forEach(particle => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            });
        }, 2000);
    }

    getRandomSparkleColor() {
        const colors = ['#ffd700', '#ffeb3b', '#4CAF50', '#03a9f4', '#e91e63', '#ff9800'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    animateParticle(particle, index) {
        // Random direction and distance
        const angle = (Math.PI * 2 * index) / 15 + (Math.random() - 0.5) * 0.5;
        const distance = 100 + Math.random() * 150;
        const duration = 1500 + Math.random() * 500;
        
        const deltaX = Math.cos(angle) * distance;
        const deltaY = Math.sin(angle) * distance - 50; // Slight upward bias
        
        // Create keyframes for the animation
        const keyframes = [
            {
                transform: 'translate(-50%, 0) scale(0)',
                opacity: 0
            },
            {
                transform: 'translate(-50%, 0) scale(1)',
                opacity: 1,
                offset: 0.1
            },
            {
                transform: `translate(calc(-50% + ${deltaX}px), ${deltaY}px) scale(0.5)`,
                opacity: 0.7,
                offset: 0.7
            },
            {
                transform: `translate(calc(-50% + ${deltaX}px), ${deltaY - 30}px) scale(0)`,
                opacity: 0
            }
        ];
        
        particle.animate(keyframes, {
            duration: duration,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
    }

    initAudioToggle() {
        // Check for existing audio preference
        const isAudioEnabled = localStorage.getItem('gameAudioEnabled') !== 'false';
        
        // Create audio toggle button container
        const audioToggleContainer = document.createElement('div');
        audioToggleContainer.id = 'audio-toggle-container';
        audioToggleContainer.style.cssText = `
            position: fixed;
            top: 120px;
            left: 20px;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        // Create the toggle button
        const audioButton = document.createElement('button');
        audioButton.id = 'audio-toggle-button';
        audioButton.innerHTML = isAudioEnabled ? '🔊' : '🔇';
        audioButton.title = isAudioEnabled ? 'Click to mute audio' : 'Click to enable audio';
        audioButton.style.cssText = `
            background: #000;
            border: 2px solid #fff;
            color: #fff;
            padding: 12px 15px;
            cursor: pointer;
            font-family: 'Press Start 2P', cursive;
            font-size: 18px;
            border-radius: 4px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
            animation: glowBorder 2s infinite alternate;
        `;
        
        // Add label
        const audioLabel = document.createElement('span');
        audioLabel.style.cssText = `
            color: #fff;
            font-family: 'Press Start 2P', cursive;
            font-size: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            opacity: 0.8;
        `;
        audioLabel.textContent = isAudioEnabled ? 'AUDIO ON' : 'AUDIO OFF';
        
        // Add click functionality
        audioButton.addEventListener('click', () => {
            const currentState = localStorage.getItem('gameAudioEnabled') !== 'false';
            const newState = !currentState;
            
            // Update localStorage
            localStorage.setItem('gameAudioEnabled', newState.toString());
            
            // Update button appearance
            audioButton.innerHTML = newState ? '🔊' : '🔇';
            audioButton.title = newState ? 'Click to mute audio' : 'Click to enable audio';
            audioLabel.textContent = newState ? 'AUDIO ON' : 'AUDIO OFF';
            
            // Update global audio state
            window.gameAudioEnabled = newState;
            
            // Play a confirmation sound if audio is being enabled
            if (newState) {
                this.playConfirmationSound();
            }
            
            // Show brief feedback
            this.showAudioToggleFeedback(newState);
        });
        
        // Add hover effects
        audioButton.addEventListener('mouseenter', () => {
            audioButton.style.transform = 'scale(1.05)';
            audioButton.style.borderColor = '#ffd700';
            audioButton.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.5)';
        });
        
        audioButton.addEventListener('mouseleave', () => {
            audioButton.style.transform = 'scale(1)';
            audioButton.style.borderColor = '#fff';
            audioButton.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
        });
        
        // Assemble and add to page
        audioToggleContainer.appendChild(audioButton);
        audioToggleContainer.appendChild(audioLabel);
        document.body.appendChild(audioToggleContainer);
        
        // Set global audio state
        window.gameAudioEnabled = isAudioEnabled;
        
        // Add CSS for animations if not present
        if (!document.getElementById('audio-toggle-styles')) {
            const style = document.createElement('style');
            style.id = 'audio-toggle-styles';
            style.textContent = `
                @keyframes audioFeedback {
                    0% { transform: scale(1) rotate(0deg); }
                    25% { transform: scale(1.1) rotate(-5deg); }
                    50% { transform: scale(1.2) rotate(5deg); }
                    75% { transform: scale(1.1) rotate(-2deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                
                .audio-feedback {
                    animation: audioFeedback 0.5s ease-out;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    playConfirmationSound() {
        // Play a brief confirmation beep when audio is enabled
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            console.log("Confirmation sound error:", e);
        }
    }
    
    showAudioToggleFeedback(isEnabled) {
        // Show visual feedback when audio is toggled
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: ${isEnabled ? '#4CAF50' : '#f44336'};
            padding: 20px 30px;
            border: 2px solid ${isEnabled ? '#4CAF50' : '#f44336'};
            border-radius: 8px;
            font-family: 'Press Start 2P', cursive;
            font-size: 12px;
            z-index: 10001;
            pointer-events: none;
            animation: audioFeedback 0.5s ease-out;
            box-shadow: 0 0 20px rgba(${isEnabled ? '76, 175, 80' : '244, 67, 54'}, 0.5);
        `;
        feedback.textContent = isEnabled ? '🔊 AUDIO ENABLED' : '🔇 AUDIO DISABLED';
        
        document.body.appendChild(feedback);
        
        // Remove feedback after animation
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 1000);
    }

    initAmbientSounds() {
        // Create Minecraft-style music manager
        this.musicManager = new MinecraftMusicManager();
        
        // Start music system
        this.musicManager.startMusicLoop();
        
        // Add UI interaction sounds (keep these)
        this.addUIInteractionSounds();
        
        // Set up environment detection for music themes
        this.setupMusicEnvironmentDetection();
    }
    
    setupMusicEnvironmentDetection() {
        // Check current level periodically and update music theme
        setInterval(() => {
            if (this.gameControl && this.gameControl.currentLevel) {
                const levelName = this.gameControl.currentLevel.constructor.name.toLowerCase();
                let musicTheme = 'overworld';
                
                // Map level names to music themes
                if (levelName.includes('office')) {
                    musicTheme = 'creative';
                } else if (levelName.includes('casino')) {
                    musicTheme = 'nether';
                } else if (levelName.includes('bank')) {
                    musicTheme = 'calm';
                } else if (levelName.includes('airport')) {
                    musicTheme = 'creative';
                } else if (levelName.includes('desert')) {
                    musicTheme = 'dry';
                } else if (levelName.includes('underground') || levelName.includes('cave')) {
                    musicTheme = 'cave';
                }
                
                // Update music theme if it changed
                if (this.musicManager.currentTheme !== musicTheme) {
                    this.musicManager.setMusicTheme(musicTheme);
                }
            }
        }, 3000); // Check every 3 seconds
    }
    
    // Method to manually set music theme
    setMusicTheme(theme) {
        if (this.musicManager) {
            this.musicManager.setMusicTheme(theme);
        }
    }
    
    addUIInteractionSounds() {
        // Add subtle hover sounds to all interactive elements
    }
    
    addUIInteractionSounds() {
        // Add subtle hover sounds to all interactive elements
        const addHoverSound = (element) => {
            element.addEventListener('mouseenter', () => {
                if (window.gameAudioEnabled !== false) {
                    this.musicManager.playUIHoverSound();
                }
            });
        };
        
        const addClickSound = (element) => {
            element.addEventListener('click', () => {
                if (window.gameAudioEnabled !== false) {
                    this.musicManager.playUIClickSound();
                }
            });
        };
        
        // Apply to existing and future UI elements
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Add sounds to buttons
                        const buttons = node.querySelectorAll ? node.querySelectorAll('button') : [];
                        buttons.forEach(button => {
                            addHoverSound(button);
                            addClickSound(button);
                        });
                        
                        // Add sounds to the element itself if it's interactive
                        if (node.tagName === 'BUTTON' || node.style.cursor === 'pointer') {
                            addHoverSound(node);
                            addClickSound(node);
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

// Minecraft-Style Music Manager Class
class MinecraftMusicManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.isPlaying = false;
        this.currentTheme = 'overworld';
        this.musicGain = null;
        this.currentTrack = null;
        
        // Musical scales and chord progressions for different themes
        this.musicThemes = {
            'overworld': {
                key: 'C',
                scale: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88], // C Major
                chords: [
                    [261.63, 329.63, 392.00], // C Major
                    [293.66, 369.99, 440.00], // D Minor
                    [329.63, 392.00, 493.88], // E Minor  
                    [349.23, 440.00, 523.25], // F Major
                    [392.00, 493.88, 587.33], // G Major
                    [220.00, 261.63, 329.63], // A Minor
                ],
                tempo: 80,
                volume: 0.15,
                mood: 'peaceful'
            },
            'creative': {
                key: 'G',
                scale: [392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 739.99], // G Major
                chords: [
                    [392.00, 493.88, 587.33], // G Major
                    [220.00, 261.63, 329.63], // A Minor
                    [246.94, 311.13, 369.99], // B Minor
                    [261.63, 329.63, 392.00], // C Major
                    [293.66, 369.99, 440.00], // D Major
                    [329.63, 415.30, 493.88], // E Minor
                ],
                tempo: 95,
                volume: 0.18,
                mood: 'uplifting'
            },
            'calm': {
                key: 'Am',
                scale: [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00], // A Minor
                chords: [
                    [220.00, 261.63, 329.63], // A Minor
                    [293.66, 349.23, 440.00], // D Minor
                    [329.63, 392.00, 493.88], // E Minor
                    [349.23, 440.00, 523.25], // F Major
                    [261.63, 329.63, 392.00], // C Major
                    [392.00, 493.88, 587.33], // G Major
                ],
                tempo: 65,
                volume: 0.12,
                mood: 'meditative'
            },
            'nether': {
                key: 'Dm',
                scale: [293.66, 311.13, 349.23, 369.99, 415.30, 440.00, 493.88], // D Minor
                chords: [
                    [293.66, 349.23, 440.00], // D Minor
                    [369.99, 440.00, 554.37], // F# Diminished
                    [415.30, 493.88, 622.25], // G# Minor
                    [246.94, 311.13, 369.99], // B Minor
                    [329.63, 415.30, 493.88], // E Minor
                ],
                tempo: 70,
                volume: 0.14,
                mood: 'mysterious'
            },
            'cave': {
                key: 'Fm',
                scale: [174.61, 196.00, 207.65, 233.08, 261.63, 277.18, 311.13], // F Minor
                chords: [
                    [174.61, 207.65, 261.63], // F Minor
                    [196.00, 233.08, 293.66], // G Minor
                    [207.65, 261.63, 311.13], // Ab Major
                    [233.08, 277.18, 349.23], // Bb Minor
                    [138.59, 174.61, 207.65], // Db Major
                ],
                tempo: 55,
                volume: 0.10,
                mood: 'eerie'
            },
            'dry': {
                key: 'E',
                scale: [329.63, 369.99, 415.30, 440.00, 493.88, 554.37, 622.25], // E Major
                chords: [
                    [329.63, 415.30, 493.88], // E Major
                    [369.99, 466.16, 554.37], // F# Minor
                    [415.30, 523.25, 622.25], // G# Minor
                    [440.00, 554.37, 659.25], // A Major
                    [493.88, 622.25, 739.99], // B Major
                ],
                tempo: 75,
                volume: 0.13,
                mood: 'warm'
            }
        };
    }
    
    startMusicLoop() {
        if (!window.gameAudioEnabled) return;
        
        // Schedule first track after 30-90 seconds (like Minecraft)
        const initialDelay = 30000 + Math.random() * 60000;
        setTimeout(() => {
            this.scheduleNextTrack();
        }, initialDelay);
    }
    
    scheduleNextTrack() {
        if (!window.gameAudioEnabled) return;
        
        // Play a track
        this.playProceduralTrack();
        
        // Schedule next track in 3-8 minutes (like Minecraft)
        const nextDelay = 180000 + Math.random() * 300000; // 3-8 minutes
        setTimeout(() => {
            this.scheduleNextTrack();
        }, nextDelay);
    }
    
    setMusicTheme(theme) {
        this.currentTheme = theme || 'overworld';
        console.log(`Music theme set to: ${this.currentTheme}`);
    }
    
    playProceduralTrack() {
        if (!window.gameAudioEnabled || this.isPlaying) return;
        
        this.isPlaying = true;
        const theme = this.musicThemes[this.currentTheme] || this.musicThemes['overworld'];
        
        // Create track based on mood
        switch (theme.mood) {
            case 'peaceful':
                this.playPeacefulMelody(theme);
                break;
            case 'uplifting':
                this.playUpliftingMelody(theme);
                break;
            case 'meditative':
                this.playMeditativeMelody(theme);
                break;
            case 'mysterious':
                this.playMysteriousMelody(theme);
                break;
            case 'eerie':
                this.playEerieMelody(theme);
                break;
            case 'warm':
                this.playWarmMelody(theme);
                break;
            default:
                this.playPeacefulMelody(theme);
        }
    }
    
    playPeacefulMelody(theme) {
        const duration = 45 + Math.random() * 30; // 45-75 seconds
        const beatDuration = 60 / theme.tempo; // Beat duration in seconds
        
        // Create main gain node for the track
        this.musicGain = this.audioContext.createGain();
        this.musicGain.connect(this.audioContext.destination);
        this.musicGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.musicGain.gain.linearRampToValueAtTime(theme.volume, this.audioContext.currentTime + 4);
        
        // Play chord progression (harmony)
        this.playChordProgression(theme, duration, beatDuration);
        
        // Play melody over chords (starts after 8 seconds)
        setTimeout(() => {
            this.playSimpleMelody(theme, duration - 8, beatDuration);
        }, 8000);
        
        // Fade out and stop
        setTimeout(() => {
            if (this.musicGain) {
                this.musicGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 3);
            }
            setTimeout(() => {
                this.isPlaying = false;
            }, 3000);
        }, (duration - 3) * 1000);
    }
    
    playUpliftingMelody(theme) {
        const duration = 40 + Math.random() * 25; // 40-65 seconds
        const beatDuration = 60 / theme.tempo;
        
        this.musicGain = this.audioContext.createGain();
        this.musicGain.connect(this.audioContext.destination);
        this.musicGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.musicGain.gain.linearRampToValueAtTime(theme.volume, this.audioContext.currentTime + 3);
        
        // More energetic chord progression
        this.playChordProgression(theme, duration, beatDuration, 'energetic');
        
        // Brighter melody
        setTimeout(() => {
            this.playArpeggioMelody(theme, duration - 6, beatDuration);
        }, 6000);
        
        setTimeout(() => {
            if (this.musicGain) {
                this.musicGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2);
            }
            setTimeout(() => this.isPlaying = false, 2000);
        }, (duration - 2) * 1000);
    }
    
    playMeditativeMelody(theme) {
        const duration = 60 + Math.random() * 40; // 60-100 seconds (longer)
        const beatDuration = 60 / theme.tempo;
        
        this.musicGain = this.audioContext.createGain();
        this.musicGain.connect(this.audioContext.destination);
        this.musicGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.musicGain.gain.linearRampToValueAtTime(theme.volume, this.audioContext.currentTime + 6);
        
        // Slow, sustained chords
        this.playPadChords(theme, duration, beatDuration * 2);
        
        // Very simple, sparse melody
        setTimeout(() => {
            this.playSparseMelody(theme, duration - 12, beatDuration * 1.5);
        }, 12000);
        
        setTimeout(() => {
            if (this.musicGain) {
                this.musicGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 5);
            }
            setTimeout(() => this.isPlaying = false, 5000);
        }, (duration - 5) * 1000);
    }
    
    playMysteriousMelody(theme) {
        const duration = 50 + Math.random() * 30;
        const beatDuration = 60 / theme.tempo;
        
        this.musicGain = this.audioContext.createGain();
        this.musicGain.connect(this.audioContext.destination);
        this.musicGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.musicGain.gain.linearRampToValueAtTime(theme.volume, this.audioContext.currentTime + 4);
        
        // Dissonant, mysterious chords
        this.playChordProgression(theme, duration, beatDuration, 'mysterious');
        
        // Haunting melody with reverb
        setTimeout(() => {
            this.playHauntingMelody(theme, duration - 8, beatDuration);
        }, 8000);
        
        setTimeout(() => {
            if (this.musicGain) {
                this.musicGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 4);
            }
            setTimeout(() => this.isPlaying = false, 4000);
        }, (duration - 4) * 1000);
    }
    
    playEerieMelody(theme) {
        const duration = 55 + Math.random() * 35;
        const beatDuration = 60 / theme.tempo;
        
        this.musicGain = this.audioContext.createGain();
        this.musicGain.connect(this.audioContext.destination);
        this.musicGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.musicGain.gain.linearRampToValueAtTime(theme.volume, this.audioContext.currentTime + 5);
        
        // Dark, low chords
        this.playDarkChords(theme, duration, beatDuration * 1.5);
        
        // Eerie high melody
        setTimeout(() => {
            this.playEerieHighMelody(theme, duration - 10, beatDuration);
        }, 10000);
        
        setTimeout(() => {
            if (this.musicGain) {
                this.musicGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 4);
            }
            setTimeout(() => this.isPlaying = false, 4000);
        }, (duration - 4) * 1000);
    }
    
    playWarmMelody(theme) {
        const duration = 45 + Math.random() * 25;
        const beatDuration = 60 / theme.tempo;
        
        this.musicGain = this.audioContext.createGain();
        this.musicGain.connect(this.audioContext.destination);
        this.musicGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.musicGain.gain.linearRampToValueAtTime(theme.volume, this.audioContext.currentTime + 3);
        
        // Warm, major chords
        this.playChordProgression(theme, duration, beatDuration, 'warm');
        
        // Flowing melody
        setTimeout(() => {
            this.playFlowingMelody(theme, duration - 6, beatDuration);
        }, 6000);
        
        setTimeout(() => {
            if (this.musicGain) {
                this.musicGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 3);
            }
            setTimeout(() => this.isPlaying = false, 3000);
        }, (duration - 3) * 1000);
    }
    
    playChordProgression(theme, duration, beatDuration, style = 'normal') {
        const chords = theme.chords;
        let chordIndex = 0;
        const chordDuration = beatDuration * 4; // Each chord lasts 4 beats
        
        const playChord = () => {
            if (!this.musicGain) return;
            
            const chord = chords[chordIndex % chords.length];
            
            chord.forEach((freq, noteIndex) => {
                setTimeout(() => {
                    this.createChordNote(freq, chordDuration, theme.volume * 0.3, style);
                }, noteIndex * 50); // Slight delay for each note in chord
            });
            
            chordIndex++;
            
            if (chordIndex * chordDuration < duration) {
                setTimeout(playChord, chordDuration * 1000);
            }
        };
        
        playChord();
    }
    
    createChordNote(frequency, duration, volume, style) {
        if (!this.musicGain) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        
        // Different waveforms for different styles
        switch (style) {
            case 'warm':
                osc.type = 'sawtooth';
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
                break;
            case 'mysterious':
                osc.type = 'triangle';
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(600, this.audioContext.currentTime);
                break;
            case 'energetic':
                osc.type = 'square';
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1200, this.audioContext.currentTime);
                break;
            default:
                osc.type = 'sine';
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        }
        
        osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(volume * 0.7, this.audioContext.currentTime + duration - 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + duration);
    }
    
    playSimpleMelody(theme, duration, beatDuration) {
        const scale = theme.scale;
        let noteIndex = 0;
        const noteDuration = beatDuration / 2; // Eighth notes
        
        const playNote = () => {
            if (!this.musicGain) return;
            
            // Simple melody pattern - mostly steps with occasional jumps
            const direction = Math.random() > 0.7 ? (Math.random() > 0.5 ? 2 : -2) : (Math.random() > 0.5 ? 1 : -1);
            noteIndex = Math.max(0, Math.min(scale.length - 1, noteIndex + direction));
            
            const frequency = scale[noteIndex] * (Math.random() > 0.8 ? 2 : 1); // Occasional octave jump
            
            this.createMelodyNote(frequency, noteDuration, theme.volume * 0.4);
            
            // Sometimes skip a beat for musical breathing
            const nextDelay = Math.random() > 0.8 ? noteDuration * 3 : noteDuration * 2;
            
            if (nextDelay / 1000 < duration) {
                setTimeout(playNote, nextDelay * 1000);
                duration -= nextDelay;
            }
        };
        
        playNote();
    }
    
    createMelodyNote(frequency, duration, volume) {
        if (!this.musicGain) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + duration);
    }
    
    // Additional melody methods for different styles (simplified versions)
    playArpeggioMelody(theme, duration, beatDuration) {
        // Implementation for arpeggio-style melody
        this.playSimpleMelody(theme, duration, beatDuration / 2);
    }
    
    playSparseMelody(theme, duration, beatDuration) {
        // Very slow, sparse melody
        this.playSimpleMelody(theme, duration, beatDuration * 3);
    }
    
    playHauntingMelody(theme, duration, beatDuration) {
        // Mysterious melody with longer notes
        this.playSimpleMelody(theme, duration, beatDuration * 1.5);
    }
    
    playPadChords(theme, duration, beatDuration) {
        // Sustained pad-like chords
        this.playChordProgression(theme, duration, beatDuration * 2, 'warm');
    }
    
    playDarkChords(theme, duration, beatDuration) {
        // Dark, low chords
        this.playChordProgression(theme, duration, beatDuration, 'mysterious');
    }
    
    playEerieHighMelody(theme, duration, beatDuration) {
        // High, eerie melody
        const scale = theme.scale.map(freq => freq * 2); // Octave higher
        this.playSimpleMelody({...theme, scale}, duration, beatDuration * 2);
    }
    
    playFlowingMelody(theme, duration, beatDuration) {
        // Smooth, flowing melody
        this.playSimpleMelody(theme, duration, beatDuration);
    }
    
    // Keep UI interaction sounds
    playUIHoverSound() {
        if (!window.gameAudioEnabled) return;
        
        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.frequency.setValueAtTime(800 + Math.random() * 200, this.audioContext.currentTime);
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
            
            osc.start(this.audioContext.currentTime);
            osc.stop(this.audioContext.currentTime + 0.1);
        } catch (e) {
            console.log("UI hover sound error:", e);
        }
    }
    
    playUIClickSound() {
        if (!window.gameAudioEnabled) return;
        
        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.frequency.setValueAtTime(1200, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.05);
            osc.type = 'square';
            
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.02, this.audioContext.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);
            
            osc.start(this.audioContext.currentTime);
            osc.stop(this.audioContext.currentTime + 0.08);
        } catch (e) {
            console.log("UI click sound error:", e);
        }
    }
}

class InventoryManager {
    constructor(game) {
        this.game = game;
        this.inventory = Inventory.getInstance();
    }

    giveItem(itemId, quantity = 1) {
        const item = defaultItems[itemId];
        if (!item) {
            console.error(`Item ${itemId} not found in defaultItems`);
            return false;
        }

        const itemToAdd = {
            ...item,
            quantity: quantity
        };

        return this.inventory.addItem(itemToAdd);
    }

    removeItem(itemId, quantity = 1) {
        return this.inventory.removeItem(itemId, quantity);
    }

    hasItem(itemId) {
        return this.inventory.items.some(item => item.id === itemId);
    }

    getItemQuantity(itemId) {
        const item = this.inventory.items.find(item => item.id === itemId);
        return item ? item.quantity : 0;
    }

    giveStartingItems() {
        this.giveItem('stock_certificate', 5);
        this.giveItem('bond', 3);
        this.giveItem('trading_boost', 2);
        this.giveItem('speed_boost', 2);
        this.giveItem('calculator', 1);
        this.giveItem('market_scanner', 1);
        this.giveItem('rare_coin', 1);
        this.giveItem('trading_manual', 1);
        this.giveItem('roi_calculator', 1);
    }
}

class QuizManager {
    constructor(game) {
        this.game = game;
    }

    async fetchQuestionByCategory(category) {
        try {
            const personId = this.game.id;
            const response = await fetch(
                `${this.game.javaURI}/rpg_answer/getQuestion?category=${category}&personid=${personId}`, 
                this.game.fetchOptions
            );
    
            if (!response.ok) throw new Error("Failed to fetch questions");
            const questions = await response.json();
            return questions;
        } catch (error) {
            console.error("Error fetching question by category:", error);
            return null;
        }
    }
    
    async attemptQuizForNpc(npcCategory, callback = null) {
        try {
            const response = await this.fetchQuestionByCategory(npcCategory);
            const allQuestions = response?.questions || [];
    
            if (allQuestions.length === 0) {
                alert(`✅ You've already completed all of ${npcCategory}'s questions!`);
                return;
            }
    
            const quiz = new Quiz(this.game);
            quiz.initialize();
            quiz.openPanel(npcCategory, callback, allQuestions);
        } catch (error) {
            console.error("Error during NPC quiz attempt:", error);
            alert("⚠️ There was a problem loading the quiz. Please try again.");
        }
    }
}

class FinTech extends Game {
    constructor(environment) {
        super(environment);
        this.statsManager = new StatsManager(this);
        this.inventoryManager = new InventoryManager(this);
        this.quizManager = new QuizManager(this);

        this.initFinTechGame(environment);
    }

    static main(environment) {
        return new FinTech(environment);
    }

    initUser() {
        const pythonURL = this.pythonURI + '/api/id';
        fetch(pythonURL, this.fetchOptions)
            .then(response => {
                if (response.status !== 200) {
                    console.error("HTTP status code: " + response.status);
                    return null;
                }
                return response.json();
            })
            .then(data => {
                if (!data) return;
                this.uid = data.uid;

                const javaURL = this.javaURI + '/rpg_answer/person/' + this.uid;
                return fetch(javaURL, this.fetchOptions);
            })
            .then(response => {
                if (!response || !response.ok) {
                    throw new Error(`Spring server response: ${response?.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (!data) return;
                this.id = data.id;
                this.statsManager.fetchStats(this.id);
                // Game-specific logic for stats, etc. should be handled in subclasses
            })
            .catch(error => {
                console.error("Error:", error);
            });
    }

    giveItem(itemId, quantity = 1) {
        return this.inventoryManager.giveItem(itemId, quantity);
    }

    removeItem(itemId, quantity = 1) {
        return this.inventoryManager.removeItem(itemId, quantity);
    }

    hasItem(itemId) {
        return this.inventoryManager.hasItem(itemId);
    }

    getItemQuantity(itemId) {
        return this.inventoryManager.getItemQuantity(itemId);
    }

    attemptQuizForNpc(npcCategory, callback = null) {
        return this.quizManager.attemptQuizForNpc(npcCategory, callback);
    }

    // === NPC Cookie Methods ===
    
    /**
     * Give a cookie to the user for completing an NPC interaction
     * @param {string} npcId - The ID of the NPC
     * @param {string} reward - The reward/cookie value (optional)
     * @param {string} objective - The new objective to show (optional)
     */
    giveNpcCookie(npcId, reward = "completed", objective = null) {
        return this.statsManager.giveNpcCookie(npcId, reward, objective);
    }

    updateNpcProgress(personId, npcId) {
        return this.statsManager.updateNpcProgress(personId, npcId);
    }

    /**
     * Check if user has a specific NPC cookie
     * @param {string} npcId - The ID of the NPC
     * @returns {string|null} - The cookie value if exists, null otherwise
     */
    getNpcCookie(npcId) {
        return this.statsManager.getNpcCookie(npcId);
    }

    /**
     * Get all NPC cookies
     * @returns {Object} - Object with npcId as key and cookie value as value
     */
    getAllNpcCookies() {
        return this.statsManager.getAllNpcCookies();
    }

    showGameInstructions() {
        // Create modal container
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #000;
            padding: 25px;
            border: 4px solid #fff;
            color: white;
            z-index: 10000;
            max-width: 600px;
            max-height: 90vh;
            width: 90%;
            overflow-y: auto;
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
            font-family: 'Press Start 2P', cursive;
            animation: glowBorder 2s infinite alternate;
            transition: opacity 0.5s ease, transform 0.5s ease;
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
        `;


        // Add content
        modal.innerHTML = `
            <style>
                @keyframes glowBorder {
                    0% { box-shadow: 0 0 5px #fff, inset 0 0 5px #fff; }
                    100% { box-shadow: 0 0 15px #fff, inset 0 0 8px #fff; }
                }
                @keyframes scanline {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                @keyframes shine {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }
                .instruction-box {
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid #ffb300;
                    margin: 8px 0;
                    padding: 12px;
                    display: flex;
                    align-items: center;
                    font-size: 0.7em;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s;
                }
                .instruction-box:hover {
                    transform: translateX(5px);
                    background: rgba(255, 255, 255, 0.15);
                    border-color: #ffd700;
                }
                .instruction-box::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.2),
                        transparent
                    );
                    animation: shine 2s infinite;
                }
                .instruction-icon {
                    font-size: 1.2em;
                    margin-right: 15px;
                    color: #ffb300;
                }
                .instruction-label {
                    color: #ffb300;
                    margin-right: 8px;
                }
                .modal-title {
                    font-size: 1.2em;
                    margin-bottom: 20px;
                    text-align: center;
                    color: #ffeb3b;
                    text-shadow: 2px 2px #000;
                    position: relative;
                }
                .button-container {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    margin-top: 20px;
                }
                .game-button {
                    background: #000;
                    color: #fff;
                    border: 2px solid #ffb300;
                    padding: 12px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: 'Press Start 2P', cursive;
                    font-size: 0.7em;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                .game-button:hover {
                    transform: translateY(-2px);
                    border-color: #ffd700;
                    box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
                }
                .game-button::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(
                        45deg,
                        transparent,
                        rgba(255, 255, 255, 0.1),
                        transparent
                    );
                    transform: rotate(45deg);
                    animation: shine 2s infinite;
                }
                .scanline {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: rgba(255, 255, 255, 0.1);
                    animation: scanline 2s linear infinite;
                    pointer-events: none;
                }
            </style>
            <div class="scanline"></div>
            <h2 class="modal-title">
                <span style="color: #4CAF50;">⚡</span> HOW TO PLAY <span style="color: #4CAF50;">⚡</span>
            </h2>
            <div class="instruction-box">
                <span class="instruction-icon">🎮</span>
                <span class="instruction-label">Movement:</span>
                <span>WASD or Arrow Keys to move</span>
            </div>
            <div class="instruction-box">
                <span class="instruction-icon">🗣️</span>
                <span class="instruction-label">Interact:</span>
                <span>Press E near NPCs</span>
            </div>
            <div class="instruction-box">
                <span class="instruction-icon">📊</span>
                <span class="instruction-label">Stats:</span>
                <span>Click stats icon (top-right)</span>
            </div>
            <div class="instruction-box">
                <span class="instruction-icon">🎒</span>
                <span class="instruction-label">Inventory:</span>
                <span>Press I to view items</span>
            </div>
            <div class="instruction-box">
                <span class="instruction-icon">💰</span>
                <span class="instruction-label">Goal:</span>
                <span>Learn finance & earn money!</span>
            </div>
            <div class="instruction-box">
                <span class="instruction-icon">❓</span>
                <span class="instruction-label">Help:</span>
                <span>Press H to show this menu</span>
            </div>
            
            <!-- NPC Cookies Section -->
            <div class="instruction-box" style="flex-direction: column; align-items: flex-start;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span class="instruction-icon">🍪</span>
                    <span class="instruction-label">NPC Cookies Earned:</span>
                </div>
                <div id="npcCookiesDisplay" style="font-size: 0.6em; line-height: 1.4; color: #fff;">
                    ${this.getNpcCookiesDisplayHTML()}
                </div>
            </div>
            
            <div class="button-container">
                <button class="game-button" id="closeInstructions">GOT IT!</button>
            </div>
        `;

        // Close modal on button click
        modal.querySelector('#closeInstructions').addEventListener('click', () => {
            modal.style.opacity = '0';
            modal.style.transform = 'translate(-50%, -50%) scale(0.95)';
            setTimeout(() => modal.remove(), 500);
        });

        // Add fade-in animation
        modal.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -50%) scale(0.95)';
        document.body.appendChild(modal);
        
        // Trigger animation after a short delay
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 100);

        // Add sound effects
        const hoverSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
        hoverSound.volume = 0.2;

        // Add hover sound effects to instruction boxes and buttons
        const elements = modal.querySelectorAll('.instruction-box, .game-button');
        elements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                hoverSound.currentTime = 0;
                hoverSound.play();
            });
        });
    }

    getNpcCookiesDisplayHTML() {
        const cookies = this.getAllNpcCookies();
        if (Object.keys(cookies).length === 0) {
            return '<span style="color: #999;">No NPC cookies yet! Talk to NPCs to earn cookies.</span>';
        }
        
        return Object.entries(cookies).map(([npcId, reward]) => {
            const emoji = '✅'; // Consistent emoji since all cookies are now "completed"
            return `<span style="color: #4CAF50;">${emoji} ${npcId.replace(/-/g, ' ')}: completed</span>`;
        }).join('<br>');
    }

    initProgressBar() {
        // Create progress bar container
        const progressContainer = document.createElement('div');
        progressContainer.id = 'game-progress-bar';
        progressContainer.style.cssText = `
            position: fixed;
            top: 60px;
            left: 0;
            right: 0;
            height: auto;
            background: rgba(0, 0, 0, 0.8);
            z-index: 9998;
            border-bottom: 2px solid #333;
            backdrop-filter: blur(5px);
            padding: 8px 0;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Create progress emoji container
        const progressEmojis = document.createElement('div');
        progressEmojis.id = 'game-progress-emojis';
        progressEmojis.style.cssText = `
            display: flex;
            gap: 8px;
            align-items: center;
            padding: 0 10px;
        `;

        // Add progress text
        const progressText = document.createElement('div');
        progressText.id = 'game-progress-text';
        progressText.style.cssText = `
            position: fixed;
            top: 95px;
            left: 20px;
            color: white;
            font-family: 'Press Start 2P', cursive;
            font-size: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            z-index: 9999;
            background: rgba(0,0,0,0.6);
            padding: 5px 10px;
            border-radius: 15px;
            border: 1px solid #333;
            backdrop-filter: blur(5px);
        `;

        progressContainer.appendChild(progressEmojis);
        document.body.appendChild(progressContainer);
        document.body.appendChild(progressText);

        // Initialize progress
        this.updateProgressBar();

        // Add CSS animations if not present
        if (!document.getElementById('progress-bar-styles')) {
            const style = document.createElement('style');
            style.id = 'progress-bar-styles';
            style.textContent = `
                @keyframes controllerPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                
                @keyframes controllerGlow {
                    0% { 
                        filter: drop-shadow(0 0 5px #4CAF50);
                        text-shadow: 0 0 10px #4CAF50;
                    }
                    50% { 
                        filter: drop-shadow(0 0 15px #4CAF50);
                        text-shadow: 0 0 20px #4CAF50;
                    }
                    100% { 
                        filter: drop-shadow(0 0 5px #4CAF50);
                        text-shadow: 0 0 10px #4CAF50;
                    }
                }
                
                @keyframes controllerBounce {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                    100% { transform: translateY(0); }
                }
                
                .controller-completed {
                    animation: controllerGlow 2s infinite;
                }
                
                .controller-pending {
                    opacity: 0.3;
                    filter: grayscale(100%);
                }
                
                .controller-new {
                    animation: controllerPulse 0.5s ease-out, controllerBounce 1s ease-out 0.5s;
                }
            `;
            document.head.appendChild(style);
        }
    }

    updateProgressBar() {
        const progressEmojis = document.getElementById('game-progress-emojis');
        const progressText = document.getElementById('game-progress-text');
        
        if (!progressEmojis || !progressText) return;

        // Define the main waypoint NPCs (should match WaypointArrow.js)
        const waypointNpcs = [
            'Stock-NPC',
            'Casino-NPC', 
            'Fidelity',
            'Schwab',
            'Crypto-NPC',
            'Bank-NPC',
            'Market Computer'
        ];

        // Calculate progress based on waypoint NPC cookies only
        const totalNpcs = waypointNpcs.length; // 7 NPCs
        const npcCookies = this.getAllNpcCookies();
        
        // Count only waypoint NPCs that have at least one cookie
        const completedNpcs = waypointNpcs.filter(npcId => npcCookies[npcId]).length;
        const progressPercentage = (completedNpcs / totalNpcs) * 100;

        // Store previous completed count for animation
        const previousCompleted = parseInt(progressEmojis.dataset.previousCompleted || '0');
        progressEmojis.dataset.previousCompleted = completedNpcs.toString();

        // Clear existing emojis
        progressEmojis.innerHTML = '';

        // Create controller emojis for each NPC
        for (let i = 0; i < totalNpcs; i++) {
            const controllerEmoji = document.createElement('span');
            const isCompleted = i < completedNpcs;
            const isNewlyCompleted = i < completedNpcs && i >= previousCompleted;
            
            controllerEmoji.style.cssText = `
                font-size: 24px;
                transition: all 0.3s ease;
                cursor: pointer;
                user-select: none;
            `;
            
            if (isCompleted) {
                controllerEmoji.textContent = '🎮'; // Completed controller
                controllerEmoji.className = isNewlyCompleted ? 'controller-completed controller-new' : 'controller-completed';
                controllerEmoji.title = `${waypointNpcs[i]} - Completed!`;
            } else {
                controllerEmoji.textContent = '🕹️'; // Pending controller (different style)
                controllerEmoji.className = 'controller-pending';
                controllerEmoji.title = `${waypointNpcs[i]} - Not completed yet`;
            }
            
            // Add hover effects
            controllerEmoji.addEventListener('mouseenter', () => {
                if (isCompleted) {
                    controllerEmoji.style.transform = 'scale(1.2)';
                    controllerEmoji.style.filter = 'drop-shadow(0 0 10px #ffd700)';
                } else {
                    controllerEmoji.style.transform = 'scale(1.1)';
                    controllerEmoji.style.opacity = '0.6';
                }
            });
            
            controllerEmoji.addEventListener('mouseleave', () => {
                controllerEmoji.style.transform = 'scale(1)';
                if (isCompleted) {
                    controllerEmoji.style.filter = '';
                } else {
                    controllerEmoji.style.opacity = '0.3';
                }
            });
            
            progressEmojis.appendChild(controllerEmoji);
        }
        
        // Update text
        progressText.textContent = `🎮 ${completedNpcs}/${totalNpcs} Controllers Earned (${Math.round(progressPercentage)}%)`;

        // Special effect when completed
        if (completedNpcs === totalNpcs) {
            progressText.textContent = '🎉 ALL CONTROLLERS UNLOCKED! 🎉';
            progressText.style.color = '#ffd700';
            
            // Add celebration effect to all controllers
            const controllers = progressEmojis.querySelectorAll('span');
            controllers.forEach((controller, index) => {
                setTimeout(() => {
                    controller.style.animation = 'controllerPulse 0.5s ease-out, controllerBounce 1s ease-out 0.5s';
                }, index * 100);
            });
            
            this.showCompletionCelebration();
        }
    }

    showCompletionCelebration() {
        // Create massive celebration effect
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createCelebrationFirework();
            }, i * 100);
        }
    }

    createCelebrationFirework() {
        const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'];
        const particles = [];
        const particleCount = 20;
        
        // Random position on screen
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight * 0.6; // Upper part of screen
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: 8px;
                height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 10001;
                box-shadow: 0 0 10px currentColor;
            `;
            
            document.body.appendChild(particle);
            particles.push(particle);
            
            // Animate particle
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = 100 + Math.random() * 150;
            const deltaX = Math.cos(angle) * distance;
            const deltaY = Math.sin(angle) * distance;
            
            particle.animate([
                {
                    transform: 'translate(-50%, -50%) scale(0)',
                    opacity: 1
                },
                {
                    transform: 'translate(-50%, -50%) scale(1)',
                    opacity: 1,
                    offset: 0.1
                },
                {
                    transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0.5)`,
                    opacity: 0.5,
                    offset: 0.8
                },
                {
                    transform: `translate(calc(-50% + ${deltaX * 1.2}px), calc(-50% + ${deltaY * 1.2}px)) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: 2000 + Math.random() * 1000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
        }
        
        // Clean up particles
        setTimeout(() => {
            particles.forEach(particle => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            });
        }, 3000);
    }

    initAudioToggle() {
        // Check for existing audio preference
        const isAudioEnabled = localStorage.getItem('gameAudioEnabled') !== 'false';
        
        // Create audio toggle button container
        const audioToggleContainer = document.createElement('div');
        audioToggleContainer.id = 'audio-toggle-container';
        audioToggleContainer.style.cssText = `
            position: fixed;
            top: 120px;
            left: 20px;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        // Create the toggle button
        const audioButton = document.createElement('button');
        audioButton.id = 'audio-toggle-button';
        audioButton.innerHTML = isAudioEnabled ? '🔊' : '🔇';
        audioButton.title = isAudioEnabled ? 'Click to mute audio' : 'Click to enable audio';
        audioButton.style.cssText = `
            background: #000;
            border: 2px solid #fff;
            color: #fff;
            padding: 12px 15px;
            cursor: pointer;
            font-family: 'Press Start 2P', cursive;
            font-size: 18px;
            border-radius: 4px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
            animation: glowBorder 2s infinite alternate;
        `;
        
        // Add label
        const audioLabel = document.createElement('span');
        audioLabel.style.cssText = `
            color: #fff;
            font-family: 'Press Start 2P', cursive;
            font-size: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            opacity: 0.8;
        `;
        audioLabel.textContent = isAudioEnabled ? 'AUDIO ON' : 'AUDIO OFF';
        
        // Add click functionality
        audioButton.addEventListener('click', () => {
            const currentState = localStorage.getItem('gameAudioEnabled') !== 'false';
            const newState = !currentState;
            
            // Update localStorage
            localStorage.setItem('gameAudioEnabled', newState.toString());
            
            // Update button appearance
            audioButton.innerHTML = newState ? '🔊' : '🔇';
            audioButton.title = newState ? 'Click to mute audio' : 'Click to enable audio';
            audioLabel.textContent = newState ? 'AUDIO ON' : 'AUDIO OFF';
            
            // Update global audio state
            window.gameAudioEnabled = newState;
            
            // Play a confirmation sound if audio is being enabled
            if (newState) {
                this.playConfirmationSound();
            }
            
            // Show brief feedback
            this.showAudioToggleFeedback(newState);
        });
        
        // Add hover effects
        audioButton.addEventListener('mouseenter', () => {
            audioButton.style.transform = 'scale(1.05)';
            audioButton.style.borderColor = '#ffd700';
            audioButton.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.5)';
        });
        
        audioButton.addEventListener('mouseleave', () => {
            audioButton.style.transform = 'scale(1)';
            audioButton.style.borderColor = '#fff';
            audioButton.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
        });
        
        // Assemble and add to page
        audioToggleContainer.appendChild(audioButton);
        audioToggleContainer.appendChild(audioLabel);
        document.body.appendChild(audioToggleContainer);
        
        // Set global audio state
        window.gameAudioEnabled = isAudioEnabled;
        
        // Add CSS for animations if not present
        if (!document.getElementById('audio-toggle-styles')) {
            const style = document.createElement('style');
            style.id = 'audio-toggle-styles';
            style.textContent = `
                @keyframes audioFeedback {
                    0% { transform: scale(1) rotate(0deg); }
                    25% { transform: scale(1.1) rotate(-5deg); }
                    50% { transform: scale(1.2) rotate(5deg); }
                    75% { transform: scale(1.1) rotate(-2deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                
                .audio-feedback {
                    animation: audioFeedback 0.5s ease-out;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    playConfirmationSound() {
        // Play a brief confirmation beep when audio is enabled
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            console.log("Confirmation sound error:", e);
        }
    }
    
    showAudioToggleFeedback(isEnabled) {
        // Show visual feedback when audio is toggled
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: ${isEnabled ? '#4CAF50' : '#f44336'};
            padding: 20px 30px;
            border: 2px solid ${isEnabled ? '#4CAF50' : '#f44336'};
            border-radius: 8px;
            font-family: 'Press Start 2P', cursive;
            font-size: 12px;
            z-index: 10001;
            pointer-events: none;
            animation: audioFeedback 0.5s ease-out;
            box-shadow: 0 0 20px rgba(${isEnabled ? '76, 175, 80' : '244, 67, 54'}, 0.5);
        `;
        feedback.textContent = isEnabled ? '🔊 AUDIO ENABLED' : '🔇 AUDIO DISABLED';
        
        document.body.appendChild(feedback);
        
        // Remove feedback after animation
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 1000);
    }

    /**
     * Show Portfolio Dashboard with comprehensive financial information
     */
    showPortfolioDashboard() {
        // Remove existing dashboard if present
        const existingDashboard = document.getElementById('portfolio-dashboard');
        if (existingDashboard) {
            existingDashboard.remove();
        }

        // Create dashboard container
        const dashboard = document.createElement('div');
        dashboard.id = 'portfolio-dashboard';
        dashboard.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
            backdrop-filter: blur(10px);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            font-family: 'Arial', sans-serif;
            overflow-y: auto;
            animation: dashboardFadeIn 0.5s ease-out;
        `;

        // Add dashboard styles if not present
        if (!document.getElementById('portfolio-dashboard-styles')) {
            const styles = document.createElement('style');
            styles.id = 'portfolio-dashboard-styles';
            styles.textContent = `
                @keyframes dashboardFadeIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                
                @keyframes cardSlideIn {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes numberCountUp {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                
                .portfolio-card {
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 16px;
                    backdrop-filter: blur(10px);
                    animation: cardSlideIn 0.6s ease-out;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                
                .portfolio-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }
                
                .stat-number {
                    animation: numberCountUp 0.8s ease-out;
                }
                
                .progress-bar {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    overflow: hidden;
                    height: 8px;
                }
                
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #4CAF50, #81C784);
                    border-radius: 10px;
                    transition: width 1s ease;
                }
            `;
            document.head.appendChild(styles);
        }

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.1));
            padding: 20px 30px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const headerTitle = document.createElement('h1');
        headerTitle.style.cssText = `
            color: #fff;
            margin: 0;
            font-size: 28px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 15px;
        `;
        headerTitle.innerHTML = `
            <span style="font-size: 32px;">📊</span>
            Financial Portfolio Dashboard
        `;

        const closeButton = document.createElement('button');
        closeButton.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: #fff;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 18px;
            transition: all 0.3s ease;
        `;
        closeButton.innerHTML = '✕';
        closeButton.onclick = () => dashboard.remove();
        closeButton.onmouseover = () => {
            closeButton.style.background = 'rgba(255, 100, 100, 0.3)';
            closeButton.style.transform = 'scale(1.1)';
        };
        closeButton.onmouseout = () => {
            closeButton.style.background = 'rgba(255, 255, 255, 0.1)';
            closeButton.style.transform = 'scale(1)';
        };

        header.appendChild(headerTitle);
        header.appendChild(closeButton);

        // Main content with integrated grid layout
        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            padding: 30px;
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            grid-template-rows: auto auto auto;
            gap: 20px;
            max-width: 1400px;
            margin: 0 auto;
            width: 100%;
        `;

        // Portfolio Summary Card (spans full width)
        const summaryCard = this.createSummaryCard();
        summaryCard.style.gridColumn = '1 / -1';

        // Left side: Holdings & Achievements (spans 2 columns)
        const holdingsCard = this.createIntegratedHoldingsCard();
        holdingsCard.style.gridColumn = '1 / 3';
        holdingsCard.style.gridRow = '2 / 4';

        // Right side: Performance and Activity cards
        const performanceCard = this.createPerformanceCard();
        const activityCard = this.createActivityCard();

        content.appendChild(summaryCard);
        content.appendChild(holdingsCard);
        content.appendChild(performanceCard);
        content.appendChild(activityCard);

        dashboard.appendChild(header);
        dashboard.appendChild(content);
        document.body.appendChild(dashboard);

        // Animate cards with staggered timing
        setTimeout(() => this.animateCardEntrance(), 100);
    }

    createSummaryCard() {
        const card = document.createElement('div');
        card.className = 'portfolio-card';
        card.style.cssText = `
            padding: 30px;
            text-align: center;
            background: linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(129, 199, 132, 0.1));
            border: 1px solid rgba(76, 175, 80, 0.3);
        `;

        const balance = localStorage.getItem('balance') || '100,000';
        const totalValue = this.calculateTotalPortfolioValue();

        card.innerHTML = `
            <div style="display: flex; justify-content: space-around; align-items: center; color: #fff;">
                <div>
                    <div style="font-size: 16px; opacity: 0.8; margin-bottom: 10px;">💰 Total Balance</div>
                    <div class="stat-number" style="font-size: 36px; font-weight: bold; color: #4CAF50;">$${balance}</div>
                </div>
                <div style="width: 1px; height: 60px; background: rgba(255,255,255,0.2);"></div>
                <div>
                    <div style="font-size: 16px; opacity: 0.8; margin-bottom: 10px;">📈 Portfolio Value</div>
                    <div class="stat-number" style="font-size: 36px; font-weight: bold; color: #81C784;">$${totalValue}</div>
                </div>
                <div style="width: 1px; height: 60px; background: rgba(255,255,255,0.2);"></div>
                <div>
                    <div style="font-size: 16px; opacity: 0.8; margin-bottom: 10px;">🎯 Progress</div>
                    <div class="stat-number" style="font-size: 36px; font-weight: bold; color: #A5D6A7;">${Object.keys(this.getAllNpcCookies()).length}/6</div>
                    <div style="font-size: 12px; opacity: 0.7;">NPCs Completed</div>
                </div>
            </div>
        `;

        return card;
    }

    createBalanceCard() {
        const card = document.createElement('div');
        card.className = 'portfolio-card';
        card.style.cssText = `
            padding: 25px;
            color: #fff;
        `;

        const accuracy = localStorage.getItem('questionAccuracy') || '0%';
        
        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <span style="font-size: 24px;">🎯</span>
                <h3 style="margin: 0; font-size: 18px;">Performance</h3>
            </div>
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Quiz Accuracy</span>
                    <span style="font-weight: bold; color: #4CAF50;">${accuracy}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${accuracy}"></div>
                </div>
            </div>
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Game Progress</span>
                    <span style="font-weight: bold; color: #2196F3;">${Math.round((Object.keys(this.getAllNpcCookies()).length / 6) * 100)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(Object.keys(this.getAllNpcCookies()).length / 6) * 100}%; background: linear-gradient(90deg, #2196F3, #64B5F6);"></div>
                </div>
            </div>
        `;

        return card;
    }

    createPerformanceCard() {
        const card = document.createElement('div');
        card.className = 'portfolio-card';
        card.style.cssText = `
            padding: 25px;
            color: #fff;
        `;

        const totalStockValue = this.getMockStockData().reduce((sum, stock) => sum + parseFloat(stock.value.replace(/,/g, '')), 0);
        const totalCryptoValue = this.getMockCryptoData().reduce((sum, crypto) => sum + parseFloat(crypto.value.replace(/,/g, '')), 0);
        const balance = parseFloat((localStorage.getItem('balance') || '100000').replace(/,/g, ''));

        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <span style="font-size: 24px;">💼</span>
                <h3 style="margin: 0; font-size: 18px;">Quick Stats</h3>
            </div>
            
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 14px;">💰 Cash Balance</span>
                    <span style="font-weight: bold; color: #4CAF50;">$${balance.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 14px;">📈 Stock Value</span>
                    <span style="font-weight: bold; color: #FF9800;">$${totalStockValue.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 14px;">₿ Crypto Value</span>
                    <span style="font-weight: bold; color: #FFC107;">$${totalCryptoValue.toLocaleString()}</span>
                </div>
                <div style="border-top: 1px solid rgba(255,255,255,0.2); margin-top: 12px; padding-top: 12px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-size: 16px; font-weight: bold;">Total Portfolio</span>
                        <span style="font-weight: bold; color: #2196F3; font-size: 18px;">$${(balance + totalStockValue + totalCryptoValue).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div style="background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 10px; padding: 15px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                    <span style="font-size: 16px;">🎯</span>
                    <span style="font-weight: bold; color: #4CAF50;">Performance Snapshot</span>
                </div>
                <div style="font-size: 12px; line-height: 1.5; opacity: 0.9;">
                    Your portfolio is performing well with diversified holdings across stocks and crypto. Continue learning from NPCs to unlock more investment strategies!
                </div>
            </div>
        `;

        return card;
    }

    createActivityCard() {
        const card = document.createElement('div');
        card.className = 'portfolio-card';
        card.style.cssText = `
            padding: 25px;
            color: #fff;
        `;

        const npcCookies = this.getAllNpcCookies();
        const nextNpc = this.getNextNpcToVisit();

        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <span style="font-size: 24px;">🎮</span>
                <h3 style="margin: 0; font-size: 18px;">Game Status</h3>
            </div>
            
            <div style="margin-bottom: 20px;">
                <div style="background: rgba(33, 150, 243, 0.1); border: 1px solid rgba(33, 150, 243, 0.3); border-radius: 10px; padding: 15px; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: bold;">NPCs Completed</span>
                        <span style="font-size: 24px; font-weight: bold; color: #2196F3;">${Object.keys(npcCookies).length}/6</span>
                    </div>
                    <div class="progress-bar" style="margin-top: 10px;">
                        <div class="progress-fill" style="width: ${(Object.keys(npcCookies).length / 6) * 100}%; background: linear-gradient(90deg, #2196F3, #64B5F6);"></div>
                    </div>
                </div>
                
                ${nextNpc ? `
                    <div style="background: rgba(255, 152, 0, 0.1); border: 1px solid rgba(255, 152, 0, 0.3); border-radius: 10px; padding: 15px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span style="font-size: 16px;">🎯</span>
                            <span style="font-weight: bold; color: #FF9800;">Next Objective</span>
                        </div>
                        <div style="font-size: 14px; opacity: 0.9;">
                            Visit <strong>${nextNpc.name}</strong><br>
                            <span style="font-size: 12px; color: #FF9800;">${nextNpc.description}</span>
                        </div>
                    </div>
                ` : `
                    <div style="background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 10px; padding: 15px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span style="font-size: 16px;">🎉</span>
                            <span style="font-weight: bold; color: #4CAF50;">All Complete!</span>
                        </div>
                        <div style="font-size: 14px; opacity: 0.9;">
                            Congratulations! You've completed all NPC interactions and mastered the fintech world!
                        </div>
                    </div>
                `}
            </div>

            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #E91E63;">🕒 Play Time Tracking</div>
                <div style="font-size: 12px; opacity: 0.8; line-height: 1.4;">
                    <div>Session started: Today</div>
                    <div>Total earnings: $${this.calculateTotalEarnings()}</div>
                    <div>Knowledge level: ${this.getKnowledgeLevel()}</div>
                </div>
            </div>
        `;

        return card;
    }

    createHoldingsSection() {
        const section = document.createElement('div');
        section.className = 'portfolio-card';
        section.style.cssText = `
            padding: 30px;
            color: #fff;
        `;

        const npcCookies = this.getAllNpcCookies();
        const achievements = Object.keys(npcCookies);

        section.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
                <span style="font-size: 24px;">🏆</span>
                <h3 style="margin: 0; font-size: 20px;">Achievements & Progress</h3>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                ${this.createAchievementCards(achievements)}
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <h4 style="margin-bottom: 15px;">Recent Activity</h4>
                <div style="max-height: 200px; overflow-y: auto;">
                    ${this.createActivityFeed()}
                </div>
            </div>
        `;

        return section;
    }

    createAchievementCards(achievements) {
        const allNpcs = ['Stock-NPC', 'Casino-NPC', 'Mining-NPC', 'Crypto-NPC', 'Bank-NPC', 'Market Computer'];
        const npcNames = {
            'Stock-NPC': 'J.P. Morgan',
            'Casino-NPC': 'Frank Sinatra', 
            'Mining-NPC': 'Max the Miner',
            'Crypto-NPC': 'Satoshi Nakamoto',
            'Bank-NPC': 'Janet Yellen',
            'Market Computer': 'Market Computer'
        };
        const npcEmojis = {
            'Stock-NPC': '📊',
            'Casino-NPC': '🎰',
            'Mining-NPC': '⛏️',
            'Crypto-NPC': '₿',
            'Bank-NPC': '🏦',
            'Market Computer': '💻'
        };

        return allNpcs.map(npc => {
            const completed = achievements.includes(npc);
            return `
                <div style="padding: 15px; background: ${completed ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)'}; border-radius: 12px; border: 1px solid ${completed ? 'rgba(76, 175, 80, 0.4)' : 'rgba(255, 255, 255, 0.1)'};">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <span style="font-size: 20px;">${npcEmojis[npc]}</span>
                        <span style="font-weight: bold; ${!completed ? 'opacity: 0.5;' : ''}">${npcNames[npc]}</span>
                        ${completed ? '<span style="color: #4CAF50; font-size: 16px;">✓</span>' : ''}
                    </div>
                    <div style="font-size: 12px; opacity: 0.7;">
                        ${completed ? 'Completed interaction' : 'Not visited yet'}
                    </div>
                </div>
            `;
        }).join('');
    }

    createActivityFeed() {
        const activities = [
            '🏦 Visited Janet Yellen - Bank Analytics',
            '📊 Interacted with J.P. Morgan - Stock Exchange', 
            '🎰 Met Frank Sinatra - Casino Games',
            '₿ Learned from Satoshi - Crypto Hub',
            '⛏️ Talked to Max - Mining Operations'
        ];

        return activities.slice(0, 3).map(activity => `
            <div style="padding: 10px; margin-bottom: 8px; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 3px solid #4CAF50;">
                <div style="font-size: 14px;">${activity}</div>
                <div style="font-size: 12px; opacity: 0.6; margin-top: 4px;">Recently completed</div>
            </div>
        `).join('');
    }

    getMockStockData() {
        return [
            { symbol: 'AAPL', shares: 10, value: '1,750.00', change: 2.3 },
            { symbol: 'GOOGL', shares: 5, value: '1,325.00', change: -1.2 },
            { symbol: 'TSLA', shares: 8, value: '1,840.00', change: 4.7 },
            { symbol: 'MSFT', shares: 12, value: '2,160.00', change: 1.8 }
        ];
    }

    getMockCryptoData() {
        return [
            { symbol: 'BTC', amount: 0.05, value: '2,150.00', change: 3.2 },
            { symbol: 'ETH', amount: 1.2, value: '2,640.00', change: -0.8 },
            { symbol: 'ADA', amount: 500, value: '180.00', change: 5.1 }
        ];
    }

    calculateTotalPortfolioValue() {
        const balance = parseFloat((localStorage.getItem('balance') || '100000').replace(/,/g, ''));
        const stockValue = this.getMockStockData().reduce((sum, stock) => sum + parseFloat(stock.value.replace(/,/g, '')), 0);
        const cryptoValue = this.getMockCryptoData().reduce((sum, crypto) => sum + parseFloat(crypto.value.replace(/,/g, '')), 0);
        
        return (balance + stockValue + cryptoValue).toLocaleString();
    }

    animateCardEntrance() {
        const cards = document.querySelectorAll('.portfolio-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animationDelay = `${index * 0.1}s`;
                card.style.opacity = '1';
            }, index * 100);
        });
    }

    getNextNpcToVisit() {
        const allNpcs = [
            { id: 'Stock-NPC', name: 'J.P. Morgan', description: 'Learn about stock market investing' },
            { id: 'Casino-NPC', name: 'Frank Sinatra', description: 'Understand risk and gambling vs investing' },
            { id: 'Mining-NPC', name: 'Max the Miner', description: 'Discover mining and commodities' },
            { id: 'Crypto-NPC', name: 'Satoshi Nakamoto', description: 'Explore cryptocurrency and blockchain' },
            { id: 'Bank-NPC', name: 'Janet Yellen', description: 'Master banking and financial policy' },
            { id: 'Market Computer', name: 'Market Computer', description: 'Analyze market data and trends' }
        ];
        
        const completedNpcs = this.getAllNpcCookies();
        
        for (let npc of allNpcs) {
            if (!completedNpcs[npc.id]) {
                return npc;
            }
        }
        
        return null; // All NPCs completed
    }

    calculateTotalEarnings() {
        const balance = parseFloat((localStorage.getItem('balance') || '100000').replace(/,/g, ''));
        const stockValue = this.getMockStockData().reduce((sum, stock) => sum + parseFloat(stock.value.replace(/,/g, '')), 0);
        const cryptoValue = this.getMockCryptoData().reduce((sum, crypto) => sum + parseFloat(crypto.value.replace(/,/g, '')), 0);
        
        return (balance + stockValue + cryptoValue - 100000).toLocaleString(); // Subtract starting amount
    }

    getKnowledgeLevel() {
        const completedNpcs = Object.keys(this.getAllNpcCookies()).length;
        const accuracy = parseInt(localStorage.getItem('questionAccuracy') || '0');
        
        if (completedNpcs >= 6 && accuracy >= 80) return 'Expert';
        if (completedNpcs >= 4 && accuracy >= 60) return 'Advanced';
        if (completedNpcs >= 2 && accuracy >= 40) return 'Intermediate';
        return 'Beginner';
    }

    calculateStockValue() {
        const stockValue = this.getMockStockData().reduce((sum, stock) => sum + parseFloat(stock.value.replace(/,/g, '')), 0);
        return stockValue.toLocaleString();
    }

    calculateCryptoValue() {
        const cryptoValue = this.getMockCryptoData().reduce((sum, crypto) => sum + parseFloat(crypto.value.replace(/,/g, '')), 0);
        return cryptoValue.toLocaleString();
    }

    initFinTechGame(environment) {
        this.initUser();
        this.inventoryManager.giveStartingItems();
        this.showGameInstructions();
        
        // Add portfolio dashboard hotkey
        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'h') {
                this.showGameInstructions();
            }
            if (event.key.toLowerCase() === 'p') {
                this.showPortfolioDashboard();
            }
        });
        
        const gameLevelClasses = environment.gameLevelClasses;
        this.gameControl = new GameControl(this, gameLevelClasses);
        this.gameControl.start();
    }

    createIntegratedHoldingsCard() {
        const card = document.createElement('div');
        card.className = 'portfolio-card';
        card.style.cssText = `
            padding: 30px;
            color: #fff;
            display: flex;
            flex-direction: column;
            height: fit-content;
        `;

        const npcCookies = this.getAllNpcCookies();
        const achievements = Object.keys(npcCookies);
        const accuracy = localStorage.getItem('questionAccuracy') || '0%';
        const mockStocks = this.getMockStockData();
        const mockCrypto = this.getMockCryptoData();

        card.innerHTML = `
            <!-- Holdings & Analysis Header -->
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.2);">
                <span style="font-size: 24px;">📈</span>
                <h3 style="margin: 0; font-size: 20px;">Holdings & Performance Analysis</h3>
            </div>
            
            <!-- Performance Metrics Section -->
            <div style="margin-bottom: 30px;">
                <h4 style="margin-bottom: 15px; color: #4CAF50;">📊 Performance Metrics</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div style="padding: 15px; background: rgba(76, 175, 80, 0.1); border-radius: 10px; border: 1px solid rgba(76, 175, 80, 0.3);">
                        <div style="font-size: 14px; opacity: 0.8; margin-bottom: 8px;">Quiz Accuracy</div>
                        <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${accuracy}</div>
                        <div class="progress-bar" style="margin-top: 8px;">
                            <div class="progress-fill" style="width: ${accuracy}"></div>
                        </div>
                    </div>
                    <div style="padding: 15px; background: rgba(33, 150, 243, 0.1); border-radius: 10px; border: 1px solid rgba(33, 150, 243, 0.3);">
                        <div style="font-size: 14px; opacity: 0.8; margin-bottom: 8px;">Game Progress</div>
                        <div style="font-size: 24px; font-weight: bold; color: #2196F3;">${Math.round((Object.keys(this.getAllNpcCookies()).length / 6) * 100)}%</div>
                        <div class="progress-bar" style="margin-top: 8px;">
                            <div class="progress-fill" style="width: ${(Object.keys(this.getAllNpcCookies()).length / 6) * 100}%; background: linear-gradient(90deg, #2196F3, #64B5F6);"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stock Holdings Section -->
            <div style="margin-bottom: 30px;">
                <h4 style="margin-bottom: 15px; color: #FF9800;">📈 Stock Portfolio</h4>
                <div style="background: rgba(255, 255, 255, 0.05); border-radius: 10px; padding: 15px;">
                    ${mockStocks.map(stock => `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 6px;">
                            <div>
                                <div style="font-weight: bold; font-size: 16px;">${stock.symbol}</div>
                                <div style="font-size: 12px; opacity: 0.7;">${stock.shares} shares</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: ${stock.change > 0 ? '#4CAF50' : '#f44336'}; font-weight: bold;">
                                    ${stock.change > 0 ? '▲' : '▼'} ${Math.abs(stock.change).toFixed(2)}%
                                </div>
                                <div style="font-size: 14px; font-weight: bold;">$${stock.value}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Crypto Holdings Section -->
            <div style="margin-bottom: 30px;">
                <h4 style="margin-bottom: 15px; color: #FFC107;">₿ Crypto Portfolio</h4>
                <div style="background: rgba(255, 255, 255, 0.05); border-radius: 10px; padding: 15px;">
                    ${mockCrypto.map(crypto => `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 6px;">
                            <div>
                                <div style="font-weight: bold; font-size: 16px;">${crypto.symbol}</div>
                                <div style="font-size: 12px; opacity: 0.7;">${crypto.amount} ${crypto.symbol}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: ${crypto.change > 0 ? '#4CAF50' : '#f44336'}; font-weight: bold;">
                                    ${crypto.change > 0 ? '▲' : '▼'} ${Math.abs(crypto.change).toFixed(2)}%
                                </div>
                                <div style="font-size: 14px; font-weight: bold;">$${crypto.value}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Achievements Section -->
            <div>
                <h4 style="margin-bottom: 15px; color: #E91E63;">🏆 NPC Achievements</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                    ${this.createAchievementCards(achievements)}
                </div>
            </div>
            
            <!-- Recent Activity -->
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <h4 style="margin-bottom: 15px; color: #9C27B0;">📋 Recent Activity</h4>
                <div style="max-height: 150px; overflow-y: auto;">
                    ${this.createActivityFeed()}
                </div>
            </div>
        `;

        return card;
    }

    /**
     * Show Portfolio Analysis Overlay with blurred background
     */
    showPortfolioAnalysisOverlay() {
        // Remove existing overlay if present
        const existingOverlay = document.getElementById('portfolio-analysis-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Calculate values safely
        let stockValue = '0';
        let cryptoValue = '0'; 
        let totalPortfolioValue = '0';
        let knowledgeLevel = 'Beginner';
        let balance = localStorage.getItem('balance') || '100,000';
        let accuracy = localStorage.getItem('questionAccuracy') || '0%';
        
        try {
            stockValue = this.calculateStockValue();
            cryptoValue = this.calculateCryptoValue();
            totalPortfolioValue = this.calculateTotalPortfolioValue();
            knowledgeLevel = this.getKnowledgeLevel();
        } catch (error) {
            console.log('Portfolio calculation error:', error);
        }

        // Create overlay container with blur effect
        const overlay = document.createElement('div');
        overlay.id = 'portfolio-analysis-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 10001;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: overlayFadeIn 0.3s ease-out;
        `;

        // Add overlay styles if not present
        if (!document.getElementById('portfolio-overlay-styles')) {
            const styles = document.createElement('style');
            styles.id = 'portfolio-overlay-styles';
            styles.textContent = `
                @keyframes overlayFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes analysisSlideIn {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                
                .analysis-card {
                    background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 55, 0.95));
                    border: 2px solid #ffb300;
                    border-radius: 16px;
                    backdrop-filter: blur(15px);
                    animation: analysisSlideIn 0.4s ease-out;
                    box-shadow: 0 0 30px rgba(255, 179, 0, 0.3);
                }
                
                .metric-item {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 179, 0, 0.3);
                    border-radius: 8px;
                    padding: 15px;
                    margin: 8px 0;
                    transition: all 0.3s ease;
                }
                
                .metric-item:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: #ffd700;
                    transform: translateX(5px);
                }
            `;
            document.head.appendChild(styles);
        }

        // Create analysis panel
        const analysisPanel = document.createElement('div');
        analysisPanel.className = 'analysis-card';
        analysisPanel.style.cssText = `
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            padding: 30px;
            color: #fff;
            font-family: 'Press Start 2P', cursive;
            position: relative;
        `;

        const completedNpcs = Object.keys(this.getAllNpcCookies()).length;
        const mockStocks = this.getMockStockData();
        const mockCrypto = this.getMockCryptoData();

        analysisPanel.innerHTML = `
            <!-- Close Button -->
            <button style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: rgba(255, 100, 100, 0.2);
                border: 1px solid #ff6b6b;
                color: #fff;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s ease;
            " onclick="this.closest('#portfolio-analysis-overlay').remove()">✕</button>

            <!-- Header -->
            <div style="text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #ffb300;">
                <h2 style="margin: 0; font-size: 16px; color: #ffeb3b;">
                    💼 PORTFOLIO ANALYSIS
                </h2>
                <div style="font-size: 10px; opacity: 0.8; margin-top: 8px;">
                    Comprehensive Financial Overview
                </div>
            </div>

            <!-- Summary Cards -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                <div class="metric-item">
                    <div style="font-size: 8px; opacity: 0.8; margin-bottom: 5px;">💰 CASH BALANCE</div>
                    <div style="font-size: 14px; color: #4CAF50;">$${balance}</div>
                </div>
                <div class="metric-item">
                    <div style="font-size: 8px; opacity: 0.8; margin-bottom: 5px;">📊 TOTAL PORTFOLIO</div>
                    <div style="font-size: 14px; color: #2196F3;">$${totalPortfolioValue}</div>
                </div>
            </div>

            <!-- Holdings Breakdown -->
            <div style="margin-bottom: 25px;">
                <h3 style="font-size: 12px; margin-bottom: 15px; color: #FF9800;">📈 HOLDINGS BREAKDOWN</h3>
                
                <div class="metric-item">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 10px;">Stock Investments</span>
                        <span style="font-size: 12px; color: #FF9800;">$${stockValue}</span>
                    </div>
                    <div style="font-size: 8px; opacity: 0.7; margin-top: 5px;">
                        ${mockStocks.length} different stocks
                    </div>
                </div>
                
                <div class="metric-item">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 10px;">Cryptocurrency</span>
                        <span style="font-size: 12px; color: #FFC107;">$${cryptoValue}</span>
                    </div>
                    <div style="font-size: 8px; opacity: 0.7; margin-top: 5px;">
                        ${mockCrypto.length} different currencies
                    </div>
                </div>
            </div>

            <!-- Performance Metrics -->
            <div style="margin-bottom: 25px;">
                <h3 style="font-size: 12px; margin-bottom: 15px; color: #E91E63;">🎯 PERFORMANCE METRICS</h3>
                
                <div class="metric-item">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 10px;">Knowledge Level</span>
                        <span style="font-size: 12px; color: #2196F3;">${knowledgeLevel}</span>
                    </div>
                </div>
                
                <div class="metric-item">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 10px;">Quiz Accuracy</span>
                        <span style="font-size: 12px; color: #4CAF50;">${accuracy}</span>
                    </div>
                </div>
                
                <div class="metric-item">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 10px;">NPCs Completed</span>
                        <span style="font-size: 12px; color: #9C27B0;">${completedNpcs}/6</span>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button style="
                    background: rgba(76, 175, 80, 0.2);
                    border: 1px solid #4CAF50;
                    color: #4CAF50;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-family: 'Press Start 2P', cursive;
                    font-size: 8px;
                    transition: all 0.3s ease;
                " onclick="
                    this.closest('#portfolio-analysis-overlay').remove();
                    document.querySelector('#stats-container').style.display = 'block';
                ">BACK TO STATS</button>
                
                <button style="
                    background: rgba(33, 150, 243, 0.2);
                    border: 1px solid #2196F3;
                    color: #2196F3;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-family: 'Press Start 2P', cursive;
                    font-size: 8px;
                    transition: all 0.3s ease;
                " onclick="
                    this.closest('#portfolio-analysis-overlay').remove();
                    gameEnv.game.showPortfolioDashboard();
                ">DETAILED VIEW</button>
            </div>
        `;

        overlay.appendChild(analysisPanel);
        document.body.appendChild(overlay);

        // Close on background click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }
}

export default FinTech; 