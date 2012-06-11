/**
 * @fileOverview Implementation of Minesweeper
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
Sawkmonkey.Games.Mines = Class.create(Sawkmonkey.Games.Game,
/** @lends Sawkmonkey.Games.Mines.prototype */
{
	/**
	 * The dom element used to display user messages.
	 */
	__messageText : null,
	/**
	 * The dom element used to display the time
	 */
	__timeText : null,
	/**
	 * The dom element used to display the mines flagged
	 */
	__flagText : null,
	/**
	 * The dom element which contains blocks in play.
	 */
	__playArea : null,

	/**
	 * The width in pixles of one block piece.
	 */
	__blockWidth : 0,
	/**
	 * The height in pixles of one block piece.
	 */
	__blockHeight : 0,
	/**
	 * The maximum number of vertical blocks.
	 */
	__maxRows : 0,
	/**
	 * The maximum number of horizontal blocks.
	 */
	__maxCols : 0,

	/**
	 * The number of vertical blocks.
	 */
	__rows : 0,
	/**
	 * The number of horizontal blocks.
	 */
	__cols : 0,

	/**
	 * Objects representing each of the blocks
	 */
	__blocks : null,

	/**
	 * Game state
	 */
	__state : null,

	/**
	 * Current level
	 */
	__time : 0,

	/**
	 * Current number of flags
	 */
	__flagged : 0,
	/**
	 * How many of the current flags are actually on mines
	 */
	__minesFlagged : 0,
	/**
	 * Current number of mines
	 */
	__mines : 0,
	/**
	 * Current number of blocks that have been cleared
	 */
	__cleared : 0,

	/**
	 * Reference to timeout used to make blocks fall.
	 */
	__timeout : null,

	__placeMines : function() {
		var m = this.__mines;
		while (m > 0) {
			var i = Math.floor((Math.random() * this.__cols));
			var j = Math.floor((Math.random() * this.__rows));
			if (this.__blocks[i][j].num < 0) { continue; }
			this.__blocks[i][j].num = -255;
			this.__blocks[i][j].mine = true;
			//look at all blocks around the bomb and increas
			//their number
			for (var k = i - 1; k <= i + 1; k++) {
				for (var l = j - 1; l <= j + 1; l++) {
					if (k >= 0 && k < this.__cols && l >= 0 && l < this.__rows)
						this.__blocks[k][l].num++;
				}
			}
			--m;
		}
	},

	__redrawPlayArea : function() {
		for (var i = 0; i < this.__cols; i++) {
			for (var j = 0; j < this.__rows; j++) {
				this.__drawBlock(i,j);
			}
		}
	},

	__drawBlock : function(x, y) {
		var block = this.__blocks[x][y];
		block.className = 'mines_block';
		block.update('');
		if (this.__state == "paused") {
			block.addClassName('mines_hidden');
		} else {
			if (!this.__showAll && !block.cleared) {
				block.addClassName('mines_hidden');
				if (block.flag) {
					block.update('!');
				}
			} else if (block.num < 0) {
				block.addClassName('mines_bomb');
			} else if (block.num > 0) {
				block.addClassName('mines_n' + block.num);
				block.update(block.num);
			}
		}
		this.__blocks[x][y].show();
	},

	__tick : function() {
		if (this.__state == 'playing') {
			this.__setTime(this.__time + 1);
			this.__timeout = setTimeout(this.__tick.bind(this), 1000);
		}
	},

	__setTime : function(val) {
		this.__time = val;
		this.__timeText.update(val);
	},

	__setFlags : function(val) {
		this.__flagged = val;
		this.__flagsText.update(val + "/" + this.__mines);
	},

	__setMessage : function(text) {
		if (text) {
			this.__messageText.update(text);
			this.__messageText.show();
		} else {
			this.__messageText.hide();
		}
	},

	__checkWin : function() {
		var size = this.__cols * this.__rows;
		if (size - this.__cleared == this.__mines && this.__minesFlagged == this.__mines) {
			this.__endGame(true);
		}
	},

	__flag : function(x, y) {
		var block = this.__blocks[x][y];
		if (!block.cleared) {
			if (block.flag) {
				block.flag = false;
				this.__setFlags(this.__flagged - 1);
				if (block.mine) {
					--this.__minesFlagged;
				}
			} else {
				block.flag = true;
				this.__setFlags(this.__flagged + 1);
				if (block.mine) {
					++this.__minesFlagged;
				}
			}
			this.__drawBlock(x,y);

			this.__checkWin();
		}
	},

	__clearBlock : function(x, y) {
		var block = this.__blocks[x][y];

		if (block.cleared) { return; }

		block.cleared = true;
		this.__drawBlock(x,y);
		this.__cleared++;

		//clear area if this is an empty block
		if (block.num == 0) {
			for (var i = x - 1; i <= x + 1; i++) {
				for (var j = y - 1; j <= y + 1; j++) {
					//make sure don't clear  a non existant block.
					if (i >= 0 && i < this.__rows && j >= 0 && j < this.__cols) {
						this.__clearBlock(i, j);
					}
				}
			}
		}
	},

	__clear : function(x, y) {
		if (this.__blocks[x][y].mine) {
			this.__endGame(false);
		} else {
			//clear the clicked block
			this.__clearBlock(x, y);
			this.__checkWin();
		}
	},

	__pauseGame : function() {
		if (this.__state == "playing") {
			this.__state = "paused";
			this.__setMessage(this._text('game_paused'));
			this.__redrawPlayArea();
			clearTimeout(this.__timeout);
		} else if (this.__state == "paused") {
			this.__state = "playing";
			this.__setMessage('');
			this.__redrawPlayArea();
			this.__timeout = setTimeout(this.__tick.bind(this), 1000);
		}
	},

	__endGame : function(win) {
		if (win) {
			this.__setMessage(this._text('game_win'));
		} else {
			this.__setMessage(this._text('game_over'));
			this.__showAll = true;
			this.__redrawPlayArea();
		}
		this.__state = "done";
		clearTimeout(this.__timeout);
	},

	__readParams : function() {
		var params = window.location.search.parseQuery();
		switch (params['level']) {
			case 'easy' :
				this.__cols = 8;
				this.__rows = 8;
				this.__mines = 10;
			break;
			case 'medium' :
				this.__cols = 16;
				this.__rows = 16;
				this.__mines = 40;
			break;
			case 'hard' :
				this.__cols = 20;
				this.__rows = 20;
				this.__mines = 99;
			break;
			default:
				this.__cols = params['cols'] || 8;
				this.__rows = params['rows'] || 8;
				this.__mines = params['mines'] || 10;
			break;
		}
	},

	start : function() {
		this.__readParams();
		this.__state = 'playing';
		this.__setMessage('');
		this.__setTime(0);
		this.__setFlags(0);
		this.__minesFlagged = 0;
		this.__cleared = 0;
		this.__flaged = 0;
		this.__showAll = false;
		for (var i = 0; i < this.__maxCols; ++i) {
			for (var j = 0; j < this.__maxRows; ++j) {
				var block = this.__blocks[i][j];
				block.num = 0;
				block.mine = false;
				block.cleared = false;
				block.flag = false;
				block.hide();
			}
		}
		this.__placeMines();
		this.__redrawPlayArea();
		this.__timeout = setTimeout(this.__tick.bind(this), 1000);
	},

	init : function($super) {
		$super();

		this.__state = 'ready';

		// Determine the size of the play area
		var dims = this.__playArea.getDimensions();

		// Determine how many blocks we can fit in the play area
		var tempBlock = new Element('div', { 'class' : 'mines_block' });
		this.__playArea.insert(tempBlock);
		var blockDims = tempBlock.getDimensions();;
		tempBlock.hide();
		this.__blockWidth = blockDims.width + 1;
		this.__blockHeight = blockDims.height + 1;
		this.__maxCols = Math.floor(dims.width / this.__blockWidth);
		this.__maxRows = Math.floor(dims.height / this.__blockHeight);

		this.__blocks = [];
		tempBlock.remove();
		var x = 0;
		var y = 0;
		for (var i = 0; i < this.__maxCols; ++i) {
			this.__blocks[i] = [];
			for (var j = 0; j < this.__maxRows; ++j) {
				var block = new Element('div', { 'class' : 'mines_block' });
				block.mines_x = i;
				block.mines_y = j;
				var f = this.__click.bind(this);
				block.observe('click', f);
				block.observe('contextmenu', f);
				block.setStyle({ 'left' : x + 'px', 'top' : y + 'px' });
				block.hide();
				this.__playArea.insert(block);
				this.__blocks[i][j] = block;
				y += this.__blockHeight;
			}
			y = 0;
			x += this.__blockWidth;
		}

		var msgDims = this.__messageText.getDimensions();
		this.__messageText.setStyle({
			'top' : (dims.height - msgDims.height)/2 + 'px',
			'left' : (dims.width - msgDims.width)/2 + 'px'
		});
	},

	_createCanvas : function($super) {
		var elm = $super();
		elm.insert(this.__createPlayArea());
		elm.insert(this.__createScoreArea());
		return elm;
	},

	__createPlayArea : function() {
		var playArea = new Element('div', { 'class' : 'mines_play_area' });
		this.__playArea = playArea;
		var messageText = new Element('div', { 'class' : 'mines_message_text'});
		messageText.update(this._text('game_ready'));
		playArea.insert(messageText);
		this.__messageText = messageText;
		return playArea;
	},

	__createScoreArea : function() {
		var scoreArea = new Element('div', { 'class' : 'mines_score_area' });

		var timeTitle = new Element('div', { 'class' : 'games_label' });
		timeTitle.update(this._text('time_title'));
		scoreArea.insert(timeTitle);
		var timeText = new Element('div', { 'class' : 'mines_score_text'});
		timeText.update('0s');
		scoreArea.insert(timeText);
		this.__timeText = timeText;

		var flagsTitle = new Element('div', { 'class' : 'games_label' });
		flagsTitle.update(this._text('mines_flags_title'));
		scoreArea.insert(flagsTitle);
		var flagsText = new Element('div', { 'class' : 'mines_score_text'});
		flagsText.update('0/0');
		scoreArea.insert(flagsText);
		this.__flagsText = flagsText;

		return scoreArea;
	},

	_keypressed : function(evt) {
		if (evt.keyCode == Event.KEY_ESC) {
			if (this.__state == 'ready' || this.__state == 'done') {
				this.start();
			} else {
				this.__pauseGame();
			}
		}
	},

	__click : function(evt) {
		var elm = evt.element();
		if (this.__state == 'playing') {
			if (evt.isLeftClick()) {
				this.__clear(elm.mines_x, elm.mines_y);
			} else if (evt.isRightClick()) {
				this.__flag(elm.mines_x, elm.mines_y);
			}
		}
		evt.stop();
	}
});

Sawkmonkey.Games.Mines.init = function(elm) {
	var t = new Sawkmonkey.Games.Mines(elm, 'mines');
	t.init();
	t.show();
}
