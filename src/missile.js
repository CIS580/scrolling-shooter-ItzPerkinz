"use strict"

module.exports = exports = Missile;

function Missile(pos, ang)
{
  this.position = {
    x: pos.x+13,
    y: pos.y
  };
  this.angle = (ang+90) * 0.0174533;
  this.velocity = {
    x: Math.cos(this.angle),
    y: Math.sin(this.angle)
  };
  this.state = "unlocked";
  this.onScreen = true;
  this.img = new Image();
  this.img.src = 'assets/weapons.png';
  console.log("Missile created at " + this.position.x + " " + this.position.y);
  this.width = 20;
  this.height = 28;
}

Missile.prototype.update = function(time)
{
  switch (this.state) {
    case "unlocked":
      // move the missile
      this.position.y -= 7*(this.velocity.y);
    break;
    case "lockedOn":

    break;

  }
  if (this.position.x < 0) this.onScreen = false;
  if (this.position.x > 1024) this.onScreen = false;
  if (this.position.y < 0) this.onScreen = false;
  if (this.position.y > 786) this.onScreen = false;
}

Missile.prototype.render = function(time, ctx)
{
  ctx.drawImage(this.img, 217, 29, 10, 14, this.position.x, this.position.y, 20, 28);
/*
  ctx.strokeStyle = "white";
  ctx.rect(this.position.x, this.position.y, this.width, this.height );
  ctx.stroke();
*/
}
