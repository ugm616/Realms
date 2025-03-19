/**
 * Country class for Fantasy Realm game
 */
class Country {
    constructor(id, name, options = {}) {
        this.id = id;
        this.name = name || Utils.generateCountryName();
        this.color = options.color || Utils.randomColor();
        
        // Map position and size
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.size = options.size || Utils.randomInt(5, 10); // Will determine visual size and power
        
        // Resources and specialties
        this.resources = {};
        CONFIG.RESOURCE_TYPES.forEach(resource => {
            // Base value with slight randomization
            const baseValue = Utils.randomFloat(0.7, 1.3);
            
            // Check if this country has an abundance of this resource
            const hasAbundance = Utils.chance(CONFIG.RESOURCE_DISTRIBUTION.ABUNDANCE_CHANCE);
            const multiplier = hasAbundance ? CONFIG.RESOURCE_DISTRIBUTION.ABUNDANCE_MULTIPLIER : 1;
            
            this.resources[resource.id] = {
                production: baseValue * multiplier,
                abundance: hasAbundance,
                amount: hasAbundance ? Utils.randomInt(50, 200) : Utils.randomInt(10, 50)
            };
        });
        
        // Personality traits
        this.traits = this.generateTraits();
        
        // Military strength
        this.army = {
            size: Utils.randomInt(10, 100),
            power: Utils.randomFloat(0.8, 1.2),
            training: Utils.randomFloat(0.8, 1.2)
        };
        
        // Diplomatic relations (will be populated by the diplomacy manager)
        this.relations = {};
        
        // Is this the player's country?
        this.isPlayer = options.isPlayer || false;
    }
    
    /**
     * Generate personality traits for the country
     */
    generateTraits() {
        const traits = {
            warlike: Utils.chance(CONFIG.COUNTRY_TRAITS.WARLIKE),
            trader: Utils.chance(CONFIG.COUNTRY_TRAITS.TRADER),
            diplomatic: Utils.chance(CONFIG.COUNTRY_TRAITS.DIPLOMATIC),
            isolationist: Utils.chance(CONFIG.COUNTRY_TRAITS.ISOLATIONIST)
        };
        
        // Ensure at least one trait is true
        if (!Object.values(traits).some(value => value)) {
            const traitKeys = Object.keys(traits);
            traits[Utils.randomChoice(traitKeys)] = true;
        }
        
        return traits;
    }
    
    /**
     * Calculate the military power of the country
     */
    getMilitaryPower() {
        return this.army.size * this.army.power * this.army.training;
    }
    
    /**
     * Get the country's diplomatic stance toward another country
     */
    getStanceToward(countryId) {
        if (!this.relations[countryId]) {
            return 'neutral';
        }
        
        const friendshipLevel = this.relations[countryId].friendship;
        
        if (friendshipLevel >= CONFIG.DIPLOMACY.ALLIANCE_THRESHOLD) {
            return 'allied';
        } else if (friendshipLevel <= CONFIG.DIPLOMACY.WAR_THRESHOLD) {
            return 'hostile';
        } else if (friendshipLevel > 50) {
            return 'friendly';
        } else if (friendshipLevel < 0) {
            return 'unfriendly';
        } else {
            return 'neutral';
        }
    }
    
    /**
     * Process country AI decisions (for non-player countries)
     */
    processAI(gameState) {
        if (this.isPlayer) return; // Skip AI processing for player country
        
        // Trade decisions
        this.makeTradeDecisions(gameState);
        
        // Diplomatic decisions
        this.makeDiplomaticDecisions(gameState);
        
        // Military decisions
        this.makeMilitaryDecisions(gameState);
    }
    
    /**
     * AI Trade decisions
     */
    makeTradeDecisions(gameState) {
        // Example implementation:
        // If country is a trader, try to trade resources they have abundance of
        if (this.traits.trader) {
            // Find resources with abundance
            const abundantResources = Object.keys(this.resources)
                .filter(resourceId => this.resources[resourceId].abundance);
            
            if (abundantResources.length > 0) {
                // Find countries to trade with
                gameState.countries.forEach(country => {
                    // Skip self and countries at war
                    if (country.id === this.id || this.getStanceToward(country.id) === 'hostile') {
                        return;
                    }
                    
                    // Consider offering trade
                    // (Implementation will be expanded in diplomacy.js)
                });
            }
        }
    }
    
    /**
     * AI Diplomatic decisions
     */
    makeDiplomaticDecisions(gameState) {
        // Implementation will be expanded in diplomacy.js
    }
    
    /**
     * AI Military decisions
     */
    makeMilitaryDecisions(gameState) {
        // Implementation will be expanded in future development
    }
    
    /**
     * Returns a summary of the country for UI display
     */
    getSummary() {
        const powerLevel = this.getMilitaryPower();
        let powerDescription;
        
        if (powerLevel < 50) powerDescription = "Weak";
        else if (powerLevel < 100) powerDescription = "Moderate";
        else if (powerLevel < 200) powerDescription = "Strong";
        else powerDescription = "Formidable";
        
        // Find strongest resources
        const strongestResources = Object.keys(this.resources)
            .filter(id => this.resources[id].abundance)
            .map(id => {
                const resourceInfo = CONFIG.RESOURCE_TYPES.find(r => r.id === id);
                return resourceInfo ? resourceInfo.name : id;
            });
        
        // Get personality traits
        const activeTraits = Object.keys(this.traits)
            .filter(trait => this.traits[trait])
            .map(trait => trait.charAt(0).toUpperCase() + trait.slice(1));
        
        return {
            name: this.name,
            color: this.color,
            powerDescription: powerDescription,
            armySize: this.army.size,
            strongestResources: strongestResources,
            traits: activeTraits
        };
    }
}