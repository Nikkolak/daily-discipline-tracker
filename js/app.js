const STORAGE_KEY = 'daily_discipline_app_v2';

// --- Confetti Effect ---
function runCelebration() {
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 25, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) { return Math.random() * (max - min) + min; }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) { return clearInterval(interval); }
        const particleCount = 40 * (timeLeft / duration);
        
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

// --- Quotes ---
const MOTIVATION_QUOTES = [
    '1% better every day.', 'Progress every day', 'Small steps, big results.', 'Master the basics.', 'Keep moving', 
    'Continuous improvement.', 'Consistency is the key.', 'Focus on the process.', 'Don\'t stop, just improve.', 'Win the day', 
    'Small habits, huge impact.', 'Build, brick by brick.', 'Refine your grind.', 'Never settle for average.', 'The journey is the goal.', 
    'Do. Improve. Repeat.', 'Small wins, big success', 'Commit to yourself.', 'Daily growth', 'You can do it', 
    'Don\'t stop', 'Don\'t quit'
];

// Global shuffle logic
let shuffledQuotes = [];
let currentIndex = 0;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function initQuotes() {
    shuffledQuotes = [...MOTIVATION_QUOTES];
    shuffleArray(shuffledQuotes);
    currentIndex = 0;
}

// --- App Class ---
class DisciplineApp {
    constructor() {
        this.state = {
            userName: null, // User's name
            habits: ['Reading (20m)', 'Workout', 'Deep Work (2h)'],
            currentDay: {}, // Map habitIndex -> boolean
            history: [], 
            winStreak: 0, // New streak counter
            targetDate: null // Target date for tasks
        };
        
        this.init();
    }

    init() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
                // Ensure winStreak exists for legacy data
                if (typeof this.state.winStreak === 'undefined') {
                    this.state.winStreak = this.calculateStreakFromHistory();
                }
                // Initialize targetDate if not present
                if (!this.state.targetDate) {
                    this.state.targetDate = this.getTodayDateString();
                }
            } catch(e) {
                console.error("Data corruption reset");
                this.state.targetDate = this.getTodayDateString();
            }
        } else {
            // First time - set target date to today
            this.state.targetDate = this.getTodayDateString();
        }
        
        // Check if user is registered
        if (!this.state.userName) {
            this.showRegistration();
        } else {
            // Check and archive any missed days
            this.checkAndArchiveMissedDays();
            
            initQuotes(); // Initialize shuffled quotes
            this.render();
            this.setupEnterKey();
            this.updateMotivation();
        }
    }
    
    checkAndArchiveMissedDays() {
        const today = this.getTodayDateString();
        const target = this.state.targetDate;
        
        // If target date is before today, archive missed days
        if (target < today) {
            let currentDate = new Date(target + 'T00:00:00');
            const todayDate = new Date(today + 'T00:00:00');
            
            while (currentDate < todayDate) {
                // Archive this day with current progress
                const stats = this.calculateStats();
                const medal = this.getMedal(stats.count, stats.total);
                const dateShort = currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                
                const entry = {
                    id: Date.now() + Math.random(), // Unique ID
                    date: dateShort,
                    percentage: stats.percentage,
                    medal: medal
                };
                
                this.state.history.unshift(entry);
                
                // Update streak logic
                if (medal === '🥇') {
                    this.state.winStreak++;
                } else {
                    this.state.winStreak = 0;
                }
                
                // Move to next day
                currentDate.setDate(currentDate.getDate() + 1);
                
                // Reset current day tasks for new day
                this.state.currentDay = {};
            }
            
            // Set target date to today
            this.state.targetDate = today;
            this.save();
        }
    }
    
    showRegistration() {
        const modal = document.getElementById('registration-modal');
        modal.classList.remove('hidden');
        
        const input = document.getElementById('user-name-input');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.registerUser();
        });
        input.focus();
    }
    
    registerUser() {
        const input = document.getElementById('user-name-input');
        const name = input.value.trim();
        
        if (!name) {
            this.customAlert('Please enter your name');
            return;
        }
        
        this.state.userName = name;
        this.save();
        
        // Hide registration modal
        const regModal = document.getElementById('registration-modal');
        regModal.classList.add('hidden');
        
        // Show welcome modal
        const welcomeModal = document.getElementById('welcome-modal');
        const welcomeName = document.getElementById('welcome-name');
        welcomeName.textContent = name;
        welcomeModal.classList.remove('hidden');
    }
    
    closeWelcome() {
        const welcomeModal = document.getElementById('welcome-modal');
        welcomeModal.classList.add('hidden');
        
        // Check and archive any missed days
        this.checkAndArchiveMissedDays();
        
        // Initialize app
        initQuotes();
        this.render();
        this.setupEnterKey();
        this.updateMotivation();
    }
    
    getRankInfo() {
        // Count total gold medals
        let goldCount = 0;
        this.state.history.forEach(day => {
            if (day.medal === '🥇') goldCount++;
        });
        
        // Determine rank and color based on gold medals
        let rank = 'Apprentice';
        let color = '#ffffff'; // white
        
        if (goldCount >= 90) {
            rank = 'Master';
            color = '#FFD700'; // gold
        } else if (goldCount >= 30) {
            rank = 'Samurai';
            color = '#C0C0C0'; // silver
        } else if (goldCount >= 10) {
            rank = 'Warrior';
            color = '#CD7F32'; // bronze
        }
        
        return { rank, color, goldCount };
    }
    
    updateUserDisplay() {
        const nameEl = document.getElementById('user-name-display');
        const rankEl = document.getElementById('user-rank-display');
        
        if (nameEl && rankEl && this.state.userName) {
            nameEl.textContent = this.state.userName;
            
            const rankInfo = this.getRankInfo();
            rankEl.textContent = rankInfo.rank;
            rankEl.style.color = rankInfo.color;
        }
    }
    
    getTodayDateString() {
        const today = new Date();
        return today.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    
    isTasksLocked() {
        const today = this.getTodayDateString();
        const target = this.state.targetDate;
        return target > today; // Locked if target date is in the future
    }
    
    formatDate(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    playClickSound() {
        // Create audio context and generate metal click sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const duration = 0.05; // 50ms
        
        // Create oscillator for the click
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Metal click characteristics: short, high-pitched with quick decay
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1500, audioContext.currentTime); // High pitch
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + duration);
        
        // Quick attack and decay for metallic snap
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }


    calculateStreakFromHistory() {
        let streak = 0;
        for (const day of this.state.history) {
            if (day.medal === '🥇') {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }
    
    setupEnterKey() {
        const input = document.getElementById('new-habit-input');
        if(input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addHabit();
            });
        }
    }

    updateMotivation() {
        const quoteEl = document.getElementById('motivation-quote');
        
        // Get next quote
        if (currentIndex >= shuffledQuotes.length) {
            shuffleArray(shuffledQuotes);
            currentIndex = 0;
        }
        
        const nextQuote = shuffledQuotes[currentIndex];
        currentIndex++;
        
        // Simple fade effect
        quoteEl.style.opacity = '0';
        setTimeout(() => {
            quoteEl.textContent = `"${nextQuote}"`;
            quoteEl.style.opacity = '1';
        }, 200);
    }

    // --- Core Logic ---

    addHabit() {
        const input = document.getElementById('new-habit-input');
        const name = input.value.trim();
        if (!name) return;

        this.state.habits.push(name);
        input.value = '';
        this.save();
        this.render();
    }

    deleteHabit(index) {
        this.customConfirm("Remove this habit?", (confirmed) => {
            if (confirmed) {
                this.state.habits.splice(index, 1);
                this.state.currentDay = {}; 
                this.save();
                this.render();
            }
        });
    }

    toggleHabit(index) {
        // Don't allow toggling if tasks are locked
        if (this.isTasksLocked()) {
            this.customAlert('Tasks are locked! Wait until ' + this.formatDate(this.state.targetDate) + ' to continue.');
            return;
        }
        
        // Play metal click sound
        this.playClickSound();
        
        const key = index.toString();
        const wasChecked = this.state.currentDay[key];
        this.state.currentDay[key] = !this.state.currentDay[key];
        
        const stats = this.calculateStats();
        const medal = this.getMedal(stats.count, stats.total);

        // Show victory video when completing all tasks (reaching 100%)
        if (!wasChecked && this.state.currentDay[key] && medal === '🥇') {
            runCelebration();
            setTimeout(() => {
                this.showVictoryVideo();
            }, 500);
        }

        this.updateMotivation();
        this.save();
        this.render();
    }

    showVictoryVideo() {
        const modal = document.getElementById('victory-modal');
        const video = document.getElementById('victory-video');
        const congratsMsg = document.getElementById('congrats-message');
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        video.currentTime = 0;
        video.play();
        
        // Hide congrats message initially
        congratsMsg.classList.add('hidden');
        congratsMsg.classList.remove('flex');
        
        // When video ends, show congratulations and auto-close
        video.onended = () => {
            congratsMsg.classList.remove('hidden');
            congratsMsg.classList.add('flex');
            
            // Auto-close after 3 seconds
            setTimeout(() => {
                this.closeVictoryVideo();
            }, 3000);
        };
    }

    closeVictoryVideo() {
        const modal = document.getElementById('victory-modal');
        const video = document.getElementById('victory-video');
        const congratsMsg = document.getElementById('congrats-message');
        
        video.pause();
        video.currentTime = 0;
        video.onended = null;
        
        congratsMsg.classList.add('hidden');
        congratsMsg.classList.remove('flex');
        
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    calculateStats() {
        const total = this.state.habits.length;
        if (total === 0) return { count: 0, percentage: 0, total: 0 };
        
        let completed = 0;
        this.state.habits.forEach((_, idx) => {
            if (this.state.currentDay[idx]) completed++;
        });

        return {
            count: completed,
            total: total,
            percentage: Math.round((completed / total) * 100)
        };
    }

    getMedal(completed, total) {
        if (total === 0) return null;
        const missed = total - completed;
        
        if (missed === 0) return '🥇'; // Gold (0 missed)
        if (missed === 1) return '🥈'; // Silver (1 missed)
        if (missed === 2) return '🥉'; // Bronze (2 missed)
        return null; // 3+ missed
    }

    archiveDay() {
        // Prevent archiving if locked (future date)
        if (this.isTasksLocked()) {
            this.customAlert('Cannot finish day yet! Wait until ' + this.formatDate(this.state.targetDate));
            return;
        }
        
        const stats = this.calculateStats();
        const medal = this.getMedal(stats.count, stats.total);
        // Short date for grid: e.g. "Jan 1"
        const dateShort = new Date(this.state.targetDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        
        const entry = {
            id: Date.now(),
            date: dateShort,
            percentage: stats.percentage,
            medal: medal
        };

        this.state.history.unshift(entry);
        
        // Update Streak Logic
        if (medal === '🥇') {
            this.state.winStreak++;
        } else {
            this.state.winStreak = 0;
        }

        this.state.currentDay = {};
        
        // Move target date to next day
        const currentDate = new Date(this.state.targetDate);
        currentDate.setDate(currentDate.getDate() + 1);
        this.state.targetDate = currentDate.toISOString().split('T')[0];
        
        this.save();
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    closeCustomConfirm(confirmed) {
        const modal = document.getElementById('custom-confirm-modal');
        
        // Execute callback first if exists
        const callback = this.confirmCallback;
        this.confirmCallback = null;
        
        // Close modal
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        
        // Execute callback after closing
        if (callback) {
            callback(confirmed);
        }
    }

    closeCustomAlert() {
        const modal = document.getElementById('custom-alert-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    customConfirm(message, callback) {
        const modal = document.getElementById('custom-confirm-modal');
        const messageEl = document.getElementById('custom-confirm-message');
        
        if (modal && messageEl) {
            messageEl.textContent = message;
            this.confirmCallback = callback;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    customAlert(message) {
        const modal = document.getElementById('custom-alert-modal');
        const messageEl = document.getElementById('custom-alert-message');
        
        if (modal && messageEl) {
            messageEl.textContent = message;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    resetApp() {
        this.customConfirm("Are you sure? This will delete ALL history and habits.", (confirmed) => {
            if (confirmed) {
                localStorage.removeItem(STORAGE_KEY);
                location.reload();
            }
        });
    }

    openResetModal() {
        const modal = document.getElementById('reset-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            // Reset radio selection
            document.querySelectorAll('input[name="reset-option"]').forEach(radio => {
                radio.checked = false;
            });
        }
    }

    closeResetModal() {
        const modal = document.getElementById('reset-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    selectResetOption(option) {
        const radio = document.getElementById(`reset-${option}`);
        if (radio) {
            radio.checked = true;
        }
    }

    confirmReset() {
        const selectedOption = document.querySelector('input[name="reset-option"]:checked');
        
        if (!selectedOption) {
            this.customAlert('Please select a reset option.');
            return;
        }

        // Close reset modal first
        this.closeResetModal();

        if (selectedOption.value === 'soft') {
            // Reset & Start Again: Keep user name and habits, clear history and statistics
            this.customConfirm('Reset history and statistics? Your name and task cards will be kept.', (confirmed) => {
                if (confirmed) {
                    const userName = this.state.userName;
                    const habits = this.state.habits;
                    this.state = {
                        userName: userName,
                        habits: habits,
                        currentDay: {},
                        history: [],
                        winStreak: 0,
                        targetDate: this.getTodayDateString()
                    };
                    this.save();
                    this.render();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        } else if (selectedOption.value === 'hard') {
            // Clear All Data: Delete everything
            this.customConfirm('⚠️ WARNING: This will delete EVERYTHING including your name. Are you absolutely sure?', (confirmed) => {
                if (confirmed) {
                    localStorage.removeItem(STORAGE_KEY);
                    location.reload();
                }
            });
        }
    }


    calculateTotalSuccessRate() {
        // Calculate average percentage of all history + today's snapshot isn't included in total usually, just history.
        // The user asked "average of all completed days correctly" -> implies history.
        if (this.state.history.length === 0) {
             return 0; // Default if no history
        }
        
        const totalPct = this.state.history.reduce((acc, curr) => acc + curr.percentage, 0);
        const avg = Math.round(totalPct / this.state.history.length);
        return avg;
    }

    // --- Rendering ---

    render() {
        const isLocked = this.isTasksLocked();
        
        // Update user name and rank display
        this.updateUserDisplay();
        
        // 1. Date - always show today's date
        const dateEl = document.getElementById('current-date');
        const today = this.getTodayDateString();
        const formattedDate = this.formatDate(today);
        dateEl.textContent = formattedDate;

        // 2. Habits Grid
        const list = document.getElementById('habit-list');
        list.innerHTML = '';
        
        this.state.habits.forEach((habit, index) => {
            const isChecked = !!this.state.currentDay[index];
            
            const div = document.createElement('div');
            
            // Apply 3D tactile button classes
            const buttonClass = isChecked ? 'task-button pressed' : 'task-button';
            const lockedClass = isLocked ? 'locked opacity-50 cursor-not-allowed' : '';
            
            div.className = `${buttonClass} ${lockedClass} rounded-lg px-3 py-2 flex items-center justify-between group h-10 overflow-hidden`;
            
            const clickHandler = isLocked ? '' : `onclick="app.toggleHabit(${index})"`;
            const cursorClass = isLocked ? '' : 'cursor-pointer';
            
            div.innerHTML = `
                <div class="flex items-center gap-2 overflow-hidden w-full ${cursorClass}" ${clickHandler}>
                     <div class="checkbox-wrapper relative w-3.5 h-3.5 flex-shrink-0 ${cursorClass}">
                        <input type="checkbox" ${isChecked ? 'checked' : ''} ${isLocked ? 'disabled' : ''} class="peer appearance-none w-3.5 h-3.5 rounded transition-colors ${cursorClass} absolute inset-0 opacity-0 z-10">
                        <div class="w-3.5 h-3.5 rounded peer-checked:bg-green-500 transition-colors flex items-center justify-center">
                            <svg class="w-2.5 h-2.5 text-white hidden pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                    </div>
                    <span class="task-text text-sm font-bold uppercase bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-purple-400 truncate select-none">${habit}</span>
                </div>
                <button onclick="event.stopPropagation(); app.deleteHabit(${index})" class="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            `;
            list.appendChild(div);
        });

        // 3. Stats & Progress
        const stats = this.calculateStats();
        const progressBar = document.getElementById('progress-bar');
        progressBar.style.width = `${stats.percentage}%`;
        
        // Color change based on progress
        if (stats.percentage === 100) {
            progressBar.className = 'heated-metal-bar h-2 rounded-full transition-all duration-500 ease-out';
        } else if (stats.percentage >= 80) {
             progressBar.className = 'heated-metal-bar h-2 rounded-full transition-all duration-500 ease-out';
        } else {
             progressBar.className = 'heated-metal-bar h-2 rounded-full transition-all duration-500 ease-out';
        }

        // Medal Logic (Strict: 0 missed = Gold, 1 missed = Silver, 2 missed = Bronze)
        const todayMedalEl = document.getElementById('today-medal');
        const earnedMedal = this.getMedal(stats.count, stats.total);
        
        const shurikenSVG = (colorClass) => `
            <svg class="shuriken ${colorClass}" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style="display: inline-block;">
                <path d="M12 2L13.5 8.5L20 7L15 12L20 17L13.5 15.5L12 22L10.5 15.5L4 17L9 12L4 7L10.5 8.5Z"/>
                <circle class="shuriken-hole" cx="12" cy="12" r="2"/>
            </svg>
        `;
        
        if (earnedMedal) {
            let colorClass = 'gold';
            if (earnedMedal === '🥈') colorClass = 'silver';
            if (earnedMedal === '🥉') colorClass = 'bronze';
            
            todayMedalEl.innerHTML = shurikenSVG(colorClass);
            todayMedalEl.classList.remove('opacity-50', 'grayscale');
            todayMedalEl.classList.add('scale-110');
        } else {
            todayMedalEl.innerHTML = shurikenSVG('gold');
            todayMedalEl.classList.add('opacity-50', 'grayscale');
            todayMedalEl.classList.remove('scale-110');
        }

        // DAILY SUCCESS Indicator Update
        const dailyInd = document.getElementById('daily-success-indicator');
        dailyInd.textContent = `${stats.percentage}%`;
        // Color logic for indicator
        dailyInd.className = 'text-xs font-mono font-bold px-2 py-0.5 rounded border transition-colors duration-300 ml-2 ';
        if (stats.percentage === 100) {
            dailyInd.className += 'bg-green-500/20 text-green-400 border-green-500/50';
        } else if (stats.percentage >= 80) {
            dailyInd.className += 'bg-amber-500/20 text-amber-400 border-amber-500/50';
        } else if (stats.percentage >= 50) {
            dailyInd.className += 'bg-blue-500/20 text-blue-400 border-blue-500/50';
        } else {
            dailyInd.className += 'bg-slate-800 text-slate-400 border-slate-700';
        }

        // 4. Monthly Stats Count
        let golds = 0, silvers = 0, bronzes = 0;
        this.state.history.forEach(day => {
            if (day.medal === '🥇') golds++;
            if (day.medal === '🥈') silvers++;
            if (day.medal === '🥉') bronzes++;
        });
        document.getElementById('stat-gold').textContent = golds;
        document.getElementById('stat-silver').textContent = silvers;
        document.getElementById('stat-bronze').textContent = bronzes;

        // 5. Total Success Rate
        const totalRate = this.calculateTotalSuccessRate();
        const rateBadge = document.getElementById('total-success-badge');
        rateBadge.textContent = `${totalRate}%`;
        
        // Win Streak Update
        const streakBadge = document.getElementById('win-streak-badge');
        streakBadge.textContent = `🔥 ${this.state.winStreak}`;
        if (this.state.winStreak > 0) {
            streakBadge.className = 'inline-flex items-center justify-center rounded-lg font-bold text-xs border shadow-sm transition-colors duration-300 bg-orange-500/10 text-orange-400 border-orange-500/50';
            streakBadge.style.minWidth = '50px';
            streakBadge.style.height = '24px';
            streakBadge.style.padding = '0 8px';
        } else {
            streakBadge.className = 'inline-flex items-center justify-center rounded-lg font-bold text-xs border shadow-sm transition-colors duration-300 bg-slate-800 text-slate-300 border-slate-700';
            streakBadge.style.minWidth = '50px';
            streakBadge.style.height = '24px';
            streakBadge.style.padding = '0 8px';
        }
        
        // Color Code
        rateBadge.className = 'inline-flex items-center justify-center rounded-lg font-bold text-xs border shadow-sm transition-colors duration-300';
        rateBadge.style.minWidth = '50px';
        rateBadge.style.height = '24px';
        rateBadge.style.padding = '0 8px';
        
        if (totalRate === 100) {
            rateBadge.classList.add('bg-lime-500/10', 'text-lime-400', 'border-lime-500/50');
        } else if (totalRate >= 90) {
            rateBadge.classList.add('bg-cyan-500/10', 'text-cyan-400', 'border-cyan-500/50');
        } else if (totalRate >= 80) {
            rateBadge.classList.add('bg-orange-500/10', 'text-orange-400', 'border-orange-500/50');
        } else if (totalRate < 70 && this.state.history.length > 0) {
             rateBadge.classList.add('bg-red-500/10', 'text-red-400', 'border-red-500/50');
        } else {
            // Default / New
            rateBadge.classList.add('bg-slate-800', 'text-slate-300', 'border-slate-700');
        }

        // Disable/Enable Finish Day Button based on lock status
        const finishBtn = document.getElementById('finish-day-btn');
        if (finishBtn) {
            finishBtn.disabled = isLocked;
        }

        // 6. History Grid
        const historyEl = document.getElementById('history-grid');
        historyEl.innerHTML = '';
        
        if (this.state.history.length === 0) {
            historyEl.innerHTML = '<div class="text-center text-slate-500 py-4 italic text-xs w-full">No history yet.</div>';
        } else {
            this.state.history.forEach(day => {
                const cell = document.createElement('div');
                
                // Determine medal color
                let shurikenColor = 'gold';
                
                if (day.medal === '🥇') {
                    shurikenColor = 'gold';
                } else if (day.medal === '🥈') {
                    shurikenColor = 'silver';
                } else if (day.medal === '🥉') {
                    shurikenColor = 'bronze';
                }
                
                cell.className = 'w-9 h-9 rounded-md flex flex-col items-center justify-center cursor-help transition-transform hover:scale-105 relative group shadow-sm';
                cell.style.backgroundImage = "url('assets/images/placeholder.png')";
                cell.style.backgroundSize = "100% 100%";
                cell.style.backgroundRepeat = "no-repeat";
                cell.title = `${day.date}: ${day.percentage}%`;

                const shurikenHTML = day.medal ? `
                    <svg class="shuriken ${shurikenColor}" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L13.5 8.5L20 7L15 12L20 17L13.5 15.5L12 22L10.5 15.5L4 17L9 12L4 7L10.5 8.5Z"/>
                        <circle class="shuriken-hole" cx="12" cy="12" r="2"/>
                    </svg>
                ` : '<span class="text-sm leading-none text-slate-400">-</span>';

                cell.innerHTML = `
                    <span class="text-[10px] absolute -top-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black text-white px-1 rounded z-10">${day.date}</span>
                    <span class="text-sm leading-none flex items-center justify-center">${shurikenHTML}</span>
                    <span class="text-[8px] font-mono leading-none mt-0.5 text-slate-300">${day.percentage}%</span>
                `;
                historyEl.appendChild(cell);
            });
        }
    }
}

// Initialize App
const app = new DisciplineApp();

