"usse strict"

module.exports = exports = Laser;

function Laser (position, angle, color, speed)
{
  this.position = position;
  this.angle = angle;
  this.velocity = {
    x: Math.cos(this.angle),
    y: Math.sin(this.angle)
  };
  this.color = color;
  this.speed = speed;
  this.length = speed * 3;
  this.width = 4;

}

Laser.prototype.update = function(time)
{
  this.position.x += this.speed*(this.velocity.x);
  this.position.y -= this.speed*(this.velocity.y);
}

Laser.prototype.render = function(time, ctx)
{
  ctx.strokeStyle = this.color;
  ctx.lineWidth = this.width;
  ctx.beginPath();
  ctx.moveTo(this.position.x, this.position.y);
  ctx.lineTo(this.position.x + this.speed*(this.velocity.x), this.position.y - this.length*(this.velocity.y));
  ctx.stroke();
  ctx.lineWidth = 1;
}
