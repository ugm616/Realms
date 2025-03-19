/**
 * UI Management for Fantasy Realm
 */
class UIManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.notificationQueue = [];
        this.isProcessingNotifications = false;
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners for UI elements
     */
    setupEventListeners() {
        // Worker assignment buttons
        document.querySelectorAll('.worker-add').forEach(button => {
            button.addEventListener('click', (e) => {
                const workerType = e.target.getAttribute('data-worker-type');
                if (workerType && this.gameState && this.gameState.resources) {
                    this.gameState.resources.adjustWorkers(workerType, 1);
                }
            });
        });
        
        document.querySelectorAll('.worker-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                const workerType = e.target.getAttribute('data-worker-type');
                // Fix for the error - check if workers and workerType exist before accessing count
                if (workerType && this.gameState && this.gameState.resources && 
                    this.gameState.resources.workers && 
                    this.gameState.resources.workers[workerType] > 0) {
                    this.gameState.resources.adjustWorkers(workerType, -1);
                }
            });
        });
        
        // Action buttons
        const buildBtn = document.getElementById('build-btn');
        if (buildBtn) {
            buildBtn.addEventListener('click', () => this.showBuildMenu());
        }
        
        const researchBtn = document.getElementById('research-btn');
        if (researchBtn) {
            researchBtn.addEventListener('click', () => this.showResearchMenu());
        }
        
        const recruitBtn = document.getElementById('recruit-btn');
        if (recruitBtn) {
            recruitBtn.addEventListener('click', () => this.showRecruitMenu());
        }
        
        const diplomacyBtn = document.getElementById('diplomacy-btn');
        if (diplomacyBtn) {
            diplomacyBtn.addEventListener('click', () => this.showDiplomacyMenu());
        }
        
        // Modal close buttons
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(button => {
            if (button) {
                button.addEventListener('click', () => this.closeModal());
            }
        });
        
        // Map controls
        const zoomInBtn = document.getElementById('zoom-in');
        if (zoomInBtn && this.gameState && this.gameState.map) {
            zoomInBtn.addEventListener('click', () => this.gameState.map.zoom(1.2));
        }
        
        const zoomOutBtn = document.getElementById('zoom-out');
        if (zoomOutBtn && this.gameState && this.gameState.map) {
            zoomOutBtn.addEventListener('click', () => this.gameState.map.zoom(0.8));
        }
    }
    
    /**
     * Add a message to the event log
     * @param {string} message - The message to add
     * @param {string} type - The type of message (info, success, warning, danger, diplomatic)
     */
    addToEventLog(message, type = 'info') {
        const eventLog = document.getElementById('event-log');
        if (!eventLog) return;
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        
        const timestamp = document.createElement('span');
        timestamp.className = 'log-timestamp';
        timestamp.textContent = this.getFormattedTime();
        
        const messageElement = document.createElement('span');
        messageElement.className = 'log-message';
        messageElement.textContent = message;
        
        logEntry.appendChild(timestamp);
        logEntry.appendChild(messageElement);
        
        eventLog.insertBefore(logEntry, eventLog.firstChild);
        
        // Limit number of messages
        while (eventLog.children.length > 50) {
            eventLog.removeChild(eventLog.lastChild);
        }
    }
    
    /**
     * Get formatted time for log entries
     * @returns {string} Formatted time string (HH:MM)
     */
    getFormattedTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    
    /**
     * Show notification to the player
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} type - Notification type (info, success, warning, danger)
     */
    showNotification(title, message, type = 'info') {
        // Queue the notification
        this.notificationQueue.push({ title, message, type });
        
        // Process queue if not already processing
        if (!this.isProcessingNotifications) {
            this.processNotificationQueue();
        }
    }
    
    /**
     * Process the notification queue to prevent overwhelming the player
     */
    processNotificationQueue() {
        if (this.notificationQueue.length === 0) {
            this.isProcessingNotifications = false;
            return;
        }
        
        this.isProcessingNotifications = true;
        const notification = this.notificationQueue.shift();
        this.displayNotification(notification.title, notification.message, notification.type);
        
        // Process next notification after a delay
        setTimeout(() => {
            this.processNotificationQueue();
        }, 3000);
    }
    
    /**
     * Display a notification on the screen
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     */
    displayNotification(title, message, type) {
        // Create notification area if it doesn't exist
        let notificationArea = document.getElementById('notification-area');
        
        if (!notificationArea) {
            notificationArea = document.createElement('div');
            notificationArea.id = 'notification-area';
            document.body.appendChild(notificationArea);
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `game-notification ${type}`;
        
        const notificationTitle = document.createElement('h4');
        notificationTitle.textContent = title;
        
        const notificationMessage = document.createElement('p');
        notificationMessage.textContent = message;
        
        const closeButton = document.createElement('button');
        closeButton.className = 'notification-close';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => {
            notification.classList.add('closing');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        });
        
        notification.appendChild(closeButton);
        notification.appendChild(notificationTitle);
        notification.appendChild(notificationMessage);
        
        notificationArea.appendChild(notification);
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('closing');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 10000);
    }
    
    /**
     * Show resource gain animation
     * @param {string} resourceType - Type of resource
     * @param {number} amount - Amount gained
     */
    showResourceGain(resourceType, amount) {
        const resourceElement = document.getElementById(`${resourceType}-value`);
        if (!resourceElement) return;
        
        // Create floating number element
        const floatingNumber = document.createElement('div');
        floatingNumber.className = 'floating-number';
        floatingNumber.textContent = `+${Math.floor(amount)}`;
        
        // Position near the resource display
        const rect = resourceElement.getBoundingClientRect();
        floatingNumber.style.left = `${rect.left + rect.width / 2}px`;
        floatingNumber.style.top = `${rect.top}px`;
        
        // Add to document
        document.body.appendChild(floatingNumber);
        
        // Animate
        setTimeout(() => {
            floatingNumber.classList.add('floating');
            setTimeout(() => {
                if (floatingNumber.parentNode) {
                    floatingNumber.remove();
                }
            }, 2000);
        }, 10);
    }
    
    /**
     * Show diplomatic offer from AI
     * @param {Object} offer - Diplomatic offer details
     */
    showDiplomaticOffer(offer) {
        if (!this.gameState || !this.gameState.map || !this.gameState.map.countries) return;
        
        const fromCountry = this.gameState.map.countries.find(c => c.id === offer.fromCountry);
        if (!fromCountry) return;
        
        // Create modal content
        this.showModal({
            title: `Diplomatic Offer from ${fromCountry.name}`,
            content: `
                <div class="diplomatic-offer">
                    <p class="offer-message">${offer.message}</p>
                    
                    <div class="offer-details">
                        <h4>Offer Type: ${this.capitalizeFirstLetter(offer.type)}</h4>
                        
                        ${offer.offeredResources ? `
                            <div class="offered-resources">
                                <h5>They offer:</h5>
                                <ul>
                                    ${Object.entries(offer.offeredResources)
                                        .filter(([_, amount]) => amount > 0)
                                        .map(([resource, amount]) => `
                                            <li>${this.capitalizeFirstLetter(resource)}: ${amount}</li>
                                        `).join('')
                                    }
                                </ul>
                            </div>
                        ` : ''}
                        
                        ${offer.requestedResources ? `
                            <div class="requested-resources">
                                <h5>They request:</h5>
                                <ul>
                                    ${Object.entries(offer.requestedResources)
                                        .filter(([_, amount]) => amount > 0)
                                        .map(([resource, amount]) => `
                                            <li>${this.capitalizeFirstLetter(resource)}: ${amount}</li>
                                        `).join('')
                                    }
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `,
            buttons: [
                {
                    label: 'Accept',
                    class: 'modal-accept',
                    action: () => this.acceptDiplomaticOffer(offer)
                },
                {
                    label: 'Reject',
                    class: 'modal-reject',
                    action: () => this.rejectDiplomaticOffer(offer)
                },
                {
                    label: 'Counter',
                    class: 'modal-counter',
                    action: () => this.counterDiplomaticOffer(offer)
                }
            ]
        });
    }
    
    /**
     * Show modal with custom content
     * @param {Object} options - Modal options
     */
    showModal(options) {
        let modalContainer = document.getElementById('modal-container');
        
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modal-container';
            document.body.appendChild(modalContainer);
        }
        
        modalContainer.innerHTML = `
            <div class="modal">
                <div class="modal-content">
                    <h3>${options.title}</h3>
                    <div class="modal-body">
                        ${options.content}
                    </div>
                    <div class="modal-buttons">
                        ${options.buttons.map(button => `
                            <button class="modal-btn ${button.class}">${button.label}</button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        modalContainer.classList.remove('hidden');
        
        // Add event listeners to buttons
        options.buttons.forEach((buttonConfig, index) => {
            const buttons = modalContainer.querySelectorAll('.modal-btn');
            if (buttons.length > index) {
                const button = buttons[index];
                button.addEventListener('click', () => {
                    buttonConfig.action();
                    this.closeModal();
                });
            }
        });
    }
    
    /**
     * Close modal
     */
    closeModal() {
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            modalContainer.classList.add('hidden');
        }
    }
    
    /**
     * Show build menu
     */
    showBuildMenu() {
        // Skip if no resource manager
        if (!this.gameState || !this.gameState.resources) return;
        
        // Building options
        const buildingOptions = [
            {
                id: 'farm',
                name: 'Farm',
                description: 'Produces food and increases farmer efficiency.',
                cost: { wood: 50, stone: 20 },
                buildTime: 30,
                effect: 'Increases food production by 0.5 per second'
            },
            {
                id: 'sawmill',
                name: 'Sawmill',
                description: 'Processes wood more efficiently.',
                cost: { wood: 30, stone: 40, gold: 20 },
                buildTime: 45,
                effect: 'Increases wood production by 0.4 per second'
            },
            {
                id: 'mine',
                name: 'Mine',
                description: 'Extracts stone and occasionally finds gold.',
                cost: { wood: 60, stone: 10, gold: 30 },
                buildTime: 60,
                effect: 'Increases stone production by 0.3 per second and chance of finding gold'
            },
            {
                id: 'market',
                name: 'Market',
                description: 'Improves trade efficiency and gold income.',
                cost: { wood: 40, stone: 30, gold: 50 },
                buildTime: 50,
                effect: 'Increases gold production by 0.25 per second'
            },
            {
                id: 'embassy',
                name: 'Embassy',
                description: 'Improves diplomatic relations and influence generation.',
                cost: { wood: 70, stone: 70, gold: 100 },
                buildTime: 90,
                effect: 'Increases influence generation and improves diplomatic relations'
            }
        ];
        
        // Generate build option HTML
        const buildOptionsHTML = buildingOptions.map(building => {
            const canAfford = this.gameState.resources.hasEnoughResources(building.cost);
            
            return `
                <div class="build-option ${canAfford ? '' : 'disabled'}">
                    <h4>${building.name}</h4>
                    <p>${building.description}</p>
                    <div class="cost">
                        ${Object.entries(building.cost).map(([resource, amount]) => `
                            <span class="resource-cost ${this.gameState.resources.resources[resource] >= amount ? '' : 'insufficient'}">
                                ${this.capitalizeFirstLetter(resource)}: ${amount}
                            </span>
                        `).join('')}
                    </div>
                    <p class="effect">${building.effect}</p>
                    <button class="build-btn" data-building="${building.id}" ${canAfford ? '' : 'disabled'}>
                        Build (${building.buildTime}s)
                    </button>
                </div>
            `;
        }).join('');
        
        // Show modal with build options
        this.showModal({
            title: 'Build Structures',
            content: `
                <div class="build-options">
                    ${buildOptionsHTML}
                </div>
            `,
            buttons: [
                {
                    label: 'Close',
                    class: 'modal-cancel',
                    action: () => {}
                }
            ]
        });
        
        // Add event listeners for build buttons
        document.querySelectorAll('.build-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const buildingId = e.target.getAttribute('data-building');
                const building = buildingOptions.find(b => b.id === buildingId);
                
                if (building && this.gameState.resources.hasEnoughResources(building.cost)) {
                    this.startBuilding(building);
                    this.closeModal();
                }
            });
        });
    }
    
    /**
     * Start building construction
     * @param {Object} building - Building details
     */
    startBuilding(building) {
        if (!this.gameState || !this.gameState.resources) return;
        
        // Deduct resources
        if (!this.gameState.resources.deductResources(building.cost)) {
            this.showNotification('Cannot Build', 'Not enough resources!', 'warning');
            return;
        }
        
        // Show notification that building started
        this.addToEventLog(`Started construction of ${building.name}.`, 'info');
        
        // Simulate building time
        this.showNotification('Construction Started', 
            `Building ${building.name}. Will be completed in ${building.buildTime} seconds.`);
        
        // Create progress indicator
        let progressBar = document.getElementById('building-progress');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'building-progress';
            progressBar.className = 'progress-bar';
            progressBar.innerHTML = `<div class="progress"></div><div class="progress-text"></div>`;
            
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.appendChild(progressBar);
            }
        }
        
        const progressInner = progressBar.querySelector('.progress');
        const progressText = progressBar.querySelector('.progress-text');
        
        // Show progress bar
        progressBar.style.display = 'block';
        progressText.textContent = `Building ${building.name}...`;
        
        // Start timer
        const startTime = Date.now();
        const buildTime = building.buildTime * 1000; // convert to ms
        
        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / buildTime, 1);
            
            progressInner.style.width = `${progress * 100}%`;
            
            if (progress < 1) {
                requestAnimationFrame(updateProgress);
            } else {
                // Building complete
                this.completeBuildingConstruction(building);
                
                // Hide progress bar after a short delay
                setTimeout(() => {
                    progressBar.style.display = 'none';
                }, 1000);
            }
        };
        
        updateProgress();
    }
    
    /**
     * Complete building construction
     * @param {Object} building - Building details
     */
    completeBuildingConstruction(building) {
        if (!this.gameState || !this.gameState.resources) return;
        
        // Add building to player's buildings
        const buildingType = building.id + 's'; // Convert to plural for resources.buildings property
        
        if (buildingType in this.gameState.resources.buildings) {
            this.gameState.resources.addBuilding(buildingType);
            
            // Show completion notification
            this.showNotification('Construction Complete', 
                `Your ${building.name} is ready!`, 'success');
            
            this.addToEventLog(`${building.name} construction completed!`, 'success');
        }
    }
    
    /**
     * Show research menu
     */
    showResearchMenu() {
        this.showNotification('Coming Soon', 'Research system will be available in a future update.', 'info');
    }
    
    /**
     * Show recruit menu
     */
    showRecruitMenu() {
        this.showNotification('Coming Soon', 'Military recruitment will be available in a future update.', 'info');
    }
    
    /**
     * Show diplomacy menu
     */
    showDiplomacyMenu() {
        // Skip if no diplomacy system
        if (!this.gameState || !this.gameState.diplomacy || !this.gameState.map) return;
        
        const countries = this.gameState.map.countries.filter(c => !c.isPlayer);
        
        // Generate country list with relationship info
        const countriesHTML = countries.map(country => {
            const relationship = this.gameState.diplomacy.getRelationship(0, country.id) || 0;
            const status = this.gameState.diplomacy.diplomaticStatus[0][country.id] || 'neutral';
            
            // Determine relationship status text
            let relationshipClass;
            let relationshipText;
            
            if (status === 'war') {
                relationshipClass = 'war';
                relationshipText = 'At War';
            } else if (status === 'allied') {
                relationshipClass = 'allied';
                relationshipText = 'Allied';
            } else if (relationship >= 75) {
                relationshipClass = 'friendly';
                relationshipText = 'Friendly';
            } else if (relationship >= 20) {
                relationshipClass = 'cordial';
                relationshipText = 'Cordial';
            } else if (relationship >= -20) {
                relationshipClass = 'neutral';
                relationshipText = 'Neutral';
            } else if (relationship >= -50) {
                relationshipClass = 'unfriendly';
                relationshipText = 'Unfriendly';
            } else {
                relationshipClass = 'hostile';
                relationshipText = 'Hostile';
            }
            
            // Calculate relationship bar width
            const barValue = Math.min(100, Math.max(0, (relationship + 100) / 2)); // Convert -100...100 to 0...100
            
            // Get bar color based on relationship
            let barColor;
            if (relationship >= 75) barColor = '#4caf50';
            else if (relationship >= 20) barColor = '#8bc34a';
            else if (relationship >= -20) barColor = '#ffeb3b';
            else if (relationship >= -50) barColor = '#ff9800';
            else barColor = '#f44336';
            
            return `
                <div class="diplomacy-item" data-country-id="${country.id}">
                    <h4>${country.name}</h4>
                    <p>Personality: ${country.personality || 'Unknown'}</p>
                    
                    <div class="relationship-display">
                        <div class="relationship-bar">
                            <div class="relationship-value" style="width: ${barValue}%; background-color: ${barColor};"></div>
                        </div>
                        <div class="relationship-status ${relationshipClass}">${relationshipText}</div>
                    </div>
                    
                    <div class="diplomacy-actions">
                        ${status !== 'allied' && status !== 'war' ? 
                            `<button class="diplomatic-btn propose-alliance" data-country="${country.id}">Propose Alliance</button>` : ''
                        }
                        ${status !== 'war' ? 
                            `<button class="diplomatic-btn declare-war war" data-country="${country.id}">Declare War</button>` : ''
                        }
                        ${status === 'war' ? 
                            `<button class="diplomatic-btn propose-peace" data-country="${country.id}">Propose Peace</button>` : ''
                        }
                        <button class="diplomatic-btn propose-trade" data-country="${country.id}">Propose Trade</button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Show modal with diplomacy options
        this.showModal({
            title: 'Diplomacy',
            content: `
                <div class="diplomacy-list">
                    ${countriesHTML.length > 0 ? countriesHTML : '<p>No countries available for diplomacy.</p>'}
                </div>
            `,
            buttons: [
                {
                    label: 'Close',
                    class: 'modal-cancel',
                    action: () => {}
                }
            ]
        });
        
        // Add event listeners for diplomacy buttons
        document.querySelectorAll('.propose-alliance').forEach(button => {
            button.addEventListener('click', e => {
                const countryId = parseInt(e.target.getAttribute('data-country'));
                if (this.gameState.diplomacy.proposeAlliance) {
                    this.gameState.diplomacy.proposeAlliance(countryId);
                    this.closeModal();
                }
            });
        });
        
        document.querySelectorAll('.declare-war').forEach(button => {
            button.addEventListener('click', e => {
                const countryId = parseInt(e.target.getAttribute('data-country'));
                this.confirmWarDeclaration(countryId);
            });
        });
        
        document.querySelectorAll('.propose-peace').forEach(button => {
            button.addEventListener('click', e => {
                const countryId = parseInt(e.target.getAttribute('data-country'));
                if (this.gameState.diplomacy.proposePeace) {
                    this.gameState.diplomacy.proposePeace(countryId);
                    this.closeModal();
                }
            });
        });
        
        document.querySelectorAll('.propose-trade').forEach(button => {
            button.addEventListener('click', e => {
                const countryId = parseInt(e.target.getAttribute('data-country'));
                this.showTradeMenu(countryId);
            });
        });
    }
    
    /**
     * Confirm war declaration
     * @param {number} countryId - Country ID
     */
    confirmWarDeclaration(countryId) {
        if (!this.gameState || !this.gameState.map) return;
        
        const country = this.gameState.map.countries.find(c => c.id === countryId);
        if (!country) return;
        
        this.showModal({
            title: 'Confirm War Declaration',
            content: `
                <p>Are you sure you want to declare war on ${country.name}?</p>
                <p class="warning">This will significantly damage your diplomatic relations and may have severe consequences.</p>
            `,
            buttons: [
                {
                    label: 'Declare War',
                    class: 'modal-btn danger',
                    action: () => {
                        if (this.gameState.diplomacy && this.gameState.diplomacy.declareWar) {
                            this.gameState.diplomacy.declareWar(countryId);
                            this.showDiplomacyMenu(); // Refresh diplomacy menu
                        }
                    }
                },
                {
                    label: 'Cancel',
                    class: 'modal-cancel',
                    action: () => {}
                }
            ]
        });
    }
    
    /**
     * Show trade menu
     * @param {number} countryId - Country ID
     */
    showTradeMenu(countryId) {
        if (!this.gameState || !this.gameState.map || !this.gameState.resources) return;
        
        const country = this.gameState.map.countries.find(c => c.id === countryId);
        if (!country) return;
        
        // Generate trade interface
        this.showModal({
            title: `Trade with ${country.name}`,
            content: `
                <div class="trade-interface">
                    <div class="trade-section">
                        <h4>Offer Resources:</h4>
                        <div class="trade-resources offer">
                            ${Object.keys(this.gameState.resources.resources).map(resource => `
                                <div class="trade-resource">
                                    <label>
                                        ${this.capitalizeFirstLetter(resource)} 
                                        (Available: ${Math.floor(this.gameState.resources.resources[resource])})
                                    </label>
                                    <input type="number" class="offer-amount" data-resource="${resource}" 
                                           min="0" max="${Math.floor(this.gameState.resources.resources[resource])}" value="0">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="trade-section">
                        <h4>Request Resources:</h4>
                        <div class="trade-resources request">
                            ${Object.keys(this.gameState.resources.resources).map(resource => `
                                <div class="trade-resource">
                                    <label>${this.capitalizeFirstLetter(resource)}</label>
                                    <input type="number" class="request-amount" data-resource="${resource}" min="0" value="0">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `,
            buttons: [
                {
                    label: 'Propose Trade',
                    class: 'modal-accept',
                    action: () => this.proposeTrade(countryId)
                },
                {
                    label: 'Cancel',
                    class: 'modal-cancel',
                    action: () => {}
                }
            ]
        });
    }
    
    /**
     * Propose trade to country
     * @param {number} countryId - Country ID
     */
    proposeTrade(countryId) {
        if (!this.gameState || !this.gameState.diplomacy) return;
        
        // Gather offered resources
        const offeredResources = {};
        document.querySelectorAll('.offer-amount').forEach(input => {
            const resource = input.getAttribute('data-resource');
            const amount = parseInt(input.value) || 0;
            if (amount > 0) {
                offeredResources[resource] = amount;
            }
        });
        
        // Gather requested resources
        const requestedResources = {};
        document.querySelectorAll('.request-amount').forEach(input => {
            const resource = input.getAttribute('data-resource');
            const amount = parseInt(input.value) || 0;
            if (amount > 0) {
                requestedResources[resource] = amount;
            }
        });
        
        // Check if anything is being traded
        if (Object.keys(offeredResources).length === 0 && Object.keys(requestedResources).length === 0) {
            this.showNotification('Invalid Trade', 'You must offer or request at least one resource.', 'warning');
            return;
        }
        
        // Propose the trade
        if (this.gameState.diplomacy.proposeTrade) {
            this.gameState.diplomacy.proposeTrade(countryId, offeredResources, requestedResources);
        }
    }
    
    /**
    /**
     * Accept diplomatic offer
     * @param {Object} offer - The diplomatic offer
     */
    acceptDiplomaticOffer(offer) {
        if (!this.gameState || !this.gameState.diplomacy) return;
        
        if (this.gameState.diplomacy.acceptOffer) {
            this.gameState.diplomacy.acceptOffer(offer);
            this.addToEventLog(
                `You accepted the ${offer.type} offer from ${this.getCountryName(offer.fromCountry)}.`,
                'diplomatic'
            );
        }
    }
    
    /**
     * Reject diplomatic offer
     * @param {Object} offer - The diplomatic offer
     */
    rejectDiplomaticOffer(offer) {
        if (!this.gameState || !this.gameState.diplomacy) return;
        
        if (this.gameState.diplomacy.rejectOffer) {
            this.gameState.diplomacy.rejectOffer(offer);
            this.addToEventLog(
                `You rejected the ${offer.type} offer from ${this.getCountryName(offer.fromCountry)}.`,
                'diplomatic'
            );
        }
    }
    
    /**
     * Counter diplomatic offer
     * @param {Object} offer - The diplomatic offer
     */
    counterDiplomaticOffer(offer) {
        // For now just show a basic interface
        if (!this.gameState || !this.gameState.map || !this.gameState.resources) return;
        
        const fromCountry = this.gameState.map.countries.find(c => c.id === offer.fromCountry);
        if (!fromCountry) return;
        
        // Generate counter offer interface with adjusted resources
        this.showModal({
            title: `Counter offer to ${fromCountry.name}`,
            content: `
                <div class="counter-offer">
                    <p>Adjust the resources to make a counter offer:</p>
                    
                    <div class="trade-section">
                        <h4>You Offer:</h4>
                        <div class="trade-resources counter-offer">
                            ${Object.keys(this.gameState.resources.resources).map(resource => {
                                const requestedAmount = offer.requestedResources && offer.requestedResources[resource] || 0;
                                const maxAmount = Math.floor(this.gameState.resources.resources[resource]);
                                
                                return `
                                    <div class="trade-resource">
                                        <label>
                                            ${this.capitalizeFirstLetter(resource)} 
                                            (Available: ${maxAmount})
                                        </label>
                                        <input type="number" class="counter-offer-amount" data-resource="${resource}" 
                                               min="0" max="${maxAmount}" value="${Math.min(requestedAmount, maxAmount)}">
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <div class="trade-section">
                        <h4>You Request:</h4>
                        <div class="trade-resources counter-request">
                            ${Object.keys(this.gameState.resources.resources).map(resource => {
                                const offeredAmount = offer.offeredResources && offer.offeredResources[resource] || 0;
                                
                                return `
                                    <div class="trade-resource">
                                        <label>${this.capitalizeFirstLetter(resource)}</label>
                                        <input type="number" class="counter-request-amount" data-resource="${resource}" 
                                               min="0" value="${offeredAmount}">
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `,
            buttons: [
                {
                    label: 'Send Counter Offer',
                    class: 'modal-accept',
                    action: () => this.sendCounterOffer(offer)
                },
                {
                    label: 'Cancel',
                    class: 'modal-cancel',
                    action: () => {}
                }
            ]
        });
    }
    
    /**
     * Send counter offer
     * @param {Object} originalOffer - The original diplomatic offer
     */
    sendCounterOffer(originalOffer) {
        if (!this.gameState || !this.gameState.diplomacy) return;
        
        // Gather offered resources
        const offeredResources = {};
        document.querySelectorAll('.counter-offer-amount').forEach(input => {
            const resource = input.getAttribute('data-resource');
            const amount = parseInt(input.value) || 0;
            if (amount > 0) {
                offeredResources[resource] = amount;
            }
        });
        
        // Gather requested resources
        const requestedResources = {};
        document.querySelectorAll('.counter-request-amount').forEach(input => {
            const resource = input.getAttribute('data-resource');
            const amount = parseInt(input.value) || 0;
            if (amount > 0) {
                requestedResources[resource] = amount;
            }
        });
        
        // Create counter offer
        if (this.gameState.diplomacy.sendCounterOffer) {
            this.gameState.diplomacy.sendCounterOffer(
                originalOffer, 
                offeredResources, 
                requestedResources
            );
            
            this.addToEventLog(
                `You sent a counter offer to ${this.getCountryName(originalOffer.fromCountry)}.`,
                'diplomatic'
            );
        }
    }
    
    /**
     * Get country name by ID
     * @param {number} countryId - Country ID
     * @returns {string} Country name or "Unknown Country"
     */
    getCountryName(countryId) {
        if (!this.gameState || !this.gameState.map) return 'Unknown Country';
        
        const country = this.gameState.map.countries.find(c => c.id === countryId);
        return country ? country.name : 'Unknown Country';
    }
    
    /**
     * Capitalize first letter of a string
     * @param {string} string - String to capitalize
     * @returns {string} Capitalized string
     */
    capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    /**
     * Update the resource information panel
     */
    updateResourcePanel() {
        if (!this.gameState || !this.gameState.resources) return;
        
        // Update each resource display
        for (const resource in this.gameState.resources.resources) {
            this.updateResourceDisplay(resource);
        }
    }
    
    /**
     * Update single resource display
     * @param {string} resourceType - Type of resource to update
     */
    updateResourceDisplay(resourceType) {
        if (!this.gameState || !this.gameState.resources) return;
        
        const resourceElement = document.getElementById(`${resourceType}-value`);
        const rateElement = document.getElementById(`${resourceType}-rate`);
        
        if (resourceElement) {
            resourceElement.textContent = Math.floor(this.gameState.resources.resources[resourceType]);
        }
        
        if (rateElement) {
            const rate = this.gameState.resources.resourceRates[resourceType];
            rateElement.textContent = `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}/s`;
            
            // Update class based on rate
            rateElement.className = 'resource-rate';
            if (rate > 0) rateElement.classList.add('positive');
            if (rate < 0) rateElement.classList.add('negative');
        }
    }
    
    /**
     * Update worker assignment display
     */
    updateWorkerDisplay() {
        if (!this.gameState || !this.gameState.resources || !this.gameState.resources.workers) return;
        
        // Update worker counts
        for (const workerType in this.gameState.resources.workers) {
            const countElement = document.getElementById(`${workerType}-count`);
            if (countElement) {
                countElement.textContent = this.gameState.resources.workers[workerType];
            }
            
            // Update add button state - can always add workers for now
            // In a full implementation, you'd check max worker constraints
            
            // Update remove button state - can't remove if 0 workers
            const removeButton = document.querySelector(`.worker-remove[data-worker-type="${workerType}"]`);
            if (removeButton) {
                removeButton.disabled = this.gameState.resources.workers[workerType] <= 0;
            }
        }
    }
    
    /**
     * Add event log section to UI if it doesn't exist
     */
    createEventLog() {
        let eventLogContainer = document.getElementById('event-log-container');
        
        if (!eventLogContainer) {
            eventLogContainer = document.createElement('div');
            eventLogContainer.id = 'event-log-container';
            eventLogContainer.className = 'event-log-container';
            
            const header = document.createElement('h3');
            header.textContent = 'Event Log';
            
            const eventLog = document.createElement('div');
            eventLog.id = 'event-log';
            eventLog.className = 'event-log';
            
            eventLogContainer.appendChild(header);
            eventLogContainer.appendChild(eventLog);
            
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.appendChild(eventLogContainer);
            }
        }
    }
    
    /**
     * Initialize status bar at bottom of screen
     */
    initializeStatusBar() {
        let statusBar = document.getElementById('status-bar');
        
        if (!statusBar) {
            statusBar = document.createElement('div');
            statusBar.id = 'status-bar';
            statusBar.className = 'status-bar';
            
            const gameInfo = document.createElement('div');
            gameInfo.id = 'game-info';
            gameInfo.className = 'game-info';
            gameInfo.innerHTML = `<span id="game-date">Year 1, Spring</span> | <span id="game-speed">1x</span>`;
            
            const statusInfo = document.createElement('div');
            statusInfo.id = 'status-info';
            statusInfo.className = 'status-info';
            statusInfo.innerHTML = `<span id="status-message">Kingdom is stable</span>`;
            
            statusBar.appendChild(gameInfo);
            statusBar.appendChild(statusInfo);
            
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer) {
                gameContainer.appendChild(statusBar);
            } else {
                document.body.appendChild(statusBar);
            }
        }
    }
    
    /**
     * Update game date display
     * @param {number} year - Game year
     * @param {string} season - Game season
     */
    updateGameDate(year, season) {
        const gameDateElement = document.getElementById('game-date');
        if (gameDateElement) {
            gameDateElement.textContent = `Year ${year}, ${season}`;
        }
    }
    
    /**
     * Update game status message
     * @param {string} message - Status message
     * @param {string} type - Message type (normal, warning, critical)
     */
    updateStatusMessage(message, type = 'normal') {
        const statusMessageElement = document.getElementById('status-message');
        if (statusMessageElement) {
            statusMessageElement.textContent = message;
            statusMessageElement.className = ''; // Reset classes
            statusMessageElement.classList.add(type);
        }
    }
    
    /**
     * Show tooltip with information
     * @param {HTMLElement} element - Element to attach tooltip to
     * @param {string} content - Tooltip content
     */
    showTooltip(element, content) {
        let tooltip = document.getElementById('tooltip');
        
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'tooltip';
            tooltip.className = 'tooltip';
            document.body.appendChild(tooltip);
        }
        
        tooltip.innerHTML = content;
        tooltip.style.display = 'block';
        
        const updatePosition = (e) => {
            const x = e.clientX + 15;
            const y = e.clientY + 15;
            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y}px`;
        };
        
        element.addEventListener('mousemove', updatePosition);
        
        element.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
            element.removeEventListener('mousemove', updatePosition);
        });
        
        // Initial position
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.right + 5}px`;
        tooltip.style.top = `${rect.top}px`;
    }
}