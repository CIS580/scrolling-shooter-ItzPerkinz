"use strict"

const Laser = require('./laser');
const Missile = require('./missile');

var lazer = new Audio("assets/laser.wav");
lazer.volume = .1;

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
  this.lasers = [];
  this.missiles = [];
  this.shootTimer = 0;
  this.remove = [];
  switch(this.type)
  {
    //blimp enemy
    case 1:
      this.img.src = "assets/blimp_enemy.png";
      this.leftRight = 0; // left
      this.upDown = 0; // down
      this.w = 96;
      this.h = 130;
      this.hp = 30;
      break;
    //red enemy
    case 2:
      this.img.src = "assets/red_enemy.png";
      this.leftRight = 0; // left
      this.upDown = 1; // down
      this.w = 136;
      this.h = 112;
      this.hp = 50;
      break;
    //BOSS enemy
    case 3:
      this.img.src = "assets/blue_enemy.png";
      this.leftRight = 0; // left
      this.upDown = 1; // down
      this.w = 366;
      this.h = 254;
      this.hp = 300;
      this.laserTimer = 0;
      this.missileTimer = 0;
      this.chargeTimer = 0;
      this.charging = false;
      break;
    //eye enemy
    case 4:
      this.img.src = "assets/eye_enemy.png";
      this.leftRight = 0; // left
      this.upDown = 1; // down
      this.w = 72;
      this.h = 70;
      this.hp = 15;
      this.chargeTimer = 4000;
      this.timer = 6000;
      this.charging = false;
      break;
    //enemy 5
    case 5:
      this.img.src = "assets/5_enemy.png";
      this.leftRight = 0; // left
      this.upDown = 1; // down
      this.w = 120;
      this.h = 140;
      this.hp = 30;
      this.rechargeTimer = 0;
      break;
  }
}

Enemy.prototype.update = function(time, camera, player) {
  this.remove = [];
  var t = this;
  this.lasers.forEach(function(l, i){
    l.update(time);
    if (l.position.y > camera.y + 786)
    { t.remove.unshift(i); }
  });
  this.remove.forEach(function(index){
    t.lasers.splice(index, 1);
  });
  this.removeM = [];
  this.missiles.forEach(function(m, i){
    m.update(time);
    if (m.position.y > camera.y + 786)
    { t.removeM.unshift(i); }
  });
  this.removeM.forEach(function(index){
    t.missiles.splice(index, 1);
  });

  this.shootTimer += time;
  switch(this.type)
  {
    //blimp enemy
    case 1:
      //this.position.y = camera.y - this.initY - 150;
      if (this.upDown == 0) this.position.y -= 10;
      if (this.position.y < camera.y - 100) this.upDown = 1;
      if (this.upDown == 1) this.position.y += 1;
      if (this.position.y > camera.y + 300) this.upDown = 0;
      // horizontal movement
      if (this.leftRight == 0) this.position.x -= 1;
      if (this.position.x < 150 && this.leftRight == 0) this.leftRight = 1;
      if (this.leftRight == 1) this.position.x += 1;
      if (this.position.x > 874 && this.leftRight == 1) this.leftRight = 0;
      //shoot
      if (this.shootTimer > Math.random()*3000 + 2000){
        fire(this, 0);
        this.shootTimer = 0;
      }
      break;
    //red enemy
    case 2:
      // tries to close in on the player
      if (this.position.y > player.position.y - 300) this.position.y -= 2;
      if (this.position.y < player.position.y - 300) this.position.y += 1;
      // horizontal movement
      if (this.position.x < player.position.x - 45) this.position.x += .5;
      if (this.position.x > player.position.x - 45) this.position.x -= .5;
      //shoot
      if (this.shootTimer > Math.random()*2000 + 3000){
        fire(this, 0);
        this.shootTimer = 0;
      }
      break;
    //blue enemy -- BOSS?
    case 3:
      this.laserTimer += time;
      this.missileTimer += time;
      this.chargeTimer += time;
      this.position.y = camera.y + 20;
      // horizontal movement
      // horizontal movement
      if (this.leftRight == 0) this.position.x -= 1;
      if (this.position.x < 25 && this.leftRight == 0) this.leftRight = 1;
      if (this.leftRight == 1) this.position.x += 1;
      if (this.position.x > 761 && this.leftRight == 1) this.leftRight = 0;

      //shoot
      if (this.laserTimer > Math.random()*3000 + 2000) { fire(this, 1); this.laserTimer = 0; }
      if (this.missileTimer > Math.random()*5000 + 6000) { fire(this, 2); this.missileTimer = 0; }
      if (this.chargeTimer > 4500) {this.charging = true;}
      if (this.chargeTimer > 6000) {this.charging = false; fire(this, 3); this.chargeTimer = 0;}
      break;
    //eye enemy
    case 4:
      //this.position.y = camera.y - this.initY - 150;
      if (this.upDown == 0) this.position.y -= 1.5;
      if (this.position.y < camera.y + 100) this.upDown = 1;
      if (this.upDown == 1) this.position.y += .5;
      if (this.position.y > camera.y + 100) this.upDown = 0;
      // horizontal movement
      if (this.leftRight == 0) this.position.x -= 3;
      if (this.position.x < 75 && this.leftRight == 0) this.leftRight = 1;
      if (this.leftRight == 1) this.position.x += 3;
      if (this.position.x > 949 && this.leftRight == 1) this.leftRight = 0;
      if (this.shootTimer > this.chargeTimer) { this.charging = true; }

      if (this.shootTimer > this.timer) {
        this.charging = false;
        fire(this, 0);
        this.shootTimer = 0;
      }
      break;
    //enemy 5
    case 5:
      this.rechargeTimer += time;
      // tries to close in on the player
      if (this.position.y > player.position.y - 500) this.position.y -= 2;
      if (this.position.y < player.position.y - 500) this.position.y += .25;
      // horizontal movement
      if (this.position.x < player.position.x - 37) this.position.x += .25;
      if (this.position.x > player.position.x - 37) this.position.x -= .25;
      if (this.position.x > player.position.x - 50 && this.position.x < player.position.x + player.w + 50 && this.rechargeTimer > 2000) {
        fire(this, 0);
        this.rechargeTimer = 0;
      }
      break;
  }
}

Enemy.prototype.render = function(time, ctx) {
  this.lasers.forEach(function(l){
    l.render(time, ctx);
  });
  this.missiles.forEach(function(m){
    m.render(time, ctx);
  })
  switch(this.type)
  {
    //blimp enemy
    case 1:
      if (this.hp > 10) ctx.drawImage(this.img, 0, 10, 96, 130, this.position.x, this.position.y, 96, 130);
      if (this.hp <= 10) ctx.drawImage(this.img, 96, 10, 96, 130, this.position.x, this.position.y, 96, 130);
      break;
    //red enemy
    case 2:
      ctx.drawImage(this.img, 5, 112, 136, 112, this.position.x, this.position.y, 136, 112);
      break;
    //blue enemy
    case 3:
      ctx.drawImage(this.img, 4, 6, 183, 127, this.position.x, this.position.y, 366, 254);
      if (this.charging == true) { ctx.fillStyle = "green"; ctx.fillRect(this.position.x + 183, this.position.y + 190, 1, 1200); }
      break;
    //eye enemy
    case 4:
      ctx.drawImage(this.img, 0, 112, 72, 70, this.position.x, this.position.y, 72, 70);
      if (this.charging == true) { ctx.fillStyle = "green"; ctx.fillRect(this.position.x + 36, this.position.y + 69, 1, 1200); }
      break;
    //enemy 5
    case 5:
      if (this.hp > 10 ) ctx.drawImage(this.img, 0, 0, 120, 139, this.position.x, this.position.y, 120, 140);
      if (this.hp <= 10) ctx.drawImage(this.img, 120, 0, 120, 139, this.position.x, this.position.y, 120, 140);
      break;
  }
}

function fire(e, type)
{
  switch(e.type)
  {
    //blimp enemy
    case 1:
      lazer.play();
      var leftShot = {x: e.position.x + 3, y: e.position.y + 100 };
      var l1 = new Laser( leftShot, 0 - (90 * 0.0174533), "red", 8);
      e.lasers.push(l1);

      if (e.hp > 10) {
        var rightShot = {x: e.position.x + 93, y: e.position.y + 100};
        var l2 = new Laser( rightShot, 0 - (90 * 0.0174533), "red", 8);
        e.lasers.push(l2);
      }
      break;
    //red enemy
    case 2:
      var miss = new Missile({x: e.position.x + 40, y: e.position.y + 112}, 0 - (90 * 0.0174533));
      e.missiles.push(miss);
      break;
    //blue enemy
    case 3:
      // laser
      if (type == 1) {
        lazer.play();
        var left = new Laser({x: e.position.x + 80, y: e.position.y + 250}, 0 - (90 * 0.0174533), "blue", 20);
        var right = new Laser({x: e.position.x + 264, y: e.position.y + 250}, 0 - (90 * 0.0174533), "blue", 20);
        left.length = 30; left.width = 6;
        right.length = 30; right.width = 6;
        e.lasers.push(left);
        e.lasers.push(right);
      }
      // missile
      if (type == 2) {
        var leftM = new Missile({x: e.position.x +128, y: e.position.y + 190}, 0 - (90 * 0.0174533));
        var midM = new Missile( {x: e.position.x + 179, y: e.position.y + 190}, 0 - (90 * 0.0174533));
        var rightM = new Missile( {x: e.position.x + 230, y: e.position.y + 190}, 0 - (90 * 0.0174533));
        e.missiles.push(leftM); e.missiles.push(midM); e.missiles.push(rightM);
      }
      //BIG Laser
      if (type == 3) {
        lazer.play();
        var las = new Laser({x: e.position.x + 175, y: e.position.y + 190}, 0 - (90 * 0.0174533), "Chartreuse", 150);
        las.width = 16;
        e.lasers.push(las);
      }
      break;
    //eye enemy
    case 4:
    lazer.play();
      var las = new Laser({x: e.position.x + 36, y: e.position.y + 69}, 0 - (90 * 0.0174533), "Chartreuse", 100);
      las.width = 6;
      e.lasers.push(las);
      break;
    //enemy 5
    case 5:
      var leftM = new Missile({x: e.position.x - 15, y: e.position.y + 50}, 0 - (90 * 0.0174533));
      var midM = new Missile( {x: e.position.x + e.w/2 -25, y: e.position.y + 60}, 0 - (90 * 0.0174533));
      var rightM = new Missile( {x: e.position.x + e.w -35, y: e.position.y + 50}, 0 - (90 * 0.0174533));
      e.missiles.push(leftM); e.missiles.push(midM); e.missiles.push(rightM);
      break;
  }
}
