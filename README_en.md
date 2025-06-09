# ProbMinesweeper

*ProbMinesweeper: Where Mathematics Meets Strategy* 🎯💣

An advanced Minesweeper game that calculates and displays mine probabilities in real-time.

This project utilizes a BDD-based mine probability calculation algorithm originally developed for TopCoder Marathon Match 122 (reference: https://www.topcoder.com/challenges/bb7a2759-8aa3-464e-8300-fb175a8efcae).

## Features

- **Real-time Probability Display**: Shows the probability of mines in unrevealed cells
- **Visual Risk Assessment**: Color-coded display from green (safe) to red (dangerous) based on probability
- **Intelligent Auto-opening**: Automatic opening of 0% probability cells (optional)
- **Advanced Probability Calculation**: Combinatorial algorithms for mine probability calculation
- **Responsive Design**: Compatible with both desktop and mobile devices
- **Game State Management**: Win/loss detection with visual feedback

## How to Play

1. Open `index.html` in your browser
2. Set board dimensions (width/height) and number of mines
3. Enable "Auto-open (0% risk)" if desired
4. Click "Start New Game" to begin
5. Left-click to reveal cells, right-click to flag mines
6. Use probability percentages to make strategic decisions

## Probability Calculation Algorithm

### JavaScript Combinatorial Solver (`solver.js`)

**Algorithm**: Constraint Satisfaction Problem with Combinatorial Analysis

**Key Components**:
- **Frontier Detection**: Identifies unrevealed cells adjacent to revealed number cells
- **Constraint Generation**: Creates mathematical constraints based on revealed numbers
- **Combination Enumeration**: Systematically explores valid mine configurations
- **Probability Calculation**: Efficient combinatorial computation using binomial coefficients

**Processing Flow**:
1. Analyze current board state and identify "frontier" (unrevealed cells adjacent to numbers)
2. Generate constraints for each number cell: `adjacent mines = cell number`
3. Use depth-first search to enumerate all valid mine configurations satisfying constraints
4. For each valid configuration, calculate the number of ways to place remaining mines
5. Aggregate results to compute probability for each frontier cell

**Time Complexity**: O(2^f) where f is frontier size, optimized with constraint propagation

## Technical Implementation

### Architecture

```
├── index.html          # Main game interface and styling
├── main.js            # Game logic and UI management
├── solver.js          # JavaScript probability calculator
└── README.md          # This documentation
```

### Key JavaScript Functions

- `computeProbabilities(board, totalBombs)`: Main entry point for probability calculation
- `autoOpenCells(cells, index)`: Intelligent auto-opening with visual feedback
- `updateDisplay()`: Renders probability information and triggers auto-opening
- `checkWin()`: Game state management and victory detection

### Probability Visualization

Probability values are color-coded for intuitive risk assessment:
- **Green (0-10%)**: Very safe cells
- **Yellow-green (10-30%)**: Low risk
- **Orange (30-70%)**: Medium risk
- **Red (70-100%)**: High risk (with pulse animation)

## Algorithm Performance

The combinatorial approach enables real-time probability calculation in JavaScript, efficiently handling frontier sizes up to approximately 15 cells.

## Mathematical Foundation

Probability calculation is based on:

1. **Constraint Satisfaction**: Each revealed number creates constraints on adjacent cells
2. **Bayesian Inference**: Computing P(mine|constraints) from valid configurations
3. **Combinatorial Counting**: Efficient enumeration using mathematical identities

**Formula**:
```
P(cell has mine) = (valid configurations with mine) / (total valid configurations)
```

Where valid configurations satisfy all revealed number constraints.

## Development

### Running the Game
Open `index.html` in a browser and test with various board configurations.

## References

- [Bayesian Inference for Mine Probability Calculation in Minesweeper](https://www.ai-gakkai.or.jp/jsai2016/webprogram/2016/pdf/927.pdf) - JSAI 2016 Conference Proceedings (Japanese)

## License

This project is released under the [MIT License](LICENSE).