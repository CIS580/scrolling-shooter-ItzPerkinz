"use strict"

module.exports = exports = Enemy;

function Enemy(type, position)
{
  this.position = {
    x: position.x,
    y: position.y
  };
  this.state = type;
  
}
