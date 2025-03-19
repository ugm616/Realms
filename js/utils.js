/**
 * Utility functions for the Fantasy Realm game
 */
const Utils = {
    /**
     * Generates a random integer between min and max (inclusive)
     */
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    /**
     * Generates a random float between min and max
     */
    randomFloat: function(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    /**
     * Returns true with the given probability (0-1)
     */
    chance: function(probability) {
        return Math.random() < probability;
    },
    
    /**
     * Picks a random item from an array
     */
    randomChoice: function(array) {
        return array[Math.floor(Math.random() * array.length)];
    },
    
    /**
     * Generates a random color in hex format
     */
    randomColor: function() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    },
    
    /**
     * Formats a number with commas for thousands separators
     */
    formatNumber: function(num) {
        return num.toLocaleString();
    },
    
    /**
     * Generates a fantasy country name
     */
    generateCountryName: function() {
        const prefixes = ['Eld', 'Aer', 'Syl', 'Dra', 'Kry', 'Myr', 'Ith', 'Val', 'Zor', 'Thal', 
                         'Ar', 'Bre', 'Cae', 'Dun', 'Eth', 'Fro', 'Gil', 'Hav', 'Ir', 'Jor'];
        
        const suffixes = ['oria', 'anth', 'vain', 'mor', 'stal', 'thas', 'lodor', 'rain', 'gard', 'heim',
                         'land', 'mark', 'ren', 'wyn', 'dale', 'ton', 'shire', 'vale', 'crest', 'haven'];
        
        return Utils.randomChoice(prefixes) + Utils.randomChoice(suffixes);
    },
    
    /**
     * Calculates the distance between two points
     */
    distance: function(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },
    
    /**
     * Shows a modal with the given content
     */
    showModal: function(content) {
        const modalContainer = document.getElementById('modal-container');
        const modalBody = document.querySelector('.modal-body');
        
        modalBody.innerHTML = content;
        modalContainer.classList.remove('hidden');
        
        // Close modal when clicking X
        document.querySelector('.close-modal').addEventListener('click', () => {
            modalContainer.classList.add('hidden');
        });
        
        // Close modal when clicking outside
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                modalContainer.classList.add('hidden');
            }
        });
    }
};