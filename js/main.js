/**
 * Main game controller for Fantasy Realm game
 */
class Game {
    constructor() {
        // Initialize game state
        this.lastTick = Date.now();
        this.isRunning = false;
        
        // Create resource manager
        this.resources = new ResourceManager();
        
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
        console.log('Initializing Fantasy Realm game...');
        
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
     * Save game state to local storage
     */
    saveGame() {
        const gameState = {
            resources: this.resources,
            lastSaved: Date.now()
        };
        
        localStorage.setItem('fantasyRealmSave', JSON.stringify(gameState));
        console.log('Game saved!');
    }
    
    /**
     * Load game state from local storage
     */
    loadGame() {
        const savedState = localStorage.getItem('fantasyRealmSave');
        
        if (savedState) {
            try {
                const gameState = JSON.parse(savedState);
                this.resources = gameState.resources;
                console.log('Game loaded!');
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
        localStorage.removeItem('fantasyRealmSave');
        location.reload();
    }
}

// Create and start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
});