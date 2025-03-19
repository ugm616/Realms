/**
 * Main game controller for Fantasy Realm game
 */
class Game {
    constructor() {
        console.log('Initializing Fantasy Realm game...');
        
        // Initialize game state
        this.lastTick = Date.now();
        this.isRunning = false;
        
        // Create resource manager with game state reference
        this.resources = new ResourceManager(this);
        
        // Create map with game state reference
        this.map = new WorldMap('world-map', this);
        
        // Create diplomacy manager
        this.diplomacy = new DiplomacyManager(this);
        
        // Create UI manager
        this.ui = new UIManager(this);
        
        // Start the game
        this.initialize();
    }
    
    /**
     * Initialize the game
     */
    initialize() {
        console.log('Setting up game systems...');
        
        // Initialize map and generate countries
        this.map.initialize();
        
        // Initialize diplomatic relationships
        this.diplomacy.initializeRelationships(this.map.countries);
        
        // Set initial resource production rates
        this.resources.updateResourceRates();
        
        // Update UI with initial values
        this.resources.updateResourceDisplay();
        
        // Start game loop
        this.start();
        
        console.log('Game initialized!');
    }
    
    /**
     * Start the game loop
     */
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTick = Date.now();
            requestAnimationFrame(() => this.gameLoop());
            console.log('Game started!');
        }
    }
    
    /**
     * Pause the game
     */
    pause() {
        this.isRunning = false;
    }
    
    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        const now = Date.now();
        const deltaTime = now - this.lastTick;
        
        // Only process game logic at the configured tick rate
        if (deltaTime >= CONFIG.TICK_RATE) {
            this.processTick(deltaTime);
            this.lastTick = now;
        }
        
        // Schedule next frame
        requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Process one game tick
     */
    processTick(deltaTime) {
        // Process resource production
        this.resources.processTick(deltaTime);
        
        // Process AI diplomatic actions (less frequently)
        if (Math.random() < 0.05) { // 5% chance each tick
            this.diplomacy.processAIDiplomacy();
        }
    }
    
    /**
     * Check if research has been completed
     */
    hasResearch(researchId) {
        // Will be implemented with research system
        return false;
    }
    
    /**
     * Save game state to local storage
     */
    saveGame() {
        try {
            const gameState = {
                resources: {
                    resources: this.resources.resources,
                    resourceRates: this.resources.resourceRates,
                    workers: this.resources.workers,
                    buildings: this.resources.buildings
                },
                lastSaved: Date.now()
            };
            
            localStorage.setItem('fantasyRealmSave', JSON.stringify(gameState));
            console.log('Game saved!');
            
            if (this.ui) {
                this.ui.addToEventLog('Game saved successfully.', 'info');
            }
            
            return true;
        } catch (e) {
            console.error('Error saving game:', e);
            return false;
        }
    }
    
    /**
     * Load game state from local storage
     */
    loadGame() {
        const savedState = localStorage.getItem('fantasyRealmSave');
        
        if (savedState) {
            try {
                const gameState = JSON.parse(savedState);
                
                // Load resources
                if (gameState.resources) {
                    this.resources.resources = gameState.resources.resources;
                    this.resources.resourceRates = gameState.resources.resourceRates;
                    this.resources.workers = gameState.resources.workers;
                    this.resources.buildings = gameState.resources.buildings;
                }
                
                // Update UI
                this.resources.updateResourceDisplay();
                
                console.log('Game loaded!');
                
                if (this.ui) {
                    this.ui.addToEventLog('Game loaded successfully.', 'info');
                }
                
                return true;
            } catch (e) {
                console.error('Error loading saved game:', e);
                return false;
            }
        }
        
        return false;
    }
    
    /**
     * Reset game state
     */
    resetGame() {
        const confirmed = confirm('Are you sure you want to reset the game? All progress will be lost.');
        
        if (confirmed) {
            localStorage.removeItem('fantasyRealmSave');
            location.reload();
        }
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+S to save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveGame();
            }
            
            // Ctrl+L to load
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                this.loadGame();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                const modalContainer = document.getElementById('modal-container');
                if (modalContainer && !modalContainer.classList.contains('hidden')) {
                    modalContainer.classList.add('hidden');
                }
            }
        });
    }
    
    /**
     * Add event listeners for main game actions
     */
    addEventListeners() {
        // Menu buttons (if we add them later)
        document.getElementById('save-game')?.addEventListener('click', () => this.saveGame());
        document.getElementById('load-game')?.addEventListener('click', () => this.loadGame());
        document.getElementById('reset-game')?.addEventListener('click', () => this.resetGame());
        
        // Add keyboard shortcuts
        this.setupKeyboardShortcuts();
    }
}

// Create and start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Make sure CONFIG is defined
    if (typeof CONFIG === 'undefined') {
        console.error('CONFIG is not defined! Make sure config.js is loaded before main.js');
        
        // Create a minimal default config
        window.CONFIG = {
            TICK_RATE: 1000,
            MAP_WIDTH: 2000,
            MAP_HEIGHT: 1500,
            COUNTRY_COUNT: 40,
            FOOD_PER_WORKER_DAILY: 2,
            AI_DIPLOMACY_COOLDOWN: 60000,
            DIPLOMATIC_OFFER_DURATION: 60000 * 3
        };
    }
    
    // Create utils if not defined
    if (typeof Utils === 'undefined') {
        console.error('Utils is not defined! Adding minimal implementation');
        
        window.Utils = {
            randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
            randomFloat: (min, max) => Math.random() * (max - min) + min,
            distance: (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
            chance: (probability) => Math.random() < probability,
            randomChoice: (array) => array[Math.floor(Math.random() * array.length)],
            generateCountryName: () => {
                const prefixes = ['North', 'South', 'East', 'West', 'New', 'Old', 'Great'];
                const roots = ['land', 'dom', 'topia', 'gard', 'mark', 'stan', 'vania', 'nia', 'ria'];
                const randomPrefix = Math.random() > 0.5 ? prefixes[Math.floor(Math.random() * prefixes.length)] : '';
                const root = 'Realm' + roots[Math.floor(Math.random() * roots.length)];
                return randomPrefix ? `${randomPrefix} ${root}` : root;
            },
            randomColor: () => {
                // Generate a random color appropriate for a country
                const hue = Math.floor(Math.random() * 360);
                const saturation = 40 + Math.floor(Math.random() * 30);
                const lightness = 40 + Math.floor(Math.random() * 20);
                return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            }
        };
    }
    
    window.gameInstance = new Game();
});