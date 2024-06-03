document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const currentTurnDisplay = document.getElementById('current-turn');
    const player1PiecesDisplay = document.getElementById('player1-pieces');
    const player2PiecesDisplay = document.getElementById('player2-pieces');
    const restartButton = document.getElementById('restart-button');
    const tryAgainButton = document.getElementById('try-again-button');
    const winnerMessage = document.createElement('div');
    winnerMessage.setAttribute('id', 'winner-message');
    winnerMessage.style.display = 'none';
    document.body.appendChild(winnerMessage);
    const cells = [];
    let selectedPiece = null;
    let currentPlayer = 'player1';  // Starting with player1 (Red)
    let mustJump = false;
    let player1Pieces = 12;
    let player2Pieces = 12;
    let mustJumpPiece = null; // Track the piece that must continue jumping

    const initialBoard = [
        ['black', 'empty', 'black', 'empty', 'black', 'empty', 'black', 'empty'],
        ['empty', 'black', 'empty', 'black', 'empty', 'black', 'empty', 'black'],
        ['black', 'empty', 'black', 'empty', 'black', 'empty', 'black', 'empty'],
        ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
        ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
        ['empty', 'red', 'empty', 'red', 'empty', 'red', 'empty', 'red'],
        ['red', 'empty', 'red', 'empty', 'red', 'empty', 'red', 'empty'],
        ['empty', 'red', 'empty', 'red', 'empty', 'red', 'empty', 'red']
    ];

    function createBoard() {
        board.innerHTML = '';
        cells.length = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', onCellClick);
                board.appendChild(cell);
                cells.push(cell);
            }
        }
        console.log('Board created');
    }

    function placePieces() {
        initialBoard.forEach((row, rowIndex) => {
            row.forEach((piece, colIndex) => {
                const cell = cells[rowIndex * 8 + colIndex];
                if (piece === 'red') {
                    createPiece(cell, 'player1');
                } else if (piece === 'black') {
                    createPiece(cell, 'player2');
                }
            });
        });
        console.log('Pieces placed according to initial board');
    }

    function createPiece(cell, player) {
        const piece = document.createElement('div');
        piece.classList.add('piece', player);
        piece.dataset.player = player;
        piece.dataset.king = 'false';
        piece.addEventListener('click', onPieceClick);
        cell.appendChild(piece);
    }

    function onPieceClick(event) {
        event.stopPropagation();
        const piece = event.target;

        if (mustJump && piece !== selectedPiece) {
            console.log('Must continue jumping with the same piece');
            return;
        }

        if (piece.dataset.player !== currentPlayer) {
            console.log('Not current player\'s turn');
            return;
        }

        if (selectedPiece) {
            selectedPiece.classList.remove('selected');
            if (selectedPiece === piece) {
                selectedPiece = null;
                console.log('Deselected piece');
                return;
            }
        }

        piece.classList.add('selected');
        selectedPiece = piece;
        console.log('Selected piece:', selectedPiece);
    }

    function onCellClick(event) {
        const cell = event.target;

        if (selectedPiece && cell.children.length === 0) {
            const startRow = parseInt(selectedPiece.parentElement.dataset.row);
            const startCol = parseInt(selectedPiece.parentElement.dataset.col);
            const endRow = parseInt(cell.dataset.row);
            const endCol = parseInt(cell.dataset.col);

            const isKing = selectedPiece.dataset.king === 'true';

            console.log(`Trying move from (${startRow}, ${startCol}) to (${endRow}, ${endCol})`);

            if (isValidMove(startRow, startCol, endRow, endCol, selectedPiece.dataset.player, isKing)) {
                animateMove(selectedPiece, cell, startRow, startCol, endRow, endCol).then(() => {
                    selectedPiece.classList.remove('selected');

                    const capturedPiece = getCapturedPiece(startRow, startCol, endRow, endCol);
                    if (capturedPiece) {
                        capturedPiece.remove();
                        console.log('Captured piece');
                        updatePieceCount();
                        if (checkForMultipleJumps(endRow, endCol, selectedPiece.dataset.player, isKing)) {
                            selectedPiece.classList.add('selected');
                            mustJumpPiece = selectedPiece;
                            console.log('Multiple jumps available');
                        } else {
                            mustJumpPiece = null;
                            switchPlayer();
                        }
                    } else {
                        mustJumpPiece = null;
                        switchPlayer();
                    }

                    checkForKing(cell);
                    checkGameOver();
                });
            } else {
                console.log('Invalid move');
            }
        }
    }

    function isValidMove(startRow, startCol, endRow, endCol, player, isKing) {
        const rowDiff = endRow - startRow;
        const colDiff = Math.abs(endCol - startCol);

        if (colDiff === 1) {
            if (mustJump) return false;
            if (isKing) {
                return Math.abs(rowDiff) === 1;
            } else {
                if (player === 'player1' && rowDiff === -1) return true;  // Player1 (Red) moves up
                if (player === 'player2' && rowDiff === 1) return true;   // Player2 (Black) moves down
            }
        } else if (colDiff === 2) {
            const middleRow = (startRow + endRow) / 2;
            const middleCol = (startCol + endCol) / 2;
            const middleCell = cells[middleRow * 8 + middleCol];
            if (middleCell.children.length === 1 && middleCell.children[0].dataset.player !== player) {
                if (isKing) {
                    return Math.abs(rowDiff) === 2;
                } else {
                    if (player === 'player1' && rowDiff === -2) return true;  // Player1 (Red) jumps up
                    if (player === 'player2' && rowDiff === 2) return true;   // Player2 (Black) jumps down
                }
            }
        }

        return false;
    }

    function getCapturedPiece(startRow, startCol, endRow, endCol) {
        if (!isInBounds(startRow, startCol) || !isInBounds(endRow, endCol)) {
            throw new Error('Invalid move: Out of bounds');
        }

        if (Math.abs(endRow - startRow) === 2) {
            const middleRow = (startRow + endRow) / 2;
            const middleCol = (startCol + endCol) / 2;
            const middleCell = cells[middleRow * 8 + middleCol];
            return middleCell.children[0];
        }
        return null;
    }

    function checkForKing(cell) {
        if (cell.children.length === 0) return; // No piece in the cell to check
        const piece = cell.children[0];
        const row = parseInt(cell.dataset.row);
        const player = piece.dataset.player;

        if ((player === 'player1' && row === 0) || (player === 'player2' && row === 7)) {
            piece.dataset.king = 'true';
            if (player === 'player1') {
                piece.classList.remove('player1');
                piece.classList.add('king-red');
            } else {
                piece.classList.remove('player2');
                piece.classList.add('king-black');
            }
            console.log('Piece kinged:', piece);
        }
    }

    function checkForMultipleJumps(row, col, player, isKing) {
        const directions = isKing ?
            [[-2, -2], [-2, 2], [2, -2], [2, 2]] :
            player === 'player1' ? [[-2, -2], [-2, 2]] : [[2, -2], [2, 2]];  // Adjust directions for player1 and player2

        for (let [rowOffset, colOffset] of directions) {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;

            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const middleRow = (row + newRow) / 2;
                const middleCol = (col + newCol) / 2;
                const middleCell = cells[middleRow * 8 + middleCol];
                const endCell = cells[newRow * 8 + newCol];

                if (middleCell.children.length === 1 && middleCell.children[0].dataset.player !== player && endCell.children.length === 0) {
                    mustJump = true;
                    return true;
                }
            }
        }

        mustJump = false;
        return false;
    }

    function switchPlayer() {
        deselectAll(); // Deselect any selected pieces before switching player
        currentPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
        mustJump = false;
        selectedPiece = null;
        updateStatus();

        if (currentPlayer === 'player2') {
            setTimeout(() => {
                if (mustJumpPiece) {
                    const bestMove = getBestMoveForPiece(mustJumpPiece);
                    if (bestMove) {
                        applyBestMove(bestMove);
                    } else {
                        mustJumpPiece = null;
                        switchPlayer();
                    }
                } else {
                    iterativeDeepeningSearch(cloneGameState(), 10).then(bestMove => { // Use iterative deepening
                        if (bestMove) {
                            applyBestMove(bestMove);
                        } else {
                            declareWinner('Red');
                        }
                    });
                }
            }, 500); // Adding a delay for visualization
        }

        console.log('Switched player:', currentPlayer);
    }

    function deselectAll() {
        const selectedPieces = document.querySelectorAll('.selected');
        selectedPieces.forEach(piece => piece.classList.remove('selected'));
    }

    function updatePieceCount() {
        player1Pieces = document.querySelectorAll('.piece.player1').length;
        player2Pieces = document.querySelectorAll('.piece.player2').length;
        player1PiecesDisplay.textContent = `Red Pieces: ${player1Pieces}`;
        player2PiecesDisplay.textContent = `Black Pieces: ${player2Pieces}`;
    }

    function updateStatus() {
        currentTurnDisplay.textContent = `Current Turn: ${currentPlayer === 'player1' ? 'Red' : 'Black'}`;
        updatePieceCount();
    }

    function animateMove(piece, cell, startRow, startCol, endRow, endCol) {
        return new Promise(resolve => {
            const pieceRect = piece.getBoundingClientRect();
            const cellRect = cell.getBoundingClientRect();
            const offsetX = cellRect.left - pieceRect.left;
            const offsetY = cellRect.top - pieceRect.top;

            piece.style.transition = 'transform 0.3s ease';
            piece.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

            piece.addEventListener('transitionend', function handler() {
                piece.style.transition = '';
                piece.style.transform = '';
                piece.removeEventListener('transitionend', handler);
                cell.appendChild(piece);
                resolve();
                console.log(`Moved piece to (${endRow}, ${endCol})`);
            });
        });
    }

    function checkGameOver() {
        if (player1Pieces === 0) {
            declareWinner('Black');
        } else if (player2Pieces === 0) {
            declareWinner('Red');
        }
    }

    function declareWinner(winner) {
        winnerMessage.textContent = `${winner} wins!`;
        winnerMessage.style.display = 'block';
        tryAgainButton.style.display = 'block';
        console.log(`${winner} wins`);
    }

    restartButton.addEventListener('click', () => {
        selectedPiece = null;
        currentPlayer = 'player1';  // Reset to player1 (Red) starting
        mustJump = false;
        player1Pieces = 12;
        player2Pieces = 12;
        mustJumpPiece = null;
        tryAgainButton.style.display = 'none';
        winnerMessage.style.display = 'none';
        createBoard();
        placePieces();
        updateStatus();
        console.log('Game restarted');
    });

    tryAgainButton.addEventListener('click', () => {
        tryAgainButton.style.display = 'none';
        winnerMessage.style.display = 'none';
        createBoard();
        placePieces();
        updateStatus();
        console.log('Try again');
    });

    createBoard();
    placePieces();
    updateStatus();

    // Algoritme håndtering

    // Helper function to clone the game state
    function cloneGameState() {
        return {
            cells: cells.map(cell => ({
                player: cell.children[0]?.dataset.player || undefined,
                king: cell.children[0]?.dataset.king === 'true' || false
            })),
            currentPlayer,
            player1Pieces,
            player2Pieces,
            mustJump
        };
    }

    // Iterative Deepening Search
    function iterativeDeepeningSearch(state, maxDepth) {
        return new Promise((resolve) => {
            let bestMove = null;
            let startTime = performance.now();
            let timeLimit = 1000; // 1 second
    
            for (let depth = 1; depth <= maxDepth; depth++) {
                if (performance.now() - startTime > timeLimit) {
                    break;
                }
                bestMove = getBestMove(state, depth);
                console.log(`Depth: ${depth}, Best Move:`, bestMove);
            }
            resolve(bestMove);
        });
    }
    
    

    // Minimax algorithm with Alpha-Beta pruning
    
    const transpositionTable = new Map();

    function alphaBeta(state, depth, alpha, beta, isMaximizingPlayer, quiescence = false) {
        const stateKey = JSON.stringify(state);
        if (transpositionTable.has(stateKey)) {
            return transpositionTable.get(stateKey);
        }
    
        if (depth === 0 || isGameOver(state)) {
            const evaluation = evaluateBoard(state);
            transpositionTable.set(stateKey, evaluation);
            return evaluation;
        }
    
        if (!quiescence && depth <= 2) { // Enter quiescence search
            return quiescenceSearch(state, alpha, beta, isMaximizingPlayer);
        }
    
        const moves = getPossibleMoves(state, isMaximizingPlayer ? 'player1' : 'player2');
        if (moves.length === 0) {
            return isMaximizingPlayer ? -Infinity : Infinity;
        }
    
        if (isMaximizingPlayer) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const newState = applyMove(cloneGameState(), move);
                const eval = alphaBeta(newState, depth - 1, alpha, beta, false);
                maxEval = Math.max(maxEval, eval);
                alpha = Math.max(alpha, eval);
                if (beta <= alpha) {
                    break;
                }
            }
            transpositionTable.set(stateKey, maxEval);
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const newState = applyMove(cloneGameState(), move);
                const eval = alphaBeta(newState, depth - 1, alpha, beta, true);
                minEval = Math.min(minEval, eval);
                beta = Math.min(beta, eval);
                if (beta <= alpha) {
                    break;
                }
            }
            transpositionTable.set(stateKey, minEval);
            return minEval;
        }
    }

    function quiescenceSearch(state, alpha, beta, isMaximizingPlayer) {
        let standPat = evaluateBoard(state);
    
        if (isMaximizingPlayer) {
            if (standPat >= beta) return beta;
            if (alpha < standPat) alpha = standPat;
        } else {
            if (standPat <= alpha) return alpha;
            if (beta > standPat) beta = standPat;
        }
    
        const moves = getPossibleMoves(state, isMaximizingPlayer ? 'player1' : 'player2').filter(move => move.capture);
        for (const move of moves) {
            const newState = applyMove(cloneGameState(), move);
            const score = quiescenceSearch(newState, alpha, beta, !isMaximizingPlayer);
    
            if (isMaximizingPlayer) {
                if (score >= beta) return beta;
                if (alpha < score) alpha = score;
            } else {
                if (score <= alpha) return alpha;
                if (beta > score) beta = score;
            }
        }
    
        return isMaximizingPlayer ? alpha : beta;
    }
    
    function getBestMove(state, depth) {
        let bestMove;
        let bestValue = -Infinity;
        const moves = getPossibleMoves(state, 'player2');

        for (const move of moves) {
            const newState = applyMove(cloneGameState(), move);
            const moveValue = alphaBeta(newState, depth - 1, -Infinity, Infinity, false);
            if (moveValue > bestValue) {
                bestValue = moveValue;
                bestMove = move;
            }
        }

        console.log(`Best move at depth ${depth}:`, bestMove, 'Value:', bestValue);
        return bestMove;
    }


    function isPieceSafe(row, col, state, player) {
        const directions = player === 'player1' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
        for (const [rowOffset, colOffset] of directions) {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;
            if (isInBounds(newRow, newCol) && state.cells[newRow * 8 + newCol].player === undefined) {
                return false;
            }
        }
        return true;
    }
    
    
    

    // Check if the game is over
    function isGameOver(state) {
        return state.player1Pieces === 0 || state.player2Pieces === 0;
    }

    // Get possible moves for a player
    function getPossibleMoves(state, player) {
        const moves = [];
        const captureMoves = [];
        const directions = player === 'player1' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
    
        state.cells.forEach((cell, index) => {
            const row = Math.floor(index / 8);
            const col = index % 8;
    
            if (cell.player === player) {
                const isKing = cell.king;
                const moveDirections = isKing ? directions.concat(directions.map(d => d.map(n => n * -1))) : directions;
    
                moveDirections.forEach(([rowOffset, colOffset]) => {
                    const newRow = row + rowOffset;
                    const newCol = col + colOffset;
                    const jumpRow = row + 2 * rowOffset;
                    const jumpCol = col + 2 * colOffset;
    
                    if (isInBounds(jumpRow, jumpCol) &&
                        state.cells[newRow * 8 + newCol].player !== player &&
                        state.cells[newRow * 8 + newCol].player !== undefined &&
                        state.cells[jumpRow * 8 + jumpCol].player === undefined) {
                        // Capture move
                        captureMoves.push({ startRow: row, startCol: col, endRow: jumpRow, endCol: jumpCol, capture: true, capturedRow: newRow, capturedCol: newCol });
                    } else if (isInBounds(newRow, newCol) && state.cells[newRow * 8 + newCol].player === undefined) {
                        // Regular move
                        moves.push({ startRow: row, startCol: col, endRow: newRow, endCol: newCol, capture: false });
                    }
                });
            }
        });
    
        // Sort moves to prioritize captures and moves towards promotion
        captureMoves.sort((a, b) => b.endRow - a.endRow);
        moves.sort((a, b) => b.endRow - a.endRow);
    
        // Return capture moves first if any exist
        if (captureMoves.length > 0) {
            return captureMoves;
        }
    
        // Otherwise, return regular moves
        return moves;
    }
    
    function evaluateBoard(state) {
        let evaluation = 0;
        const centerBonus = 3;
        const kingBonus = 10;
        const pieceBonus = 5;
        const safePieceBonus = 2;
        const captureBonus = 50; // Increased bonus for capturing
        const mobilityBonus = 1;
        const kingSafetyBonus = 5;
        const promotionZoneBonus = 2;
    
        state.cells.forEach((cell, index) => {
            const row = Math.floor(index / 8);
            const col = index % 8;
            const pieceValue = (cell.king ? kingBonus : pieceBonus);
    
            if (cell.player === 'player1') {
                evaluation += pieceValue;
                if (row >= 3 && row <= 4 && col >= 3 && col <= 4) {
                    evaluation += centerBonus; // Bonus for controlling the center
                }
                if (isPieceSafe(row, col, state, 'player1')) {
                    evaluation += safePieceBonus; // Bonus for safe pieces
                }
                if (row <= 2) {
                    evaluation += promotionZoneBonus; // Bonus for being close to promotion
                }
            } else if (cell.player === 'player2') {
                evaluation -= pieceValue;
                if (row >= 3 && row <= 4 && col >= 3 && col <= 4) {
                    evaluation -= centerBonus; // Penalty for opponent controlling the center
                }
                if (isPieceSafe(row, col, state, 'player2')) {
                    evaluation -= safePieceBonus; // Penalty for safe opponent pieces
                }
                if (row >= 5) {
                    evaluation -= promotionZoneBonus; // Penalty for opponent being close to promotion
                }
            }
        });
    
        evaluation += (state.player1Pieces - state.player2Pieces) * 10;
    
        // Add a bonus for the number of possible captures
        const player1Captures = getPossibleMoves(state, 'player1').filter(move => move.capture).length;
        const player2Captures = getPossibleMoves(state, 'player2').filter(move => move.capture).length;
        evaluation += (player1Captures - player2Captures) * captureBonus;
    
        // Add a bonus for mobility
        const player1Moves = getPossibleMoves(state, 'player1').length;
        const player2Moves = getPossibleMoves(state, 'player2').length;
        evaluation += (player1Moves - player2Moves) * mobilityBonus;
    
        // Add a bonus for king safety
        const player1Kings = state.cells.filter(cell => cell.player === 'player1' && cell.king).length;
        const player2Kings = state.cells.filter(cell => cell.player === 'player2' && cell.king).length;
        evaluation += (player1Kings - player2Kings) * kingSafetyBonus;
    
        return evaluation;
    }
    
    
    

    function getBestMoveForPiece(piece) {
        const row = parseInt(piece.parentElement.dataset.row);
        const col = parseInt(piece.parentElement.dataset.col);
        const state = cloneGameState();
        const moves = getPossibleMoves(state, piece.dataset.player);

        return moves.find(move => move.startRow === row && move.startCol === col);
    }

    // Helper function to check if coordinates are within board bounds
    function isInBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    function applyMove(state, move) {
        const { startRow, startCol, endRow, endCol, capture, capturedRow, capturedCol } = move;
    
        if (!isInBounds(startRow, startCol) || !isInBounds(endRow, endCol)) {
            throw new Error('Invalid move: Out of bounds');
        }
    
        const startIndex = startRow * 8 + startCol;
        const endIndex = endRow * 8 + endCol;
        const capturedIndex = capturedRow * 8 + capturedCol;
    
        const piece = state.cells[startIndex];
        
        if (!piece || piece.player === undefined) {
            throw new Error('Invalid move: No piece found at starting position');
        }
    
        if (state.cells[endIndex].player !== undefined) {
            throw new Error('Invalid move: Destination cell is occupied');
        }
    
        // Move the piece to the new position
        state.cells[endIndex] = { ...piece };
        state.cells[startIndex] = { player: undefined, king: false };
    
        // Remove the captured piece if there is one
        if (capture) {
            if (!isInBounds(capturedRow, capturedCol)) {
                throw new Error('Invalid move: Captured piece position out of bounds');
            }
    
            if (state.cells[capturedIndex].player === undefined) {
                console.error(`Captured piece not found at (${capturedRow}, ${capturedCol})`);
                console.error('State at captured position:', state.cells[capturedIndex]);
                console.error('Full state:', state);
                throw new Error('Invalid move: No piece found at captured position');
            }
    
            // Update player piece count
            if (state.cells[capturedIndex].player === 'player1') {
                state.player1Pieces -= 1;
            } else {
                state.player2Pieces -= 1;
            }
    
            state.cells[capturedIndex] = { player: undefined, king: false };
        }
    
        // Check for kinging
        if ((piece.player === 'player1' && endRow === 0) || (piece.player === 'player2' && endRow === 7)) {
            state.cells[endIndex].king = true;
        }
    
        return state;
    }

    function applyBestMove(move) {
        const startCell = cells[move.startRow * 8 + move.startCol];
        const endCell = cells[move.endRow * 8 + move.endCol];
        const piece = startCell.children[0];

        animateMove(piece, endCell, move.startRow, move.startCol, move.endRow, move.endCol).then(() => {
            const capturedPiece = getCapturedPiece(move.startRow, move.startCol, move.endRow, move.endCol);
            if (capturedPiece) {
                capturedPiece.remove();
                updatePieceCount();

                // Handle multiple jumps
                const isKing = piece.dataset.king === 'true';
                if (checkForMultipleJumps(move.endRow, move.endCol, piece.dataset.player, isKing)) {
                    piece.classList.add('selected');
                    mustJumpPiece = piece;  // Track the piece that must continue jumping
                    setTimeout(() => {
                        const additionalMove = getBestMoveForPiece(mustJumpPiece);
                        if (additionalMove) {
                            applyBestMove(additionalMove);
                        } else {
                            mustJumpPiece = null;
                            switchPlayer();
                        }
                    }, 500);
                } else {
                    mustJumpPiece = null;
                    switchPlayer();
                }
            } else {
                mustJumpPiece = null;
                switchPlayer();
            }

            checkForKing(cells[move.endRow * 8 + move.endCol]);
            checkGameOver();
        });
    }

    
    // Check if the game is over
    function isGameOver(state) {
    return state.player1Pieces === 0 || state.player2Pieces === 0;
    }

});
