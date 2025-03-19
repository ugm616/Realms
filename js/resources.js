/**
 * Manages all game resources and production
 */
class ResourceManager {
    constructor(gameState) {
        this.gameState = gameState;
        
        // Starting resources
        this.resources = {
            food: 100,
            wood: 100,
            stone: 50,
            gold: 25,
            influence: 10
        };
        
        // Base production rates per second
        this.resourceRates = {
            food: 0.5,
            wood: 0.3,
            stone: 0.1,
            gold: 0.05,
            influence: 0.01
        };
        
        // Workers assigned to each resource
        this.workers = {
            farmers: 5,      // Workers that produce food
            woodcutters: 3,
            miners: 2,
            merchants: 1,
            diplomats: 0
        };
        
        // Max workers (upgradeable)
        this.maxWorkers = {
            farmers: 10,
            woodcutters: 10,
            miners: 10,
            merchants: 5,
            diplomats: 3
        };
        
        // Worker production multipliers (upgradeable)
        this.workerEfficiency = {
            farmers: 1.0,
            woodcutters: 1.0,
            miners: 1.0,
            merchants: 1.0,
            diplomats: 1.0
        };
        
        // Special resource chance modifiers
        this.specialResourceChance = {
            goldDiscovery: 0.02, // 2% chance of miners finding gold
            foodSurplus: 0.05,   // 5% chance of farmers producing extra food
        };
        
        // Special resource amount modifiers
        this.specialResourceAmounts = {
            goldDiscoveryMin: 100,
            goldDiscoveryMax: 5000,
            foodSurplusMin: 50,
            foodSurplusMax: 200
        };
        
        // Buildings that affect production
        this.buildings = {
            // Food production buildings
            farms: 1,
            granaries: 0,
            mills: 0,
            
            // Mining buildings
            miningCamps: 0,
            goldRefineries: 0,
            
            // Wood buildings
            sawmills: 0,
            lumberjackLodges: 0,
            
            // Trade buildings
            marketplaces: 0,
            tradingPosts: 0,
            
            // Influence buildings
            embassy: 0,
            palace: 0
        };
        
        // Special events tracker
        this.resourceEvents = [];
        
        // Trade offers system
        this.tradeOffers = [];
    }
    
    /**
     * Update resource production rates based on workers, buildings, etc.
     */
    updateResourceRates() {
        // Calculate food production rate
        this.resourceRates.food = (
            this.workers.farmers * 0.2 * this.workerEfficiency.farmers +
            this.buildings.farms * 0.5 +
            this.buildings.mills * 0.3
        );
        
        // Calculate wood production rate
        this.resourceRates.wood = (
            this.workers.woodcutters * 0.2 * this.workerEfficiency.woodcutters +
            this.buildings.sawmills * 0.4 +
            this.buildings.lumberjackLodges * 0.2
        );
        
        // Calculate stone production rate
        this.resourceRates.stone = (
            this.workers.miners * 0.15 * this.workerEfficiency.miners +
            this.buildings.miningCamps * 0.3
        );
        
        // Calculate gold production rate
        this.resourceRates.gold = (
            this.workers.merchants * 0.1 * this.workerEfficiency.merchants +
            this.buildings.marketplaces * 0.2 +
            this.buildings.tradingPosts * 0.3 +
            this.buildings.goldRefineries * 0.5
        );
        
        // Calculate influence production rate
        this.resourceRates.influence = (
            this.workers.diplomats * 0.05 * this.workerEfficiency.diplomats +
            this.buildings.embassy * 0.1 +
            this.buildings.palace * 0.3
        );
        
        // Apply seasonal effects (if implemented)
        if (this.gameState && this.gameState.season === 'winter') {
            this.resourceRates.food *= 0.7; // Reduced food production in winter
        } else if (this.gameState && this.gameState.season === 'summer') {
            this.resourceRates.food *= 1.2; // Increased food production in summer
        }
        
        // Apply country bonuses (if any)
        if (this.gameState && this.gameState.playerCountry &&
            this.gameState.playerCountry.bonuses) {
            
            for (const resource in this.resourceRates) {
                const bonusKey = resource + 'Production';
                if (this.gameState.playerCountry.bonuses[bonusKey]) {
                    this.resourceRates[resource] *= this.gameState.playerCountry.bonuses[bonusKey];
                }
            }
        }
        
        // Calculate storage capacities
        this.maxStorage = {
            food: 500 + (this.buildings.granaries * 200),
            wood: 500 + (this.buildings.lumberjackLodges * 200),
            stone: 300 + (this.buildings.miningCamps * 150),
            gold: 1000 + (this.buildings.tradingPosts * 500),
            influence: 100 + (this.buildings.embassy * 50)
        };
    }
    
    /**
     * Process resource production for each tick
     */
    processTick(deltaTime) {
        // Convert delta time to seconds
        const seconds = deltaTime / 1000;
        
        // Update resources based on rates
        for (const resource in this.resourceRates) {
            const newAmount = this.resources[resource] + (this.resourceRates[resource] * seconds);
            // Cap resources at maximum storage
            if (this.maxStorage && this.maxStorage[resource]) {
                this.resources[resource] = Math.min(newAmount, this.maxStorage[resource]);
            } else {
                this.resources[resource] = newAmount;
            }
        }
        
        // Process random resource discoveries
        this.processSpecialResourceEvents(seconds);
        
        // Update UI
        this.updateResourceDisplay();
    }
    
    /**
     * Process special resource events like gold discoveries
     */
    processSpecialResourceEvents(seconds) {
        // Clear old events that should be removed from display
        this.resourceEvents = this.resourceEvents.filter(event => Date.now() < event.expires);
        
        // Calculate chance for this tick (scaled by time and worker count)
        const goldDiscoveryChance = this.specialResourceChance.goldDiscovery * seconds * this.workers.miners;
        const foodSurplusChance = this.specialResourceChance.foodSurplus * seconds * this.workers.farmers;
        
        // Check for gold discovery by miners
        if (Math.random() < goldDiscoveryChance) {
            // Calculate gold amount
            const baseAmount = Utils.randomInt(
                this.specialResourceAmounts.goldDiscoveryMin,
                this.specialResourceAmounts.goldDiscoveryMax
            );
            
            // Apply miner efficiency and building bonuses
            const refineryBonus = this.buildings.goldRefineries * 0.2; // Each refinery adds 20% more gold
            const goldAmount = Math.round(baseAmount * (1 + refineryBonus) * this.workerEfficiency.miners);
            
            // Add gold to resources
            this.resources.gold = Math.min(
                this.resources.gold + goldAmount,
                this.maxStorage.gold || Number.MAX_SAFE_INTEGER
            );
            
            // Create event notification
            this.resourceEvents.push({
                type: 'gold-discovery',
                amount: goldAmount,
                message: `Miners discovered ${goldAmount} gold!`,
                expires: Date.now() + 5000 // Show for 5 seconds
            });
            
            // Dispatch event for UI notification
            const event = new CustomEvent('resourceEvent', { 
                detail: {
                    type: 'gold-discovery',
                    amount: goldAmount
                }
            });
            document.dispatchEvent(event);
        }
        
                // Check for food surplus by farmers
        if (Math.random() < foodSurplusChance) {
            // Calculate food amount
            const baseAmount = Utils.randomInt(
                this.specialResourceAmounts.foodSurplusMin,
                this.specialResourceAmounts.foodSurplusMax
            );
            
            // Apply modifiers based on technology and buildings
            let finalAmount = baseAmount;
            
            if (this.gameState.hasResearch('agriculture_efficiency')) {
                finalAmount *= 1.5;
            }
            
            if (this.buildings.farms > 3) {
                finalAmount *= (1 + (this.buildings.farms * 0.1));
            }
            
            // Add food bonus
            const oldFood = this.resources.food;
            this.resources.food += finalAmount;
            
            // Report to event log
            this.gameState.ui.addToEventLog(
                `Your farmers produced a surplus of ${Math.floor(finalAmount)} food!`,
                'success'
            );
            
            // Trigger special notification for substantial surpluses
            if (finalAmount > 50) {
                this.gameState.ui.showNotification(
                    'Bountiful Harvest!',
                    `Your kingdom has experienced an exceptional harvest, yielding ${Math.floor(finalAmount)} extra food.`,
                    'success'
                );
            }
            
            // Update food icon to show the gain
            this.gameState.ui.showResourceGain('food', finalAmount);
        }
        
        // Check for food shortage (if food is critically low)
        if (this.resources.food < 20 && this.workers.farmers >= 3) {
            const foodEmergencyChance = this.specialResourceChances.foodEmergency * 
                (1 - (this.resources.food / 20)); // Higher chance when food is lower
            
            if (Math.random() < foodEmergencyChance) {
                // Emergency food production with penalty
                const emergencyFood = Utils.randomInt(10, 25);
                this.resources.food += emergencyFood;
                
                // But there's a penalty to worker efficiency
                this.workerEfficiency.farmers *= 0.9; // Temporary reduction
                
                // Report to event log
                this.gameState.ui.addToEventLog(
                    `Emergency food measures produced ${emergencyFood} food, but your farmers are exhausted (-10% efficiency).`,
                    'warning'
                );
                
                // Schedule efficiency recovery
                setTimeout(() => {
                    this.workerEfficiency.farmers /= 0.9; // Restore normal efficiency
                    this.gameState.ui.addToEventLog(
                        'Your farmers have recovered from their exhaustion.',
                        'info'
                    );
                }, 60000); // 1 minute penalty
            }
        }
    }
    
    /**
     * Process special resource events for wood production
     * @private
     */
    processWoodEvents() {
        const woodBonusChance = this.calculateResourceEventChance('wood');
        
        // Check for wood bonus from woodcutters
        if (Math.random() < woodBonusChance) {
            const baseAmount = Utils.randomInt(
                this.specialResourceAmounts.woodBonusMin,
                this.specialResourceAmounts.woodBonusMax
            );
            
            // Apply modifiers
            let finalAmount = baseAmount;
            
            if (this.gameState.hasResearch('efficient_logging')) {
                finalAmount *= 1.4;
            }
            
            if (this.buildings.sawmills > 0) {
                finalAmount *= (1 + (this.buildings.sawmills * 0.15));
            }
            
            // Add wood bonus
            this.resources.wood += finalAmount;
            
            // Report to event log
            this.gameState.ui.addToEventLog(
                `Your woodcutters discovered a rich forest area, yielding ${Math.floor(finalAmount)} extra wood!`,
                'success'
            );
            
            // Update wood icon to show the gain
            this.gameState.ui.showResourceGain('wood', finalAmount);
        }
    }
    
    /**
     * Calculate chance of special resource events based on worker count and modifiers
     * @param {string} resourceType - Type of resource (food, wood, etc.)
     * @returns {number} Chance of event (0-1)
     * @private
     */
    calculateResourceEventChance(resourceType) {
        let baseChance = 0;
        let workerCount = 0;
        
        // Get base chance and worker count based on resource type
        switch (resourceType) {
            case 'food':
                baseChance = this.specialResourceChances.foodSurplus;
                workerCount = this.workers.farmers;
                break;
            case 'wood':
                baseChance = this.specialResourceChances.woodBonus;
                workerCount = this.workers.woodcutters;
                break;
            case 'stone':
                baseChance = this.specialResourceChances.stoneBonus;
                workerCount = this.workers.miners;
                break;
            case 'gold':
                baseChance = this.specialResourceChances.goldBonus;
                workerCount = this.workers.merchants;
                break;
            default:
                return 0;
        }
        
        // No workers, no chance
        if (workerCount <= 0) return 0;
        
        // Calculate modified chance based on worker count and efficiency
        const workerEfficiency = this.workerEfficiency[`${resourceType === 'gold' ? 'merchants' : 
                                resourceType === 'stone' ? 'miners' : 
                                resourceType === 'wood' ? 'woodcutters' : 'farmers'}`];
        
        return baseChance * Math.min(1, (workerCount / 10)) * workerEfficiency;
    }
    
    /**
     * Get daily food consumption based on population
     * @returns {number} Daily food consumption
     */
    getDailyFoodConsumption() {
        // Calculate total population
        const totalWorkers = Object.values(this.workers).reduce((sum, count) => sum + count, 0);
        const baseConsumption = totalWorkers * CONFIG.FOOD_PER_WORKER_DAILY;
        
        // Apply modifiers
        let finalConsumption = baseConsumption;
        
        if (this.gameState.hasResearch('efficient_food_distribution')) {
            finalConsumption *= 0.9; // 10% less food consumption
        }
        
        return finalConsumption;
    }
    
    /**
     * Consume daily food and handle starvation if needed
     */
    consumeDailyFood() {
        const consumption = this.getDailyFoodConsumption();
        const oldFood = this.resources.food;
        
        this.resources.food -= consumption;
        
        // Check for starvation
        if (this.resources.food < 0) {
            this.resources.food = 0;
            
            // Calculate severity of starvation
            const deficit = Math.abs(oldFood - consumption);
            const starvationSeverity = deficit / consumption;
            
            // Handle starvation effects
            this.handleStarvation(starvationSeverity);
            
            // Add to event log
            this.gameState.ui.addToEventLog(
                'Your people are starving! Worker efficiency is reduced.',
                'danger'
            );
            
            // Show notification for severe starvation
            if (starvationSeverity > 0.5) {
                this.gameState.ui.showNotification(
                    'Severe Food Shortage!',
                    'Your kingdom is experiencing a severe food shortage. People are starving and worker efficiency is greatly reduced. Prioritize food production immediately!',
                    'danger'
                );
            }
        }
    }
    
    /**
     * Handle effects of starvation
     * @param {number} severity - Severity of starvation (0-1)
     */
    handleStarvation(severity) {
        // Reduce worker efficiency based on starvation severity
        const efficiencyPenalty = Math.min(0.8, severity);
        
        for (const workerType in this.workerEfficiency) {
            this.workerEfficiency[workerType] *= (1 - efficiencyPenalty);
        }
        
        // Severe starvation can cause population loss
        if (severity > 0.7 && Math.random() < severity - 0.3) {
            // Find worker type with most workers
            let maxWorkerType = null;
            let maxWorkers = 0;
            
            for (const workerType in this.workers) {
                if (this.workers[workerType] > maxWorkers) {
                    maxWorkers = this.workers[workerType];
                    maxWorkerType = workerType;
                }
            }
            
            // Remove workers due to starvation
            if (maxWorkerType && this.workers[maxWorkerType] > 1) {
                const lostWorkers = Math.ceil(this.workers[maxWorkerType] * 0.1);
                this.workers[maxWorkerType] -= lostWorkers;
                
                this.gameState.ui.addToEventLog(
                    `${lostWorkers} ${maxWorkerType} have perished due to starvation!`,
                    'danger'
                );
            }
        }
    }
    
    /**
     * Check for and handle food recovery after starvation
     */
    checkFoodRecovery() {
        // Check if we have enough food now
        if (this.resources.food > this.getDailyFoodConsumption() * 3) {
            // Recover worker efficiency gradually
            for (const workerType in this.workerEfficiency) {
                if (this.workerEfficiency[workerType] < 1) {
                    this.workerEfficiency[workerType] = Math.min(1, this.workerEfficiency[workerType] + 0.05);
                }
            }
            
            // If all efficiencies are restored
            if (Object.values(this.workerEfficiency).every(eff => eff >= 0.99)) {
                this.gameState.ui.addToEventLog(
                    'Your people have recovered from the food shortage.',
                    'success'
                );
                
                // Fully restore all efficiencies to exactly 1.0
                for (const workerType in this.workerEfficiency) {
                    this.workerEfficiency[workerType] = 1.0;
                }
            }
        }
    }
}