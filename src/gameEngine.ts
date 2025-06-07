// create game, board, etc.
export type Player = 'x' | 'o'
export type Cell = Player | null
export type CellCoord = {
  row: number,
  col: number,
}
export type Board = Cell[][]
export type EndState = Player | 'tie' | undefined
export type Game = {
  id: string,
  name: string,
  board: Board,
  currentPlayer: Player,
  endState?: EndState
}

function generateGameName() {
  const nameList = [
    'Time','Past','Future','Dev',
    'Fly','Flying','Soar','Soaring','Power','Falling',
    'Fall','Jump','Cliff','Mountain','Rend','Red','Blue',
    'Green','Yellow','Gold','Demon','Demonic','Panda','Cat',
    'Kitty','Kitten','Zero','Memory','Trooper','XX','Bandit',
    'Fear','Light','Glow','Tread','Deep','Deeper','Deepest',
    'Mine','Your','Worst','Enemy','Hostile','Force','Video',
    'Game','Donkey','Mule','Colt','Cult','Cultist','Magnum',
    'Gun','Assault','Recon','Trap','Trapper','Redeem','Code',
    'Script','Writer','Near','Close','Open','Cube','Circle',
    'Geo','Genome','Germ','Spaz','Shot','Echo','Beta','Alpha',
    'Gamma','Omega','Seal','Squid','Money','Cash','Lord','King',
    'Duke','Rest','Fire','Flame','Morrow','Break','Breaker','Numb',
    'Ice','Cold','Rotten','Sick','Sickly','Janitor','Camel','Rooster',
    'Sand','Desert','Dessert','Hurdle','Racer','Eraser','Erase','Big',
    'Small','Short','Tall','Sith','Bounty','Hunter','Cracked','Broken',
    'Sad','Happy','Joy','Joyful','Crimson','Destiny','Deceit','Lies',
    'Lie','Honest','Destined','Bloxxer','Hawk','Eagle','Hawker','Walker',
    'Zombie','Sarge','Capt','Captain','Punch','One','Two','Uno','Slice',
    'Slash','Melt','Melted','Melting','Fell','Wolf','Hound',
    'Legacy','Sharp','Dead','Mew','Chuckle','Bubba','Bubble','Sandwich',
    'Smasher','Extreme','Multi','Universe','Ultimate','Death','Ready','Monkey',
    'Elevator','Wrench','Grease','Head','Theme','Grand','Cool','Kid',
    'Boy','Girl','Vortex','Paradox'
  ]

  return `${nameList[Math.floor( Math.random() * nameList.length)] + " " + nameList[Math.floor( Math.random() * nameList.length)] }`
}

export const initializeGame = (startPlayer: Player): Game => {
  const game: Game = {
    id: crypto.randomUUID(),
    name: generateGameName(),
    board: [
      [null, null, null], 
      [null, null, null], 
      [null, null, null]
    ],
    currentPlayer: startPlayer
  }

  return game
}

// make move
export const move = (game: Game, chosenCellCoord: CellCoord): Game => {
  const nextGame = structuredClone(game)

  // if the cell is already selected, change nothing
  const selectedCell = nextGame.board[chosenCellCoord.row][chosenCellCoord.col]
  if (selectedCell) return nextGame

  // if the cell is empty, fill it and return, calculating endState
  nextGame.board[chosenCellCoord.row][chosenCellCoord.col] = nextGame.currentPlayer
  const endState = checkEnd(nextGame)
  return {
    ...nextGame, 
    currentPlayer: game.currentPlayer === 'x' ? 'o' : 'x', 
    endState}
}

const getRow = (board: Board, index: number): Cell[] => {
  return board.map(row => row[index])
}

// check endState
const checkEnd = (game: Game): EndState => {
  const board = game.board

  /// TIE ///
  let playedCells: number = 0
  for (const row of board) {
    for (const cell of row) {
      if (cell) playedCells = playedCells + 1
    }
  }

  /// WIN SCENARIOS ///
  // any col is complete for a player 
  for (const row of board) {
    const xCount: number = row.filter(cell => cell === 'x').length
    const oCount: number =  row.filter(cell => cell === 'o').length

    if (xCount === 3 || oCount === 3) {
      //console.log('complete in cols')
      return game.currentPlayer
    }
  }
  // any row is complete for a player
  for (let i:number = 0; i < 3; i ++) {
    const col = getRow(board, i)
    const xCount: number = col.filter(cell => cell === 'x').length 
    const oCount: number = col.filter(cell => cell ==='o').length

    if (xCount === 3 || oCount === 3) {
      //console.log('complete in rows');
      return game.currentPlayer
    } 
  }

  // one of the two diagonals is complete for a player 
  // first diagonal
  const firstDiag: Cell[] = [board[0][0], board[1][1],  board[2][2]]
  if (firstDiag.filter(cell => cell === 'x').length === 3 || firstDiag.filter(cell => cell === 'o').length === 3 ) {
    //console.log('complete in first diag');
    return game.currentPlayer
  }
  // backwards diagonal
  const backDiag: Cell[] = [board[2][0], board[1][1],  board[0][2]]
  if (backDiag.filter(cell => cell === 'x').length === 3 || backDiag.filter(cell => cell === 'o').length === 3 ) {
    //console.log('complete in back diag');
    return game.currentPlayer
  }

  if (playedCells === 9) {
    return 'tie'
  }

  // else, return undefined to continue playing
  return undefined
}

function isMovesLeft(game: Game): boolean {
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) if (game.board[i][j] === null) return true;

  return false;
}

function getScore(game: Game): number | undefined {
  const board = game.board;

  // checking for row victory
  for (let row = 0; row < 3; row++) {
    if (board[row][0] === board[row][1] && board[row][1] === board[row][2] && board[row][0] !== null) {
      if (board[row][0] === 'x') {
        return 10;
      } else if (board[row][0] === 'o') {
        return -10;
      }
    }
  }

  // checking for col victory
  for (let col = 0; col < 3; col++) {
    if (board[0][col] === board[1][col] && board[1][col] === board[2][col] && board[0][col] !== null) {
      if (board[0][col] === 'x') {
        return 10;
      } else if (board[0][col] === 'o') {
        return -10;
      }
    }
  }

    // Checking for Diagonals for X or O victory.
  if (board[0][0] === board[1][1] && board[1][1] === board[2][2] && board[0][0] !== null) {
    if (board[0][0] === 'x') return 10;
    else if (board[0][0] === 'o') return -10;
  }

  if (board[0][2] === board[1][1] && board[1][1] === board[2][0] && board[0][2] !== null) {
    if (board[0][2] === 'x') return 10;
    else if (board[0][2] === 'o') return -10;
  }


  // if no moves left, return tie 0
  if (isMovesLeft(game) === false){
    return 0;
  } 

  // if moves are left AND no winner, game is still ongoing
  return undefined
}

function minimax(game: Game, depth: number, isMax: boolean, maximizingPlayer: Player, minimizingPlayer: Player): number {
  const score = getScore(game);
  const board = game.board;

  // if Max has won the game, return score
  if (score != undefined) {
    return score;
  } else {
    if (isMax) {
      let best = -1000;
      const playertoMove = maximizingPlayer

      // Traverse all cells
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          // Check if cell is empty
          if (board[i][j] === null) {
            // Make the move
            board[i][j] = playertoMove;

            // Call minimax recursively
            // and choose the maximum value
            best = Math.max(best, minimax(game, depth + 1, !isMax, maximizingPlayer, minimizingPlayer));

            // Undo the move
            board[i][j] = null;
          }
        }
      }
      return best;
    }

    // If this minimizer's move
    else {
      let best = 1000;
      const playertoMove = minimizingPlayer

      // Traverse all cells
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          // Check if cell is empty
          if (board[i][j] === null) {
            // Make the move
            board[i][j] = playertoMove;

            // Call minimax recursively and
            // choose the minimum value
            best = Math.min(best, minimax(game, depth + 1, !isMax, maximizingPlayer, minimizingPlayer));

            // Undo the move
            board[i][j] = null;
          }
        }
      }
      return best;
    }
  }
}

export function findBestMove(game: Game) {
  const maximizingPlayer = game.currentPlayer;
  const minimizingPlayer = maximizingPlayer === "x" ? "o" : "x"
  const board = game.board;
  let bestVal = -1000;
  const bestMove: CellCoord = { row: -1, col: -1 };

  // Traverse all cells, evaluate minimax function for all empty cells.
  // return the cell with optimal value.
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      // Check if cell is empty
      if (board[i][j] === null) {
        // Make the move
        board[i][j] = maximizingPlayer;

        // compute evaluation function
        // for this move.
        const moveVal = minimax(game, 0, false, maximizingPlayer, minimizingPlayer);

        // Undo the move
        board[i][j] = null;

        // If the value of the current move
        // is more than the best value, then
        // update best
        if (moveVal > bestVal) {
          bestMove.row = i;
          bestMove.col = j;
          bestVal = moveVal;
        }
      }
    }
  }

  return bestMove;
}
