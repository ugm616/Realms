/**
 * World map handling for Fantasy Realm game
 */
class WorldMap {
    constructor(containerId, gameState) {
        this.container = document.getElementById(containerId);
        this.gameState = gameState;
        this.width = CONFIG.MAP_WIDTH;
        this.height = CONFIG.MAP_HEIGHT;
        this.countries = [];
        this.selectedCountry = null;
        this.mapGroup = null;
        this.continents = [];
        this.seaLevel = 0.4; // Threshold for sea vs. land
        this.noiseScale = 0.004; // Scale for Perlin noise
        
        // Set up SVG container
        this.setupSVG();
        
        // Add event listeners
        this.addEventListeners();
    }
    
    /**
     * Set up the SVG element for the world map
     */
    setupSVG() {
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        this.svg.style.backgroundColor = '#1a4875'; // Deep ocean color
        
        // Create definitions for patterns and gradients
        this.defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Water pattern
        const waterPattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        waterPattern.setAttribute('id', 'water-pattern');
        waterPattern.setAttribute('patternUnits', 'userSpaceOnUse');
        waterPattern.setAttribute('width', '100');
        waterPattern.setAttribute('height', '100');
        
        const waterRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        waterRect.setAttribute('width', '100');
        waterRect.setAttribute('height', '100');
        waterRect.setAttribute('fill', '#1a4875');
        
        waterPattern.appendChild(waterRect);
        
        // Add subtle wave lines to water
        for (let i = 0; i < 5; i++) {
            const wavePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const yPos = 10 + i * 20;
            wavePath.setAttribute('d', `M0,${yPos} Q25,${yPos-5} 50,${yPos} T100,${yPos}`);
            wavePath.setAttribute('stroke', '#2a5885');
            wavePath.setAttribute('stroke-width', '1');
            wavePath.setAttribute('fill', 'none');
            waterPattern.appendChild(wavePath);
        }
        
        this.defs.appendChild(waterPattern);
        this.svg.appendChild(this.defs);
        
        // Create base layers
        this.baseGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.baseGroup.classList.add('base-group');
        this.svg.appendChild(this.baseGroup);
        
        // Create terrain layer
        this.terrainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.terrainGroup.classList.add('terrain-group');
        this.svg.appendChild(this.terrainGroup);
        
        // Create map group for countries
        this.mapGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.mapGroup.classList.add('country-group');
        this.svg.appendChild(this.mapGroup);
        
        // Create labels group (on top)
        this.labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.labelGroup.classList.add('label-group');
        this.svg.appendChild(this.labelGroup);
        
        this.container.appendChild(this.svg);
        
        // Add base grid lines
        this.addBaseLayers();
    }
    
    /**
     * Add base decorative layers to the map
     */
    addBaseLayers() {
        // Add grid lines for longitude/latitude effect
        const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gridGroup.classList.add('grid-lines');
        
        // Add longitude lines
        for (let x = 0; x < this.width; x += 200) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', x);
            line.setAttribute('y2', this.height);
            line.setAttribute('stroke', 'rgba(180, 210, 230, 0.15)');
            line.setAttribute('stroke-width', '1');
            gridGroup.appendChild(line);
        }
        
        // Add latitude lines
        for (let y = 0; y < this.height; y += 200) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', y);
            line.setAttribute('x2', this.width);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', 'rgba(180, 210, 230, 0.15)');
            line.setAttribute('stroke-width', '1');
            gridGroup.appendChild(line);
        }
        
        this.baseGroup.appendChild(gridGroup);
    }
    
    /**
     * Generate world terrain and continents
     */
    generateTerrain() {
        console.log("Generating terrain...");
        // Create a simple noise function if we don't have a proper perlin noise library
        const noise = (x, y) => {
            // Simple pseudo-noise function (not as good as Perlin but works for demonstration)
            return 0.5 * (Math.sin(x * 0.01) + Math.sin(y * 0.01) + 
                   Math.sin(x * 0.02 + y * 0.01) + Math.sin(y * 0.03 + x * 0.01));
        };
        
        // Create the ocean base
        const ocean = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        ocean.setAttribute('x', '0');
        ocean.setAttribute('y', '0');
        ocean.setAttribute('width', this.width);
        ocean.setAttribute('height', this.height);
        ocean.setAttribute('fill', 'url(#water-pattern)');
        this.terrainGroup.appendChild(ocean);
        
        // Generate continents using noise
        const continentCount = 4 + Math.floor(Math.random() * 3); // 4-6 continents
        const continentSeeds = [];
        
        // Generate continent seeds (centers)
        for (let i = 0; i < continentCount; i++) {
            continentSeeds.push({
                x: this.width * (0.1 + 0.8 * Math.random()),
                y: this.height * (0.1 + 0.8 * Math.random()),
                size: 0.5 + Math.random() * 0.5 // Relative size factor
            });
        }
        
        // Generate landmass for each continent
        for (let i = 0; i < continentSeeds.length; i++) {
            const seed = continentSeeds[i];
            const continentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            continentGroup.classList.add('continent');
            continentGroup.setAttribute('data-continent-id', i);
            
            // Generate continent shape
            const continentPoints = this.generateContinentShape(seed, noise);
            const continent = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            
            continent.setAttribute('points', continentPoints.map(p => `${p.x},${p.y}`).join(' '));
            continent.setAttribute('fill', '#76A665'); // Base continent color
            continent.setAttribute('stroke', '#5D8A4F');
            continent.setAttribute('stroke-width', '3');
            
            continentGroup.appendChild(continent);
            this.terrainGroup.appendChild(continentGroup);
            
            // Store continent data
            this.continents.push({
                id: i,
                seed: seed,
                points: continentPoints,
                element: continent,
                countries: [],
                boundingBox: this.calculateBoundingBox(continentPoints)
            });
        }
        
        // Add some terrain features
        this.addTerrainFeatures();
    }
    
    /**
     * Calculate a polygon's bounding box
     */
    calculateBoundingBox(points) {
        let minX = this.width;
        let minY = this.height;
        let maxX = 0;
        let maxY = 0;
        
        points.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2
        };
    }
    
    /**
     * Generate a realistic continent shape
     */
    generateContinentShape(seed, noiseFunction) {
        const points = [];
        const numPoints = 24 + Math.floor(Math.random() * 12); // 24-36 points
        const baseRadius = Math.min(this.width, this.height) * 0.15 * seed.size;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            
            // Use noise to create irregular coastlines
            const noiseVal = 0.6 + 0.4 * noiseFunction(
                seed.x + Math.cos(angle) * 100, 
                seed.y + Math.sin(angle) * 100
            );
            
            const radius = baseRadius * noiseVal;
            
            const x = seed.x + Math.cos(angle) * radius;
            const y = seed.y + Math.sin(angle) * radius;
            points.push({ x, y });
        }
        
        return points;
    }
    
    /**
     * Add mountains, forests, and other terrain features
     */
    addTerrainFeatures() {
        // Add a few mountain ranges
        this.continents.forEach(continent => {
            // 50% chance of having mountains
            if (Math.random() > 0.5) {
                const mountainCount = 5 + Math.floor(Math.random() * 10);
                const mountainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                mountainGroup.classList.add('mountains');
                
                const centerX = continent.boundingBox.centerX;
                const centerY = continent.boundingBox.centerY;
                const spreadX = continent.boundingBox.width * 0.3;
                const spreadY = continent.boundingBox.height * 0.3;
                
                // Generate a mountain range
                for (let i = 0; i < mountainCount; i++) {
                    const x = centerX + (Math.random() - 0.5) * spreadX;
                    const y = centerY + (Math.random() - 0.5) * spreadY;
                    const size = 5 + Math.random() * 10;
                    
                    // Check if point is inside the continent
                    if (this.isPointInPolygon({x, y}, continent.points)) {
                        const mountain = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        
                        // Simple triangle for mountain
                        const points = [
                            `${x},${y - size * 1.5}`,
                            `${x - size},${y + size}`,
                            `${x + size},${y + size}`
                        ].join(' ');
                        
                        mountain.setAttribute('points', points);
                        mountain.setAttribute('fill', '#9E9E9E');
                        mountain.setAttribute('stroke', '#696969');
                        mountain.setAttribute('stroke-width', '1');
                        
                        mountainGroup.appendChild(mountain);
                    }
                }
                
                this.terrainGroup.appendChild(mountainGroup);
            }
            
            // 70% chance of having forests
            if (Math.random() > 0.3) {
                const forestCount = 5 + Math.floor(Math.random() * 10);
                const forestGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                forestGroup.classList.add('forests');
                
                // Generate a forest area
                for (let i = 0; i < forestCount; i++) {
                    const x = continent.boundingBox.x + Math.random() * continent.boundingBox.width;
                    const y = continent.boundingBox.y + Math.random() * continent.boundingBox.height;
                    const size = 10 + Math.random() * 15;
                    
                    // Check if point is inside the continent
                    if (this.isPointInPolygon({x, y}, continent.points)) {
                        const forest = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        
                        forest.setAttribute('cx', x);
                        forest.setAttribute('cy', y);
                        forest.setAttribute('r', size);
                        forest.setAttribute('fill', '#2E7D32');
                        forest.setAttribute('fill-opacity', '0.7');
                        
                        forestGroup.appendChild(forest);
                    }
                }
                
                this.terrainGroup.appendChild(forestGroup);
            }
        });
    }
    
    /**
     * Check if a point is inside a polygon
     */
    isPointInPolygon(point, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            
            const intersect = ((yi > point.y) !== (yj > point.y))
                && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
                
            if (intersect) inside = !inside;
        }
        return inside;
    }
    
    /**
     * Generate countries and place them on the map
     */
    generateCountries() {
        console.log("Generating countries...");
        
        // First ensure we have terrain
        if (this.continents.length === 0) {
            this.generateTerrain();
        }
        
        // Clear existing countries
        this.countries = [];
        
        // Determine countries per continent (based on size)
        this.continents.forEach(continent => {
            const continentArea = continent.boundingBox.width * continent.boundingBox.height;
            const maxCountries = Math.max(2, Math.min(12, Math.floor(continentArea / 40000)));
            continent.maxCountries = maxCountries;
        });
        
        // Find continent for player's country (prefer larger ones)
        this.continents.sort((a, b) => 
            (b.boundingBox.width * b.boundingBox.height) - 
            (a.boundingBox.width * a.boundingBox.height)
        );
        
        // Place player in one of the largest continents (first or second)
        const playerContinent = Math.random() < 0.7 ? this.continents[0] : this.continents[1];
        
        // Create player country first
        const playerCountry = new Country(0, 'Eldoria', {
            x: playerContinent.boundingBox.centerX,
            y: playerContinent.boundingBox.centerY,
            size: 10,
            color: '#4b86b4',
            isPlayer: true
        });
        
        this.countries.push(playerCountry);
        playerContinent.countries.push(playerCountry);
        
        // Now divide continents into countries using Voronoi-like approach
        let countryId = 1;
        
        this.continents.forEach(continent => {
            const continentCountries = continent.countries.length;
            const remainingCountries = continent.maxCountries - continentCountries;
            
            for (let i = 0; i < remainingCountries; i++) {
                // Find a position within the continent
                let x, y;
                let attempts = 0;
                let validPosition = false;
                
                while (!validPosition && attempts < 50) {
                    x = continent.boundingBox.x + Math.random() * continent.boundingBox.width;
                    y = continent.boundingBox.y + Math.random() * continent.boundingBox.height;
                    
                    // Check if position is inside continent
                    if (this.isPointInPolygon({x, y}, continent.points)) {
                        // Check if not too close to existing countries
                        let tooClose = false;
                        for (const country of continent.countries) {
                            const dist = Utils.distance(x, y, country.x, country.y);
                            if (dist < 100) { // Minimum distance between countries
                                tooClose = true;
                                break;
                            }
                        }
                        
                        if (!tooClose) {
                            validPosition = true;
                        }
                    }
                    
                    attempts++;
                }
                
                if (validPosition) {
                    const country = new Country(countryId++, null, {
                        x: x,
                        y: y,
                        size: Utils.randomInt(6, 9),
                        continentId: continent.id
                    });
                    
                    this.countries.push(country);
                    continent.countries.push(country);
                }
            }
        });
        
        // Now draw all countries
        this.drawCountries();
    }
    
    /**
     * Draw or redraw all countries on the map using Voronoi-like regions
     */
    drawCountries() {
        // Ensure map group is clear
        while (this.mapGroup.firstChild) {
            this.mapGroup.removeChild(this.mapGroup.firstChild);
        }
        
        // Clear labels too
        while (this.labelGroup.firstChild) {
            this.labelGroup.removeChild(this.labelGroup.firstChild);
        }
        
        // Draw each country with its territory based on continent
        this.continents.forEach(continent => {
            if (continent.countries.length === 0) return;
            
            // Special case: if only one country, it gets the whole continent
            if (continent.countries.length === 1) {
                const country = continent.countries[0];
                const territory = this.createCountryPolygon(continent.points, country);
                this.mapGroup.appendChild(territory);
                country.polygonElement = territory;
                country.territory = continent.points;
                
                // Add capital marker
                this.addCapitalMarker(country);
                
                // Add label
                this.addCountryLabel(country);
                
                return;
            }
            
            // If multiple countries, divide the continent
            const countryTerritories = this.divideContinent(continent);
            
            // Draw each country's territory
            continent.countries.forEach((country, index) => {
                if (index < countryTerritories.length) {
                    const territory = this.createCountryPolygon(countryTerritories[index], country);
                    this.mapGroup.appendChild(territory);
                    country.polygonElement = territory;
                    country.territory = countryTerritories[index];
                    
                    // Add capital marker
                    this.addCapitalMarker(country);
                    
                    // Add label
                    this.addCountryLabel(country);
                }
            });
            
            // Add borders between countries
            this.addCountryBorders(continent);
        });
    }
    
    /**
     * Divide a continent into separate country territories using Voronoi-like approach
     */
    divideContinent(continent) {
        const territories = [];
        const boundingBox = continent.boundingBox;
        const resolution = 10; // Resolution of the grid for dividing
        
        // Create a grid covering the continent
        const gridWidth = Math.ceil(boundingBox.width / resolution);
        const gridHeight = Math.ceil(boundingBox.height / resolution);
        const grid = Array(gridWidth * gridHeight).fill(-1);
        
        // For each point in the grid, find the closest country
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                const worldX = boundingBox.x + x * resolution;
                const worldY = boundingBox.y + y * resolution;
                
                // Skip if outside continent
                if (!this.isPointInPolygon({x: worldX, y: worldY}, continent.points)) {
                    continue;
                }
                
                // Find closest country
                let closestCountry = -1;
                let closestDist = Number.MAX_VALUE;
                
                continent.countries.forEach((country, i) => {
                    const dist = Utils.distance(worldX, worldY, country.x, country.y);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestCountry = i;
                    }
                });
                
                if (closestCountry !== -1) {
                    grid[y * gridWidth + x] = closestCountry;
                }
            }
        }
        
        // Initialize territories array
        for (let i = 0; i < continent.countries.length; i++) {
            territories.push([]);
        }
        
        // Now trace the outline of each country's territory
        const visited = new Set();
        
        const findBoundaryPoints = (countryIndex) => {
            const points = [];
            
            // Check each grid cell
            for (let x = 0; x < gridWidth; x++) {
                for (let y = 0; y < gridHeight; y++) {
                    if (grid[y * gridWidth + x] !== countryIndex) continue;
                    
                    // Check if this is a boundary cell (adjacent to another country or edge)
                    let isBoundary = false;
                    
                    for (let nx = Math.max(0, x-1); nx <= Math.min(gridWidth-1, x+1); nx++) {
                        for (let ny = Math.max(0, y-1); ny <= Math.min(gridHeight-1, y+1); ny++) {
                            if (nx === x && ny === y) continue;
                            
                            const neighborIndex = grid[ny * gridWidth + nx];
                            if (neighborIndex === -1 || neighborIndex !== countryIndex) {
                                isBoundary = true;
                                break;
                            }
                        }
                        if (isBoundary) break;
                    }
                    
                    if (isBoundary) {
                        points.push({
                            x: boundingBox.x + x * resolution, 
                            y: boundingBox.y + y * resolution
                        });
                    }
                }
            }
            
            // Use convex hull or similar algorithm to form a proper polygon
            // For simplicity, we'll just use the country center and sort points by angle
            const country = continent.countries[countryIndex];
            points.sort((a, b) => {
                const angleA = Math.atan2(a.y - country.y, a.x - country.x);
                const angleB = Math.atan2(b.y - country.y, b.x - country.x);
                return angleA - angleB;
            });
            
            return points;
        };
        
        // Get boundary points for each country
        for (let i = 0; i < continent.countries.length; i++) {
            const boundaryPoints = findBoundaryPoints(i);
            territories[i] = boundaryPoints.length > 2 ? boundaryPoints : 
                this.generateSimplifiedCountryShape(continent.countries[i]);
        }
        
        return territories;
    }
    
    /**
     * Generate a simplified country shape if the territory algorithm fails
     */
    generateSimplifiedCountryShape(country) {
        const points = [];
        const numPoints = 8 + Math.floor(Math.random() * 4);
        const baseRadius = 50 + Math.random() * 30;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const radiusVariation = 0.8 + Math.random() * 0.4;
            const radius = baseRadius * radiusVariation;
            
            const x = country.x + Math.cos(angle) * radius;
            const y = country.y + Math.sin(angle) * radius;
            points.push({ x, y });
        }
        
        return points;
    }
    
    /**
     * Create a polygon element for a country
     */
    createCountryPolygon(points, country) {
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        
        // Set points attribute for the polygon
        polygon.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(' '));
        polygon.setAttribute('fill', country.color);
        polygon.setAttribute('stroke', '#333');
        polygon.setAttribute('stroke-width', '1');
        polygon.setAttribute('data-country-id', country.id);
        
        // Add interaction classes
        polygon.classList.add('country');
        if (country.isPlayer) {
            polygon.classList.add('player-country');
        }
        
        // Check for diplomatic status and add appropriate styling
        if (this.gameState && this.gameState.diplomacy) {
            if (this.gameState.diplomacy.areAllied && this.gameState.diplomacy.areAllied(0, country.id)) {
                polygon.classList.add('allied-country');
            } else if (this.gameState.diplomacy.areAtWar && this.gameState.diplomacy.areAtWar(0, country.id)) {
                polygon.classList.add('enemy-country');
            }
        }
        
        // Add event listeners for the country
        polygon.addEventListener('click', () => this.onCountryClick(country));
        polygon.addEventListener('mouseover', () => this.onCountryHover(country, true));
        polygon.addEventListener('mouseout', () => this.onCountryHover(country, false));
        
        return polygon;
    }
    
    /**
     * Add borders between countries within a continent
     */
    addCountryBorders(continent) {
        const borderGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        borderGroup.classList.add('country-borders');
        
        // For each pair of countries, draw borders
        for (let i = 0; i < continent.countries.length; i++) {
            for (let j = i + 1; j < continent.countries.length; j++) {
                const country1 = continent.countries[i];
                const country2 = continent.countries[j];
                
                // Check if territories are adjacent
                if (this.areCountriesAdjacent(country1, country2)) {
                    // Add country as neighbor
                    if (!country1.neighbors) country1.neighbors = [];
                    if (!country2.neighbors) country2.neighbors = [];
                    
                    country1.neighbors.push(country2.id);
                    country2.neighbors.push(country1.id);
                    
                    // Draw border - we'll use a simplified approach with a line between centers
                    const border = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    border.setAttribute('x1', country1.x);
                    border.setAttribute('y1', country1.y);
                    border.setAttribute('x2', country2.x);
                    border.setAttribute('y2', country2.y);
                    border.setAttribute('stroke', '#333');
                    border.setAttribute('stroke-width', '2');
                    border.setAttribute('stroke-dasharray', '5,3');
                    border.setAttribute('data-country1', country1.id);
                    border.setAttribute('data-country2', country2.id);
                    
                    borderGroup.appendChild(border);
                }
            }
        }
        
        this.mapGroup.appendChild(borderGroup);
    }
    
    /**
     * Check if two countries are adjacent (share a border)
     * This is a simplified approach - for a full game you'd want a more accurate method
     */
    areCountriesAdjacent(country1, country2) {
        // For simplicity, we'll just check distance between countries
        // In a real implementation, you would check if their territories share an edge
        const dist = Utils.distance(country1.x, country1.y, country2.x, country2.y);
        return dist < 150; // Threshold for being considered adjacent
    }
    
    /**
     * Add a capital marker for a country
     */
    addCapitalMarker(country) {
        // Find a good spot for the capital (using country center for now)
        const capitalX = country.x;
        const capitalY = country.y;
        
        // Create capital marker
        const capitalGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        capitalGroup.classList.add('capital-marker');
        
        const capitalCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        capitalCircle.setAttribute('cx', capitalX);
        capitalCircle.setAttribute('cy', capitalY);
        capitalCircle.setAttribute('r', country.isPlayer ? 6 : 4);
        capitalCircle.setAttribute('fill', country.isPlayer ? 'gold' : 'white');
                capitalCircle.setAttribute('stroke', 'black');
        capitalCircle.setAttribute('stroke-width', '1');
        
        // Add star shape for capital
        const starPoints = this.generateStarPoints(capitalX, capitalY, country.isPlayer ? 8 : 6, country.isPlayer ? 3 : 2);
        const star = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        star.setAttribute('points', starPoints);
        star.setAttribute('fill', country.isPlayer ? 'gold' : 'white');
        star.setAttribute('stroke', 'black');
        star.setAttribute('stroke-width', '0.5');
        
        capitalGroup.appendChild(capitalCircle);
        capitalGroup.appendChild(star);
        
        // Store capital position in country
        country.capitalX = capitalX;
        country.capitalY = capitalY;
        
        // Add to map
        this.mapGroup.appendChild(capitalGroup);
        
        return capitalGroup;
    }
    
    /**
     * Generate points for a star shape
     */
    generateStarPoints(centerX, centerY, outerRadius, innerRadius) {
        const points = [];
        const numPoints = 5;
        const angleStep = Math.PI / numPoints;
        
        for (let i = 0; i < numPoints * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = i * angleStep;
            
            const x = centerX + radius * Math.sin(angle);
            const y = centerY + radius * Math.cos(angle);
            
            points.push(`${x},${y}`);
        }
        
        return points.join(' ');
    }
    
    /**
     * Add a country label to the map
     */
    addCountryLabel(country) {
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.setAttribute('x', country.x);
        textElement.setAttribute('y', country.y + 20); // Position below the capital
        textElement.setAttribute('text-anchor', 'middle');
        textElement.setAttribute('dominant-baseline', 'middle');
        textElement.setAttribute('fill', '#fff');
        textElement.setAttribute('stroke', '#000');
        textElement.setAttribute('stroke-width', '0.5');
        textElement.setAttribute('font-size', `${10 + country.size}px`);
        textElement.textContent = country.name;
        
        // Store reference to label element
        country.textElement = textElement;
        
        this.labelGroup.appendChild(textElement);
        return textElement;
    }
    
    /**
     * Handle country click event
     */
    onCountryClick(country) {
        // Deselect previous country
        if (this.selectedCountry) {
            this.selectedCountry.polygonElement.classList.remove('selected');
        }
        
        // Select new country
        this.selectedCountry = country;
        country.polygonElement.classList.add('selected');
        
        // Show country info in the panel
        this.updateCountryPanel(country);
        
        // Dispatch event for other modules
        const event = new CustomEvent('countrySelected', { detail: country });
        document.dispatchEvent(event);
    }
    
    /**
     * Handle country hover event
     */
    onCountryHover(country, isHovering) {
        if (isHovering) {
            country.polygonElement.classList.add('hovered');
            
            // Make text larger on hover
            if (country.textElement) {
                country.textElement.setAttribute('font-size', `${12 + country.size}px`);
                country.textElement.setAttribute('font-weight', 'bold');
            }
        } else {
            country.polygonElement.classList.remove('hovered');
            
            // Return text to normal size
            if (country.textElement) {
                country.textElement.setAttribute('font-size', `${10 + country.size}px`);
                country.textElement.setAttribute('font-weight', 'normal');
            }
        }
    }
    
    /**
     * Update the country information panel
     */
    updateCountryPanel(country) {
        const countryNameElement = document.getElementById('selected-country-name');
        const countryDetailsElement = document.getElementById('country-details');
        const diplomaticActionsElement = document.getElementById('diplomatic-actions');
        
        if (!countryNameElement || !countryDetailsElement) return;
        
        countryNameElement.textContent = country.name;
        
        // Show country panel if it was hidden
        const countryInfoElement = document.querySelector('.country-info');
        if (countryInfoElement) {
            countryInfoElement.classList.remove('hidden');
        }
        
        // Generate details about the country
        let detailsHTML = `
            <div class="country-stat">
                <span>Size:</span>
                <span>${country.size} (${this.getSizeDescription(country.size)})</span>
            </div>
            <div class="country-stat">
                <span>Primary Resources:</span>
                <span>${this.getPrimaryResourcesText(country)}</span>
            </div>
            <div class="country-stat">
                <span>Personality:</span>
                <span>${country.personality || 'Unknown'}</span>
            </div>
        `;
        
        // Add relationship status if not player's country
        if (!country.isPlayer) {
            detailsHTML += `
                <div class="country-stat">
                    <span>Relationship:</span>
                    <span>${this.getRelationshipText(country)}</span>
                </div>
            `;
            
            // Show diplomatic actions
            if (diplomaticActionsElement) {
                diplomaticActionsElement.classList.remove('hidden');
            }
        } else {
            // Hide diplomatic actions for player's own country
            if (diplomaticActionsElement) {
                diplomaticActionsElement.classList.add('hidden');
            }
        }
        
        countryDetailsElement.innerHTML = detailsHTML;
    }
    
    /**
     * Get text description of country size
     */
    getSizeDescription(size) {
        if (size >= 9) return 'Massive';
        if (size >= 7) return 'Large';
        if (size >= 5) return 'Medium';
        return 'Small';
    }
    
    /**
     * Get text listing primary resources of a country
     */
    getPrimaryResourcesText(country) {
        // Mock implementation - will be replaced with actual resource data
        const resources = [];
        
        // Check for resource abundance in the country
        for (const resourceId in country.resources) {
            if (country.resources[resourceId] > 1.5) {
                const resourceInfo = CONFIG.RESOURCE_TYPES.find(r => r.id === resourceId);
                if (resourceInfo) {
                    resources.push(resourceInfo.name);
                }
            }
        }
        
        return resources.length > 0 ? resources.join(', ') : 'None';
    }
    
    /**
     * Get text description of relationship with a country
     */
    getRelationshipText(country) {
        // Implementation based on diplomacy system
        let relationshipValue = 0;
        
        if (this.gameState && this.gameState.diplomacy) {
            relationshipValue = this.gameState.diplomacy.getRelationship(0, country.id) || 0;
        }
        
        if (relationshipValue >= 75) return 'Allied';
        if (relationshipValue >= 50) return 'Friendly';
        if (relationshipValue >= 20) return 'Cordial';
        if (relationshipValue >= -20) return 'Neutral';
        if (relationshipValue >= -50) return 'Unfriendly';
        if (relationshipValue >= -75) return 'Hostile';
        return 'At War';
    }
    
    /**
     * Add event listeners for map controls
     */
    addEventListeners() {
        // Zoom controls
        const zoomIn = document.getElementById('zoom-in');
        const zoomOut = document.getElementById('zoom-out');
        
        if (zoomIn) {
            zoomIn.addEventListener('click', () => this.zoom(1.2));
        }
        
        if (zoomOut) {
            zoomOut.addEventListener('click', () => this.zoom(0.8));
        }
    }
    
    /**
     * Zoom the map
     */
    zoom(factor) {
        // Get current viewBox values
        const viewBox = this.svg.getAttribute('viewBox').split(' ').map(Number);
        const [x, y, width, height] = viewBox;
        
        // Calculate new width and height
        const newWidth = width / factor;
        const newHeight = height / factor;
        
        // Adjust x and y to keep the center point the same
        const newX = x + (width - newWidth) / 2;
        const newY = y + (height - newHeight) / 2;
        
        // Set new viewBox
        this.svg.setAttribute('viewBox', `${newX} ${newY} ${newWidth} ${newHeight}`);
    }
    
    /**
     * Initialize the map
     */
    initialize() {
        console.log("Initializing world map...");
        this.generateTerrain();
        this.generateCountries();
    }
    
    /**
     * Refresh the map after diplomatic changes
     */
    refreshMapDisplay() {
        // Update country styling based on current diplomatic status
        this.countries.forEach(country => {
            if (country.polygonElement) {
                // Reset classes that might change
                country.polygonElement.classList.remove('allied-country', 'enemy-country');
                
                // Add diplomatic status classes if applicable
                if (this.gameState && this.gameState.diplomacy) {
                    if (this.gameState.diplomacy.areAllied && this.gameState.diplomacy.areAllied(0, country.id)) {
                        country.polygonElement.classList.add('allied-country');
                    } else if (this.gameState.diplomacy.areAtWar && this.gameState.diplomacy.areAtWar(0, country.id)) {
                        country.polygonElement.classList.add('enemy-country');
                    }
                }
            }
        });
    }
}
        