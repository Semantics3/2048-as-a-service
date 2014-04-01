//Extracted from 2048 by gabrielecirulli
//https://github.com/gabrielecirulli/2048

function Tile(position, value) {
  value = parseInt(value);
  this.x                = position.x;
  this.y                = position.y;
  this.value            = value || 2;

  this.previousPosition = null;
  this.mergedFrom       = null; // Tracks tiles that merged together
}

Tile.prototype.savePosition = function () {
  this.previousPosition = { x: this.x, y: this.y };
};

Tile.prototype.updatePosition = function (position) {
  this.x = position.x;
  this.y = position.y;
};

exports.Tile = Tile;
