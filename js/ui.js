/**
 * UI Manager for Fantasy Realm game
 */
class UIManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.initializeEventListeners();
    }
    
    /**
     * Initialize event listeners for UI elements
     */
    initializeEventListeners() {
        // Population worker controls
        const workerControls = document.querySelectorAll('.worker-type .controls button');
        workerControls.forEach(button => {
            button.addEventListener('click', (e) => {
                const workerType = e.target.dataset.worker;
                const isIncrease = e.target.classList.contains('plus');
                
                const currentCount = this.gameState.resources.workers[workerType].count;
                const newCount = isIncrease ? currentCount + 1 : Math.max(0, currentCount - 1);
                
                this.gameState.resources.assignWorkers(workerType, newCount);
            });
        });
        
        // Action buttons
        const buildButton = document.getElementById('btn-build');
        if (buildButton) {
            buildButton.addEventListener('click', () => this.openBuildMenu());
        }
        
        const researchButton = document.getElementById('btn-research');
        if (researchButton) {
            researchButton.addEventListener('click', () => this.openResearchMenu());
        }
        
        const recruitButton = document.getElementById('btn-recruit');
        if (recruitButton) {
            recruitButton.addEventListener('click', () => this.openRecruitMenu());
        }
        
        const diplomacyButton = document.getElementById('btn-diplomacy');
        if (diplomacyButton) {
            diplomacyButton.addEventListener('click', () => this.openDiplomacyMenu());
        }
    }
    
    /**
     * Open the build menu
     */
    openBuildMenu() {
        const buildOptions = [
            {
                id: 'mine',
                name: 'Mine',
                description: 'Increases iron production by 25%',
                cost: { wood: 100, stone: 50 },
                effect: { resourceType: 'iron', multiplier: 1.25 }
            },
            {
                id: 'sawmill',
                name: 'Sawmill',
                description: 'Increases wood production by 25%',
                cost: { iron: 50, stone: 75 },
                effect: { resourceType: 'wood', multiplier: 1.25 }
            },
            {
                id: 'quarry',
                name: 'Quarry',
                description: 'Increases stone production by 30%',
                cost: { wood: 75, iron: 50 },
                effect: { resourceType: 'stone', multiplier: 1.3 }
            },
            {
                id: 'farm',
                name: 'Farm',
                description: 'Increases food production by 35%',
                cost: { wood: 50, stone: 25 },
                effect: { resourceType: 'food', multiplier: 1.35 }
            },
            {
                id: 'magic_tower',
                name: 'Magic Tower',
                description: 'Increases magic production by 40%',
                cost: { stone: 100, gems: 25 },
                effect: { resourceType: 'magic', multiplier: 1.4 }
            }
        ];
        
        let modalContent = `
            <h3>Build Structures</h3>
            <p>Choose a structure to build in your kingdom:</p>
            <div class="build-options">
        `;
        
        buildOptions.forEach(option => {
            const canAfford = this.gameState.resources.canAfford(option.cost);
            
            modalContent += `
                <div class="build-option ${canAfford ? '' : 'disabled'}">
                    <h4>${option.name}</h4>
                    <p>${option.description}</p>
                    <div class="cost">
                        <span>Cost:</span>
                        ${Object.entries(option.cost).map(([resource, amount]) => 
                            `<span class="resource-cost">${resource}: ${amount}</span>`
                        ).join('')}
                    </div>
                    <button class="btn-build" data-build="${option.id}" ${canAfford ? '' : 'disabled'}>
                        Build
                    </button>
                </div>
            `;
        });
        
        modalContent += `</div>`;
        
        Utils.showModal(modalContent);
        
        // Add event listeners for build buttons
        setTimeout(() => {
            const buildButtons = document.querySelectorAll('.btn-build');
            buildButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const buildId = e.target.dataset.build;
                    const buildOption = buildOptions.find(option => option.id === buildId);
                    
                    if (buildOption && this.gameState.resources.canAfford(buildOption.cost)) {
                        // Pay the cost
                        this.gameState.resources.spendResources(buildOption.cost);
                        
                        // Apply the effect
                        const resourceId = buildOption.effect.resourceType;
                        if (this.gameState.resources.resources[resourceId]) {
                            this.gameState.resources.resources[resourceId].multiplier *= buildOption.effect.multiplier;
                        }
                        
                        // Update rates
                        this.gameState.resources.updateResourceRates();
                        
                        // Close modal
                        document.getElementById('modal-container').classList.add('hidden');
                        
                        // Show success message
                        Utils.showModal(`
                            <h3>${buildOption.name} Built!</h3>
                            <p>You have successfully built a ${buildOption.name}.</p>
                            <p>${buildOption.description}</p>
                        `);
                    }
                });
            });
        }, 100);
    }
    
    /**
     * Open the research menu
     */
    openResearchMenu() {
        const researchOptions = [
            {
                id: 'advanced_mining',
                name: 'Advanced Mining',
                description: 'Miners produce 50% more resources',
                cost: { gold: 200, iron: 100 },
                effect: { workerType: 'miner', efficiencyBonus: 0.5 }
            },
            {
                id: 'efficient_logging',
                name: 'Efficient Logging',
                description: 'Woodcutters produce 50% more resources',
                cost: { gold: 200, wood: 150 },
                effect: { workerType: 'woodcutter', efficiencyBonus: 0.5 }
            },
            {
                id: 'magical_attunement',
                name: 'Magical Attunement',
                description: 'Mages produce 75% more magic',
                cost: { gold: 300, magic: 50 },
                effect: { workerType: 'mage', efficiencyBonus: 0.75 }
            },
            {
                id: 'trade_routes',
                name: 'Trade Routes',
                description: 'Gold income increases by 25%',
                cost: { gold: 500, food: 200 },
                effect: { resourceType: 'gold', multiplier: 1.25 }
            }
        ];
        
        let modalContent = `
            <h3>Research Technologies</h3>
            <p>Choose a technology to research:</p>
            <div class="research-options">
        `;
        
        researchOptions.forEach(option => {
            const canAfford = this.gameState.resources.canAfford(option.cost);
            
            modalContent += `
                <div class="research-option ${canAfford ? '' : 'disabled'}">
                    <h4>${option.name}</h4>
                    <p>${option.description}</p>
                    <div class="cost">
                        <span>Cost:</span>
                        ${Object.entries(option.cost).map(([resource, amount]) => 
                            `<span class="resource-cost">${resource}: ${amount}</span>`
                        ).join('')}
                    </div>
                    <button class="btn-research" data-research="${option.id}" ${canAfford ? '' : 'disabled'}>
                        Research
                    </button>
                </div>
            `;
        });
        
        modalContent += `</div>`;
        
        Utils.showModal(modalContent);
        
        // Add event listeners for research buttons
        setTimeout(() => {
            const researchButtons = document.querySelectorAll('.btn-research');
            researchButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const researchId = e.target.dataset.research;
                    const researchOption = researchOptions.find(option => option.id === researchId);
                    
                    if (researchOption && this.gameState.resources.canAfford(researchOption.cost)) {
                        // Pay the cost
                        this.gameState.resources.spendResources(researchOption.cost);
                        
                        // Apply the effect
                        if (researchOption.effect.workerType) {
                            const workerType = researchOption.effect.workerType;
                            this.gameState.resources.workers[workerType].efficiency += researchOption.effect.efficiencyBonus;
                        } else if (researchOption.effect.resourceType) {
                            const resourceId = researchOption.effect.resourceType;
                            this.gameState.resources.resources[resourceId].multiplier *= researchOption.effect.multiplier;
                        }
                        
                        // Update rates
                        this.gameState.resources.updateResourceRates();
                        
                        // Close modal
                        document.getElementById('modal-container').classList.add('hidden');
                        
                        // Show success message
                        Utils.showModal(`
                            <h3>${researchOption.name} Researched!</h3>
                            <p>You have successfully researched ${researchOption.name}.</p>
                            <p>${researchOption.description}</p>
                        `);
                    }
                });
            });
        }, 100);
    }
    
    /**
     * Open the recruit menu
     */
    openRecruitMenu() {
        const recruitOptions = [
            {
                id: 'soldiers',
                name: 'Soldiers',
                description: 'Basic military units for defense and offense',
                cost: { gold: 50, food: 20, iron: 10 },
                power: 5,
                count: 10
            },
            {
                id: 'archers',
                name: 'Archers',
                description: 'Ranged units with higher damage but lower health',
                cost: { gold: 75, food: 20, wood: 15 },
                power: 7,
                count: 10
            },
            {
                id: 'cavalry',
                name: 'Cavalry',
                description: 'Mobile units with high attack power',
                cost: { gold: 100, food: 30, iron: 5 },
                power: 10,
                count: 5
            },
            {
                id: 'mages',
                name: 'Battle Mages',
                description: 'Powerful magical units with area effects',
                cost: { gold: 150, food: 20, magic: 10 },
                power: 15,
                count: 3
            }
        ];
        
        let modalContent = `
            <h3>Recruit Military Units</h3>
            <p>Recruit military units to defend your kingdom or wage war:</p>
            <div class="recruit-options">
        `;
        
        recruitOptions.forEach(option => {
            const canAfford = this.gameState.resources.canAfford(option.cost);
            
            modalContent += `
                <div class="recruit-option ${canAfford ? '' : 'disabled'}">
                    <h4>${option.name} (${option.count})</h4>
                    <p>${option.description}</p>
                    <p>Military Power: ${option.power * option.count}</p>
                    <div class="cost">
                        <span>Cost:</span>
                        ${Object.entries(option.cost).map(([resource, amount]) => 
                            `<span class="resource-cost">${resource}: ${amount}</span>`
                        ).join('')}
                    </div>
                    <button class="btn-recruit" data-recruit="${option.id}" ${canAfford ? '' : 'disabled'}>
                        Recruit
                    </button>
                </div>
            `;
        });
        
        modalContent += `</div>`;
        
        Utils.showModal(modalContent);
        
        // Add event listeners for recruit buttons
        setTimeout(() => {
            const recruitButtons = document.querySelectorAll('.btn-recruit');
            recruitButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const recruitId = e.target.dataset.recruit;
                    const recruitOption = recruitOptions.find(option => option.id === recruitId);
                    
                    if (recruitOption && this.gameState.resources.canAfford(recruitOption.cost)) {
                        // Pay the cost
                        this.gameState.resources.spendResources(recruitOption.cost);
                        
                        // Add military power (will be implemented in a future military system)
                        if (!this.gameState.military) {
                            this.gameState.military = { units: {}, power: 0 };
                        }
                        
                        if (!this.gameState.military.units[recruitId]) {
                            this.gameState.military.units[recruitId] = 0;
                        }
                        
                        this.gameState.military.units[recruitId] += recruitOption.count;
                        this.gameState.military.power += recruitOption.power * recruitOption.count;
                        
                        // Close modal
                        document.getElementById('modal-container').classList.add('hidden');
                        
                        // Show success message
                        Utils.showModal(`
                            <h3>Units Recruited!</h3>
                            <p>You have recruited ${recruitOption.count} ${recruitOption.name}.</p>
                            <p>Your military power has increased by ${recruitOption.power * recruitOption.count}.</p>
                        `);
                    }
                });
            });
        }, 100);
    }
    
    /**
     * Open the diplomacy menu
     */
    openDiplomacyMenu() {
        // Get all countries except player's country
        const countries = this.gameState.map.countries.filter(country => !country.isPlayer);
        
        let modalContent = `
            <h3>Diplomatic Relations</h3>
            <p>Current diplomatic status with other nations:</p>
            <div class="diplomacy-list">
        `;
        
        countries.forEach(country => {
            const relationshipValue = this.gameState.diplomacy.getRelationship(0, country.id);
            let relationshipStatus = 'Neutral';
            let statusClass = 'neutral';
            
            if (relationshipValue >= 75) {
                relationshipStatus = 'Allied';
                statusClass = 'allied';
            } else if (relationshipValue >= 50) {
                relationshipStatus = 'Friendly';
                statusClass = 'friendly';
            } else if (relationshipValue >= 20) {
                relationshipStatus = 'Cordial';
                statusClass = 'cordial';
            } else if (relationshipValue <= -75) {
                relationshipStatus = 'At War';
                statusClass = 'war';
            } else if (relationshipValue <= -50) {
                relationshipStatus = 'Hostile';
                statusClass = 'hostile';
            } else if (relationshipValue <= -20) {
                relationshipStatus = 'Unfriendly';
                statusClass = 'unfriendly';
            }
            
            modalContent += `
                <div class="diplomacy-item" data-country-id="${country.id}">
                    <div class="country-name">${country.name}</div>
                    <div class="relationship-bar">
                        <div class="relationship-value" style="width: ${Math.abs(relationshipValue)}%; background-color: ${relationshipValue >= 0 ? '#4CAF50' : '#F44336'}"></div>
                    </div>
                    <div class="relationship-status ${statusClass}">${relationshipStatus}</div>
                    <div class="diplomacy-actions">
                        <button class="btn-view" data-country-id="${country.id}">View</button>
                    </div>
                </div>
            `;
        });
        
        modalContent += `</div>`;
        
        Utils.showModal(modalContent);
        
        // Add event listeners for view buttons
        setTimeout(() => {
            const viewButtons = document.querySelectorAll('.btn-view');
            viewButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const countryId = parseInt(e.target.dataset.countryId);
                    const country = this.gameState.map.countries.find(c => c.id === countryId);
                    
                    if (country) {
                        // Select the country on the map
                        this.gameState.map.onCountryClick(country);
                        
                        // Close the modal
                        document.getElementById('modal-container').classList.add('hidden');
                    }
                });
            });
        }, 100);
    }
}