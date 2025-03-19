/**
 * Configuration settings for the Fantasy Realm game
 */
const CONFIG = {
    // Game settings
    GAME_NAME: "Fantasy Realm",
    STARTING_GOLD: 1000,
    TICK_RATE: 1000, // milliseconds between game ticks
    
    // World map settings
    MAP_WIDTH: 2000,
    MAP_HEIGHT: 1500,
    COUNTRY_COUNT: 40,
    
    // Resource settings
    RESOURCE_TYPES: [
        { id: 'gold', name: 'Gold', icon: 'fa-coins' },
        { id: 'wood', name: 'Wood', icon: 'fa-tree' },
        { id: 'iron', name: 'Iron', icon: 'fa-hammer' },
        { id: 'gems', name: 'Gems', icon: 'fa-gem' },
        { id: 'stone', name: 'Stone', icon: 'fa-mountain' },
        { id: 'food', name: 'Food', icon: 'fa-apple-alt' },
        { id: 'magic', name: 'Magic', icon: 'fa-hat-wizard' }
    ],
    
    // Worker settings
    WORKER_TYPES: [
        { id: 'woodcutter', name: 'Woodcutter', resource: 'wood', baseProduction: 2 },
        { id: 'miner', name: 'Miner', resource: 'iron', baseProduction: 1 },
        { id: 'gemcollector', name: 'Gem Collector', resource: 'gems', baseProduction: 0.2 },
        { id: 'stonemason', name: 'Stonemason', resource: 'stone', baseProduction: 1.5 },
        { id: 'farmer', name: 'Farmer', resource: 'food', baseProduction: 3 },
        { id: 'mage', name: 'Mage', resource: 'magic', baseProduction: 0.1 }
    ],
    
    // Country trait probabilities
    COUNTRY_TRAITS: {
        WARLIKE: 0.25, // Chance of a country being aggressive
        TRADER: 0.35,  // Chance of a country preferring trade
        DIPLOMATIC: 0.3, // Chance of a country being diplomatic
        ISOLATIONIST: 0.1 // Chance of a country being isolationist
    },
    
    // Resource distribution settings
    RESOURCE_DISTRIBUTION: {
        // Probability of a country having abundance in a resource
        ABUNDANCE_CHANCE: 0.3,
        // Multiplier for resource production when abundant
        ABUNDANCE_MULTIPLIER: 2.5
    },
    
    // Diplomatic settings
    DIPLOMACY: {
        ALLIANCE_THRESHOLD: 75, // Friendship level needed for alliance
        WAR_THRESHOLD: -50,     // Friendship level that can trigger war
        INITIAL_FRIENDSHIP_MIN: 0,
        INITIAL_FRIENDSHIP_MAX: 30
    }
};