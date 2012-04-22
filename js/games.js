/**
 * @fileOverview Base file for all JavaScript games including base classes.
 * @author mephillips
 */
/*
 * Copyright (c) 2005 Matthew Phillips
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

/** @namespace */
var Sawkmonkey = {};
/** @namespace */
Sawkmonkey.Games = {};

Sawkmonkey.Games.Game = Class.create(
/** @lends Sawkmonkey.Games.Games.prototype */
{
	/**
	 * The root dom element used for adding content.
	 * @private
	 */
	__elm : null,

	/**
	 * The unique id for this game
	 * @private
	 */
	__gameId : null,

	/**
	 * Holds onto any affect object for animating help appear/dissapear
	 */
	__helpEffect : null,

	/**
	 * Create a new Game object but do no other initilization.
	 * @param {Object} elm The id of, or element to use for the game root.
	 */
	initialize : function(elm, gameId) {
		this.__elm = $(elm);
		this.__gameId = gameId;
	},

	/**
	 * Initialize this game, creating and DOM elements and doing any other
	 * work needed to make the game work.
	 */
	init : function() {
		this.__elm.addClassName('games_container');
		this.__elm.insert(this._createTitle());
		this.__elm.insert(this._createHelp());
		this.__elm.insert(this._createCanvas());
		Event.observe(document, 'keypress', this._keypressed.bind(this));
	},

	/**
	 * Make the game visible
	 */
	show : function() {
		this.__elm.show();
	},

	/**
	 *  Hibe the game
	 */
	hide : function() {
		this.__elm.hide();
	},

	_createTitle : function() {
		var elm = new Element('div', { 'class' : 'games_title' });
		elm.update(this._text(this.__gameId + '_title'));
		return elm;
	},

	_createHelp : function() {
		var elm = new Element('div', { 'class' : 'games_help' });

		var linkElm = new Element('a', { 'class' : 'games_help_link', 'href' : 'javascript:void(0)' });
		linkElm.update(this._text('help_link'));
		linkElm.observe('mouseover', this.__showHelp.bind(this));
		linkElm.observe('mouseout', this.__hideHelp.bind(this));
		elm.insert(linkElm);

		var contentElm = new Element('div', { 'class' : 'games_help_content' });
		contentElm.update(this._text(this.__gameId + '_help'));
		contentElm.hide();
		elm.insert(contentElm);

		return elm;
	},

	_createCanvas : function() {
		var elm = new Element('div', { 'class' : 'games_canvas' });
		return elm;
	},

	_text : function(id) {
		return Sawkmonkey.Games.Text[id];
	},

	_keypressed : function(evt) {
	},

	__showHelp : function(evt) {
		var elm = evt.element();
		elm = elm.up().down('.games_help_content');
		if (this.__helpEffect) { this.__helpEffect.cancel(); }
		this.__helpEffect = Effect.BlindDown(elm);
	},

	__hideHelp : function(evt) {
		var elm = evt.element();
		elm = elm.up().down('.games_help_content');
		if (this.__helpEffect) { this.__helpEffect.cancel(); }
		this.__helpEffect = Effect.BlindUp(elm);
	}
});
