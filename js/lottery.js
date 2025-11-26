// Debug log to check if script is loading
console.log('Lottery.js loaded');

// Define the teams and their chances
const teams = [
    { name: "Bradley's Bandits", chances: 150 },
    { name: "Buttar's Barbarians", chances: 150 },
    { name: "Cyr's Beers", chances: 150 },
    { name: "Darcy's Demons", chances: 150 },
    { name: "Lu's Lazers", chances: 40 },
    { name: "Moe's Hoes", chances: 30 },
    { name: "Sith's Nips", chances: 0 },
    { name: "Sleepy's Steppaz", chances: 0 },
    { name: "Teezy's Turtles", chances: 0 },
    { name: "Zims Sims", chances: 0 }
];

const TEAM_NAME_OPTIONS = [
    "Bradley's Bandits",
    "Buttar's Barbarians",
    "Cyr's Beers",
    "Darcy's Demons",
    "Lu's Lazers",
    "Moe's Hoes",
    "Sith's Nips",
    "Sleepy's Steppaz",
    "Teezy's Turtles",
    "Zims Sims"
];

// Define the odds for each team at each position
const odds = [
    [22.4, 21.8, 20.9, 19.1, 15.7, 0], // Team 1
    [22.4, 21.8, 20.9, 19.1, 14.8, 0.9], // Team 2
    [22.4, 21.8, 20.9, 19.1, 13.8, 1.9], // Team 3
    [22.4, 21.8, 20.9, 19.1, 12.9, 2.8], // Team 4
    [6.0, 7.2, 9.1, 13.2, 42.8, 21.7], // Team 5
    [4.5, 5.5, 7.1, 10.4, 0, 72.6]  // Team 6
];

// Initialize pick ownership data structure
const pickOwnership = Array(3).fill().map(() => Array(10).fill().map(() => null));

// Load saved team names from localStorage
function loadSavedTeamNames() {
    const savedTeams = localStorage.getItem('lotteryTeamNames');
    if (savedTeams) {
        const teamNames = JSON.parse(savedTeams);
        teamNames.forEach((name, index) => {
            if (index < teams.length && name) {
                teams[index].name = name;
            }
        });
    }
}

// Save team names to localStorage
function saveTeamNames() {
    const teamNames = teams.map(team => team.name);
    localStorage.setItem('lotteryTeamNames', JSON.stringify(teamNames));
}

// Load saved pick ownership from localStorage
function loadSavedPickOwnership() {
    const savedOwnership = localStorage.getItem('lotteryPickOwnership');
    if (savedOwnership) {
        const parsedOwnership = JSON.parse(savedOwnership);
        // Only copy valid values (non-null)
        for (let round = 0; round < 3; round++) {
            for (let pick = 0; pick < 10; pick++) {
                if (parsedOwnership[round][pick] !== null) {
                    pickOwnership[round][pick] = parsedOwnership[round][pick];
                }
            }
        }
    }
}

// Save pick ownership to localStorage
function savePickOwnership() {
    localStorage.setItem('lotteryPickOwnership', JSON.stringify(pickOwnership));
}

// Create team input fields
function createTeamInputs() {
    const teamInputsDiv = document.getElementById('teamInputs');
    if (!teamInputsDiv) return;

    // Load saved team names before creating inputs
    loadSavedTeamNames();

    // Ensure the datalist with preset options exists once
    let datalist = document.getElementById('teamNameOptions');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'teamNameOptions';
        TEAM_NAME_OPTIONS.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            datalist.appendChild(option);
        });
        document.body.appendChild(datalist);
    }

    teams.forEach((team, index) => {
        const row = document.createElement('div');
        row.className = 'team-input-row';
        
        const label = document.createElement('label');
        label.textContent = `Team ${index + 1}:`;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.setAttribute('list', 'teamNameOptions');
        input.value = team.name && !team.name.startsWith('Team ') ? team.name : '';
        input.placeholder = 'Select Team...';
        
        // Save team name when input changes
        input.addEventListener('input', function() {
            teams[index].name = this.value || `Team ${index + 1}`;
            saveTeamNames();
        });
        
        row.appendChild(label);
        row.appendChild(input);
        teamInputsDiv.appendChild(row);
    });
}

// Create odds table
function createOddsTable() {
    const tableBody = document.getElementById('oddsTableBody');
    if (!tableBody) return;

    odds.forEach((teamOdds, index) => {
        const row = document.createElement('tr');
        
        // Add team name cell
        const teamCell = document.createElement('td');
        teamCell.textContent = `Team ${index + 1}`;
        row.appendChild(teamCell);

        // Add odds cells
        teamOdds.forEach(odd => {
            const cell = document.createElement('td');
            const displayValue = typeof odd === 'number' ? `${odd.toFixed(1)}%` : '0.0%';
            cell.textContent = displayValue;
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}

// Create pick ownership table
function createPickOwnershipTable() {
    const tableContainer = document.getElementById('pickOwnershipTable');
    if (!tableContainer) return;

    // Load saved pick ownership before creating the table
    loadSavedPickOwnership();

    // Create table element
    const table = document.createElement('table');
    table.className = 'pick-ownership-table';

    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const pickHeader = document.createElement('th');
    pickHeader.textContent = 'Pick';
    headerRow.appendChild(pickHeader);
    
    const originalTeamHeader = document.createElement('th');
    originalTeamHeader.textContent = 'Original Team';
    headerRow.appendChild(originalTeamHeader);
    
    const ownerHeader = document.createElement('th');
    ownerHeader.textContent = 'Owned By';
    headerRow.appendChild(ownerHeader);
    
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    
    // For each round
    for (let round = 0; round < 3; round++) {
        // Add round header
        const roundHeaderRow = document.createElement('tr');
        roundHeaderRow.className = 'round-header';
        
        const roundHeaderCell = document.createElement('td');
        roundHeaderCell.colSpan = 3;
        roundHeaderCell.textContent = `Round ${round + 1}`;
        roundHeaderRow.appendChild(roundHeaderCell);
        
        tbody.appendChild(roundHeaderRow);
        
        // Add each pick in the round
        for (let pick = 0; pick < 10; pick++) {
            const row = document.createElement('tr');
            
            // Pick number cell
            const pickCell = document.createElement('td');
            const pickNumber = round * 10 + pick + 1;
            pickCell.textContent = pickNumber;
            row.appendChild(pickCell);
            
            // Original team cell
            const originalTeamCell = document.createElement('td');
            originalTeamCell.textContent = teams[pick].name;
            row.appendChild(originalTeamCell);
            
            // Owner dropdown cell
            const ownerCell = document.createElement('td');
            const ownerSelect = document.createElement('select');
            
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select Team';
            ownerSelect.appendChild(defaultOption);
            
            // Add all teams as options
            teams.forEach((team, teamIndex) => {
                const option = document.createElement('option');
                option.value = teamIndex;
                option.textContent = team.name;
                
                // Set selected if this team is the owner
                if (pickOwnership[round][pick] === teamIndex) {
                    option.selected = true;
                }
                
                ownerSelect.appendChild(option);
            });
            
            // Add change event listener
            ownerSelect.addEventListener('change', function() {
                const selectedTeamIndex = this.value === '' ? null : parseInt(this.value);
                pickOwnership[round][pick] = selectedTeamIndex;
                savePickOwnership();
            });
            
            ownerCell.appendChild(ownerSelect);
            row.appendChild(ownerCell);
            
            tbody.appendChild(row);
        }
    }
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
}

// Function to run a quick lottery without animation - modified for NBA-style rules
function runQuickLottery() {
    // Create a copy of teams for the lottery with their original indexes (teams 1-6 have chances)
    const lotteryTeams = teams.slice(0, 6).map((team, index) => ({
        ...team,
        originalIndex: index // Store original index for seeding reference
    }));
    const results = new Array(10);
    
    // Store a copy of the lottery teams in their original seeding order (worst to best record)
    const teamsInSeedingOrder = [...lotteryTeams].sort((a, b) => b.chances - a.chances);
    
    // Step 1: Generate top 6 picks through lottery
    const availableTeams = [...lotteryTeams];
    const top6Picks = [];
    
    // Choose top 6 picks randomly based on odds
    for (let i = 0; i < 6; i++) {
        // For pick 5, exclude Team 6 (index 5) if they're still available
        let teamsForThisPick = [...availableTeams];
        if (i === 4) { // Pick 5 (0-indexed, so i === 4)
            teamsForThisPick = teamsForThisPick.filter(team => team.originalIndex !== 5);
            // Safety check: if filtering removed all teams, use original availableTeams
            // (This should never happen, but ensures robustness)
            if (teamsForThisPick.length === 0) {
                teamsForThisPick = [...availableTeams];
            }
        }
        
        const selectedIndex = getRandomTeam(teamsForThisPick);
        if (selectedIndex === null) {
            console.error('Failed to select a team');
            break;
        }
        
        // Find the actual index in availableTeams
        const selectedTeam = teamsForThisPick[selectedIndex];
        const actualIndex = availableTeams.findIndex(t => t.originalIndex === selectedTeam.originalIndex);
        
        top6Picks.push(selectedTeam);
        availableTeams.splice(actualIndex, 1);
    }
    
    // Place top 6 picks at the front of results array
    for (let i = 0; i < 6; i++) {
        results[i] = top6Picks[i];
    }
    
    // Step 2: Add teams 7-10 automatically (they stay in their original positions)
    for (let i = 6; i < 10; i++) {
        results[i] = teams[i];
    }
    
    // For display purposes, remove the originalIndex property
    return results.map(team => ({
        name: team.name,
        chances: team.chances
    }));
}

// In the getRandomTeam function, make sure it handles edge cases better
function getRandomTeam(availableTeams) {
    if (availableTeams.length === 0) {
        console.error('No teams available');
        return null;
    }
    
    const totalChances = availableTeams.reduce((sum, team) => sum + team.chances, 0);
    
    // Handle case where total chances is 0
    if (totalChances <= 0) {
        // Just pick randomly if there are no weighted chances
        return Math.floor(Math.random() * availableTeams.length);
    }
    
    let random = Math.random() * totalChances;
    
    for (let i = 0; i < availableTeams.length; i++) {
        random -= availableTeams[i].chances;
        if (random <= 0) {
            return i;
        }
    }
    return availableTeams.length - 1;
}

// Update the full draft order based on lottery results and pick ownership
function updateFullDraftOrder(lotteryResults) {
    const fullDraftOrderDiv = document.getElementById('fullDraftOrder');
    if (!fullDraftOrderDiv) return;
    
    fullDraftOrderDiv.innerHTML = '';
    
    // Create a container for each round
    for (let round = 0; round < 3; round++) {
        const roundDiv = document.createElement('div');
        roundDiv.className = 'draft-round';
        
        const roundTitle = document.createElement('h3');
        roundTitle.className = 'draft-round-title';
        roundTitle.textContent = `Round ${round + 1}`;
        roundDiv.appendChild(roundTitle);
        
        // For each pick in the round
        for (let pick = 0; pick < 10; pick++) {
            // Get the original team based on lottery results
            const originalTeamIndex = lotteryResults[pick].name === teams[pick].name ? pick : teams.findIndex(team => team.name === lotteryResults[pick].name);
            
            // Get the team that owns this pick
            const ownerTeamIndex = pickOwnership[round][originalTeamIndex] !== null ? pickOwnership[round][originalTeamIndex] : originalTeamIndex;
            
            const pickDiv = document.createElement('div');
            pickDiv.className = 'draft-pick';
            
            const pickNumber = document.createElement('span');
            pickNumber.className = 'draft-pick-number';
            pickNumber.textContent = `${round * 10 + pick + 1}.`;
            
            const pickTeam = document.createElement('span');
            pickTeam.className = 'draft-pick-team';
            pickTeam.textContent = teams[ownerTeamIndex].name;
            
            pickDiv.appendChild(pickNumber);
            pickDiv.appendChild(pickTeam);
            
            // If the pick is owned by a different team than the original team, show the original team
            if (ownerTeamIndex !== originalTeamIndex) {
                const originalTeam = document.createElement('span');
                originalTeam.className = 'draft-pick-original';
                originalTeam.textContent = `(via ${teams[originalTeamIndex].name})`;
                pickDiv.appendChild(originalTeam);
            }
            
            roundDiv.appendChild(pickDiv);
        }
        
        fullDraftOrderDiv.appendChild(roundDiv);
    }
    
    // Make the draft order section visible
    const draftOrderSection = document.querySelector('.draft-order-section');
    if (draftOrderSection) {
        draftOrderSection.style.display = 'block';
    }
}

// Modify the runLottery function to handle magic number with visible quick runs
function runLottery() {
    console.log('Running lottery...');
    
    // Get magic number
    const magicNumberInput = document.getElementById('magicNumber');
    const magicNumber = parseInt(magicNumberInput.value) || 1;
    
    if (magicNumber < 1 || magicNumber > 99) {
        alert('Magic number must be between 1 and 99');
        return;
    }

    // Update team names from inputs
    const inputs = document.querySelectorAll('.team-input-row input');
    inputs.forEach((input, index) => {
        if (input.value.trim()) {
            teams[index].name = input.value.trim();
        } else {
            teams[index].name = `Team ${index + 1}`;
        }
    });
    
    // Save team names
    saveTeamNames();

    // Create full-screen lottery view
    const fullscreenView = document.createElement('div');
    fullscreenView.className = 'lottery-fullscreen';
    document.body.appendChild(fullscreenView);
    
    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'lottery-content';
    fullscreenView.appendChild(contentContainer);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
        document.body.removeChild(fullscreenView);
    });
    contentContainer.appendChild(closeButton);
    
    // Add title
    const title = document.createElement('h2');
    title.className = 'lottery-title';
    title.textContent = `Lu's Dynasty League Draft Lottery (Magic Number: ${magicNumber})`;
    contentContainer.appendChild(title);
    
    // Create animation container
    const animationContainer = document.createElement('div');
    animationContainer.className = 'lottery-animation-container';
    contentContainer.appendChild(animationContainer);

    // Function to run quick iterations with visual feedback
    function runQuickIterations(currentIteration) {
        if (currentIteration < magicNumber - 1) {
            // Show iteration number
            const iterationMsg = document.createElement('div');
            iterationMsg.className = 'iteration-number';
            iterationMsg.textContent = `Lottery Results ${currentIteration + 1} of ${magicNumber - 1}`;
            animationContainer.innerHTML = '';
            animationContainer.appendChild(iterationMsg);

            // Run the quick lottery
            const quickResults = runQuickLottery();
            
            // Create podium display
            const podiumContainer = document.createElement('div');
            podiumContainer.className = 'quick-iteration-podium';
            
            // Create podium places (in reverse order for flex alignment)
            [2, 1, 0].forEach((place) => {
                const podiumPlace = document.createElement('div');
                podiumPlace.className = `podium-place ${place === 0 ? 'first' : place === 1 ? 'second' : 'third'}`;
                
                const podiumBlock = document.createElement('div');
                podiumBlock.className = 'podium-block';
                
                const teamName = document.createElement('div');
                teamName.className = 'podium-team-name';
                teamName.textContent = quickResults[place].name;
                
                const placeNumber = document.createElement('div');
                placeNumber.textContent = `${place + 1}${place === 0 ? 'st' : place === 1 ? 'nd' : 'rd'}`;
                
                podiumBlock.appendChild(teamName);
                podiumBlock.appendChild(placeNumber);
                podiumPlace.appendChild(podiumBlock);
                podiumContainer.appendChild(podiumPlace);
            });
            
            animationContainer.appendChild(podiumContainer);

            // Continue to next iteration after a short delay
            setTimeout(() => {
                runQuickIterations(currentIteration + 1);
            }, 800);
        } else {
            // Start the final lottery animation
            runFinalLottery();
        }
    }

    // Function to run the final lottery with full animation
    function runFinalLottery() {
        // Clear the animation container
        animationContainer.innerHTML = '';

        // Show calculating message
        const calculatingMsg = document.createElement('div');
        calculatingMsg.className = 'fullscreen-calculating';
        calculatingMsg.textContent = 'Calculating the FINAL draft order...';
        calculatingMsg.style.color = '#000000'; // Change to black text
        calculatingMsg.style.fontSize = '2.5rem';
        calculatingMsg.style.fontWeight = 'bold';
        calculatingMsg.style.position = 'absolute';
        calculatingMsg.style.top = '50%';
        calculatingMsg.style.left = '50%';
        calculatingMsg.style.transform = 'translate(-50%, -50%)';
        calculatingMsg.style.width = '100%';
        calculatingMsg.style.textAlign = 'center';
        calculatingMsg.style.animation = 'calculatingAnimation 2s ease-in-out infinite';
        animationContainer.appendChild(calculatingMsg);
        
        // Add animation keyframes for the calculating message
        const calcAnimStyle = document.createElement('style');
        calcAnimStyle.textContent = `
            @keyframes calculatingAnimation {
                0% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.95); }
                50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
                100% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.95); }
            }
        `;
        document.head.appendChild(calcAnimStyle);

        // Run the actual lottery
        const results = runQuickLottery();
        
        // Start the reveal process after a longer delay (5 seconds)
        setTimeout(() => {
            animationContainer.removeChild(calculatingMsg);
            
            // Start with revealing picks 10-7 (automatic)
            revealAutomaticPicks();
        }, 5000);
        
        // Step 1: Reveal automatic picks (10-7)
        function revealAutomaticPicks() {
            const batchHeader = document.createElement('div');
            batchHeader.className = 'batch-header';
            batchHeader.textContent = 'Automatic Picks';
            batchHeader.style.fontSize = '1.8rem';
            batchHeader.style.fontWeight = 'bold';
            batchHeader.style.color = '#ff6b6b';
            batchHeader.style.marginBottom = '1rem';
            animationContainer.appendChild(batchHeader);
            
            let currentIndex = 9; // Start from pick 10
            
            function showNextPick() {
                if (currentIndex >= 6) { // For picks 10 to 7
                    const resultItem = document.createElement('div');
                    resultItem.className = 'fullscreen-result-item';
                    resultItem.textContent = `Pick ${currentIndex + 1}: ${results[currentIndex].name}`;
                    
                    resultItem.style.backgroundColor = '#ffcccb';
                    resultItem.style.fontWeight = 'normal';
                    resultItem.style.boxShadow = '0 2px 4px rgba(255, 0, 0, 0.2)';
                    
                    // Insert at the beginning rather than appending to show highest pick at top
                    animationContainer.insertBefore(resultItem, animationContainer.firstChild.nextSibling);
                    
                    currentIndex--;
                    
                    // Continue with next pick after delay
                    if (currentIndex >= 6) {
                        setTimeout(showNextPick, 800);
                    } else {
                        // When all automatic picks are shown, add a "next" button to continue
                        setTimeout(() => {
                            const nextButton = document.createElement('button');
                            nextButton.textContent = 'Continue to Lottery Picks';
                            nextButton.className = 'lottery-button';
                            nextButton.style.margin = '2rem auto';
                            nextButton.style.display = 'block';
                            
                            nextButton.addEventListener('click', () => {
                                // Clear screen and show lottery picks 6-5
                                animationContainer.innerHTML = '';
                                revealMiddlePicks();
                            });
                            
                            animationContainer.appendChild(nextButton);
                        }, 1000);
                    }
                }
            }
            
            showNextPick();
        }
        
        // Step 2: Reveal middle picks (6-5)
        function revealMiddlePicks() {
            const batchHeader = document.createElement('div');
            batchHeader.className = 'batch-header';
            batchHeader.textContent = 'Lottery Picks 6-5';
            batchHeader.style.fontSize = '1.8rem';
            batchHeader.style.fontWeight = 'bold';
            batchHeader.style.color = '#4834d4';
            batchHeader.style.marginBottom = '1rem';
            animationContainer.appendChild(batchHeader);
            
            let currentIndex = 5; // Start from pick 6
            
            function showNextPick() {
                if (currentIndex >= 4) { // For picks 6 to 5
                    // Show pick timer before revealing pick - standardized to 10 seconds
                    showPickTimer(10, () => {
                        const resultItem = document.createElement('div');
                        resultItem.className = 'fullscreen-result-item';
                        resultItem.textContent = `Pick ${currentIndex + 1}: ${results[currentIndex].name}`;
                        
                        // Regular pick styling
                        resultItem.style.backgroundColor = '#f8f9fa';
                        resultItem.style.fontWeight = 'normal';
                        resultItem.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                        
                        // Insert at the beginning rather than appending to show highest pick at top
                        animationContainer.insertBefore(resultItem, animationContainer.firstChild.nextSibling);
                        
                        currentIndex--;
                        
                        // Continue with next pick after delay
                        if (currentIndex >= 4) {
                            setTimeout(showNextPick, 500);
                        } else {
                            // When all middle picks are shown, add a "next" button to continue
                            setTimeout(() => {
                                const nextButton = document.createElement('button');
                                nextButton.textContent = 'Reveal Top 4 Picks';
                                nextButton.className = 'lottery-button';
                                nextButton.style.margin = '2rem auto';
                                nextButton.style.display = 'block';
                                
                                nextButton.addEventListener('click', () => {
                                    // Clear screen and show podium for top 4
                                    animationContainer.innerHTML = '';
                                    revealTopFour();
                                });
                                
                                animationContainer.appendChild(nextButton);
                            }, 1000);
                        }
                    });
                }
            }
            
            showNextPick();
        }
        
        // Step 3: Reveal top 4 picks in podium style
        function revealTopFour() {
            // Clear any previous content
            animationContainer.innerHTML = '';
            
            // Make the container much taller to accommodate everything
            animationContainer.style.minHeight = '800px';
            animationContainer.style.padding = '2rem';
            
            const batchHeader = document.createElement('div');
            batchHeader.className = 'batch-header';
            batchHeader.textContent = 'Top 4 Draft Picks';
            batchHeader.style.fontSize = '2.5rem';
            batchHeader.style.fontWeight = 'bold';
            batchHeader.style.color = '#4834d4';
            batchHeader.style.marginBottom = '3rem';
            batchHeader.style.textAlign = 'center';
            batchHeader.style.width = '100%';
            animationContainer.appendChild(batchHeader);
            
            // Add a dedicated area for the drumroll message that stays in place
            const drumrollArea = document.createElement('div');
            drumrollArea.className = 'drumroll-area';
            drumrollArea.style.width = '100%';
            drumrollArea.style.height = '120px';
            drumrollArea.style.display = 'flex';
            drumrollArea.style.justifyContent = 'center';
            drumrollArea.style.alignItems = 'center';
            drumrollArea.style.margin = '2rem 0 3rem 0';
            drumrollArea.style.position = 'relative';
            animationContainer.appendChild(drumrollArea);
            
            // Create podium container with fixed dimensions - make it much larger
            const podiumContainer = document.createElement('div');
            podiumContainer.className = 'top-four-podium';
            podiumContainer.style.display = 'flex';
            podiumContainer.style.justifyContent = 'center';
            podiumContainer.style.alignItems = 'flex-end';
            podiumContainer.style.height = '550px'; // Increased height more
            podiumContainer.style.margin = '0 auto 3rem auto';
            podiumContainer.style.padding = '0';
            podiumContainer.style.width = '100%';
            podiumContainer.style.maxWidth = '1000px'; // Increased width
            podiumContainer.style.position = 'relative';
            animationContainer.appendChild(podiumContainer);
            
            // Create fixed positions for each podium place with more spacing
            const positions = [
                {order: 0, position: 3, width: 200}, // 4th place - Increased width
                {order: 1, position: 2, width: 220}, // 3rd place - Increased width
                {order: 2, position: 0, width: 270}, // 1st place - Increased width
                {order: 3, position: 1, width: 250}  // 2nd place - Increased width
            ];
            
            // Create empty placeholder elements to maintain layout - wider with more spacing
            positions.forEach(pos => {
                const placeholder = document.createElement('div');
                placeholder.className = `podium-placeholder position-${pos.position + 1}`;
                placeholder.style.flex = '1';
                placeholder.style.minWidth = `${pos.width}px`;
                placeholder.style.maxWidth = `${pos.width}px`;
                placeholder.style.height = '10px';
                placeholder.style.margin = '0 25px'; // Even more spacing
                placeholder.style.opacity = '0';
                placeholder.style.order = pos.order.toString();
                podiumContainer.appendChild(placeholder);
            });
            
            // Function to reveal each podium place with adjusted timing
            function revealPodiumPlace(index) {
                if (index >= positions.length) {
                    finishReveal();
                    return;
                }
                
                const position = positions[index].position;
                
                // Skip drumroll and timer for 2nd pick (position 1)
                if (position !== 1) {
                    // Update drumroll message - only for positions other than 2nd pick
                    const drumroll = document.createElement('div');
                    drumroll.className = 'fullscreen-drumroll';
                    
                    if (position === 0) {
                        drumroll.textContent = 'The team picking 1st in this years draft will be...';
                        drumroll.style.color = '#ffd700';
                    } else if (position === 2) {
                        drumroll.textContent = 'The team picking 3rd in this years draft will be...';
                        drumroll.style.color = '#cd7f32';
                    } else {
                        drumroll.textContent = 'The team picking 4th in this years draft will be...';
                        drumroll.style.color = '#6c5ce7';
                    }
                    
                    drumroll.style.fontSize = '2.2rem'; // Larger text
                    drumroll.style.fontWeight = 'bold';
                    drumroll.style.textAlign = 'center';
                    drumroll.style.padding = '1.5rem';
                    drumroll.style.animation = 'shake 0.5s infinite';
                    drumroll.style.width = '100%';
                    
                    // Clear previous drumroll and add new one
                    drumrollArea.innerHTML = '';
                    drumrollArea.appendChild(drumroll);
                    
                    // Standardize all countdowns to 10 seconds for consistency
                    showPickTimer(10, () => {
                        revealPodiumPosition(position);
                    });
                } else {
                    // For 2nd pick, just clear drumroll area and reveal immediately
                    drumrollArea.innerHTML = '';
                    revealPodiumPosition(position);
                }
                
                // Helper function to reveal a podium position
                function revealPodiumPosition(position) {
                    // Find the placeholder for this position
                    const placeholder = document.querySelector(`.podium-placeholder.position-${position + 1}`);
                    
                    // Create podium place - much larger
                    const podiumPlace = document.createElement('div');
                    podiumPlace.className = 'podium-place';
                    
                    // Style based on position - increased heights
                    if (position === 0) { // 1st place
                        podiumPlace.style.height = '400px'; // Taller
                        podiumPlace.style.backgroundColor = '#ffd700';
                        podiumPlace.style.zIndex = '40';
                    } else if (position === 1) { // 2nd place
                        podiumPlace.style.height = '320px'; // Taller
                        podiumPlace.style.backgroundColor = '#c0c0c0';
                        podiumPlace.style.zIndex = '30';
                    } else if (position === 2) { // 3rd place
                        podiumPlace.style.height = '260px'; // Taller
                        podiumPlace.style.backgroundColor = '#cd7f32';
                        podiumPlace.style.zIndex = '20';
                    } else { // 4th place - make it taller
                        podiumPlace.style.height = '220px'; // Even taller
                        podiumPlace.style.backgroundColor = '#6c5ce7';
                        podiumPlace.style.zIndex = '10';
                    }
                    
                    // Common styles for all podium places - larger elements
                    podiumPlace.style.width = '100%';
                    podiumPlace.style.display = 'flex';
                    podiumPlace.style.flexDirection = 'column';
                    podiumPlace.style.justifyContent = 'flex-start';
                    podiumPlace.style.alignItems = 'center';
                    podiumPlace.style.borderRadius = '12px 12px 0 0'; // Rounder corners
                    podiumPlace.style.padding = '1.5rem 1rem'; // More horizontal space
                    podiumPlace.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.3)'; // Stronger shadow
                    podiumPlace.style.position = 'absolute';
                    podiumPlace.style.bottom = '0';
                    podiumPlace.style.left = placeholder.offsetLeft + 'px';
                    podiumPlace.style.width = placeholder.offsetWidth + 'px';
                    podiumPlace.style.animation = 'revealPodium 0.8s ease-out';
                    podiumPlace.style.boxSizing = 'border-box'; // Ensure padding is included in width/height
                    
                    // Position number - made smaller for 4th place
                    const positionNumber = document.createElement('div');
                    positionNumber.textContent = `${position + 1}`;
                    
                    // Adjust size based on position
                    if (position === 3) { // 4th place
                        positionNumber.style.fontSize = '4rem';
                        positionNumber.style.lineHeight = '1';
                        positionNumber.style.marginBottom = '0.5rem';
                    } else {
                        positionNumber.style.fontSize = '5rem';
                        positionNumber.style.marginBottom = '1rem';
                    }
                    
                    positionNumber.style.fontWeight = 'bold';
                    positionNumber.style.color = 'white';
                    positionNumber.style.textShadow = '3px 3px 6px rgba(0, 0, 0, 0.4)';
                    podiumPlace.appendChild(positionNumber);
                    
                    // Team name - ensure it's visible for all positions
                    const teamName = document.createElement('div');
                    teamName.textContent = results[position].name;
                    
                    // Adjust team name styling based on position
                    if (position === 3) { // 4th place
                        teamName.style.fontSize = '1.4rem';
                        teamName.style.marginTop = '0.3rem';
                        teamName.style.lineHeight = '1.2';
                        teamName.style.wordBreak = 'break-word'; // Allow long names to wrap
                        teamName.style.whiteSpace = 'normal'; // Allow text wrapping
                        teamName.style.height = 'auto'; // Auto height based on content
                        teamName.style.maxHeight = '6rem'; // Increased max height
                        teamName.style.display = 'flex';
                        teamName.style.alignItems = 'center';
                        teamName.style.justifyContent = 'center';
                    } else if (position === 2) { // 3rd place
                        teamName.style.fontSize = '1.5rem';
                        teamName.style.marginTop = '0.5rem';
                        teamName.style.lineHeight = '1.2';
                        teamName.style.wordBreak = 'break-word';
                        teamName.style.whiteSpace = 'normal';
                    } else if (position === 1) { // 2nd place
                        teamName.style.fontSize = '1.6rem';
                        teamName.style.marginTop = '0.8rem';
                        teamName.style.lineHeight = '1.2';
                        teamName.style.wordBreak = 'break-word';
                        teamName.style.whiteSpace = 'normal';
                    } else { // 1st place
                        teamName.style.fontSize = '1.8rem';
                        teamName.style.marginTop = '1rem';
                        teamName.style.lineHeight = '1.3';
                        teamName.style.wordBreak = 'break-word';
                        teamName.style.whiteSpace = 'normal';
                    }
                    
                    teamName.style.fontWeight = 'bold';
                    teamName.style.color = 'white';
                    teamName.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.4)';
                    teamName.style.textAlign = 'center';
                    teamName.style.width = '100%';
                    teamName.style.padding = '0 0.5rem';
                    podiumPlace.appendChild(teamName);
                    
                    // Add to podium container
                    podiumContainer.appendChild(podiumPlace);
                    
                    // Continue with next position after a delay
                    let nextDelay = 2000; // Default delay
                    
                    // Special case: If we just showed the 1st pick, show 2nd pick immediately after a short delay
                    if (position === 0) {
                        nextDelay = 1000; // Shorter delay for 2nd pick after 1st
                    }
                    
                    setTimeout(() => {
                        revealPodiumPlace(index + 1);
                    }, nextDelay);
                }
            }
            
            // Function to finish the reveal process
            function finishReveal() {
                // Clear the drumroll area
                drumrollArea.innerHTML = '';
                
                // Show complete message - larger
                const completeMsg = document.createElement('div');
                completeMsg.className = 'fullscreen-complete';
                completeMsg.textContent = 'Draft lottery complete!';
                completeMsg.style.marginTop = '3rem';
                completeMsg.style.textAlign = 'center';
                completeMsg.style.fontSize = '2rem'; // Larger text
                completeMsg.style.fontWeight = 'bold';
                completeMsg.style.color = '#28a745';
                completeMsg.style.padding = '1.5rem';
                completeMsg.style.border = '3px solid #28a745';
                completeMsg.style.borderRadius = '12px';
                completeMsg.style.width = '100%';
                completeMsg.style.maxWidth = '800px';
                completeMsg.style.margin = '3rem auto';
                animationContainer.appendChild(completeMsg);
                
                // Update the regular results div and draft order
                updateResultsDiv(results);
                updateFullDraftOrder(results);
                
                // Add view full results button - larger
                const viewResultsBtn = document.createElement('button');
                viewResultsBtn.textContent = 'View Full Draft Order';
                viewResultsBtn.className = 'lottery-button';
                viewResultsBtn.style.margin = '3rem auto';
                viewResultsBtn.style.padding = '1.2rem 2.5rem';
                viewResultsBtn.style.fontSize = '1.5rem';
                viewResultsBtn.style.display = 'block';
                
                viewResultsBtn.addEventListener('click', () => {
                    document.body.removeChild(fullscreenView);
                });
                
                animationContainer.appendChild(viewResultsBtn);
            }
            
            // Start the reveal process
            setTimeout(() => {
                revealPodiumPlace(0);
            }, 1000); // Short delay before starting
        }
        
        // Countdown timer function
        function showCountdown(seconds, callback) {
            const countdownElement = document.createElement('div');
            countdownElement.className = 'fullscreen-countdown';
            countdownElement.textContent = `Next pick in: ${seconds}`;
            countdownElement.style.fontSize = '1.5rem';
            countdownElement.style.color = '#ffffff';
            countdownElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            countdownElement.style.padding = '0.5rem 1rem';
            countdownElement.style.borderRadius = '8px';
            countdownElement.style.position = 'fixed';
            countdownElement.style.bottom = '20px';
            countdownElement.style.right = '20px';
            countdownElement.style.zIndex = '1100';
            countdownElement.style.animation = 'pulse 1s infinite alternate';
            
            document.body.appendChild(countdownElement);
            
            let remainingSeconds = seconds;
            
            const interval = setInterval(() => {
                remainingSeconds--;
                
                if (remainingSeconds > 0) {
                    countdownElement.textContent = `Next pick in: ${remainingSeconds}`;
                } else {
                    clearInterval(interval);
                    document.body.removeChild(countdownElement);
                    callback();
                }
            }, 1000);
        }
    }

    // Start the process with the quick iterations
    if (magicNumber > 1) {
        runQuickIterations(0);
    } else {
        runFinalLottery();
    }
}

// Completely override the order of display in the results div to ensure consistency
function updateResultsDiv(results) {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;
    
    // Clear existing content
    resultsDiv.innerHTML = '';
    resultsDiv.style.display = 'block';
    
    // Force inline styles to override any potential CSS conflicts
    resultsDiv.style.display = 'block';
    
    // Create a fresh container with explicit styles
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.width = '100%';
    container.style.gap = '10px';
    container.style.margin = '0 auto';
    container.style.padding = '0';
    container.style.boxSizing = 'border-box';
    container.style.position = 'relative'; // Establish a positioning context
    
    // Ensure CSS specificity by using !important for critical styles
    container.setAttribute('style', 
        'display: flex !important;' +
        'flex-direction: column !important;' + 
        'width: 100% !important;' +
        'gap: 10px !important;' +
        'margin: 0 auto !important;' +
        'padding: 0 !important;' + 
        'box-sizing: border-box !important;' +
        'position: relative !important;');
    
    // Add the results to the container in the intended order (1 to 10)
    for (let i = 0; i < results.length; i++) {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        // Apply explicit inline styles
        resultItem.style.width = '100%';
        resultItem.style.boxSizing = 'border-box';
        resultItem.style.padding = '1rem';
        resultItem.style.margin = '0 0 10px 0';
        resultItem.style.borderRadius = '8px';
        resultItem.style.textAlign = 'center';
        resultItem.style.position = 'relative';
        resultItem.style.zIndex = '1';
        resultItem.style.transform = 'none';
        
        // Set background color based on pick number
        if (i === 0) { // 1st pick
            resultItem.style.backgroundColor = '#ffd700'; // Gold
            resultItem.style.fontWeight = 'bold';
            resultItem.style.fontSize = '1.3rem';
            resultItem.style.boxShadow = '0 4px 6px rgba(255, 215, 0, 0.3)';
        } else if (i === 1) { // 2nd pick
            resultItem.style.backgroundColor = '#c0c0c0'; // Silver
            resultItem.style.fontWeight = 'bold';
            resultItem.style.fontSize = '1.2rem';
            resultItem.style.boxShadow = '0 4px 6px rgba(192, 192, 192, 0.3)';
        } else if (i === 2) { // 3rd pick
            resultItem.style.backgroundColor = '#cd7f32'; // Bronze
            resultItem.style.fontWeight = 'bold';
            resultItem.style.fontSize = '1.1rem';
            resultItem.style.boxShadow = '0 4px 6px rgba(205, 127, 50, 0.3)';
        } else if (i >= 6) { // Picks 7-10 (automatic)
            resultItem.style.backgroundColor = '#ffcccb'; // Light red
            resultItem.style.boxShadow = '0 2px 4px rgba(255, 0, 0, 0.2)';
        }
        
        // Add text content without automatic label for picks 7-10
        resultItem.textContent = `Pick ${i + 1}: ${results[i].name}`;
        
        // Append to the container in sequence
        container.appendChild(resultItem);
    }
    
    // Add the container to the results div
    resultsDiv.appendChild(container);
    
    // Add the completion message
    const completeMsg = document.createElement('div');
    completeMsg.className = 'complete-message';
    completeMsg.textContent = 'Draft lottery complete!';
    completeMsg.style.color = '#28a745';
    completeMsg.style.border = '2px solid #28a745';
    completeMsg.style.textAlign = 'center';
    completeMsg.style.padding = '1rem';
    completeMsg.style.marginTop = '1rem';
    completeMsg.style.borderRadius = '8px';
    completeMsg.style.fontWeight = 'bold';
    
    resultsDiv.appendChild(completeMsg);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    createTeamInputs();
    createOddsTable();
    loadSavedPickOwnership(); // Load saved pick ownership
    createPickOwnershipTable();
    
    // Hide the draft order section initially
    const draftOrderSection = document.querySelector('.draft-order-section');
    if (draftOrderSection) {
        draftOrderSection.style.display = 'none';
    }
});

// Make sure the function is available globally
window.runLottery = runLottery;

// Add CSS for the countdown timer to the styles block at the end of the file
const styleElement = document.createElement('style');
styleElement.textContent = `
    .fullscreen-countdown {
        font-size: 1.5rem;
        color: #ffffff;
        background-color: rgba(0, 0, 0, 0.7);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1100;
        animation: pulse 1s infinite alternate;
    }
    
    .lottery-animation-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: 400px;
        padding: 0.8rem;
        overflow-y: auto;
        max-height: 90vh;
        gap: 0.3rem;
    }
    
    .fullscreen-result-item {
        width: 100%;
        max-width: 800px;
        padding: 0.5rem;
        margin: 0.1rem 0;
        border-radius: 10px;
        background-color: var(--background-color);
        transition: all 0.3s ease;
        font-size: 1.2rem;
        text-align: center;
        animation: slideInFromRight 0.8s ease;
    }
    
    .fullscreen-drumroll,
    .fullscreen-calculating,
    .fullscreen-complete {
        width: 100%;
        max-width: 800px;
        z-index: 10;
    }
    
    @keyframes slideInFromRight {
        from {
            opacity: 0;
            transform: translateX(30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes pulse {
        from { opacity: 0.8; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(styleElement);

// Update podium animations and styles
const podiumStyleElement = document.createElement('style');
podiumStyleElement.textContent = `
    @keyframes revealPodium {
        0% {
            transform: translateY(100px);
            opacity: 0;
        }
        60% {
            transform: translateY(-20px);
            opacity: 1;
        }
        100% {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes shake {
        0% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        50% { transform: translateX(0); }
        75% { transform: translateX(5px); }
        100% { transform: translateX(0); }
    }
    
    .top-four-podium {
        perspective: 800px;
    }
    
    .podium-place {
        transition: all 0.3s ease;
    }
    
    .podium-place:hover {
        transform: translateY(-15px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    }
    
    /* Styles for fullscreen modal */
    .lottery-fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.9);
        z-index: 9999;
        overflow: hidden;
    }
    
    /* Added fixed container styles */
    .fullscreen-drumroll {
        width: 100%;
        max-width: 1000px;
        margin: 0 auto;
        text-align: center;
    }
    
    .lottery-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: 3rem;
        width: 100%;
        height: 100%;
        overflow-y: auto;
        background-color: white;
    }
    
    .lottery-title {
        font-size: 3rem;
        color: #4834d4;
        margin-bottom: 3rem;
        text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
    }
    
    .lottery-animation-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        width: 100%;
        min-height: 800px;
        padding: 2rem;
        overflow-y: auto;
        overflow-x: hidden;
        background-color: white;
    }
    
    /* Button styling */
    .lottery-button {
        padding: 1.2rem 2.5rem;
        font-size: 1.5rem;
        font-weight: 600;
        background: linear-gradient(135deg, #4834d4 0%, #6c5ce7 100%);
        color: white;
        border: none;
        border-radius: 50px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 6px 15px rgba(72, 52, 212, 0.4);
    }
    
    .lottery-button:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba(72, 52, 212, 0.5);
    }
    
    .close-button {
        position: absolute;
        top: 30px;
        right: 30px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        font-size: 2.5rem;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        transition: all 0.3s ease;
    }
    
    .close-button:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: rotate(90deg);
    }
    
    /* Add these styles for better spacing with long team names */
    .podium-place {
        overflow: hidden;
        text-overflow: ellipsis;
        word-wrap: break-word;
    }
    
    /* Ensure team name containers don't break layout */
    .fullscreen-result-item {
        overflow-wrap: break-word;
        word-break: break-word;
        white-space: normal !important;
    }
`;
document.head.appendChild(podiumStyleElement);

// Create a centralized pick timer function
function showPickTimer(seconds, callback) {
    // Create timer container that's more prominently displayed in the center
    const timerContainer = document.createElement('div');
    timerContainer.className = 'pick-timer-container';
    timerContainer.style.display = 'flex';
    timerContainer.style.flexDirection = 'column';
    timerContainer.style.alignItems = 'center';
    timerContainer.style.justifyContent = 'center';
    timerContainer.style.width = '180px';
    timerContainer.style.height = '180px';
    timerContainer.style.borderRadius = '50%';
    timerContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    timerContainer.style.color = '#ffffff';
    timerContainer.style.position = 'fixed';
    timerContainer.style.top = '50%';
    timerContainer.style.left = '50%';
    timerContainer.style.transform = 'translate(-50%, -50%)';
    timerContainer.style.zIndex = '10000'; // Ensure this is higher than any other elements
    timerContainer.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.5)';
    
    // Add text label
    const timerLabel = document.createElement('div');
    timerLabel.textContent = 'Revealing in';
    timerLabel.style.fontSize = '1.2rem';
    timerLabel.style.marginBottom = '0.5rem';
    timerContainer.appendChild(timerLabel);
    
    // Add seconds display
    const timerDisplay = document.createElement('div');
    timerDisplay.textContent = seconds.toString();
    timerDisplay.style.fontSize = '4rem';
    timerDisplay.style.fontWeight = 'bold';
    timerContainer.appendChild(timerDisplay);
    
    // Append to fullscreen view instead of body to ensure it's displayed in the modal context
    const fullscreenView = document.querySelector('.lottery-fullscreen');
    fullscreenView.appendChild(timerContainer);
    
    let remainingSeconds = seconds;
    
    // Add animation for the countdown
    timerContainer.style.animation = 'pulse 1s infinite alternate';
    
    const interval = setInterval(() => {
        remainingSeconds--;
        
        if (remainingSeconds > 0) {
            timerDisplay.textContent = remainingSeconds.toString();
            // Update color as time gets lower
            if (remainingSeconds <= 3) {
                timerDisplay.style.color = '#ff6b6b';
                timerContainer.style.animation = 'pulse 0.5s infinite alternate';
            }
        } else {
            clearInterval(interval);
            fullscreenView.removeChild(timerContainer);
            callback();
        }
    }, 1000);
}

// Add CSS styles for the pick timer
const timerStyleElement = document.createElement('style');
timerStyleElement.textContent = `
    /* Pick timer styles */
    @keyframes pulse {
        from { 
            transform: translate(-50%, -50%) scale(0.95);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
        }
        to { 
            transform: translate(-50%, -50%) scale(1.05);
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.7);
        }
    }
    
    .pick-timer-container {
        animation: pulse 1s infinite alternate;
        pointer-events: none; /* Allow clicking through the timer */
    }
    
    /* Ensure the fullscreen container doesn't block the timer */
    .lottery-fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.9);
        z-index: 9999;
        overflow: hidden;
    }
`;
document.head.appendChild(timerStyleElement); 