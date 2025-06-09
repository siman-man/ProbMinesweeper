# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Minesweeper game with an advanced probability calculation system. The project combines a web-based UI with sophisticated algorithmic solving capabilities using Binary Decision Diagrams (BDD).

### Architecture Components

1. **Frontend (Browser-based)**:
   - `index.html` - Main game interface with responsive design
   - `main.js` - Game logic, UI interactions, and board management
   - `solver.js` - JavaScript probability solver using combinatorial analysis

2. **Backend Solver (C++)**:
   - `solver.cpp` - Advanced BDD-based minesweeper solver for complex probability calculations

### Key Technical Details

- **Probability Calculation**: Two solver implementations
  - JavaScript version uses combinatorial analysis for real-time probability display
  - C++ version uses Binary Decision Diagrams for more sophisticated constraint solving
- **Game State Management**: Uses 2D arrays for bomb positions, numbers, and visibility
- **UI Features**: Real-time probability visualization with color-coded risk levels
- **Responsive Design**: Mobile-friendly interface with touch support

### Development Commands

Since this is a static web project with no build system:
- Open `index.html` directly in a browser to run the game
- For C++ solver development: `g++ -o solver solver.cpp -std=c++17`

### File Interactions

- `main.js` calls `computeProbabilities()` from `solver.js` to display mine probabilities
- The JavaScript solver operates independently of the C++ solver
- Game state is managed entirely in the browser without external dependencies