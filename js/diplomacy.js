/**
 * Diplomacy system for Fantasy Realm game
 */
class DiplomacyManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.relationships = {};
        this.alliances = [];
        this.wars = [];
        
        // Initialize event listeners
        this.initializeEventListeners();
    }
    
    /**
     * Initialize diplomatic relationships between all countries
     */
    initializeRelationships(countries) {
        countries.forEach(country1 => {
            if (!this.relationships[country1.id]) {
                this.relationships[country1.id] = {};
            }
            
            countries.forEach(country2 => {
                if (country1.id !== country2.id) {
                    // Initialize with slight randomness but generally neutral
                    const initialValue = Utils.randomInt(
                        CONFIG.DIPLOMACY.INITIAL_FRIENDSHIP_MIN, 
                        CONFIG.DIPLOMACY.INITIAL_FRIENDSHIP_MAX
                    );
                    
                    this.relationships[country1.id][country2.id] = initialValue;
                }
            });
        });
    }
    
    /**
     * Initialize event listeners for diplomatic actions
     */
    initializeEventListeners() {
        // Trade button
        const tradeButton = document.getElementById('btn-trade');
        if (tradeButton) {
            tradeButton.addEventListener('click', () => this.openTradeDialog());
        }
        
        // Alliance button
        const allyButton = document.getElementById('btn-ally');
        if (allyButton) {
            allyButton.addEventListener('click', () => this.proposeAlliance());
        }
        
        // War button
        const warButton = document.getElementById('btn-declare-war');
        if (warButton) {
            warButton.addEventListener('click', () => this.declareWar());
        }
    }
    
    /**
     * Get the relationship value between two countries
     */
    getRelationship(country1Id, country2Id) {
        if (!this.relationships[country1Id] || !this.relationships[country1Id][country2Id]) {
            return 0;
        }
        return this.relationships[country1Id][country2Id];
    }
    
    /**
     * Modify the relationship between two countries
     */
    modifyRelationship(country1Id, country2Id, amount) {
        if (!this.relationships[country1Id]) {
            this.relationships[country1Id] = {};
        }
        
        if (!this.relationships[country1Id][country2Id]) {
            this.relationships[country1Id][country2Id] = 0;
        }
        
        this.relationships[country1Id][country2Id] += amount;
        
        // Ensure relationship stays within bounds (-100 to 100)
        this.relationships[country1Id][country2Id] = Math.max(
            -100, 
            Math.min(100, this.relationships[country1Id][country2Id])
        );
        
        // Check if relationship changes trigger diplomatic status changes
        this.checkRelationshipThresholds(country1Id, country2Id);
        
        return this.relationships[country1Id][country2Id];
    }
    
    /**
     * Check if relationship changes cross important thresholds
     */
    checkRelationshipThresholds(country1Id, country2Id) {
        const relationshipValue = this.getRelationship(country1Id, country2Id);
        
        // Check for alliance formation
        if (relationshipValue >= CONFIG.DIPLOMACY.ALLIANCE_THRESHOLD) {
            this.formAlliance(country1Id, country2Id);
        }
        
        // Check for war declaration by AI
        if (relationshipValue <= CONFIG.DIPLOMACY.WAR_THRESHOLD) {
            this.startWar(country1Id, country2Id);
        }
    }
    
    /**
     * Form an alliance between two countries
     */
    formAlliance(country1Id, country2Id) {
        // Check if alliance already exists
        const allianceExists = this.alliances.some(alliance => 
            alliance.members.includes(country1Id) && alliance.members.includes(country2Id)
        );
        
        if (allianceExists) return;
        
        // Check if countries are at war
        const atWar = this.wars.some(war => 
            (war.aggressor === country1Id && war.defender === country2Id) ||
            (war.aggressor === country2Id && war.defender === country1Id)
        );
        
        if (atWar) {
            // End the war first
            this.endWar(country1Id, country2Id);
        }
        
        // Try to add to existing alliance if one country is already in an alliance
        let allianceAdded = false;
        
        for (const alliance of this.alliances) {
            if (alliance.members.includes(country1Id) && !alliance.members.includes(country2Id)) {
                alliance.members.push(country2Id);
                allianceAdded = true;
                break;
            } else if (alliance.members.includes(country2Id) && !alliance.members.includes(country1Id)) {
                alliance.members.push(country1Id);
                allianceAdded = true;
                break;
            }
        }
        
        // Create new alliance if needed
        if (!allianceAdded) {
            this.alliances.push({
                id: `alliance_${Date.now()}`,
                name: `${country1Id}_${country2Id}_alliance`,
                members: [country1Id, country2Id],
                formed: Date.now()
            });
        }
        
        // Notify about alliance
        if (country1Id === 0 || country2Id === 0) { // Player is involved
            const otherCountryId = country1Id === 0 ? country2Id : country1Id;
            const otherCountry = this.gameState.map.countries.find(c => c.id === otherCountryId);
            
            Utils.showModal(`
                <h3>Alliance Formed</h3>
                <p>Your nation has formed an alliance with ${otherCountry.name}.</p>
                <p>This alliance will provide mutual defense and improved trading terms.</p>
            `);
        }
    }
    
    /**
     * Start a war between two countries
     */
    startWar(country1Id, country2Id) {
        // Check if already at war
        const warExists = this.wars.some(war => 
            (war.aggressor === country1Id && war.defender === country2Id) ||
            (war.aggressor === country2Id && war.defender === country1Id)
        );
        
        if (warExists) return;
        
        // Create new war
        this.wars.push({
            id: `war_${Date.now()}`,
            aggressor: country1Id,
            defender: country2Id,
            started: Date.now(),
            battles: []
        });
        
        // If player is involved, show notification
        if (country1Id === 0 || country2Id === 0) {
            const isPlayerAggressor = country1Id === 0;
            const otherCountryId = isPlayerAggressor ? country2Id : country1Id;
            const otherCountry = this.gameState.map.countries.find(c => c.id === otherCountryId);
            
            if (!isPlayerAggressor) {
                Utils.showModal(`
                    <h3>War Declared!</h3>
                    <p>${otherCountry.name} has declared war on your nation!</p>
                    <p>Prepare your defenses and consider your options carefully.</p>
                `);
            }
        }
    }
    
    /**
     * End a war between two countries
     */
    endWar(country1Id, country2Id) {
        const warIndex = this.wars.findIndex(war => 
            (war.aggressor === country1Id && war.defender === country2Id) ||
            (war.aggressor === country2Id && war.defender === country1Id)
        );
        
        if (warIndex === -1) return;
        
        // Remove the war
        const war = this.wars.splice(warIndex, 1)[0];
        
        // If player is involved, show notification
        if (country1Id === 0 || country2Id === 0) {
            const otherCountryId = country1Id === 0 ? country2Id : country1Id;
            const otherCountry = this.gameState.map.countries.find(c => c.id === otherCountryId);
            
            Utils.showModal(`
                <h3>Peace Treaty</h3>
                <p>The war between your nation and ${otherCountry.name} has ended.</p>
                <p>Relations remain tense, but open hostilities have ceased.</p>
            `);
        }
    }
    
    /**
     * Open trade dialog with selected country
     */
    openTradeDialog() {
        const selectedCountry = this.gameState.map.selectedCountry;
        if (!selectedCountry || selectedCountry.isPlayer) return;
        
        // Create trade dialog content
        let modalContent = `
            <h3>Trade with ${selectedCountry.name}</h3>
            <div class="trade-container">
                <div class="trade-column your-offer">
                    <h4>Your Offer</h4>
                    <div class="resource-selection">
        `;
        
        // Add player resources
        for (const resourceId in this.gameState.resources.resources) {
            const resource = this.gameState.resources.resources[resourceId];
            const resourceInfo = CONFIG.RESOURCE_TYPES.find(r => r.id === resourceId);
            
            if (resourceInfo && resource.amount > 0) {
                modalContent += `
                    <div class="trade-resource">
                        <i class="fas ${resourceInfo.icon}"></i>
                        <span>${resourceInfo.name}</span>
                        <input type="number" id="offer-${resourceId}" min="0" max="${Math.floor(resource.amount)}" value="0">
                    </div>
                `;
            }
        }
        
        modalContent += `
                    </div>
                </div>
                <div class="trade-column their-offer">
                    <h4>Their Offer</h4>
                    <div class="resource-selection">
        `;
        
        // Add country's resources (mock values for now)
        for (const resourceId in selectedCountry.resources) {
            if (selectedCountry.resources[resourceId] > 1) { // Only show resources they have abundance of
                const resourceInfo = CONFIG.RESOURCE_TYPES.find(r => r.id === resourceId);
                if (resourceInfo) {
                    modalContent += `
                        <div class="trade-resource">
                            <i class="fas ${resourceInfo.icon}"></i>
                            <span>${resourceInfo.name}</span>
                            <input type="number" id="request-${resourceId}" min="0" value="0">
                        </div>
                    `;
                }
            }
        }
        
        modalContent += `
                    </div>
                </div>
            </div>
            <div class="trade-actions">
                <button id="btn-trade-propose" class="btn-primary">Propose Trade</button>
                <button id="btn-trade-cancel" class="btn-secondary">Cancel</button>
            </div>
        `;
        
        Utils.showModal(modalContent);
        
        // Add event listeners for the trade buttons
        setTimeout(() => {
            const proposeButton = document.getElementById('btn-trade-propose');
            const cancelButton = document.getElementById('btn-trade-cancel');
            
            if (proposeButton) {
                proposeButton.addEventListener('click', () => this.proposeTrade(selectedCountry));
            }
            
            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    document.getElementById('modal-container').classList.add('hidden');
                });
            }
        }, 100);
    }
    
    /**
     * Process a trade proposal
     */
    proposeTrade(country) {
        // Collect offered resources
        const offered = {};
        let offerTotal = 0;
        
        for (const resourceId in this.gameState.resources.resources) {
            const inputElement = document.getElementById(`offer-${resourceId}`);
            if (inputElement) {
                const amount = parseInt(inputElement.value);
                if (amount > 0) {
                    offered[resourceId] = amount;
                    
                    // Calculate rough value (simplified)
                    const resourceValue = resourceId === 'gold' ? 1 : 2;
                    offerTotal += amount * resourceValue;
                }
            }
        }
        
        // Collect requested resources
        const requested = {};
        let requestTotal = 0;
        
        for (const resourceId in country.resources) {
            const inputElement = document.getElementById(`request-${resourceId}`);
            if (inputElement) {
                const amount = parseInt(inputElement.value);
                if (amount > 0) {
                    requested[resourceId] = amount;
                    
                    // Calculate rough value (simplified)
                    const resourceValue = resourceId === 'gold' ? 1 : 2;
                    requestTotal += amount * resourceValue;
                }
            }
        }
        
        // Check if trade is valid (both sides offering something)
        if (Object.keys(offered).length === 0 || Object.keys(requested).length === 0) {
            Utils.showModal(`
                <h3>Invalid Trade</h3>
                <p>Both sides must offer at least one resource.</p>
            `);
            return;
        }
        
        // Check if player can afford the offer
        for (const resourceId in offered) {
            if (this.gameState.resources.resources[resourceId].amount < offered[resourceId]) {
                Utils.showModal(`
                    <h3>Insufficient Resources</h3>
                    <p>You don't have enough ${resourceId} to complete this trade.</p>
                `);
                return;
            }
        }
        
        // Calculate if AI will accept based on relationship and trade value
        const relationshipValue = this.getRelationship(0, country.id);
        const fairnessModifier = (offerTotal / Math.max(1, requestTotal)) * 100;
        const acceptanceThreshold = 90 - (relationshipValue * 0.5); // Better relationships mean more favorable trades
        
        if (fairnessModifier >= acceptanceThreshold) {
            // Trade accepted
            // Execute the trade
            for (const resourceId in offered) {
                this.gameState.resources.resources[resourceId].amount -= offered[resourceId];
            }
            
            for (const resourceId in requested) {
                if (!this.gameState.resources.resources[resourceId]) {
                    this.gameState.resources.resources[resourceId] = { amount: 0, rate: 0 };
                }
                this.gameState.resources.resources[resourceId].amount += requested[resourceId];
            }
            
            // Improve relationship
            this.modifyRelationship(0, country.id, Math.min(5, Math.floor(fairnessModifier / 20)));
            
            // Show success message
            Utils.showModal(`
                <h3>Trade Accepted</h3>
                <p>${country.name} has accepted your trade offer.</p>
                <p>Your relationship has improved slightly.</p>
            `);
            
            // Update UI
            this.gameState.resources.updateResourceDisplay();
        } else {
            // Trade rejected
            Utils.showModal(`
                <h3>Trade Rejected</h3>
                <p>${country.name} has rejected your trade offer.</p>
                <p>They feel the trade is unfavorable to them. Consider offering more value or improving your relationship first.</p>
            `);
        }
    }
    
    /**
     * Propose alliance with selected country
     */
    proposeAlliance() {
        const selectedCountry = this.gameState.map.selectedCountry;
        if (!selectedCountry || selectedCountry.isPlayer) return;
        
        const relationshipValue = this.getRelationship(0, selectedCountry.id);
        
        if (relationshipValue >= CONFIG.DIPLOMACY.ALLIANCE_THRESHOLD) {
            // Alliance accepted
            this.formAlliance(0, selectedCountry.id);
        } else {
            // Alliance rejected
            Utils.showModal(`
                <h3>Alliance Rejected</h3>
                <p>${selectedCountry.name} has rejected your alliance proposal.</p>
                <p>Your relationship isn't strong enough yet. Try improving relations through trade and other diplomatic actions first.</p>
            `);
        }
    }
    
    /**
     * Declare war on selected country
     */
    declareWar() {
        const selectedCountry = this.gameState.map.selectedCountry;
        if (!selectedCountry || selectedCountry.isPlayer) return;
        
        Utils.showModal(`
            <h3>Declare War on ${selectedCountry.name}?</h3>
            <p>Are you sure you want to declare war? This action cannot be undone and will have serious consequences.</p>
            <div class="modal-actions">
                <button id="btn-confirm-war" class="btn-danger">Declare War</button>
                <button id="btn-cancel-war" class="btn-secondary">Cancel</button>
            </div>
        `);
        
        // Add event listeners for confirmation buttons
        setTimeout(() => {
                const confirmButton = document.getElementById('btn-confirm-war');
            const cancelButton = document.getElementById('btn-cancel-war');
            
            if (confirmButton) {
                confirmButton.addEventListener('click', () => {
                    // Set relationship to war level
                    this.modifyRelationship(0, selectedCountry.id, -100);
                    
                    // Start the war
                    this.startWar(0, selectedCountry.id);
                    
                    // Close the modal
                    document.getElementById('modal-container').classList.add('hidden');
                });
            }
            
            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    document.getElementById('modal-container').classList.add('hidden');
                });
            }
        }, 100);
    }
    
    /**
     * Process AI diplomatic actions (called periodically)
     */
    processAIDiplomacy() {
        const countries = this.gameState.map.countries;
        
        // Each country has a chance to take diplomatic actions
        countries.forEach(country1 => {
            if (country1.isPlayer) return; // Skip player country
            
            // Chance to initiate diplomatic action based on personality
            if (!Utils.chance(0.1)) return; // 10% chance per cycle
            
            // Select another country randomly to interact with
            const otherCountries = countries.filter(c => c.id !== country1.id);
            const country2 = Utils.randomChoice(otherCountries);
            
            const relationship = this.getRelationship(country1.id, country2.id);
            
            // Decide action based on relationship and country traits
            if (relationship <= CONFIG.DIPLOMACY.WAR_THRESHOLD && country1.traits && country1.traits.warlike) {
                // Start war if warlike and relationship is bad enough
                this.startWar(country1.id, country2.id);
            } 
            else if (relationship >= 40 && relationship < CONFIG.DIPLOMACY.ALLIANCE_THRESHOLD) {
                // Improve relationships through trade or gifts
                const relationshipChange = Utils.randomInt(1, 3);
                this.modifyRelationship(country1.id, country2.id, relationshipChange);
                this.modifyRelationship(country2.id, country1.id, relationshipChange);
                
                // If player is involved, notify
                if (country2.isPlayer) {
                    // 20% chance to actually notify to avoid spamming notifications
                    if (Utils.chance(0.2)) {
                        Utils.showModal(`
                            <h3>Diplomatic Gesture</h3>
                            <p>${country1.name} has sent a diplomatic envoy with gifts to improve relations with your nation.</p>
                            <p>Your relationship has improved slightly.</p>
                        `);
                    }
                }
            }
            else if (relationship >= CONFIG.DIPLOMACY.ALLIANCE_THRESHOLD && !this.areAllied(country1.id, country2.id)) {
                // Form alliance if relationship is good enough
                this.formAlliance(country1.id, country2.id);
            }
        });
    }
    
    /**
     * Check if two countries are allied
     */
    areAllied(country1Id, country2Id) {
        return this.alliances.some(alliance => 
            alliance.members.includes(country1Id) && 
            alliance.members.includes(country2Id)
        );
    }
    
    /**
     * Check if two countries are at war
     */
    areAtWar(country1Id, country2Id) {
        return this.wars.some(war => 
            (war.aggressor === country1Id && war.defender === country2Id) ||
            (war.aggressor === country2Id && war.defender === country1Id)
        );
    }
    
    /**
     * Get all allies of a country
     */
    getAllies(countryId) {
        const allies = [];
        
        this.alliances.forEach(alliance => {
            if (alliance.members.includes(countryId)) {
                alliance.members.forEach(memberId => {
                    if (memberId !== countryId && !allies.includes(memberId)) {
                        allies.push(memberId);
                    }
                });
            }
        });
        
        return allies;
    }
    
    /**
     * Get all enemies (countries at war with) of a country
     */
    getEnemies(countryId) {
        const enemies = [];
        
        this.wars.forEach(war => {
            if (war.aggressor === countryId) {
                enemies.push(war.defender);
            } else if (war.defender === countryId) {
                enemies.push(war.aggressor);
            }
        });
        
        return enemies;
    }
}