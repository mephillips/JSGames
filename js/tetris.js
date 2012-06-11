/**
 * @fileOverview Implementation of Tetris
 * @author mephillips
 */
/*
 * Copyright (c) 2012 Matthew Phillips
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 */
Sawkmonkey.Games.Tetris = Class.create(Sawkmonkey.Games.Game,
/** @lends Sawkmonkey.Games.Tetris.prototype */
{
	/**
	 * The dom element used to display user messages.
	 */
	__messageText : null,

	/**
	 * The dom element used to display the score.
	 */
	__scoreText : null,

	/**
	 * The dom element used to display the level.
	 */
	__levelText : null,

	/**
	 * The dom element which contains blocks in play.
	 */
	__playArea : null,

	/**
	 * The number of vertical blocks the area can fit.
	 */
	__rows : 0,
	/**
	 * The number of horizontal blocks the area can fit.
	 */
	__cols : 0,

	/**
	 * The width in pixles of one block piece.
	 */
	__blockWidth : 0,
	/**
	 * The height in pixles of one block piece.
	 */
	__blockHeight : 0,

	/**
	 * A block object pool
	 */
	__freeBlocks : null,
	/**
	 * Track what blocks are in play in a colxrow array
	 */
	__blocks : null,

	/**
	 * Game state
	 */
	__state : null,

	/**
	 * Current level
	 */
	__level : 0,
	/**
	 * Current score
	 */
	__score : 0,
	/**
	 * Score needed to reach next level
	 */
	__nextLevelScore : 0,

	/**
	 * Timeout between block falls
	 */
	__delay : 0,

	/**
	 * Reference to timeout used to make blocks fall.
	 */
	__timeout : null,


	start : function() {
		this.__cleanup();
		this.__state = 'playing';
		this.__messageText.hide();
		this.__setScore(0);
		this.setLevel(1);
		this.__blocks = [];
		for (var i = 0; i < this.__cols; ++i) {
			this.__blocks[i] = [];
		}
		this.__rowSize = [];
		for (var i = 0; i < this.__rows; ++i) {
			this.__rowSize[i] = 0;
		}
		this.__lastKey = null;
		this.__nextBlock = this.__makeBlock();
		this.__startBlock();
	},

	setLevel : function(level) {
		var scoreData = Sawkmonkey.Games.Tetris.ScoreData;

		this.__level = Math.min(level, scoreData.length);
		this.__levelText.update(level);
		this.__nextLevelScore = scoreData[this.__level - 1][0];
		this.__delay = scoreData[this.__level - 1][1];
	},

	__setScore : function(newScore) {
		this.__score = newScore;
		this.__scoreText.update(newScore);
	},

	__makeBlock : function() {
		var block = new Sawkmonkey.Games.Tetris.Block(
			this.__cols + 1,
			this.__blockWidth,
			this.__blockHeight,
			this.__freeBlocks);
		return block;
	},

	__startBlock : function() {
		this.__currBlock = this.__nextBlock;
		var start_loc = Math.floor(Math.random()*(this.__cols-this.__currBlock.width));
		var result = this.__moveBlock(this.__currBlock, start_loc, 0, false);
		if (result == 'ok') {
			this.__nextBlock = this.__makeBlock();
			this.__fallBlock();
		} else if (result == 'block') {
			this.__endGame(false);
		} else {
			console.log("Invalid start block result: " + result + " start_loc: " + start_loc);
		}
	},

	__fallBlock : function() {
		//Blocks fall by pixels. Special handling each time it falls
		//a full block size
		if (this.__currBlock.ydrift >= this.__blockHeight || this.__lastKey == Event.KEY_DOWN) {
			//reset the drift and move the block down 1
			this.__currBlock.ydrift = 0;
			this.__moveBlock(this.__currBlock, this.__currBlock.x, this.__currBlock.y+1);

			// Support moving block sideways into gaps
			if (this.__lastKey == Event.KEY_LEFT || this.__lastKey == Event.KEY_RIGHT) {
				var dir = (this.__lastKey == Event.KEY_LEFT) ? 1 : -1;
				this.__moveBlock(this.__currBlock, this.__currBlock.x-dir, this.__currBlock.y);
			}
			this.__lastKey = null;

			//test to see if the block can still move down
			var result = this.__moveBlock(this.__currBlock, this.__currBlock.x, this.__currBlock.y+1, true);
			if (result == 'block' || result == 'vert') {
				setTimeout(this.__endBlock.bind(this), 0);
				return;
			}
		}

		this.__currBlock.ydrift += 2;
		this.__currBlock.drawBlock();

		this.__timeout = setTimeout(this.__fallBlock.bind(this), this.__delay);
	},

	__endBlock : function() {
		//add the block pieces to the play area
		var max = 0;
		var min = this.__rows - 1;
		for (var i = 0; i < this.__currBlock.pieces.length; ++i) {
			var x = this.__currBlock.x + this.__currBlock.pieces[i].x;
			var y = this.__currBlock.y + this.__currBlock.pieces[i].y;
			this.__blocks[x][y] = this.__currBlock.pieces[i];
			++this.__rowSize[y];
			if (y > max) { max = y; }
			if (y < min) { min = y; }
		}

		//check for rows which are full
		var cleared = 0;
		for (var row = max; row >= min; row--) {
			//row is full clear it
			if (this.__rowSize[row] == this.__cols) {
				++cleared;
				for (var j = 0; j < this.__cols; ++j) {
					this.__freeBlockPiece(this.__blocks[j][row]);
					this.__blocks[j][row] = null;
				}
				this.__rowSize[row] = 0;
			} else if (this.__rowSize[row] == 0) {
				break;
			} else if (cleared > 0) {
				//at least on row was previously cleared move this row
				//down
				this.__moveRow(row, cleared);
			}
		}

		if (cleared > 0) {
			//move more rows down
			while (row >= 0 && this.__rowSize[row] != 0) {
				this.__moveRow(row, cleared);
				--row;
			}
			this.__setScore(this.__score + (2<<cleared));
			if (this.__score >= this.__nextLevelScore) {
				var nextLevel = this.__level + 1;
				if (nextLevel > Sawkmonkey.Games.Tetris.ScoreData.length) {
					this.__endGame(true);
				} else {
					this.setLevel(nextLevel);
				}
			}
		}

		if (this.__state != "done") {
			this.__startBlock();
		}
	},

	__endGame : function(win) {
		if (win) {
			this.__messageText.update(this._text('game_win'));
		} else {
			this.__messageText.update(this._text('game_over'));
		}
		this.__messageText.show();
		this.__state = "done";
	},

	__moveRow : function(row, amount) {
		for (var j = 0; j < this.__cols; j++) {
			this.__blocks[j][row+amount] = this.__blocks[j][row];
			this.__blocks[j][row] = null;
			if (this.__blocks[j][row+amount] != null) {
				var y = (row+amount)*this.__blockHeight;
				this.__blocks[j][row+amount].setStyle({'top' : y + 'px'});
			}
		}
		this.__rowSize[row+amount] = this.__rowSize[row];
		this.__rowSize[row] = 0;
	},

	__moveBlock : function(block, x, y, test) {
		var err = this.__testBlock(block, x, y, block.angle);
		if (err == 'ok' && !test) {
			block.x = x;
			block.y = y;
			block.drawBlock();
		}
		return err;
	},

	//try to rotate the block and return result. 
	//if test is true the block will not actually be rotated
	__rotateBlock : function(block, test) {
		var angle = (block.angle + 1) % 4;
		var err = this.__testBlock(block, block.x, block.y + 1, angle);
		if (err == 'ok' && !test) {
			block.angle = angle;
			block.drawBlock();
		} else {
			block.updateBlock();
		}
		return err;
	},

	__testBlock : function(block, x, y, angle) {
		var origX = block.x;
		var origY = block.y;
		var origA = block.angle;
		var result = 'ok';

		block.x = x;
		block.y = y;
		block.angle = angle;
		block.updateBlock();
		for (var i = 0; i < block.pieces.length; ++i) {
			if (block.x + block.pieces[i].x < 0 || block.x + block.pieces[i].x >= this.__cols) {
				result = 'horiz';	//block is over a wall
				break;
			}
			if (block.y + block.pieces[i].y < 0 || block.y + block.pieces[i].y >= this.__rows) {
				result = 'vert'; //block is below the ground
				break;
			}
			if (this.__blocks[block.x + block.pieces[i].x][block.y + block.pieces[i].y] != null) {
				result = 'block';	//block is overlapping another
				break;
			}
		}
		block.x = origX;
		block.y = origY;
		block.angle = origA;
		block.updateBlock();
		return result;
	},

	__cleanup : function() {
		if (this.__blocks) {
			for (var x = 0; x < this.__cols; ++x) {
				for (var y = 0; y < this.__rows; ++y) {
					this.__freeBlockPiece(this.__blocks[x][y]);
				}
			}
		}
		this.__freeBlock(this.__currBlock);
		this.__currBlock = null;
		this.__freeBlock(this.__nextBlock);
		this.__nextBlock = null;
	},

	__freeBlock : function(block) {
		if (block) {
			for (var i = 0; i < block.pieces.length; ++i) {
				this.__freeBlockPiece(block.pieces[i]);
			}
		}
	},

	__freeBlockPiece : function(piece) {
		if (piece) {
			piece.removeClassName('tetris_bg' + piece.type);
			piece.hide();
			this.__freeBlocks.push(piece);
		}
	},

	init : function($super) {
		$super();

		this.__state = 'ready';

		// Determine the size of the play area
		var dims = this.__playArea.getDimensions();

		// Determine how many blocks we can fit in the play area
		var tempBlock = new Element('div', { 'class' : 'tetris_block' });
		this.__playArea.insert(tempBlock);
		var blockDims = tempBlock.getDimensions();;
		tempBlock.hide();
		this.__blockWidth = blockDims.width + 1;
		this.__blockHeight = blockDims.height + 1;
		this.__cols = Math.floor(dims.width / this.__blockWidth);
		this.__rows = Math.floor(dims.height / this.__blockHeight);

		// Create free block pool
		var numBlocks = this.__cols * this.__rows;
		this.__freeBlocks = [ tempBlock ];
		for (var i = 1; i < numBlocks; ++i) {
			tempBlock = new Element('div', { 'class' : 'tetris_block' });
			tempBlock.hide();
			this.__playArea.insert(tempBlock);
			this.__freeBlocks.push(tempBlock);
		}
	},

	_createCanvas : function($super) {
		var elm = $super();
		elm.insert(this.__createPlayArea());
		elm.insert(this.__createPreviewArea());
		elm.insert(this.__createScoreArea());
		return elm;
	},

	__createPlayArea : function() {
		var playArea = new Element('div', { 'class' : 'games_border tetris_play_area' });
		this.__playArea = playArea;
		var messageText = new Element('div', { 'class' : 'tetris_message_text'});
		messageText.update(this._text('game_ready'));
		playArea.insert(messageText);
		this.__messageText = messageText;
		return playArea;
	},

	__createPreviewArea : function() {
		var previewArea = new Element('div', { 'class' : 'games_border tetris_preview_area' });
		return previewArea;
	},

	__createScoreArea : function() {
		var scoreArea = new Element('div', { 'class' : 'tetris_score_area' });

		var levelTitle = new Element('div', { 'class' : 'games_label' });
		levelTitle.update(this._text('level_title'));
		scoreArea.insert(levelTitle);
		var levelText = new Element('div', { 'class' : 'tetris_score_text'});
		levelText.update('0');
		scoreArea.insert(levelText);
		this.__levelText = levelText;

		var scoreTitle = new Element('div', { 'class' : 'games_label' });
		scoreTitle.update(this._text('score_title'));
		scoreArea.insert(scoreTitle);
		var scoreText = new Element('div', { 'class' : 'tetris_score_text'});
		scoreText.update('000000');
		scoreArea.insert(scoreText);
		this.__scoreText = scoreText;

		return scoreArea;
	},

	_keypressed : function(evt) {
		if (this.__state == 'playing') {
			this.__lastKey = evt.keyCode;
			var block = this.__currBlock;
			if (evt.keyCode == Event.KEY_LEFT || evt.keyCode == Event.KEY_RIGHT) {
				var dir = (evt.keyCode == Event.KEY_LEFT) ? 1 : -1;
				if (this.__moveBlock(block, block.x-dir, block.y+1, true) == 'ok') {
					if (this.__moveBlock(block, block.x-dir, block.y, false) == 'ok') {
						this.__lastKey = null;
					}
				}
			} else if (evt.keyCode == Event.KEY_DOWN) {
				clearTimeout(this.__timeout);
				this.__timeout = setTimeout(this.__fallBlock.bind(this), 0);
			} else if (evt.keyCode == Event.KEY_UP) {
				if (this.__rotateBlock(block, false) == 'ok') {
					this.__lastKey = null;
				}
			}
		}
		if (evt.keyCode == Event.KEY_ESC) {
			if (this.__state == "ready" || this.__state == "done") {
				this.start();
			} else if (this.__state == "paused") {
				this.__state = "playing";
				this.__messageText.hide();
				this.__fallBlock();
			} else {
				this.__state = 'paused';
				this.__messageText.update(this._text('game_paused'));
				this.__messageText.show();
				clearTimeout(this.__timeout);
			}
		}
	}
});

Sawkmonkey.Games.Tetris.Block = Class.create(
/** @lends Sawkmonkey.Games.Block.prototype */
{
	BLOCK_TYPES : 7,
	BLOCK_ANGLES : 4,
	PIECES : 4,

	initialize : function(startX, blockWidth, blockHeight, blocks) {
		this.x = startX;
		this.y = 0;
		this.ydrift = 1;
		this.pieces = [];
		this.type = Math.floor(Math.random()*this.BLOCK_TYPES)
		this.angle = Math.floor(Math.random()*this.BLOCK_ANGLES)
		this.blockWidth = blockWidth;
		this.blockHeight = blockHeight;
		for (var i = 0; i < this.PIECES; ++i) {
			this.pieces[i] = blocks.pop();
			this.pieces[i].addClassName('tetris_bg' + this.type);
			this.pieces[i].type = this.type;
			this.pieces[i].show();
		}
		this.updateBlock();
		this.drawBlock();
	},

	drawBlock : function() {
		var dims = this.pieces[0].getDimensions();
		for (var i = 0; i < this.pieces.length; ++i) {
			var x  = (this.x + this.pieces[i].x) * this.blockWidth;
			var y  = (this.y + this.pieces[i].y) * this.blockHeight + this.ydrift;
			this.pieces[i].setStyle({ 'left' : x + 'px', 'top' : y + 'px' });
		}
	},

	updateBlock : function() {
		var data = Sawkmonkey.Games.Tetris.BlockData[this.type];
		var ai = 5*this.angle;
		for (var i = 0; i < this.pieces.length; ++i ){
			this.pieces[i].x = data[ai + i][0];
			this.pieces[i].y = data[ai + i][1];
		}
		this.width = data[ai + this.pieces.length][0];
		this.height = data[ai + this.pieces.length][1];
	}
});

Sawkmonkey.Games.Tetris.BlockData = [
	[ // Square
		[0,0], [1, 0], [0, 1], [1, 1], [2, 2],
		[0,0], [1, 0], [0, 1], [1, 1], [2, 2],
		[0,0], [1, 0], [0, 1], [1, 1], [2, 2],
		[0,0], [1, 0], [0, 1], [1, 1], [2, 2],
	], [ // Stick
		[0,0], [1, 0], [2, 0], [3, 0], [4, 1],
		[0,0], [0, 1], [0, 2], [0, 3], [1, 4],
		[0,0], [1, 0], [2, 0], [3, 0], [4, 1],
		[0,0], [0, 1], [0, 2], [0, 3], [1, 4],
	], [ // Right shift one
		[0,0], [0, 1], [1, 1], [1, 2], [2, 3],
		[1,0], [2, 0], [0, 1], [1, 1], [3, 2],
		[0,0], [0, 1], [1, 1], [1, 2], [2, 3],
		[1,0], [2, 0], [0, 1], [1, 1], [3, 2],
	], [ // Left shift one
		[1,0], [0, 1], [1, 1], [0, 2], [2, 3],
		[0,0], [1, 0], [1, 1], [2, 1], [3, 2],
		[1,0], [0, 1], [1, 1], [0, 2], [2, 3],
		[0,0], [1, 0], [1, 1], [2, 1], [3, 2],
	], [ // L
		[0,1], [1, 1], [2, 1], [2, 0], [3, 2],
		[0,0], [0, 1], [0, 2], [1, 2], [2, 3],
		[0,0], [1, 0], [2, 0], [0, 1], [3, 2],
		[0,0], [1, 0], [1, 1], [1, 2], [2, 3],
	], [ // Backwards L
		[0,0], [0, 1], [1, 1], [2, 1], [3, 2],
		[0,0], [1, 0], [0, 1], [0, 2], [2, 3],
		[0,0], [1, 0], [2, 0], [2, 1], [3, 2],
		[1,0], [1, 1], [1, 2], [0, 2], [2, 3],
	], [ // Try
		[1,0], [0, 1], [1, 1], [2, 1], [3, 2],
		[0,0], [0, 1], [0, 2], [1, 1], [2, 3],
		[0,0], [1, 0], [2, 0], [1, 1], [3, 2],
		[1,0], [1, 1], [1, 2], [0, 1], [2, 3],
	],
];

Sawkmonkey.Games.Tetris.ScoreData = [
	[ 32, 80 ],
	[ 64, 70 ],
	[ 128, 60 ],
	[ 256, 50 ],
	[ 512, 40 ],
	[ 1024, 30 ],
	[ 2048, 20 ],
	[ 4096, 10 ],
	[ 8192, 5 ],
	[ 16384, 0 ],
];


Sawkmonkey.Games.Tetris.init = function(elm) {
	var t = new Sawkmonkey.Games.Tetris(elm, 'tetris');
	t.init();
	t.show();
}
