/**
 * Resource management for Fantasy Realm game
 */
class ResourceManager {
    constructor(gameState) {
        this.gameState = gameState;
        
        // Initialize resources
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
            farmers: 5,
            woodcutters: 3,
            miners: 2,
            merchants: 1,
            diplomats: 0
        };
        
        // Worker production multipliers
        this.workerEfficiency = {
            farmers: 1.0,
            woodcutters: 1.0,
            miners: 1.0,
            merchants: 1.0,
            diplomats: 1.0
        };
        
        // Buildings that affect production
        this.buildings = {
            farms: 1,
            sawmills: 0,
            mines: 0,
            markets: 0,
            embassies: 0
        };
        
        // Special resource discovery chances and amounts
        this.specialResourceChances = {
            foodSurplus: 0.01,    // 1% chance per tick for food surplus
            woodBonus: 0.01,      // 1% chance per tick for wood bonus
            stoneBonus: 0.01,     // 1% chance per tick for stone bonus
            goldBonus: 0.02,      // 2% chance per tick for gold discovery
            foodEmergency: 0.05   // 5% chance when food is low
        };
        
        this.specialResourceAmounts = {
            foodSurplusMin: 20,
            foodSurplusMax: 100,
            woodBonusMin: 15,
            woodBonusMax: 80,
            stoneBonusMin: 10,
            stoneBonusMax: 50,
            goldBonusMin: 100,
            goldBonusMax: 5000
        };
        
        // Last processed time for daily events
        this.lastDailyCheck = Date.now();
    }
    
    /**
     * Update resource production rates based on workers, buildings, etc.
     */
    updateResourceRates() {
        // Calculate food production rate
        this.resourceRates.food = (
            this.workers.farmers * 0.2 * this.workerEfficiency.farmers +
            this.buildings.farms * 0.5
        );
        
        // Calculate wood production rate
        this.resourceRates.wood = (
            this.workers.woodcutters * 0.15 * this.workerEfficiency.woodcutters +
            this.buildings.sawmills * 0.4
        );
        
        // Calculate stone production rate
        this.resourceRates.stone = (
            this.workers.miners * 0.1 * this.workerEfficiency.miners +
            this.buildings.mines * 0.3
        );
        
        // Calculate gold production rate
        this.resourceRates.gold = (
            this.workers.merchants * 0.08 * this.workerEfficiency.merchants +
            this.buildings.markets * 0.25
        );
        
        // Calculate influence production rate
        this.resourceRates.influence = (
            this.workers.diplomats * 0.05 * this.workerEfficiency.diplomats +
            this.buildings.embassies * 0.2
        );
        
        // Apply seasonal effects or other modifiers if implemented later
        
        // Update UI with new rates
        this.updateResourceDisplay();
    }
    
    /**
     * Process resource production for the current tick
     * @param {number} deltaTime - Time elapsed since last tick in ms
     */
    processTick(deltaTime) {
        // Convert delta time to seconds
        const seconds = deltaTime / 1000;
        
        // Update resources based on rates
        for (const resource in this.resourceRates) {
            this.resources[resource] += this.resourceRates[resource] * seconds;
            
            // Round to 2 decimal places to avoid floating point issues
            this.resources[resource] = Math.round(this.resources[resource] * 100) / 100;
        }
        
        // Process special resource events
        this.processSpecialResourceEvents();
        
        // Check for daily events (food consumption)
        this.checkDailyEvents();
        
        // Update UI
        this.updateResourceDisplay();
    }
    
    /**
     * Process special resource events (discoveries, bonuses, etc.)
     */
    processSpecialResourceEvents() {
        // Process miners finding gold (2% chance)
        if (this.workers.miners > 0) {
            const goldDiscoveryChance = this.specialResourceChances.goldBonus * 
                (1 + (this.workers.miners / 10)); // More miners slightly increases chance
                
            if (Math.random() < goldDiscoveryChance) {
                const baseAmount = Utils.randomInt(
                    this.specialResourceAmounts.goldBonusMin,
                    this.specialResourceAmounts.goldBonusMax
                );
                
                // Apply modifiers based on buildings and technology
                let finalAmount = baseAmount;
                
                if (this.buildings.mines > 2) {
                    finalAmount *= (1 + (this.buildings.mines * 0.1));
                }
                
                // Add gold bonus
                this.resources.gold += finalAmount;
                
                // Report to event log if UI exists
                if (this.gameState && this.gameState.ui) {
                    this.gameState.ui.addToEventLog(
                        `Your miners discovered gold worth ${Math.floor(finalAmount)} gold!`,
                        'success'
                    );
                    
                    // For large gold discoveries, show a special notification
                    if (finalAmount > 1000) {
                        this.gameState.ui.showNotification(
                            'Major Gold Discovery!',
                            `Your miners have struck a major gold vein worth ${Math.floor(finalAmount)} gold!`,
                            'success'
                        );
                    }
                    
                    // Update gold icon to show the gain
                    this.gameState.ui.showResourceGain('gold', finalAmount);
                }
            }
        }
        
        // Process food surplus events
        this.processFoodEvents();
        
        // Process wood bonus events
        this.processWoodEvents();
        
        // Process stone bonus events
        this.processStoneEvents();
    }
    
    /**
     * Process special resource events for food production
     * @private
     */
    processFoodEvents() {
        const foodSurplusChance = this.calculateResourceEventChance('food');
        
        // Check for food surplus by farmers
        if (Math.random() < foodSurplusChance) {
            // Calculate food amount
            const baseAmount = Utils.randomInt(
                this.specialResourceAmounts.foodSurplusMin,
                this.specialResourceAmounts.foodSurplusMax
            );
            
            // Apply modifiers based on technology and buildings
            let finalAmount = baseAmount;
            
            if (this.gameState && this.gameState.hasResearch && 
                this.gameState.hasResearch('agriculture_efficiency')) {
                finalAmount *= 1.5;
            }
            
            if (this.buildings.farms > 3) {
                finalAmount *= (1 + (this.buildings.farms * 0.1));
            }
            
            // Add food bonus
            const oldFood = this.resources.food;
            this.resources.food += finalAmount;
            
            // Report to event log
            if (this.gameState && this.gameState.ui) {
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
                if (this.gameState && this.gameState.ui) {
                    this.gameState.ui.addToEventLog(
                        `Emergency food measures produced ${emergencyFood} food, but your farmers are exhausted (-10% efficiency).`,
                        'warning'
                    );
                }
                
                // Schedule efficiency recovery
                setTimeout(() => {
                    this.workerEfficiency.farmers /= 0.9; // Restore normal efficiency
                    if (this.gameState && this.gameState.ui) {
                        this.gameState.ui.addToEventLog(
                            'Your farmers have recovered from their exhaustion.',
                            'info'
                        );
                    }
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
            
            if (this.gameState && this.gameState.hasResearch && 
                this.gameState.hasResearch('efficient_logging')) {
                finalAmount *= 1.4;
            }
            
            if (this.buildings.sawmills > 0) {
                finalAmount *= (1 + (this.buildings.sawmills * 0.15));
            }
            
            // Add wood bonus
            this.resources.wood += finalAmount;
            
            // Report to event log
            if (this.gameState && this.gameState.ui) {
                this.gameState.ui.addToEventLog(
                    `Your woodcutters discovered a rich forest area, yielding ${Math.floor(finalAmount)} extra wood!`,
                    'success'
                );
                
                // Update wood icon to show the gain
                this.gameState.ui.showResourceGain('wood', finalAmount);
            }
        }
    }
    
    /**
     * Process special resource events for stone production
     * @private
     */
    processStoneEvents() {
        const stoneBonusChance = this.calculateResourceEventChance('stone');
        
        // Check for stone bonus from miners
        if (Math.random() < stoneBonusChance) {
            const baseAmount = Utils.randomInt(
                this.specialResourceAmounts.stoneBonusMin,
                this.specialResourceAmounts.stoneBonusMax
            );
            
            // Apply modifiers
            let finalAmount = baseAmount;
            
            if (this.gameState && this.gameState.hasResearch && 
                this.gameState.hasResearch('advanced_mining')) {
                finalAmount *= 1.4;
            }
            
            if (this.buildings.mines > 0) {
                finalAmount *= (1 + (this.buildings.mines * 0.15));
            }
            
            // Add stone bonus
            this.resources.stone += finalAmount;
            
            // Report to event log
            if (this.gameState && this.gameState.ui) {
                this.gameState.ui.addToEventLog(
                    `Your miners discovered a rich stone vein, yielding ${Math.floor(finalAmount)} extra stone!`,
                    'success'
                );
                
                // Update stone icon to show the gain
                this.gameState.ui.showResourceGain('stone', finalAmount);
            }
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
     * Check time-based daily events (like food consumption)
     */
    checkDailyEvents() {
        const now = Date.now();
        // Once per game day (1 minute in real time)
        if (now - this.lastDailyCheck > 60000) {
            this.lastDailyCheck = now;
            
            // Consume daily food
            this.consumeDailyFood();
            
            // Check food recovery
            this.checkFoodRecovery();
        }
    }
    
    /**
     * Get daily food consumption based on population
     * @returns {number} Daily food consumption
     */
    getDailyFoodConsumption() {
        // Calculate total population
        const totalWorkers = Object.values(this.workers).reduce((sum, count) => sum + count, 0);
        const baseConsumption = totalWorkers * (CONFIG.FOOD_PER_WORKER_DAILY || 2);
        
        // Apply modifiers
        let finalConsumption = baseConsumption;
        
        if (this.gameState && this.gameState.hasResearch && 
            this.gameState.hasResearch('efficient_food_distribution')) {
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
            if (this.gameState && this.gameState.ui) {
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
                
                if (this.gameState && this.gameState.ui) {
                    this.gameState.ui.addToEventLog(
                        `${lostWorkers} ${maxWorkerType} have perished due to starvation!`,
                        'danger'
                    );
                }
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
                if (this.gameState && this.gameState.ui) {
                    this.gameState.ui.addToEventLog(
                        'Your people have recovered from the food shortage.',
                        'success'
                    );
                }
                
                // Fully restore all efficiencies to exactly 1.0
                for (const workerType in this.workerEfficiency) {
                    this.workerEfficiency[workerType] = 1.0;
                }
            }
        }
    }
    
    /**
     * Update the UI to display current resources and rates
     */
    updateResourceDisplay() {
        // Skip if UI not initialized or if we're in a headless test
        if (!this.gameState || !this.gameState.ui) return;
        
        // Update each resource display
        for (const resource in this.resources) {
            const resourceElement = document.getElementById(`${resource}-value`);
            const rateElement = document.getElementById(`${resource}-rate`);
            
            if (resourceElement) {
                resourceElement.textContent = Math.floor(this.resources[resource]);
            }
            
            if (rateElement) {
                const rate = this.resourceRates[resource];
                rateElement.textContent = `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}/s`;
                
                // Add color class based on rate
                rateElement.className = 'resource-rate';
                if (rate > 0) rateElement.classList.add('positive');
                if (rate < 0) rateElement.classList.add('negative');
            }
        }
        
        // Update worker counts
        for (const workerType in this.workers) {
            const workerCountElement = document.getElementById(`${workerType}-count`);
            if (workerCountElement) {
                workerCountElement.textContent = this.workers[workerType];
            }
        }
    }
    
    /**
     * Add or remove workers of a specific type
     * @param {string} workerType - Type of worker
     * @param {number} amount - Positive or negative amount to adjust
     * @returns {boolean} Success of the operation
     */
    adjustWorkers(workerType, amount) {
        // Check if valid worker type
        if (!(workerType in this.workers)) return false;
        
        // Try to adjust workers
        const newCount = this.workers[workerType] + amount;
        
        // Cannot go below 0
        if (newCount < 0) return false;
        
        // Apply the change
        this.workers[workerType] = newCount;
        
        // Update resource rates based on new worker distribution
        this.updateResourceRates();
        
        return true;
    }
    
    /**
     * Calculate total worker count
     * @returns {number} Total workers
     */
    getTotalWorkers() {
        return Object.values(this.workers).reduce((sum, count) => sum + count, 0);
    }
    
    /**
     * Check if player has enough resources
     * @param {Object} cost - Map of resource costs
     * @returns {boolean} True if player has enough resources
     */
    hasEnoughResources(cost) {
        for (const resource in cost) {
            if (this.resources[resource] < cost[resource]) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Deduct resources from player's supply
     * @param {Object} cost - Map of resource costs
     * @returns {boolean} True if deduction was successful
     */
    deductResources(cost) {
        if (!this.hasEnoughResources(cost)) return false;
        
        for (const resource in cost) {
            this.resources[resource] -= cost[resource];
        }
        
        // Update UI
        this.updateResourceDisplay();
        return true;
    }
    
    /**
     * Add a building of specific type
     * @param {string} buildingType - Type of building to add
     * @returns {boolean} Success of the operation
     */
    addBuilding(buildingType) {
        // Check if valid building type
        if (!(buildingType in this.buildings)) return false;
        
        // Increment building count
        this.buildings[buildingType]++;
        
        // Update resource rates
        this.updateResourceRates();
        
        return true;
    }
    
    /**
     * Get trade value of resources for diplomacy
     * @returns {Object} Value mapping for each resource
     */
    getTradeValues() {
        return {
            food: 1,
            wood: 2,
            stone: 3,
            gold: 5,
            influence: 10
        };
    }
    
    /**
     * Trade resources with another country
     * @param {Object} give - Resources to give
     * @param {Object} receive - Resources to receive
     * @returns {boolean} Success of the trade
     */
    tradeResources(give, receive) {
        // Check if we have enough to give
        if (!this.hasEnoughResources(give)) return false;
        
        // Process the trade
        for (const resource in give) {
            this.resources[resource] -= give[resource];
        }
        
        for (const resource in receive) {
            this.resources[resource] += receive[resource];
        }
        
        // Update UI
        this.updateResourceDisplay();
        
        return true;
    }
}