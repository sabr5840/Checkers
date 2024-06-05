# Game of Checkers

<img width="397" alt="image" src="https://github.com/sabr5840/Checkers/assets/113180288/beca789b-ae8c-4536-9e29-b10a4b70f76a">

## Introduction
This is a web-based Checkers game developed to provide an engaging experience across various devices, from desktops to mobile devices. The game is built using a combination of HTML for structure, CSS for styling, and JavaScript for interactivity and game mechanics. The user interface is minimalist and intuitive, ensuring a smooth and responsive user experience.

## Live Demo
- **Clickable link to deployed version**: [Checkers Game](https://sabr5840.github.io/Checkers/)
- **Readable link to deployed version**: https://sabr5840.github.io/Checkers/

## GitHub Repository
- **Clickable link to GitHub repository**: [GitHub Repository](https://github.com/sabr5840/Checkers)
- **Readable link to GitHub repository**: https://github.com/sabr5840/Checkers

## Features
- **Player vs AI**: Play against a computer opponent.
- **Minimax Algorithm**: Uses the Minimax algorithm for AI decision-making.
- **Alpha-Beta Pruning**: Optimizes the Minimax algorithm to improve performance.
- **Responsive Design**: Works on both desktop and mobile devices.
- **Interactive Gameplay**: Highlighting possible moves, capturing pieces, and promoting to king.

## How to Play
1. **Starting the Game**:
    - The game starts with the red player (Player 1) making the first move.
2. **Making Moves**:
    - Click on a piece to select it. Possible moves will be highlighted.
    - Click on a highlighted cell to move the piece.
3. **Capturing Pieces**:
    - If you can capture an opponent's piece, you must do so.
    - Multiple jumps are possible and must be completed in the same turn.
4. **King Promotion**:
    - When a piece reaches the opposite side of the board, it is promoted to a king.
5. **Winning the Game**:
    - The game ends when a player captures all of the opponent's pieces or the opponent has no legal moves left.

## Implementation Details
### Board and Pieces
- The board is created using a grid of 8x8 cells.
- Pieces are created and placed on the board at the start of the game.

### AI Algorithms
#### Minimax Algorithm
- A recursive algorithm used for decision-making in games.
- Evaluates possible future moves and selects the optimal move for the AI.

#### Alpha-Beta Pruning
- An optimization of the Minimax algorithm.
- Reduces the number of nodes evaluated in the game tree by pruning branches that do not affect the final decision.

### Key Functions
- **createBoard()**: Initializes the game board.
- **placePieces()**: Places the pieces on the board in their starting positions.
- **onPieceClick()**: Handles user clicks on pieces, highlighting possible moves.
- **onCellClick()**: Handles user clicks on cells, moving the selected piece if the move is valid.
- **isValidMove()**: Checks if a move is valid according to the game rules.
- **animateMove()**: Animates piece movement for a smooth gameplay experience.
- **minimax()**: Implements the Minimax algorithm for AI decision-making.
- **alphaBeta()**: Implements Alpha-Beta Pruning to optimize Minimax.
- **evaluateBoard()**: Evaluates the board state to determine the best moves.
- **getPossibleMoves()**: Generates all possible moves for a given board state and player.

## Code Structure
The code is structured into several modules for clarity and maintainability:
- **HTML**: Defines the structure of the game interface.
- **CSS**: Styles the game board and pieces, and provides animations.
- **JavaScript**: Implements game logic, AI algorithms, and interactivity.

## Example Code Snippets
## AI Decision Making

```javascript
function minimax(state, depth, alpha, beta, isMaximizingPlayer) {
    const stateKey = JSON.stringify(state);
    if (memo.has(stateKey)) {
        return memo.get(stateKey);
    }

    if (depth === 0 || isGameOver(state)) {
        const evaluation = evaluateBoard(state);
        memo.set(stateKey, evaluation);
        return evaluation;
    }

    let consideredMoves = [];

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        const moves = getPossibleMoves(state, 'player1');
        for (const move of moves) {
            const newState = applyMove(cloneGameState(), move);
            const eval = minimax(newState, depth - 1, alpha, beta, false);
            consideredMoves.push(move);
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) {
                console.log(`Pruning branch at move (${move.startRow}, ${move.startCol}) to (${move.endRow}, ${move.endCol})`);
                break;
            }
        }
        memo.set(stateKey, maxEval);
        return maxEval;
    } else {
        let minEval = Infinity;
        const moves = getPossibleMoves(state, 'player2');
        for (const move of moves) {
            const newState = applyMove(cloneGameState(), move);
            const eval = minimax(newState, depth - 1, alpha, beta, true);
            consideredMoves.push(move);
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) {
                console.log(`Pruning branch at move (${move.startRow}, ${move.startCol}) to (${move.endRow}, ${move.endCol})`);
                break;
            }
        }
        memo.set(stateKey, minEval);
        return minEval;
    }
}

function minimax(state, depth, alpha, beta, isMaximizingPlayer) {
    const stateKey = JSON.stringify(state);
    if (memo.has(stateKey)) {
        return memo.get(stateKey);
    }

    if (depth === 0 || isGameOver(state)) {
        const evaluation = evaluateBoard(state);
        memo.set(stateKey, evaluation);
        return evaluation;
    }

    let consideredMoves = [];

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        const moves = getPossibleMoves(state, 'player1');
        for (const move of moves) {
            const newState = applyMove(cloneGameState(), move);
            const eval = minimax(newState, depth - 1, alpha, beta, false);
            consideredMoves.push(move);
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) {
                console.log(`Pruning branch at move (${move.startRow}, ${move.startCol}) to (${move.endRow}, ${move.endCol})`);
                break;
            }
        }
        memo.set(stateKey, maxEval);
        return maxEval;
    } else {
        let minEval = Infinity;
        const moves = getPossibleMoves(state, 'player2');
        for (const move of moves) {
            const newState = applyMove(cloneGameState(), move);
            const eval = minimax(newState, depth - 1, alpha, beta, true);
            consideredMoves.push(move);
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) {
                console.log(`Pruning branch at move (${move.startRow}, ${move.startCol}) to (${move.endRow}, ${move.endCol})`);
                break;
            }
        }
        memo.set(stateKey, minEval);
        return minEval;
    }
}

