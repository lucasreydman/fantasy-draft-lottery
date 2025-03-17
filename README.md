# Fantasy Draft Lottery Simulator

A dynamic web-based lottery simulator for fantasy sports draft order determination, featuring customizable team names, pick trading, and an engaging visual lottery reveal process.

## Features

### Team Management
- Customizable team names for up to 12 teams
- Automatic saving of team names in local storage
- Pre-configured lottery odds for the top 8 teams
- Automatic placement for teams 9-12

### Lottery System
- Weighted lottery system for picks 1-8
- Automatic placement for picks 9-12
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

The lottery uses the following odds distribution for the top 8 teams:

| Team  |   1st   |   2nd   |   3rd   |   4th   |   5th   |   6th   |   7th   |   8th   |
|-------|---------|---------|---------|---------|---------|---------|---------|---------|
|   1   |  21.2%  |  20.5%  |  19.4%  |  17.4%  |  21.4%  |    -    |    -    |    -    |
|   2   |  21.2%  |  20.5%  |  19.4%  |  17.4%  |  18.8%  |   2.7%  |    -    |    -    |
|   3   |  21.2%  |  20.5%  |  19.4%  |  17.4%  |  16.3%  |   5.0%  |   0.2%  |    -    |
|   4   |  21.2%  |  20.5%  |  19.4%  |  17.4%  |  14.0%  |   7.0%  |   0.5%  |    -    |
|   5   |   6.1%  |   7.1%  |   8.7%  |  11.5%  |  29.5%  |  32.9%  |   4.2%  |   0.1%  |
|   6   |   4.5%  |   5.4%  |   6.7%  |   9.1%  |    -    |  52.5%  |  21.0%  |   0.8%  |
|   7   |   3.0%  |   3.6%  |   4.6%  |   6.4%  |    -    |    -    |  74.2%  |   8.2%  |
|   8   |   1.5%  |   1.8%  |   2.4%  |   3.3%  |    -    |    -    |    -    |  90.9%  |

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