/**
 * Resource management system for Fantasy Realm game
 */
class ResourceManager {
    constructor() {
        this.resources = {};
        this.workers = {};
        
        // Initialize resources
        CONFIG.RESOURCE_TYPES.forEach(resource => {
            this.resources[resource.id] = {
                amount: 0,
                rate: 0,
                baseProduction: 0,
                upgrades: 0,
                multiplier: 1
            };
        });
        
        // Initialize workers
        CONFIG.WORKER_TYPES.forEach(worker => {
            this.workers[worker.id] = {
                count: 0,
                efficiency: 1,
                baseProduction: worker.baseProduction,
                resourceType: worker.resource
            };
        });
        
        // Starting resources
        this.resources.gold.amount = CONFIG.STARTING_GOLD;
        this.resources.food.amount = 100;
        this.resources.wood.amount = 50;
    }
    
    /**
     * Assign workers to a specific worker type
     */
    assignWorkers(workerType, count) {
        // Make sure we have the worker type
        if (!this.workers[workerType]) {
            console.error(`Worker type ${workerType} does not exist`);
            return false;
        }
        
        const currentCount = this.workers[workerType].count;
        const delta = count - currentCount;
        
        // Check if we have enough idle population
        if (delta > 0) {
            const idlePopulation = this.getIdlePopulation();
            if (delta > idlePopulation) {
                console.error(`Not enough idle population to assign ${delta} workers`);
                return false;
            }
        }
        
        this.workers[workerType].count = count;
        this.updateResourceRates();
        return true;
    }
    
    /**
     * Get the current idle population
     */
    getIdlePopulation() {
        const totalPopulation = this.getTotalPopulation();
        const assignedWorkers = Object.values(this.workers)
            .reduce((sum, worker) => sum + worker.count, 0);
        
        return totalPopulation - assignedWorkers;
    }
    
    /**
     * Get the total population
     */
    getTotalPopulation() {
        // For now, return a fixed value. Later this will be calculated based on game progress
        return 100;
    }
    
    /**
     * Update the production rates for all resources
     */
    updateResourceRates() {
        // Reset all rates
        Object.keys(this.resources).forEach(resourceId => {
            this.resources[resourceId].rate = 0;
        });
        
        // Calculate production from workers
        Object.keys(this.workers).forEach(workerId => {
            const worker = this.workers[workerId];
            const resourceId = worker.resourceType;
            
            if (this.resources[resourceId]) {
                const production = worker.count * worker.baseProduction * worker.efficiency;
                this.resources[resourceId].rate += production;
            }
        });
        
        // Apply multipliers
        Object.keys(this.resources).forEach(resourceId => {
            this.resources[resourceId].rate *= this.resources[resourceId].multiplier;
        });
    }
    
    /**
     * Process resource production for one tick
     */
    processTick(deltaTime) {
        const timeInMinutes = deltaTime / 60000; // Convert ms to minutes
        
        // Update all resources based on their production rate
        Object.keys(this.resources).forEach(resourceId => {
            const resource = this.resources[resourceId];
            resource.amount += resource.rate * timeInMinutes;
        });
        
        // Update UI
        this.updateResourceDisplay();
    }
    
    /**
     * Update the resource display in the UI
     */
    updateResourceDisplay() {
        // Update gold in header
        document.getElementById('gold-amount').textContent = Utils.formatNumber(Math.floor(this.resources.gold.amount));
        
        // Update resource panel
        CONFIG.RESOURCE_TYPES.forEach(resourceType => {
            const resourceElement = document.getElementById(resourceType.id);
            if (resourceElement) {
                const amountElement = resourceElement.querySelector('.resource-amount');
                const rateElement = resourceElement.querySelector('.resource-rate');
                
                if (amountElement) {
                    amountElement.textContent = Utils.formatNumber(Math.floor(this.resources[resourceType.id].amount));
                }
                
                if (rateElement) {
                    const rate = this.resources[resourceType.id].rate;
                    rateElement.textContent = rate > 0 ? `+${rate.toFixed(1)}/min` : `${rate.toFixed(1)}/min`;
                    rateElement.style.color = rate >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
                }
            }
        });
        
        // Update worker counts and population info
        document.getElementById('total-population').textContent = this.getTotalPopulation();
        document.getElementById('idle-population').textContent = this.getIdlePopulation();
        
        Object.keys(this.workers).forEach(workerId => {
            const workerCountElement = document.getElementById(`${workerId}-count`);
            if (workerCountElement) {
                workerCountElement.textContent = this.workers[workerId].count;
            }
        });
    }
    
    /**
     * Check if we can afford a specific cost
     */
    canAfford(cost) {
        for (const resourceId in cost) {
            if (!this.resources[resourceId] || this.resources[resourceId].amount < cost[resourceId]) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Spend resources based on cost object
     */
    spendResources(cost) {
        if (!this.canAfford(cost)) {
            return false;
        }
        
        for (const resourceId in cost) {
            this.resources[resourceId].amount -= cost[resourceId];
        }
        
        this.updateResourceDisplay();
        return true;
    }
}