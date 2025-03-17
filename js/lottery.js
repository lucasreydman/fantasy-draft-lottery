// Debug log to check if script is loading
console.log('Lottery.js loaded');

// Define the teams and their chances
const teams = [
    { name: "Team 1", chances: 140 },
    { name: "Team 2", chances: 140 },
    { name: "Team 3", chances: 140 },
    { name: "Team 4", chances: 140 },
    { name: "Team 5", chances: 40 },
    { name: "Team 6", chances: 30 },
    { name: "Team 7", chances: 20 },
    { name: "Team 8", chances: 10 },
    { name: "Team 9", chances: 0 },
    { name: "Team 10", chances: 0 },
    { name: "Team 11", chances: 0 },
    { name: "Team 12", chances: 0 }
];

// Define the odds for each team at each position
const odds = [
    [21.2, 20.5, 19.4, 17.4, 21.4, 0, 0, 0], // Team 1
    [21.2, 20.5, 19.4, 17.4, 18.8, 2.7, 0, 0], // Team 2
    [21.2, 20.5, 19.4, 17.4, 16.3, 5.0, 0.2, 0], // Team 3
    [21.2, 20.5, 19.4, 17.4, 14.0, 7.0, 0.5, 0], // Team 4
    [6.1, 7.1, 8.7, 11.5, 29.5, 32.9, 4.2, 0.1], // Team 5
    [4.5, 5.4, 6.7, 9.1, 0, 52.5, 21.0, 0.8], // Team 6
    [3.0, 3.6, 4.6, 6.4, 0, 0, 74.2, 8.2], // Team 7
    [1.5, 1.8, 2.4, 3.3, 0, 0, 0, 90.9]  // Team 8
];

// Initialize pick ownership data structure
const pickOwnership = Array(4).fill().map(() => Array(12).fill().map(() => null));

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
        for (let round = 0; round < 4; round++) {
            for (let pick = 0; pick < 12; pick++) {
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

    teams.forEach((team, index) => {
        const row = document.createElement('div');
        row.className = 'team-input-row';
        
        const label = document.createElement('label');
        label.textContent = `Team ${index + 1}:`;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = team.name !== `Team ${index + 1}` ? team.name : '';
        input.placeholder = 'Enter Name...';
        
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
            cell.textContent = odd > 0 ? `${odd.toFixed(1)}%` : '-';
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
    for (let round = 0; round < 4; round++) {
        // Add round header
        const roundHeaderRow = document.createElement('tr');
        roundHeaderRow.className = 'round-header';
        
        const roundHeaderCell = document.createElement('td');
        roundHeaderCell.colSpan = 3;
        roundHeaderCell.textContent = `Round ${round + 1}`;
        roundHeaderRow.appendChild(roundHeaderCell);
        
        tbody.appendChild(roundHeaderRow);
        
        // Add each pick in the round
        for (let pick = 0; pick < 12; pick++) {
            const row = document.createElement('tr');
            
            // Pick number cell
            const pickCell = document.createElement('td');
            const pickNumber = round * 12 + pick + 1;
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

function getRandomTeam(availableTeams) {
    if (availableTeams.length === 0) {
        console.error('No teams available');
        return null;
    }
    
    const totalChances = availableTeams.reduce((sum, team) => sum + team.chances, 0);
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
    for (let round = 0; round < 4; round++) {
        const roundDiv = document.createElement('div');
        roundDiv.className = 'draft-round';
        
        const roundTitle = document.createElement('h3');
        roundTitle.className = 'draft-round-title';
        roundTitle.textContent = `Round ${round + 1}`;
        roundDiv.appendChild(roundTitle);
        
        // For each pick in the round
        for (let pick = 0; pick < 12; pick++) {
            // Get the original team based on lottery results
            const originalTeamIndex = lotteryResults[pick].name === teams[pick].name ? pick : teams.findIndex(team => team.name === lotteryResults[pick].name);
            
            // Get the team that owns this pick
            const ownerTeamIndex = pickOwnership[round][originalTeamIndex] !== null ? pickOwnership[round][originalTeamIndex] : originalTeamIndex;
            
            const pickDiv = document.createElement('div');
            pickDiv.className = 'draft-pick';
            
            const pickNumber = document.createElement('span');
            pickNumber.className = 'draft-pick-number';
            pickNumber.textContent = `${round * 12 + pick + 1}.`;
            
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

// Modify the runLottery function to update the full draft order
function runLottery() {
    console.log('Running lottery...');
    
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

    // Create a copy of teams for the lottery
    const lotteryTeams = teams.slice(0, 8); // Only first 8 teams participate in lottery
    const availableTeams = [...lotteryTeams];
    const results = [];

    // Generate top 8 picks through lottery
    for (let i = 0; i < 8; i++) {
        const selectedIndex = getRandomTeam(availableTeams);
        if (selectedIndex === null) {
            console.error('Failed to select a team');
            break;
        }
        
        const selectedTeam = availableTeams[selectedIndex];
        results.push(selectedTeam);
        availableTeams.splice(selectedIndex, 1);
    }

    // Add teams 9-12 automatically for picks 9-12
    for (let i = 8; i < 12; i++) {
        results.push(teams[i]);
    }

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
    title.textContent = 'Lu\'s Dynasty League Draft Lottery';
    contentContainer.appendChild(title);
    
    // Create animation container
    const animationContainer = document.createElement('div');
    animationContainer.className = 'lottery-animation-container';
    contentContainer.appendChild(animationContainer);
    
    // Show calculating message
    const calculatingMsg = document.createElement('div');
    calculatingMsg.className = 'fullscreen-calculating';
    calculatingMsg.textContent = 'Calculating the draft order...';
    animationContainer.appendChild(calculatingMsg);

    // Define the reveal function
    function revealNextPick(index) {
        if (index >= 0) {
            const resultItem = document.createElement('div');
            resultItem.className = 'fullscreen-result-item';
            
            // Set background color based on pick number
            if (index === 0) { // 1st pick
                resultItem.style.backgroundColor = '#ffd700'; // Gold
                resultItem.style.fontWeight = 'bold';
                resultItem.style.fontSize = '1.6rem';
                resultItem.style.boxShadow = '0 4px 10px rgba(255, 215, 0, 0.5)';
            } else if (index === 1) { // 2nd pick
                resultItem.style.backgroundColor = '#c0c0c0'; // Silver
                resultItem.style.fontWeight = 'bold';
                resultItem.style.fontSize = '1.5rem';
                resultItem.style.boxShadow = '0 4px 8px rgba(192, 192, 192, 0.5)';
            } else if (index === 2) { // 3rd pick
                resultItem.style.backgroundColor = '#cd7f32'; // Bronze
                resultItem.style.fontWeight = 'bold';
                resultItem.style.fontSize = '1.4rem';
                resultItem.style.boxShadow = '0 4px 8px rgba(205, 127, 50, 0.5)';
            }
            
            resultItem.textContent = `Pick ${index + 1}: ${results[index].name}`;
            
            // Add a drumroll effect for the top 3 picks
            if (index <= 2) {
                const drumroll = document.createElement('div');
                drumroll.className = 'fullscreen-drumroll';
                
                // Set text and color based on pick number
                if (index === 0) {
                    drumroll.textContent = 'The team picking 1st in this years draft will be...';
                    drumroll.style.color = '#ffd700'; // Gold
                } else if (index === 1) {
                    drumroll.textContent = 'The team picking 2nd in this years draft will be...';
                    drumroll.style.color = '#c0c0c0'; // Silver
                } else {
                    drumroll.textContent = 'The team picking 3rd in this years draft will be...';
                    drumroll.style.color = '#cd7f32'; // Bronze
                }
                
                // Insert at the beginning of the container
                animationContainer.insertBefore(drumroll, animationContainer.firstChild);
                
                // Show drumroll for 2 seconds, then show the result for 3 seconds (total 5 seconds)
                setTimeout(() => {
                    animationContainer.removeChild(drumroll);
                    // Insert the new pick at the beginning of the container
                    animationContainer.insertBefore(resultItem, animationContainer.firstChild);
                    
                    // Move to next pick after 3 more seconds (total 5 seconds per pick)
                    setTimeout(() => {
                        revealNextPick(index - 1);
                    }, 3000);
                }, 2000);
            } else {
                // For regular picks, just show the result for 5 seconds
                // Insert the new pick at the beginning of the container
                animationContainer.insertBefore(resultItem, animationContainer.firstChild);
                
                // Move to next pick after 5 seconds
                setTimeout(() => {
                    revealNextPick(index - 1);
                }, 5000);
            }
        } else {
            // All picks revealed, add completion message
            const completeMsg = document.createElement('div');
            completeMsg.className = 'fullscreen-complete';
            completeMsg.textContent = 'Draft lottery complete!';
            // Insert at the beginning of the container
            animationContainer.insertBefore(completeMsg, animationContainer.firstChild);
            
            // Also update the regular results div
            updateResultsDiv(results);
            
            // Update the full draft order
            updateFullDraftOrder(results);
        }
    }
    
    // First reveal picks 12-9 one by one
    function revealLaterPicks() {
        let currentIndex = 11; // Start with pick 12
        
        function showNextLaterPick() {
            if (currentIndex >= 8) {
                const resultItem = document.createElement('div');
                resultItem.className = 'fullscreen-result-item';
                resultItem.textContent = `Pick ${currentIndex + 1}: ${results[currentIndex].name} (Automatic)`;
                
                // Style with light red color
                resultItem.style.backgroundColor = '#ffcccb'; // Light red
                resultItem.style.fontWeight = 'normal';
                resultItem.style.boxShadow = '0 2px 4px rgba(255, 0, 0, 0.2)';
                
                // Insert at the beginning of the container
                animationContainer.insertBefore(resultItem, animationContainer.firstChild);
                
                currentIndex--;
                
                // Continue to next pick after 2 seconds (faster than main lottery)
                if (currentIndex >= 8) {
                    setTimeout(showNextLaterPick, 2000);
                } else {
                    // After showing all later picks, start the main lottery reveal
                    setTimeout(() => {
                        revealNextPick(7);
                    }, 3000);
                }
            }
        }
        
        // Start showing later picks
        showNextLaterPick();
    }
    
    // First, show the calculating message for 5 seconds
    setTimeout(() => {
        // Remove the calculating message
        animationContainer.removeChild(calculatingMsg);
        
        // Start by revealing picks 12-9
        revealLaterPicks();
    }, 5000);
    
    console.log('Results animation started:', results);
}

// Helper function to update the regular results div
function updateResultsDiv(results) {
    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
        resultsDiv.innerHTML = '';
        resultsDiv.style.display = 'block';
        
        results.forEach((team, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            // Set background color based on pick number
            if (index === 0) { // 1st pick
                resultItem.style.backgroundColor = '#ffd700'; // Gold
                resultItem.style.fontWeight = 'bold';
                resultItem.style.fontSize = '1.3rem';
                resultItem.style.boxShadow = '0 4px 6px rgba(255, 215, 0, 0.3)';
            } else if (index === 1) { // 2nd pick
                resultItem.style.backgroundColor = '#c0c0c0'; // Silver
                resultItem.style.fontWeight = 'bold';
                resultItem.style.fontSize = '1.2rem';
                resultItem.style.boxShadow = '0 4px 6px rgba(192, 192, 192, 0.3)';
            } else if (index === 2) { // 3rd pick
                resultItem.style.backgroundColor = '#cd7f32'; // Bronze
                resultItem.style.fontWeight = 'bold';
                resultItem.style.fontSize = '1.1rem';
                resultItem.style.boxShadow = '0 4px 6px rgba(205, 127, 50, 0.3)';
            } else if (index >= 8) { // Picks 9-12 (automatic)
                resultItem.style.backgroundColor = '#ffcccb'; // Light red
                resultItem.style.boxShadow = '0 2px 4px rgba(255, 0, 0, 0.2)';
            }
            
            // Add text content with automatic label for picks 9-12
            if (index >= 8) {
                resultItem.textContent = `Pick ${index + 1}: ${team.name} (Automatic)`;
            } else {
                resultItem.textContent = `Pick ${index + 1}: ${team.name}`;
            }
            
            resultsDiv.appendChild(resultItem);
        });
        
        // Add a "Draft complete!" message
        const completeMsg = document.createElement('div');
        completeMsg.className = 'complete-message';
        completeMsg.textContent = 'Draft lottery complete!';
        completeMsg.style.color = '#28a745';
        completeMsg.style.border = '2px solid #28a745';
        resultsDiv.appendChild(completeMsg);
    }
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