"use strict"

module.exports = exports = Upgrade;

function Upgrade(position, type)
{
  this.position = {
    x: position.x,
    y: position.y
  };
  this.type = type;
  this.img = new Image();
  this.img.src = 'assets/upgrades.png';
  this.w = 42;
  this.h = 48;
}

Upgrade.prototype.update = function(time)
{
  switch (this.type)
  {
    //weapon
    case "weapon":
      this.position.y += 3;
      break;
    //health
    case "health":
      this.position.y += 2;
      break;
    //armor
    case "armor":
      this.position.y += 1;
      break;
  }
}

Upgrade.prototype.render = function(time, ctx)
{
  switch (this.type)
  {
    //weapon
    case "weapon":
      ctx.drawImage(this.img, 2, 142, 21, 24, this.position.x, this.position.y, 42, 48);
      break;
    //health
    case "health":
      ctx.drawImage(this.img, 74, 170, 21, 24, this.position.x, this.position.y, 42, 48);
      break;
    //armor
    case "armor":
      ctx.drawImage(this.img, 121, 141, 21, 24, this.position.x, this.position.y, 42, 48);
      break;
  }
}
