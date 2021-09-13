
export const pieceRenders = {
	KING: '\u2654',
	QUEEN: 'Q', 
	ROOK: 'R',
	BISHOP: 'B',
	KNIGHT: 'N',
	PAWN: 'P',
	NONE: ''
}

export const includes = (a, v) => a.indexOf(v) !== -1
export function opponent(player) {
	if (player == players.PLAYER_1) {
		return players.PLAYER_2
	}
	else if (player == players.PLAYER_2) {
		return players.PLAYER_1
	}
}

export const players = {
	PLAYER_1: 'white',
	PLAYER_2: 'black',
	NONE: 'empty'
}

export class ChessBoard {
	constructor(pieceList, sel=null, castled=null) {
		this.pieces = this.genPieces(pieceList)
		this.pieceList = pieceList
		this.selectedPiece = sel
		this.handleCastled(castled)
	}
	
	copy() {
		return new ChessBoard(this.pieceList.map(x => x.copy()), this.selectedPiece, this.castled)
	}
	
	handleCastled(castled) {
		if (castled) {
			this.castled = castled
		} else {
			let player1 = players.PLAYER_1
			let player2 = players.PLAYER_2
			
			this.castled = {player1: false, player2: false}
		}
	}
	
	playerCanMove(player) {
		let pieces = this.getPiecesFromPlayer(player)
		pieces = pieces.filter(x => x.hasLegalMove(this))
		return pieces.length > 0
	}
	
	getPiecesFromPlayer(player) {
		let pieces = this.pieceList.filter(x => x.player == player)
		return pieces
	}
	
	getPlayerKing(player) {
		return this.pieceList.filter(x => (x.player == player) && (x.pieceRender == pieceRenders.KING))[0]
	}
	
	genPieces(pieceList) {
		
		return [...Array(8).keys()]
			.map(
				y => [...Array(8).keys()]
					.map(x => pieceList[8 * y + x])
			)
	}
	
	getPiece(i) {
		return this.pieceList[i]
	}
	
	getPieceXY(x, y) {
		return this.getPiece(y * 8 + x)
	}
	
	pieceMove(origLoc, newLoc) {
		let cp = this.copy()
		cp.updatePiece(newLoc, cp.getPiece(origLoc));
		cp.updatePiece(origLoc, new EmptyPiece(origLoc));
		cp.handleQueening(newLoc)
		return cp
	}
	
	handleQueening(newLoc) {
		let piece = this.getPiece(newLoc)
		let yNeeded = piece.player == players.PLAYER_1 ? 0 : 7
		if ((piece.pieceRender == pieceRenders.PAWN) &&
			(piece.y == yNeeded)) {
			this.updatePiece(newLoc, new Queen(piece.player, newLoc))
		}
	}
	
	// takes in the square number of the square being moved to,
	// the piece that's being moved
	updatePiece(i, newPiece) {
		let p = newPiece.updateLocation(i)
		this.pieceList[i] = p
		this.pieces[~~(i/8)][i%8] = p
	}
	
	selectPiece(i) {
		let returned = this.copy()
		returned.pieceList[i].selected = true
		returned.selectedPiece = i
		return returned
	}
	
	unselectPiece() {
		let returned = this.copy()
		if (returned.selectedPiece) {
			returned.pieceList[returned.selectedPiece].selected = false
		}
		return returned
	}
	
	kingUnderAttack(player) {
		
		let king = this.getPlayerKing(player)
		let opp = opponent(player)
		let enemyPieces = this.getPiecesFromPlayer(opp)
		let bcp = this.copy()
		
		let attackers = enemyPieces.filter(function f(p) {
			if (includes(p.getMoveOptions(bcp), king.i)) {
				// console.log('in check')
				// console.log(king.i)
				// console.log(p.getMoveOptions(bcp))
				return true
			}
			
		
		})
		// console.log('king')
		// console.log(king)
		
		// console.log('attackers')
		// console.log(attackers)
		
		return attackers.length > 0
	}
}

export class ChessPiece {
	constructor(pieceRender, player, i) {
		this.pieceRender = pieceRender
		this.player = player
		this.y = ~~(i / 8)
		this.x = i % 8
		this.i = i
		this.moveFilters = []
		this.complexMoveFilters = []
		this.moveFilters.push(piece => piece.player != this.player)
		this.setPieceUnicode('', '')
		this.selected = false
	}
	
	copy() {
		return new ChessPiece(this.pieceRender, this.player, this.i);
	}
	
	setPieceUnicode(white, black) {
		if (this.player == players.PLAYER_1) {
			this.pieceUnicode = white
		} else if (this.player == players.PLAYER_2) {
			this.pieceUnicode = black
		} else {
			this.pieceUnicode = ''
		}
	}
	
	// returns all legal moves the piece can make
	getAllLegalMoves(board) {
		// get i locations of all possible moves, ignoring check
		let moveOptions = this.getMoveOptions(board)
		let i1 = this.i
		let p1 = this.player
		// console.log('move options')
		// console.log(moveOptions)
		return moveOptions.filter(function f(opt){
			let futureBoardState = board.pieceMove(i1, opt)
			return !(futureBoardState.kingUnderAttack(p1))
		})
		
	}
	
	// returns all squares the piece can move to - ignoring the idea of being in check
	getMoveOptions(board) {
		let allMoves = this.getRangeOfMotion()
		let allPieces = allMoves.map(move => board.getPieceXY(move[0], move[1]))
		let returned = []
		for (const p of allPieces) {
			 
			if (this.applyMoveFilters(p) && this.applyMoveFilters(p, board)) {
				returned.push(p.i)
			}
			
		}
		return returned
	}
	
	
	
	applyMoveFilters(piece, board=null) {
		let through = board ? this.complexMoveFilters : this.moveFilters
		for (const filter of through) {
			if (!filter(piece, board)) {
				return false
			}
		}
		return true
	}
	
	getRangeOfMotion() {
		return []
	}
	
	hasLegalMove(board) {
		// console.log('all legal moves')
		// console.log(this.getAllLegalMoves(board))
		return this.getAllLegalMoves(board).length > 0;
	}
	
	isLegalMove(i, board) {
		let result = this.getAllLegalMoves(board).filter(x => x == i);		
		return result.length == 1
	}
	
	updateLocation(i) {
		let newPiece = this.copy()
		newPiece.y = ~~(i / 8)
		newPiece.x = i % 8
		newPiece.i = i
		return newPiece
	}
	
	moveIsOnBoard(candidates) {
		return candidates.filter(x => (0 <= x[0]) && (8 > x[0]) && (0 <= x[1]) && (8 > x[1]))
	}
}

export class King extends ChessPiece {
	constructor(player, i) {
		super(pieceRenders.KING, player, i)
		this.setPieceUnicode('\u2654', '\u265A')
	}
	
	copy() {
		return new King(this.player, this.i)
	}
	
	getRangeOfMotion() {
		
		let candidates = [[-1, -1], [-1, 0], [-1, 1], 
				[0, -1],  [0, 1],
				[1, -1],  [1, 0],  [1, 1]]
			.map(x => [this.x + x[0], this.y + x[1]])
		
		return this.moveIsOnBoard(candidates)
	}
	
	getAllLegalMoves(board) {
		
		let normalOpts = super.getAllLegalMoves(board)
		let kingside = this.checkCastles(board, 'kingside')
		let queenside = this.checkCastles(board, 'queenside')
		if (kingside) {
			normalOpts.push(kingside)
		}
		if (queenside) {
			normalOpts.push(queenside)
		}
		return normalOpts
	}
	
	checkCastles(board, side) {
		let relevantSquares = this.genCastleSquares(side)
		if (board.castled[this.player]) {
			return null
		}
		if (!(this.checkPiecePlacement(board, relevantSquares))) {
			return null
		}
		if (!(this.checkMiddlePieces(board, relevantSquares))) {
			return null
		}
		if (!(this.checkSafeSquares(board, relevantSquares))) {
			return null
		}
		return relevantSquares[2]
	}
	
	checkSafeSquares(board, relevantSquares) {
		let checkSquares = relevantSquares.slice(1, 3)
		console.log('check squares')
		console.log(checkSquares)
		let i1 = this.i
		let p1 = this.player
		
		let inCheck = board.kingUnderAttack(p1)
		// // let otherCheck = board.pieceMove(this.i, checkSquares[1]).kingUnderAttack(p1)
		// return (! inCheck) && (! otherCheck)
		
		let unsafeSquares = checkSquares.filter(function f(opt){
			let futureBoardState = board.pieceMove(i1, opt)
			return futureBoardState.kingUnderAttack(p1)
		})
		return (! inCheck) && (unsafeSquares.length == 0)
	}
	
	checkMiddlePieces(board, relevantSquares) {
		let middleSquares = relevantSquares.slice(1, relevantSquares.length - 1)
		let filtered = middleSquares.filter(function f(i) {
			let pieceNotEmpty = board.getPiece(i).player != players.NONE
			return pieceNotEmpty
		})
		return filtered.length == 0
	}
	
	checkPiecePlacement(board, relevantSquares) {
		let rook = board.getPiece(relevantSquares[relevantSquares.length - 1])
		let king = board.getPiece(relevantSquares[0])
		return (rook.pieceRender == pieceRenders.ROOK) && (rook.player == this.player) &&
				(king.pieceRender == pieceRenders.KING) && (king.player == this.player)
	}
	
	genCastleSquares(side) {
		let kingBlackSquares = [4, 5, 6, 7]
		let kingWhiteSquares = [60, 61, 62, 63]
		let queenBlackSquares = [4, 3, 2, 1, 0]
		let queenWhiteSquares = [60, 59, 58, 57, 56]
		if ((side == 'kingside') && (this.player == players.PLAYER_2)) {return kingBlackSquares}
		if ((side == 'kingside') && (this.player == players.PLAYER_1)) {return kingWhiteSquares}
		if ((side == 'queenside') && (this.player == players.PLAYER_2)) {return queenBlackSquares}
		if ((side == 'queenside') && (this.player == players.PLAYER_1)) {return queenWhiteSquares}
		
	}
	
	
}

export class Knight extends ChessPiece {
	constructor(player, i) {
		super(pieceRenders.KNIGHT, player, i)
		this.setPieceUnicode('\u2658', '\u265E')
	}
	
	copy() {
		return new Knight(this.player, this.i)
	}
	
	
	getRangeOfMotion() {
		let candidates = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], 
				[1, -2],  [1, 2],  [2, -1],  [2, 1]]
			.map(x => [this.x + x[0], this.y + x[1]])
			
		return this.moveIsOnBoard(candidates)
	}
	
	
}

export class Pawn extends ChessPiece {
	constructor(player, i) {
		super(pieceRenders.PAWN, player, i)
		this.moveFilters.push(this.checkTaking())
		this.complexMoveFilters.push(this.checkMove2())
		this.setPieceUnicode('\u2659', '\u265F')
	}
	
	copy() {
		return new Pawn(this.player, this.i)
	}
	
	
	getRangeOfMotion() {
		let opts = []
		if (this.player == players.PLAYER_1) {
			opts = [[0, -1], [0, -2], [-1, -1], [1, -1]]
		} else {
			opts = [[0, 1], [0, 2], [-1, 1], [1, 1]]
		}
		opts = opts.map(x => [this.x + x[0], this.y + x[1]])
		return this.moveIsOnBoard(opts)
	}
	
	checkTaking() {
		let thisX = this.x
		let thisPlayer = this.player
		return function returned(piece, board) {
			
			if (Math.abs(piece.x - thisX) == 1) {
				return piece.player == opponent(thisPlayer)
			} else if (piece.x == thisX) {
				return piece.player == players.NONE
			}
		}
	}
	
	checkMove2() {
		let thisY = this.y
		let thisX = this.x
		let thisPlayer = this.player
		return function returned(piece, board) {
			if (Math.abs(thisY - piece.y) == 1) {
				return true
			} 
			else if (Math.abs(thisY - piece.y) == 2) {
				
				if (thisPlayer == players.PLAYER_1) {
					let between = board.getPieceXY(thisX, 5)
					return (thisY == 6) && between.player == players.NONE
				} 
				else if (thisPlayer == players.PLAYER_2) {
					let between = board.getPieceXY(thisX, 2)
					return (thisY == 1) && between.player == players.NONE
				}
			}
		}
	}
}

export class RangePiece extends ChessPiece {
	
	getMoveOptions(board) {
		
		let returned = []
		let allMoves = this.getRangeOfMotion()
		// console.log('candidates')
		// console.log(allMoves)
		for (const moveSet of allMoves) {
			let pieceSet = moveSet.map(move => board.getPieceXY(move[0], move[1]))
			let toAdd = this.applyRangeMoveChecker(pieceSet)
			// console.log('toadd')
			// console.log(toAdd)
			returned = returned.concat(toAdd)
		}
				
		// console.log('All Move options')
		// console.log(returned)
		return returned
	}
	
	applyRangeMoveChecker(pieces) {
		let done = false
		let returned = []
		for (const p of pieces) {
			if (p.player == this.player) {
				// console.log('a')
				return returned
			}
			else if (p.player == players.NONE) {
				returned.push(p.i)
				// console.log('b')
			}
			else {
				returned.push(p.i)
				// console.log('c')
				return returned
			}
		}
		return returned
	} 
}

export class Rook extends RangePiece {
	constructor(player, i) {
		super(pieceRenders.ROOK, player, i)
		this.setPieceUnicode('\u2656', '\u265C')
	}
	copy() {
		return new Rook(this.player, this.i)
	}
	
	getRangeOfMotion() {
		let returned = []
		let down = [...Array(7).keys()]
				.map(x => [0, x+1])
				.map(x => [this.x + x[0], this.y + x[1]])
		let up = [...Array(7).keys()]
				.map(x => [0, -1-x])
				.map(x => [this.x + x[0], this.y + x[1]])
				
		let right = [...Array(7).keys()]
				.map(x => [x+1, 0])
				.map(x => [this.x + x[0], this.y + x[1]])
		
		let left = [...Array(7).keys()]
				.map(x => [-1-x, 0])
				.map(x => [this.x + x[0], this.y + x[1]])
				
		returned.push(this.moveIsOnBoard(down))
		returned.push(this.moveIsOnBoard(up))
		returned.push(this.moveIsOnBoard(right))
		returned.push(this.moveIsOnBoard(left))
		
	
		return returned
	}
}

export class Bishop extends RangePiece {
	constructor(player, i) {
		super(pieceRenders.BISHOP, player, i)
		this.setPieceUnicode('\u2657', '\u265D')
	}
	copy() {
		return new Bishop(this.player, this.i)
	}
	
	getRangeOfMotion() {
		let returned = []
		let upr = [...Array(7).keys()]
				.map(x => [x+1, -x-1])
				.map(x => [this.x + x[0], this.y + x[1]])
		let upl = [...Array(7).keys()]
				.map(x => [-x-1, -x-1])
				.map(x => [this.x + x[0], this.y + x[1]])
		let downr = [...Array(7).keys()]
				.map(x => [x+1, x+1])
				.map(x => [this.x + x[0], this.y + x[1]])
		let downl = [...Array(7).keys()]
				.map(x => [-x-1, x+1])
				.map(x => [this.x + x[0], this.y + x[1]])
				
		returned.push(this.moveIsOnBoard(upr))
		returned.push(this.moveIsOnBoard(upl))
		returned.push(this.moveIsOnBoard(downr))
		returned.push(this.moveIsOnBoard(downl))
		
		return returned
		
	}
}

export class Queen extends RangePiece {
	constructor(player, i) {
		super(pieceRenders.QUEEN, player, i)
		this.setPieceUnicode('\u2655', '\u265B')
	}
	copy() {
		return new Queen(this.player, this.i)
	}
	
	getRangeOfMotion() {
		let diag = (new Bishop(this.player, this.i)).getRangeOfMotion()
		let straight = (new Rook(this.player, this.i)).getRangeOfMotion()
		
		return diag.concat(straight)
		
	}
}

export class EmptyPiece extends ChessPiece {
	constructor(i) {
		super(
			pieceRenders.NONE, 
			players.NONE,  
			i
		)
	}
}

 


