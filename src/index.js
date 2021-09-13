import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {ChessBoard, King, Knight, Pawn, Rook, Bishop, Queen, pieceRenders, players, opponent, ChessPiece, EmptyPiece} from './game-components';



// 
const initBlackPieces = [
	new Rook(players.PLAYER_2, 0),
	new Knight(players.PLAYER_2, 1),
	new Bishop(players.PLAYER_2, 2),
	new Queen(players.PLAYER_2, 3),
	new King(players.PLAYER_2, 4),
	new Bishop(players.PLAYER_2, 5),
	new Knight(players.PLAYER_2, 6),
	new Rook(players.PLAYER_2, 7),
	
	new Pawn(players.PLAYER_2, 8),
	new Pawn(players.PLAYER_2, 9),
	new Pawn(players.PLAYER_2, 10),
	new Pawn(players.PLAYER_2, 11),
	new Pawn(players.PLAYER_2, 12),
	new Pawn(players.PLAYER_2, 13),
	new Pawn(players.PLAYER_2, 14),
	new Pawn(players.PLAYER_2, 15)
	
]

const emptySquares = [...Array(48-16).keys()].map(x => x+16).map(y => new EmptyPiece(y))

const initWhitePieces = [
	new Pawn(players.PLAYER_1, 48),
	new Pawn(players.PLAYER_1, 49),
	new Pawn(players.PLAYER_1, 50),
	new Pawn(players.PLAYER_1, 51),
	new Pawn(players.PLAYER_1, 52),
	new Pawn(players.PLAYER_1, 53),
	new Pawn(players.PLAYER_1, 54),
	new Pawn(players.PLAYER_1, 55),
	
	
	new Rook(players.PLAYER_1, 56),
	new Knight(players.PLAYER_1, 57),
	new Bishop(players.PLAYER_1, 58),
	new Queen(players.PLAYER_1, 59),
	new King(players.PLAYER_1, 60),
	new Bishop(players.PLAYER_1, 61),
	new Knight(players.PLAYER_1, 62),
	new Rook(players.PLAYER_1, 63),
]
	
// const [a, setA] = useState()

	
const initBoard = new ChessBoard(initBlackPieces.concat(emptySquares).concat(initWhitePieces))



function Square(props) {
	let sel = ""
	if (props.piece.selected) {
		sel = " selected"
	}
	let squareColor = "lightSquare"
	if ((Math.floor(props.piece.i / 8) % 2) == (props.piece.i % 2)){
		squareColor = "darkSquare"
	}
	let cn = squareColor + " " + sel
	return (
		<button className={cn} onClick={props.onClick}>
			{props.piece.pieceUnicode}
		</button>
	)
	
}

class RenderPiece {
	constructor(piece) {
		this.pieceRender = piece.pieceRender
		this.player = piece.player
	}
}

class Board extends React.Component {
	
	renderSquare(i) {
		return <Square 
					piece={this.props.squares[i]}
					onClick={() => this.props.onClick(i)}
				/>
	}
	
	renderRow(rn) {
		return <div className="board-row">
			{this.renderSquare(rn*8 + 0)}
			{this.renderSquare(rn*8 + 1)}
			{this.renderSquare(rn*8 + 2)}
			{this.renderSquare(rn*8 + 3)}
			{this.renderSquare(rn*8 + 4)}
			{this.renderSquare(rn*8 + 5)}
			{this.renderSquare(rn*8 + 6)}
			{this.renderSquare(rn*8 + 7)}
		</div>
	}

	render() {
		
		return (
			<div>
				{this.renderRow(0)}
				{this.renderRow(1)}
				{this.renderRow(2)}
				{this.renderRow(3)}
				{this.renderRow(4)}
				{this.renderRow(5)}
				{this.renderRow(6)}
				{this.renderRow(7)}
			</div>
		);
	}
}



class Game extends React.Component {
	constructor(props) {
		super(props)
		
		this.state = {
			history: [{
				squares: initBoard
			}],
			playerTurn: players.PLAYER_1,
			moveNumber: 0,
			moveStage: "readyToSelect",
			pieceSelected: null
			
		};
		
	}
	
	handleClick(i) {
		if (this.state.moveStage === "readyToSelect") {
			return this.handlePieceSelect(i);
		} else {
			return this.handlePieceMove(i);
		}
	}
	
	handlePieceSelect(i) {
		const hist = this.state.history.slice(0, this.state.moveNumber + 1);
		const current = hist[this.state.moveNumber];
		const squares = current.squares.copy();
		const pieceSelected = squares.getPiece(i);
		
		if (! (this.state.playerTurn === pieceSelected.player)) {
			return;
		}
		
		if (! (pieceSelected.hasLegalMove(squares.copy()))) {
			console.log('no move')
			return;
		}
		let newSquares = squares.selectPiece(i)
		hist[this.state.moveNumber].squares = newSquares
		
		this.setState({
			history: hist,
			moveStage: "readyToMove",
			pieceSelected: pieceSelected.copy()
			
		})
	}
	
	handlePieceMove(i) {
		const hist = this.state.history.slice(0, this.state.moveNumber + 1);
		const current = hist[hist.length - 1];
		let squares = current.squares.copy();
		let new_square = squares.getPiece(i);
		
		if (! (this.state.pieceSelected.isLegalMove(i, squares.copy()))) {
			console.log('fire');	
			return;
		}
		let updatedSquares = squares.unselectPiece()
		hist[hist.length - 1].squares = updatedSquares
		let sel = this.state.pieceSelected.copy();
		squares = this.handleKingMove(squares, sel.i, i)
		squares = squares.pieceMove(sel.i, i)
		
		
		this.setState({
			history: hist.concat([{
				squares: squares
			}]),
			
			moveStage: "readyToSelect",
			pieceSelected: null,
			playerTurn: this.state.playerTurn === players.PLAYER_1 ? players.PLAYER_2 : players.PLAYER_1,
			moveNumber: hist.length
		});
		// console.log(.blackPieces)
	}
	
	handleKingMove(squares, startLoc, endLoc) {
		let startPiece = squares.getPiece(startLoc)
		let endPiece = squares.getPiece(endLoc)
		
		if (startPiece.pieceRender == pieceRenders.KING) {
			console.log('a')
			if (Math.abs(startPiece.x - endPiece.x) == 2) {
				let returned;
				if (startPiece.x > endPiece.x) {
					let rookI = endPiece.i - 2
					returned = squares.pieceMove(rookI, rookI + 3)
					returned.castled[startPiece.player] = true
				}
				else if (startPiece.x < endPiece.x) {
					let rookI = endPiece.i + 1
					console.log('rooki')
					console.log(rookI)
					returned = squares.pieceMove(rookI, rookI - 2)
					returned.castled[startPiece.player] = true
				}
				return returned
				
			}
			else {
				let returned = squares.copy()
				returned.castled[startPiece.player] = true
				return returned
			}
		}
		else {
			return squares
		}
	}
	
	
	jumpTo(step) {
		this.setState({
			moveNumber: step,
			moveStage: "readyToSelect",
			pieceSelected: null,
			playerTurn: (step % 2) == 0 ? players.PLAYER_1 : players.PLAYER_2
		});
	}		
	
	render() {
		
		const history = this.state.history
		const current = history[this.state.moveNumber]
		const calcWinner = calculateWinner(this.state.playerTurn, current.squares);
		
		const moves = history.map((step, move) => {
			const desc = move ?
				'Go to move #' + move : 
				'Go to game start';
			
			return (
				<li key={move}>
					<button onClick={() => this.jumpTo(move)}> {desc} 
					</button>
				</li>
			);
		});
		
		let status;
		if(calcWinner) {
			if (calcWinner == players.NONE) {
				status = "Stalemate"
			} else {
				status = 'Winner: ' + calcWinner;
			}
		} else {
			status = (this.state.playerTurn == players.PLAYER_1 ? 'White' : 'Black') + "'s turn";
		}
			
		return (
			<div className="game">
			
			
			<div className="game-board">
				<Board 
				squares={current.squares.pieceList}
				onClick={i => this.handleClick(i)}
				/>
			</div>
			<div className="game-info">
				<div>{status}</div>
				<ol>{moves}</ol>
				
				
				
				
			</div>
			</div>
		);
	}
}

// <div className="container">
					// <BoardSquare
					// color="light"
					// />
					// <Square 
						// piece={new King(players.PLAYER_2, 1)}
						// onClick={() => 1}
					// />
				// </div>

function calculateWinner(playerTurn, squares) {
  
	let kingUnderAttack = squares.kingUnderAttack(playerTurn)
	let canMove = squares.playerCanMove(playerTurn)
	if ((! (canMove)) && kingUnderAttack) {
		return opponent(playerTurn)
	}
	else if (!(canMove) ) {
		return players.NONE
	}
	else {
		return null
	}
	
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);
