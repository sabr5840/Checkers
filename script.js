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

    // AI variables and constants
    const INFINITY = 10000;
    const NEG_INFINITY = -10000;

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
                            console.log('Multiple jumps available');
                        } else {
                            switchPlayer();
                        }
                    } else {
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
        currentPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
        mustJump = false;
        selectedPiece = null;
        updateStatus();
        console.log('Switched player:', currentPlayer);

        if (currentPlayer === 'player2') {  // Assuming player2 is the computer
            setTimeout(computerMove, 500);  // Adding a delay for the computer's move
        }
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

    // Helper Functions and AI Integration
    function copy_board() {
        const boardCopy = [];
        cells.forEach(cell => {
            const piece = cell.querySelector('.piece');
            if (piece) {
                boardCopy.push({
                    player: piece.dataset.player,
                    king: piece.dataset.king === 'true',
                    row: parseInt(cell.dataset.row),
                    col: parseInt(cell.dataset.col)
                });
            }
        });
        return boardCopy;
    }

    function evaluate_position(x, y) {
        if (x == 0 || x == 7 || y == 0 || y == 7) {
            return 5;
        } else {
            return 3;
        }
    }

    function utility(boardCopy) {
        let sum = 0;
        let computer_pieces = 0;
        let computer_kings = 0;
        let human_pieces = 0;
        let human_kings = 0;
        let computer_pos_sum = 0;
        let human_pos_sum = 0;

        boardCopy.forEach(piece => {
            if (piece.player === 'player1') { // human
                human_pieces += 1;
                if (piece.king) human_kings += 1;
                human_pos_sum += evaluate_position(piece.col, piece.row);
            } else { // computer
                computer_pieces += 1;
                if (piece.king) computer_kings += 1;
                computer_pos_sum += evaluate_position(piece.col, piece.row);
            }
        });

        const piece_difference = computer_pieces - human_pieces;
        const king_difference = computer_kings - human_kings;
        const avg_human_pos = human_pos_sum / human_pieces || 0;
        const avg_computer_pos = computer_pos_sum / computer_pieces || 0;
        const avg_pos_diff = avg_computer_pos - avg_human_pos;

        const features = [piece_difference, king_difference, avg_pos_diff];
        const weights = [100, 10, 1];

        let board_utility = 0;
        features.forEach((feature, index) => {
            board_utility += feature * weights[index];
        });

        return board_utility;
    }

    function get_available_moves(player, boardCopy) {
        const moves = [];
        boardCopy.forEach(piece => {
            if (piece.player === player) {
                const directions = piece.king ? 
                    [[-1, -1], [-1, 1], [1, -1], [1, 1], [-2, -2], [-2, 2], [2, -2], [2, 2]] :
                    player === 'player1' ? [[-1, -1], [-1, 1], [-2, -2], [-2, 2]] : [[1, -1], [1, 1], [2, -2], [2, 2]];
                directions.forEach(direction => {
                    const newRow = piece.row + direction[0];
                    const newCol = piece.col + direction[1];
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        const capturedPiece = getCapturedPiece(piece.row, piece.col, newRow, newCol);
                        const endCell = cells[newRow * 8 + newCol];
                        if ((!endCell || endCell.children.length === 0)) {
                            if (Math.abs(direction[0]) === 2 && capturedPiece && capturedPiece.dataset.player !== player) {
                                moves.push({ piece, from: { row: piece.row, col: piece.col }, to: { row: newRow, col: newCol }, capturedPiece });
                            } else if (Math.abs(direction[0]) === 1 && !capturedPiece) {
                                moves.push({ piece, from: { row: piece.row, col: piece.col }, to: { row: newRow, col: newCol } });
                            }
                        }
                    }
                });
            }
        });
        return moves;
    }

    function alpha_beta_search(boardCopy, limit) {
        const alpha = NEG_INFINITY;
        const beta = INFINITY;
        const available_moves = get_available_moves('player2', boardCopy);
        const max = max_value(boardCopy, available_moves, limit, alpha, beta);

        const best_moves = available_moves.filter(move => move.score === max);
        const selected_move = best_moves[Math.floor(Math.random() * best_moves.length)];
        return selected_move;
    }

    function max_value(boardCopy, moves, limit, alpha, beta) {
        if (limit <= 0) {
            return utility(boardCopy);
        }
        let max = NEG_INFINITY;
        moves.forEach(move => {
            const newBoard = movePiece(boardCopy, move);
            const newMoves = get_available_moves('player1', newBoard);
            const min_score = min_value(newBoard, newMoves, limit - 1, alpha, beta);
            move.score = min_score;
            max = Math.max(max, min_score);
            if (max >= beta) return max;
            alpha = Math.max(alpha, max);
        });
        return max;
    }

    function min_value(boardCopy, moves, limit, alpha, beta) {
        if (limit <= 0) {
            return utility(boardCopy);
        }
        let min = INFINITY;
        moves.forEach(move => {
            const newBoard = movePiece(boardCopy, move);
            const newMoves = get_available_moves('player2', newBoard);
            const max_score = max_value(newBoard, newMoves, limit - 1, alpha, beta);
            move.score = max_score;
            min = Math.min(min, max_score);
            if (min <= alpha) return min;
            beta = Math.min(beta, min);
        });
        return min;
    }

    function movePiece(boardCopy, move) {
        const newBoard = boardCopy.map(piece => ({ ...piece }));
        const piece = newBoard.find(p => p.row === move.from.row && p.col === move.from.col);
        piece.row = move.to.row;
        piece.col = move.to.col;
        if (move.capturedPiece) {
            const capturedPieceIndex = newBoard.findIndex(p => p.row === parseInt(move.capturedPiece.dataset.row) && p.col === parseInt(move.capturedPiece.dataset.col));
            newBoard.splice(capturedPieceIndex, 1);
        }
        return newBoard;
    }

    function computerMove() {
        const boardCopy = copy_board();
        const bestMove = alpha_beta_search(boardCopy, 4); // Search depth can be adjusted
        if (bestMove) {
            const startCell = cells[bestMove.from.row * 8 + bestMove.from.col];
            const endCell = cells[bestMove.to.row * 8 + bestMove.to.col];
            const piece = startCell.querySelector('.piece');
            animateMove(piece, endCell, bestMove.from.row, bestMove.from.col, bestMove.to.row, bestMove.to.col).then(() => {
                if (bestMove.capturedPiece) {
                    bestMove.capturedPiece.remove();
                    updatePieceCount();
                }
                checkForKing(endCell);
                checkGameOver();
                switchPlayer();
            });
        }
    }
});
