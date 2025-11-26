# Fantasy Draft Lottery Simulator

A dynamic web-based lottery simulator for fantasy sports draft order determination, featuring customizable team names, pick trading, and an engaging visual lottery reveal process.

## Features

### Team Management
- Customizable team names for up to 10 teams
- Automatic saving of team names in local storage
- Pre-configured lottery odds for the top 6 teams
- Automatic placement for teams 7-10

### Lottery System
- Weighted lottery system for picks 1-6
- Automatic placement for picks 7-10
- Magic number functionality (1-99) for running multiple simulations
- Visual podium display for quick simulation results
- Dramatic reveal animation for the final lottery results

### Pick Trading
- Full pick ownership management system
- Trade tracking for all 4 rounds
- Ability to assign picks to different teams
- Automatic saving of pick ownership data

### Visual Features
- Gold, silver, and bronze theming for top 3 picks
- Podium displays for simulation results
- Fullscreen lottery animations
- Drumroll effects for top 3 picks
- Responsive design for various screen sizes

## Lottery Odds

The lottery uses the following odds distribution for the top 6 teams:

| Team  |   1st   |   2nd   |   3rd   |   4th   |   5th   |   6th   |
|-------|---------|---------|---------|---------|---------|---------|
|   1   |  22.4%  |  21.8%  |  20.9%  |  19.1%  |  15.7%  |    -    |
|   2   |  22.4%  |  21.8%  |  20.9%  |  19.1%  |  14.8%  |   0.9%  |
|   3   |  22.4%  |  21.8%  |  20.9%  |  19.1%  |  13.8%  |   1.9%  |
|   4   |  22.4%  |  21.8%  |  20.9%  |  19.1%  |  12.9%  |   2.8%  |
|   5   |   6.0%  |   7.2%  |   9.1%  |  13.2%  |  42.8%  |  21.7%  |
|   6   |   4.5%  |   5.5%  |   7.1%  |  10.4%  |    -    |  72.6%  |

## Magic Number Feature

The magic number functionality allows you to:
- Run multiple quick simulations before the final lottery
- See the top 3 picks for each simulation on a podium
- Compare different outcomes before the final result
- Input any number from 1 to 99 simulations

## Usage

1. Enter custom team names in the input fields (optional)
2. Set up pick ownership in the trade table if picks have been traded
3. Enter a magic number (1-99) to determine the number of simulations
4. Click "Run Lottery" to start the lottery process
5. Watch the simulation results and final lottery reveal
6. View the complete draft order for all 4 rounds

## Data Persistence

The application automatically saves:
- Custom team names
- Pick ownership/trades
- All data is stored in the browser's local storage

## Technical Details

Built using:
- HTML5
- CSS3
- Vanilla JavaScript
- Local Storage API for data persistence