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
    const memo = new Map();

    function createBoard() {
        board.innerHTML = '';
        cells.length = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell', (row + col) % 2 === 0 ? 'light' : 'dark');
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
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 !== 0) {
                    createPiece(cells[row * 8 + col], 'player2');  // Placing black pieces at the top
                }
            }
        }

        for (let row = 5; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 !== 0) {
                    createPiece(cells[row * 8 + col], 'player1');  // Placing red pieces at the bottom
                }
            }
        }
        console.log('Pieces placed');
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
            console.log("Not current player's turn");
            return;
        }

        if (selectedPiece) {
            selectedPiece.classList.remove('selected');
            clearHighlights(); // Clear previous highlights
            if (selectedPiece === piece) {
                selectedPiece = null;
                console.log('Deselected piece');
                return;
            }
        }

        piece.classList.add('selected');
        selectedPiece = piece;
        console.log('Selected piece:', selectedPiece);

        // Highlight possible moves for the selected piece
        highlightPossibleMoves(selectedPiece);
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

    function getCapturedPiece(startRow, startCol, endRow, endCol) {
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
            player === 'player1' ? [[-2, -2], [-2, 2]] : [[2, -2], [2, 2]]; // Adjust directions for player1 and player2

        for (let [rowOffset, colOffset] of directions) {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;

            if (isInBounds(newRow, newCol)) {
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
                    const state = cloneGameState();
                    const bestMove = getBestMoveAlphaBeta(state, 4); // Set depth to 4 for alpha-beta decision-making

                    if (bestMove) {
                        console.log('AlphaBeta best move: ', bestMove);
                        applyBestMove(bestMove);
                    } else {
                        declareWinner('Red');
                    }
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

    function cloneGameState() {
        return {
            cells: cells.map(cell => {
                return {
                    player: cell.children[0]?.dataset.player,
                    king: cell.children[0]?.dataset.king === 'true'
                };
            }),
            currentPlayer,
            player1Pieces,
            player2Pieces
        };
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
                consideredMoves.push(move); // Track moves considered by minimax
                maxEval = Math.max(maxEval, eval);
                alpha = Math.max(alpha, eval);
                if (beta <= alpha) {
                    console.log(`Pruning branch at move (${move.startRow}, ${move.startCol}) to (${move.endRow}, ${move.endCol})`);
                    break; // Prune the branch
                }
            }
            clearHighlights();
            highlightConsideredMoves(consideredMoves);
            memo.set(stateKey, maxEval);
            return maxEval;
        } else {
            let minEval = Infinity;
            const moves = getPossibleMoves(state, 'player2');
            for (const move of moves) {
                const newState = applyMove(cloneGameState(), move);
                const eval = minimax(newState, depth - 1, alpha, beta, true);
                consideredMoves.push(move); // Track moves considered by minimax
                minEval = Math.min(minEval, eval);
                beta = Math.min(beta, eval);
                if (beta <= alpha) {
                    console.log(`Pruning branch at move (${move.startRow}, ${move.startCol}) to (${move.endRow}, ${move.endCol})`);
                    break; // Prune the branch
                }
            }
            clearHighlights();
            highlightConsideredMoves(consideredMoves);
            memo.set(stateKey, minEval);
            return minEval;
        }
    }

    function alphaBeta(state, depth, alpha, beta, isMaximizingPlayer) {
        return minimax(state, depth, alpha, beta, isMaximizingPlayer);
    }

    function evaluateBoard(state) {
        let evaluation = 0;
        const pieceValue = 3;
        const kingValue = 5;
        const centerValue = 1;

        state.cells.forEach((cell, index) => {
            const row = Math.floor(index / 8);
            const col = index % 8;
            if (cell.player === 'player1') {
                evaluation += pieceValue + (cell.king ? kingValue : 0);
                evaluation += (7 - row); // Higher value for pieces closer to becoming king
                evaluation += (col > 2 && col < 5 ? centerValue : 0); // Higher value for center control
            } else if (cell.player === 'player2') {
                evaluation -= pieceValue + (cell.king ? kingValue : 0);
                evaluation -= row; // Higher value for pieces closer to becoming king
                evaluation -= (col > 2 && col < 5 ? centerValue : 0); // Higher value for center control
            }
        });

        const player1Moves = getPossibleMoves(state, 'player1').length;
        const player2Moves = getPossibleMoves(state, 'player2').length;

        evaluation += player1Moves;
        evaluation -= player2Moves;

        return evaluation;
    }

    function isGameOver(state) {
        return state.player1Pieces === 0 || state.player2Pieces === 0;
    }

    function getPossibleMoves(state, player) {
        const moves = [];
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

                    if (isInBounds(newRow, newCol) && state.cells[newRow * 8 + newCol].player === undefined) {
                        moves.push({ startRow: row, startCol: col, endRow: newRow, endCol: newCol, capture: false });
                    } else if (
                        isInBounds(jumpRow, jumpCol) &&
                        state.cells[newRow * 8 + newCol].player !== player &&
                        state.cells[newRow * 8 + newCol].player !== undefined &&
                        state.cells[jumpRow * 8 + jumpCol].player === undefined
                    ) {
                        moves.push({ startRow: row, startCol: col, endRow: jumpRow, endCol: jumpCol, capture: true, capturedRow: newRow, capturedCol: newCol });
                    }
                });
            }
        });

        return moves;
    }

    function getBestMove(state, depth, evaluationFunction) {
        let bestMove;
        let bestValue = -Infinity;
        let worstMove;
        let worstValue = Infinity;
        const moves = getPossibleMoves(state, 'player2');
        const consideredMoves = [];

        for (const move of moves) {
            const newState = applyMove(cloneGameState(), move);
            const moveValue = evaluationFunction(newState, depth - 1, -Infinity, Infinity, false);
            consideredMoves.push(move);
            console.log(`Move from (${move.startRow}, ${move.startCol}) to (${move.endRow}, ${move.endCol}) has value ${moveValue}`);
            if (moveValue > bestValue) {
                bestValue = moveValue;
                bestMove = move;
            }
            if (moveValue < worstValue) {
                worstValue = moveValue;
                worstMove = move;
            }
        }

        clearHighlights();
        clearBestMoveHighlight();
        clearWorstMoveHighlight();
        highlightConsideredMoves(consideredMoves);

        if (bestMove) {
            highlightBestMove(bestMove);
        }
        if (worstMove) {
            highlightWorstMove(worstMove);
        }

        return bestMove;
    }

    function getBestMoveAlphaBeta(state, depth) {
        return getBestMove(state, depth, alphaBeta);
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

    function applyMove(state, move) {
        const { startRow, startCol, endRow, endCol, capture, capturedRow, capturedCol } = move;

        const startIndex = startRow * 8 + startCol;
        const endIndex = endRow * 8 + endCol;
        state.cells[endIndex] = { ...state.cells[startIndex] };
        state.cells[startIndex] = { player: undefined, king: false };

        if (capture) {
            const capturedIndex = capturedRow * 8 + capturedCol;
            if (state.cells[capturedIndex].player === 'player1') {
                state.player1Pieces -= 1;
            } else {
                state.player2Pieces -= 1;
            }
            state.cells[capturedIndex] = { player: undefined, king: false };
        }

        if ((state.cells[endIndex].player === 'player1' && endRow === 0) || (state.cells[endIndex].player === 'player2' && endRow === 7)) {
            state.cells[endIndex].king = true;
        }

        return state;
    }

    function getBestMoveForPiece(piece) {
        const row = parseInt(piece.parentElement.dataset.row);
        const col = parseInt(piece.parentElement.dataset.col);
        const state = cloneGameState();
        const moves = getPossibleMoves(state, piece.dataset.player);

        return moves.find(move => move.startRow === row && move.startCol === col);
    }

    function highlightPossibleMoves(piece) {
        const moves = getPossibleMovesForPiece(piece);
        console.log('Possible moves:', moves);
        moves.forEach(move => {
            const endCell = cells[move.endRow * 8 + move.endCol];
            endCell.classList.add('possible-move');
            console.log(`Highlighting possible move to (${move.endRow}, ${move.endCol})`);
        });
    }

    function getPossibleMovesForPiece(piece) {
        const startRow = parseInt(piece.parentElement.dataset.row);
        const startCol = parseInt(piece.parentElement.dataset.col);
        const isKing = piece.dataset.king === 'true';
        console.log(`Getting possible moves for piece at (${startRow}, ${startCol})`);
        return getPossibleMoves(cloneGameState(), piece.dataset.player).filter(move =>
            move.startRow === startRow && move.startCol === startCol
        );
    }

    function highlightConsideredMoves(moves) {
        clearConsideredMovesHighlight();
        moves.forEach(move => {
            const endCell = cells[move.endRow * 8 + move.endCol];
            if (endCell.children.length === 0) { // Only highlight if the cell is empty
                endCell.classList.add('considered-move');
                console.log(`Highlighting considered move to (${move.endRow}, ${move.endCol})`);
            }
        });
    }

    function clearConsideredMovesHighlight() {
        const consideredMoveCells = document.querySelectorAll('.considered-move');
        consideredMoveCells.forEach(cell => cell.classList.remove('considered-move'));
        console.log('Cleared considered move highlights');
    }

    function highlightBestMove(move) {
        const endCell = cells[move.endRow * 8 + move.endCol];
        endCell.classList.add('best-move');
        console.log(`Highlighting best move to (${move.endRow}, ${move.endCol})`);
    }

    function highlightWorstMove(move) {
        const endCell = cells[move.endRow * 8 + move.endCol];
        endCell.classList.add('worst-move');
        console.log(`Highlighting worst move to (${move.endRow}, ${move.endCol})`);
    }

    function clearBestMoveHighlight() {
        const bestMoveCell = document.querySelector('.best-move');
        if (bestMoveCell) {
            bestMoveCell.classList.remove('best-move');
            console.log('Cleared best move highlight');
        }
    }

    function clearWorstMoveHighlight() {
        const worstMoveCell = document.querySelector('.worst-move');
        if (worstMoveCell) {
            worstMoveCell.classList.remove('worst-move');
            console.log('Cleared worst move highlight');
        }
    }

    function isInBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    function clearHighlights() {
        cells.forEach(cell => {
            cell.classList.remove('possible-move', 'considered-move', 'best-move', 'worst-move');
        });
        console.log('Cleared all highlights');
    }
});
