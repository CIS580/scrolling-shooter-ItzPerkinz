"use strict"

module.exports = exports = Enemy;

function Enemy(type, position)
{
  this.position = {
    x: position.x,
    y: position.y
  };
  this.initX = position.x;
  this.initY = position.y;
  this.type = type;
  this.state = "default";
  this.img = new Image();
  this.w;
  this.h;
  this.hp;
  switch(this.type)
  {
    //blimp enemy
    case 1:
      this.img.src = "assets/blimp_enemy.png";
      this.leftRight = 0; // left
      this.upDown = 1; // down
      this.w = 96;
      this.h = 130;
      this.hp = 20;
      break;
    //red enemy
    case 2:
      this.img.src = "assets/red_enemy.png";
      this.w = 136;
      this.h = 112;
      this.hp = 20;
      break;
    //blue enemy
    case 3:
      this.img.src = "assets/blue_enemy.png";
      this.w = 183;
      this.h = 127;
      this.hp = 30;
      break;
    //eye enemy
    case 4:
      this.img.src = "assets/eye_enemy.png";
      this.w = 72;
      this.h = 70;
      this.hp = 5;
      break;
    //enemy 5
    case 5:
      this.img.rsc = "assets/5_enemy.png";
      this.w = 120;
      this.h = 140;
      this.hp = 20;
      break;
  }
}

Enemy.prototype.update = function(time, camera, player) {
  switch(this.type)
  {
    //blimp enemy
    case 1:
      //this.position.y = camera.y - this.initY - 150;
      if (this.upDown == 0) this.position.y -= 1;
      if (this.position.y < camera.y - this.initY - 150) this.upDown = 1;
      if (this.upDown == 1) this.position.y += 1;
      if (this.position.y > camera.y - this.initY + 300) this.upDown = 0;
      // horizontal movement
      if (this.leftRight == 0) this.position.x -= 1;
      if (this.position.x < 150 && this.leftRight == 0) this.leftRight = 1;
      if (this.leftRight == 1) this.position.x += 1;
      if (this.position.x > 874 && this.leftRight == 1) this.leftRight = 0;
      break;
    //red enemy
    case 2:
      break;
    //blue enemy
    case 3:
      break;
    //eye enemy
    case 4:
      break;
    //enemy 5
    case 5:
      break;
  }
}

Enemy.prototype.render = function(time, ctx) {
  switch(this.type)
  {
    //blimp enemy
    case 1:
      ctx.drawImage(this.img, 0, 10, 96, 130, this.position.x, this.position.y, 96, 130);
      ctx.fillStyle = "red";
      ctx.fillText(this.hp, this.position.x + 40, this.position.y + 80);
      break;
    //red enemy
    case 2:
      ctx.drawImage(this.img, 5, 112, 136, 112, this.position.x, this.position.y, 136, 112);
      break;
    //blue enemy
    case 3:
      ctx.drawImage(this.img, 4, 6, 183, 127, this.position.x, this.position.y, 183, 127);
      break;
    //eye enemy
    case 4:
      ctx.drawImage(this.img, 0, 112, 72, 70, this.position.x, this.position.y, 72, 70);
      break;
    //enemy 5
    case 5:
      ctx.drawImage(this.img, 0, 0, 120, 140, this.position.x, this.position.y, 120, 140);
      break;
  }
}
