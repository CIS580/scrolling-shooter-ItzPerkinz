(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/* Classes and Libraries */
const Game = require('./game');
const Vector = require('./vector');
const Camera = require('./camera');
const Player = require('./player');
const BulletPool = require('./bullet_pool');
const Missile = require('./missile');
const Enemy = require('./enemy');
const Upgrade = require('./upgrade');
const Particle = require('./particle');


/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);
var input = {
  up: false,
  down: false,
  left: false,
  right: false
}
var camera = new Camera(canvas);
var bullets = new BulletPool(50);
var missiles = [];
var upgrades = [];
var enemies = [];
var player = new Player(bullets, missiles);

var missileTimer = 0;
var upgradeTimer = 0;
var level = 1;
var score = 0;

var rand = (Math.random()*5000 + 5000);
var close = [];
var closeE = [];
var removeUps = [];
var markedForRemoval = [];
var removeE = [];

var particles = [];
var removePart = [];

var backgrounds = [
  new Image(),
  new Image()
];

backgrounds[0].src = 'assets/layer-1.png';
backgrounds[0].style.width = '25%';
backgrounds[0].style.height = 'auto';
backgrounds[1].src = 'assets/layer-2.png';
//backgrounds[2].src = '';

var background = new Audio("assets/background.mp3");
background.loop = true;
background.volume = 0.05;
//background.play();

//left click
window.onmousedown = function(event)
{
  event.preventDefault();
  player.firing = true;

}

// right click
canvas.oncontextmenu = function(event)
{
  event.preventDefault();
}

window.onmouseup = function(event)
{
  player.firing = false;
  event.preventDefault();
}

window.onkeypress = function(event) {
  event.preventDefault();
  if (event.keyCode == 32) {
    switch (player.state)
    {
      case "standard":
        player.fireMissile();
        if (player.bool == true) missileTimer = 0;
        break;
      case "empowered":
        console.log("empowered shoot");
        break;
    }

  }
}

/**
 * @function onkeydown
 * Handles keydown events
 */
window.onkeydown = function(event) {
  switch(event.key) {
    case "ArrowUp":
    case "w":
      input.up = true;
      event.preventDefault();
      break;
    case "ArrowDown":
    case "s":
      input.down = true;
      event.preventDefault();
      break;
    case "ArrowLeft":
    case "a":
      input.left = true;
      event.preventDefault();
      break;
    case "ArrowRight":
    case "d":
      input.right = true;
      event.preventDefault();
      break;
  }
}

/**
 * @function onkeyup
 * Handles keydown events
 */
window.onkeyup = function(event) {
  switch(event.key) {
    case "ArrowUp":
    case "w":
      input.up = false;
      event.preventDefault();
      break;
    case "ArrowDown":
    case "s":
      input.down = false;
      event.preventDefault();
      break;
    case "ArrowLeft":
    case "a":
      input.left = false;
      event.preventDefault();
      break;
    case "ArrowRight":
    case "d":
      input.right = false;
      event.preventDefault();
      break;
  }
}

/**
 * @function masterLoop
 * Advances the game in sync with the refresh rate of the screen
 * @param {DOMHighResTimeStamp} timestamp the current time
 */
var masterLoop = function(timestamp) {
  game.loop(timestamp);
  window.requestAnimationFrame(masterLoop);
}
masterLoop(performance.now());

/**
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {DOMHighResTimeStamp} elapsedTime indicates
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {
  upgradeTimer += elapsedTime;
  //reload missile after 5 seconds if the player has less than 4 missiles
  if (player.missileCount < 4) missileTimer += elapsedTime;
  if (missileTimer > 5000 && player.missileCount < 4) {
    player.missileCount++;
    missileTimer = 0;
  }

  //spawn random upgrade after a time between 10-20 seconds
  if (upgradeTimer > rand) {
    spawnUpgrade();
    upgradeTimer = 0;
    rand = (Math.random()*10000 + 10000);
  }
  // update the player
  player.update(elapsedTime, input);
  checkForCloseUpgrade();
  checkForCloseEnemy();
  checkForUp();
  checkForDead();

  // update the camera
  camera.update(player.position);

  // Update bullets
  bullets.update(elapsedTime, function(bullet){
    if(!camera.onScreen(bullet)) return true;
    return false;
  });

  // Update missiles
  markedForRemoval = [];
  player.missiles.forEach(function(m, i){
    m.update(elapsedTime);
    if(m.position.y < 0)
      markedForRemoval.unshift(i);
  });
  markedForRemoval.forEach(function(index){
    player.missiles.splice(index, 1);
  });

  //update upgrades
  removeUps = [];
  upgrades.forEach(function(u, i){
    u.update(elapsedTime);
    if (u.position.y > 775)
      removeUps.unshift(i);
  });
  removeUps.forEach(function(index){
    upgrades.splice(index, 1);
  });

  removePart = [];
  //update particles
  particles.forEach(function(p, i){
    p.update(elapsedTime);
    if (p.scale == 0)
      removePart.unshift(i);
  });
  removePart.forEach(function(index){
    particles.splice(index, 1);
  });


}

/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {DOMHighResTimeStamp} elapsedTime indicates
  * the number of milliseconds passed since the last frame.
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function render(elapsedTime, ctx) {


  // TODO: Render background
  renderBackgrounds(elapsedTime, ctx);

  // Transform the coordinate system using
  // the camera position BEFORE rendering
  // objects in the world - that way they
  // can be rendered in WORLD cooridnates
  // but appear in SCREEN coordinates
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  renderWorld(elapsedTime, ctx);
  ctx.restore();

  // Render the GUI without transforming the
  // coordinate system
  renderGUI(elapsedTime, ctx);
}

/**
  * @function renderWorld
  * Renders the entities in the game world
  * IN WORLD COORDINATES
  * @param {DOMHighResTimeStamp} elapsedTime
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function renderWorld(elapsedTime, ctx) {
    // Render the bullets
    bullets.render(elapsedTime, ctx);

    // Render the missiles
    missiles.forEach(function(m) {
      m.render(elapsedTime, ctx);
    });

    //render upgrades
    upgrades.forEach(function(u) {
      u.render(elapsedTime, ctx);
    });

    //render the particles
    particles.forEach(function(p){
      p.render(elapsedTime, ctx);
    })

    // Render the player
    player.render(elapsedTime, ctx);

    if (player.state == "empowered") {
      ctx.font = "20px Impact";
      ctx.fillStyle = "LightBlue";
      ctx.fillText("Empowered Weapons for " + Math.floor((10 - (player.empoweredTimer/1000))), 400, 140);
    }
}

function renderBackgrounds(elapsedTime, ctx) {
  //ctx.save();
  //ctx.translate(0, -camera.y * 0.2);
  //ctx.drawImage(backgrounds[2], 0, 0);
  //ctx.restore();

  ctx.save();
  ctx.translate(0, -camera.y * 0.6);
  ctx.drawImage(backgrounds[1], 0, 0);
  ctx.restore();

  ctx.save();
  ctx.translate(0, -camera.y);
  ctx.drawImage(backgrounds[0], 0, 0);
  ctx.restore();
}

/**
  * @function renderGUI
  * Renders the game's GUI IN SCREEN COORDINATES
  * @param {DOMHighResTimeStamp} elapsedTime
  * @param {CanvasRenderingContext2D} ctx
  */
function renderGUI(elapsedTime, ctx) {
  // TODO: Render the GUI
  ctx.font = "15px Tahoma";
  ctx.fillStyle = "white";
  ctx.fillText("Lives -- " + player.lives, 5,20);
  ctx.fillText("Armor -- " + player.armor, 5,40);

  ctx.fillText("Missiles -- " + player.missileCount, 5,80);
  ctx.fillText("Reload Time -- " + Math.ceil(5 -missileTimer/1000), 5,100);

  ctx.fillText("Level -- " + level, 5,750);
  ctx.fillText("Score -- " + score, 5,770);
}

//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// OTHER FUNCTIONS
//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//spawn a random upgrade. Called from the main update function
function spawnUpgrade() {
  var t = Math.floor(Math.random()*3);
  var type;
  if (t == 0) type = "weapon";
  if (t == 1) type = "health";
  if (t == 2) type = "armor";
  var spot = Math.random()*700 + 150;
  var pos = {x: spot, y: 10};
  var u = new Upgrade(pos, type);
  upgrades.push(u);
}

//check to see if there are any upgrades close enough to the player to even warrant using the distance formula (expensive)
function checkForCloseUpgrade() {
  close = [];
  for (var i = 0; i < upgrades.length; i++) {
    if (upgrades[i].position.y + 50 > player.position.y || upgrades[i].position.y - 50 > player.position.y) {
      close.push(upgrades[i]);
    }
  }
}

//check to see if there are any upgrades close enough to the player to even warrant using the distance formula (expensive)
function checkForCloseEnemy() {
  closeE = [];
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].position.y + 50 > player.position.y || enemies[i].position.y - 50 > player.position.y) {
      close.push(enemies[i]);
    }
  }
}

//check to see if the player has touched an upgrade
function checkForUp() {
  close.forEach(function(u, i) {
    if (player.position.x < u.position.x + u.w &&
        player.position.x + 35 > u.position.x &&
        player.position.y < u.position.y + u.h &&
        35 + player.position.y > u.position.y) {
          upgrades.splice(i, 1);
          // weapon = blue, health = red, armor = yellow
          if (u.type == "armor") {
            explosion(player.center, "yellow", "small"); explosion(player.center, "Khaki", "small");
            player.armored = true; }
          if (u.type == "health") {
            explosion(player.center, "red", "small"); explosion(player.center, "LightCoral", "small");
            if (player.lives < 3) player.lives++; }
          if (u.type == "weapon") {
            explosion(player.center, "blue", "small"); explosion(player.center, "LightBlue", "small");
            player.state = "empowered";
            if (player.empoweredTimer > 0) { player.empoweredTimer = 0;}
          }
          player.score += 50;
        }
  });
}

//check to see if the player has hit an enemy
function checkForDead() {
  closeE.forEach(function(e, i) {
    if (player.position.x < e.position.x + e.w &&
        player.position.x + 35 > e.position.x &&
        player.position.y < e.position.y + e.h &&
        35 + player.position.y > e.position.y) {

        }
    });
}



// creates an explosion at a given position with a given color
// still referencing http://www.gameplaypassion.com/blog/explosion-effect-html5-canvas/ heavily
function explosion(position, color, size)
{
  if (size == "small")
  {
    var minSize = 5;
    var maxSize = 20;
    var count = 12;
    var minSpeed = 60;
    var maxSpeed = 200;
    var minScaleSpeed = 1;
    var maxScaleSpeed = 4;
  }
  if (size == "big")
  {
    var minSize = 15;
    var maxSize = 35;
    var count = 10;
    var minSpeed = 100;
    var maxSpeed = 300;
    var minScaleSpeed = 1;
    var maxScaleSpeed = 4;
  }

  var radius;

  for (var angle = 0; angle < 360; angle+=Math.round(360/count))
  {
    radius = minSize + Math.random()*(maxSize-minSize);
    var particle = new Particle(position, radius, color);
    particle.scaleSpeed = minScaleSpeed + Math.random()*(maxScaleSpeed-minScaleSpeed);
    var speed = minSpeed + Math.random()*(maxSpeed-minSpeed);
    particle.velocityX = speed * Math.cos(angle * Math.PI / 180);
    particle.velocityY = speed * Math.sin(angle * Math.PI / 180);
    particles.push(particle);
  }
}

},{"./bullet_pool":2,"./camera":3,"./enemy":4,"./game":5,"./missile":6,"./particle":7,"./player":8,"./upgrade":9,"./vector":10}],2:[function(require,module,exports){
"use strict";

/**
 * @module BulletPool
 * A class for managing bullets in-game
 * We use a Float32Array to hold our bullet info,
 * as this creates a single memory buffer we can
 * iterate over, minimizing cache misses.
 * Values stored are: positionX, positionY, velocityX,
 * velocityY in that order.
 */
module.exports = exports = BulletPool;

/**
 * @constructor BulletPool
 * Creates a BulletPool of the specified size
 * @param {uint} size the maximum number of bullets to exits concurrently
 */
function BulletPool(maxSize) {
  this.pool = new Float32Array(4 * maxSize);
  this.end = 0;
  this.max = maxSize;
}

/**
 * @function add
 * Adds a new bullet to the end of the BulletPool.
 * If there is no room left, no bullet is created.
 * @param {Vector} position where the bullet begins
 * @param {Vector} velocity the bullet's velocity
*/
BulletPool.prototype.add = function(position, velocity) {
  if(this.end < this.max) {
    this.pool[4*this.end] = position.x;
    this.pool[4*this.end+1] = position.y;
    this.pool[4*this.end+2] = velocity.x;
    this.pool[4*this.end+3] = velocity.y;
    this.end++;
  }
}

/**
 * @function update
 * Updates the bullet using its stored velocity, and
 * calls the callback function passing the transformed
 * bullet.  If the callback returns true, the bullet is
 * removed from the pool.
 * Removed bullets are replaced with the last bullet's values
 * and the size of the bullet array is reduced, keeping
 * all live bullets at the front of the array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {function} callback called with the bullet's position,
 * if the return value is true, the bullet is removed from the pool
 */
BulletPool.prototype.update = function(elapsedTime, callback) {
  for(var i = 0; i < this.end; i++){
    // Move the bullet
    this.pool[4*i] += this.pool[4*i+2];
    this.pool[4*i+1] += this.pool[4*i+3];
    // If a callback was supplied, call it
    if(callback && callback({
      x: this.pool[4*i],
      y: this.pool[4*i+1]
    })) {
      // Swap the current and last bullet if we
      // need to remove the current bullet
      this.pool[4*i] = this.pool[4*(this.end-1)];
      this.pool[4*i+1] = this.pool[4*(this.end-1)+1];
      this.pool[4*i+2] = this.pool[4*(this.end-1)+2];
      this.pool[4*i+3] = this.pool[4*(this.end-1)+3];
      // Reduce the total number of bullets by 1
      this.end--;
      // Reduce our iterator by 1 so that we update the
      // freshly swapped bullet.
      i--;
    }
  }
}

/**
 * @function render
 * Renders all bullets in our array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
BulletPool.prototype.render = function(elapsedTime, ctx) {
  // Render the bullets as a single path
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "red";
  for(var i = 0; i < this.end; i++) {
    ctx.moveTo(this.pool[4*i], this.pool[4*i+1]);
    ctx.arc(this.pool[4*i], this.pool[4*i+1], 3, 0, 2*Math.PI);
  }
  ctx.fill();
  ctx.restore();
}

},{}],3:[function(require,module,exports){
"use strict";

/* Classes and Libraries */
const Vector = require('./vector');

/**
 * @module Camera
 * A class representing a simple camera
 */
module.exports = exports = Camera;

/**
 * @constructor Camera
 * Creates a camera
 * @param {Rect} screen the bounds of the screen
 */
function Camera(screen) {
  this.x = 0;
  this.y = 0;
  this.width = screen.width;
  this.height = screen.height;
}

/**
 * @function update
 * Updates the camera based on the supplied target
 * @param {Vector} target what the camera is looking at
 */
Camera.prototype.update = function(target) {
  // TODO: Align camera with player
}

/**
 * @function onscreen
 * Determines if an object is within the camera's gaze
 * @param {Vector} target a point in the world
 * @return true if target is on-screen, false if not
 */
Camera.prototype.onScreen = function(target) {
  return (
     target.x > this.x &&
     target.x < this.x + this.width &&
     target.y > this.y &&
     target.y < this.y + this.height
   );
}

/**
 * @function toScreenCoordinates
 * Translates world coordinates into screen coordinates
 * @param {Vector} worldCoordinates
 * @return the tranformed coordinates
 */
Camera.prototype.toScreenCoordinates = function(worldCoordinates) {
  return Vector.subtract(worldCoordinates, this);
}

/**
 * @function toWorldCoordinates
 * Translates screen coordinates into world coordinates
 * @param {Vector} screenCoordinates
 * @return the tranformed coordinates
 */
Camera.prototype.toWorldCoordinates = function(screenCoordinates) {
  return Vector.add(screenCoordinates, this);
}

},{"./vector":10}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
"use strict";

/**
 * @module exports the Game class
 */
module.exports = exports = Game;

/**
 * @constructor Game
 * Creates a new game object
 * @param {canvasDOMElement} screen canvas object to draw into
 * @param {function} updateFunction function to update the game
 * @param {function} renderFunction function to render the game
 */
function Game(screen, updateFunction, renderFunction) {
  this.update = updateFunction;
  this.render = renderFunction;

  // Set up buffers
  this.frontBuffer = screen;
  this.frontCtx = screen.getContext('2d');
  this.backBuffer = document.createElement('canvas');
  this.backBuffer.width = screen.width;
  this.backBuffer.height = screen.height;
  this.backCtx = this.backBuffer.getContext('2d');

  // Start the game loop
  this.oldTime = performance.now();
  this.paused = false;
}

/**
 * @function pause
 * Pause or unpause the game
 * @param {bool} pause true to pause, false to start
 */
Game.prototype.pause = function(flag) {
  this.paused = (flag == true);
}

/**
 * @function loop
 * The main game loop.
 * @param{time} the current time as a DOMHighResTimeStamp
 */
Game.prototype.loop = function(newTime) {
  var game = this;
  var elapsedTime = newTime - this.oldTime;
  this.oldTime = newTime;

  if(!this.paused) this.update(elapsedTime);
  this.render(elapsedTime, this.frontCtx);

  // Flip the back buffer
  this.frontCtx.drawImage(this.backBuffer, 0, 0);
}

},{}],6:[function(require,module,exports){
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
  this.height = 40;
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
}

Missile.prototype.render = function(time, ctx)
{
  ctx.drawImage(this.img, 217, 29, 10, 14, this.position.x, this.position.y, 20, 40);
/*
  ctx.strokeStyle = "white";
  ctx.rect(this.position.x, this.position.y, this.width, this.height );
  ctx.stroke();
*/
}

},{}],7:[function(require,module,exports){
"use strict"

module.exports = exports = Particle;

// based heavily on code from a helpful site -- http://www.gameplaypassion.com/blog/explosion-effect-html5-canvas/
// but i modified it to fit my project
function Particle (p, r, c)
{
  this.scale = 1.0;
  this.position = {
    x: p.x,
    y: p.y
  };
  this.radius = r;
  this.color = c;
  this.velocityX = 0;
  this.velocityXY = 0;
  this.scaleSpeed = 0.5;
}

Particle.prototype.update = function(time)
{
  //shrink
  this.scale -= this.scaleSpeed * time / 1000;

  if (this.scale <= 0) { this.scale = 0; }

  //exploding
  this.position.x += this.velocityX * time/1000;
  this.position.y += this.velocityY * time/1000;
}

Particle.prototype.render = function(time, ctx)
{
  
  // translating ctx to the particle coords
  ctx.save();
  ctx.translate(this.position.x, this.position.y);
  ctx.scale(this.scale, this.scale);

  ctx.rect(this.position.x, this.position.y, 50, 50);
  //drawing circles
  ctx.beginPath();
  ctx.arc(0,0, this.radius, 0, Math.PI*2, true);
  ctx.closePath();

  ctx.fillStyle = this.color;
  ctx.fill();

  ctx.restore();
}

},{}],8:[function(require,module,exports){
"use strict";

/* Classes and Libraries */
const Vector = require('./vector');
const Missile = require('./missile');

/* Constants */
const PLAYER_SPEED = 5;
const BULLET_SPEED = 20;

/**
 * @module Player
 * A class representing a player's helicopter
 */
module.exports = exports = Player;

/**
 * @constructor Player
 * Creates a player
 * @param {BulletPool} bullets the bullet pool
 */
function Player(bullets, missiles) {
  this.missiles = missiles;
  this.missileCount = 4;
  this.bullets = bullets;
  this.angle = 0;
  this.position = {x: 200, y: 200};
  this.velocity = {x: 0, y: 0};
  this.img = new Image()
  this.img.src = 'assets/ships.png';

  this.fired = 0;
  this.hit = 0;

  this.lives = 3;
  this.armor = 0;

  this.bool = false;
  this.firing = false;
  this.bulletTimer = 0;

  this.state = "standard";
  this.armored = false;

  this.empoweredTimer = 0;

  this.center;
}



/**
 * @function update
 * Updates the player based on the supplied input
 * @param {DOMHighResTimeStamp} elapedTime
 * @param {Input} input object defining input, must have
 * boolean properties: up, left, right, down
 */
Player.prototype.update = function(elapsedTime, input) {
  this.bool = false;
  if (this.state == "empowered") {
    this.empoweredTimer += elapsedTime;
    if (this.empoweredTimer > 10000) { this.state = "standard"; }
   }
  this.bulletTimer += elapsedTime;
  // set the velocity
  this.velocity.x = 0;
  if(input.left) this.velocity.x -= PLAYER_SPEED;
  if(input.right) this.velocity.x += PLAYER_SPEED;
  this.velocity.y = 0;
  if(input.up) this.velocity.y -= PLAYER_SPEED / 2;
  if(input.down) this.velocity.y += PLAYER_SPEED / 2;

  // determine player angle
  this.angle = 0;
  if(this.velocity.x < 0) this.angle = -1;
  if(this.velocity.x > 0) this.angle = 1;

  // move the player
  this.position.x += this.velocity.x;
  this.position.y += this.velocity.y;

  // don't let the player move off-screen
  if(this.position.x < 0) this.position.x = 0;
  if(this.position.x > 1001) this.position.x = 1001;
  if(this.position.y > 759) this.position.y = 759;
  if(this.position.y < 0) this.position.y = 0;

  var temp = this.velocity.y;
  if (temp > 1) temp = temp * -1;

  if (this.firing && this.bulletTimer > 10) this.fireBullet({x: 0, y: temp}); this.bulletTimer = 0;

  this.center = {
    x: this.position.x + 23,
    y: this.position.y + 5
  };
}

/**
 * @function render
 * Renders the player helicopter in world coordinates
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
Player.prototype.render = function(elapasedTime, ctx) {
  var offset = this.angle * 23;
  ctx.save();
  ctx.translate(this.position.x, this.position.y);
  ctx.drawImage(this.img, 48+offset, 57, 23, 27, 0, 0, 46, 54);
// -12.5, -12,
  ctx.restore();

  if (this.armored == true)
  {
    ctx.beginPath();
    ctx.strokeStyle = "yellow";
    ctx.arc(this.position.x+23, this.position.y+27, 30, 0, Math.PI*2);
    ctx.closePath();
    ctx.stroke();
  }
}

/**
 * @function fireBullet
 * Fires a bullet
 * @param {Vector} direction
 */
Player.prototype.fireBullet = function(direction) {
  var position = Vector.add(this.position, {x:23, y:30});
  var velocity = Vector.scale(Vector.normalize(direction), BULLET_SPEED);
  this.bullets.add(position, velocity);
}

/**
 * @function fireMissile
 * Fires a missile, if the player still has missiles
 * to fire.
 */
Player.prototype.fireMissile = function() {
  if(this.missileCount > 0){
    console.log(this.missiles.length);
    var missile = new Missile(this.position, this.angle );
    this.missiles.push(missile);
    this.missileCount--;
    if (this.missileCount == 3) this.bool = true;
  }
}

},{"./missile":6,"./vector":10}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
"use strict";

/**
 * @module Vector
 * A library of vector functions.
 */
module.exports = exports = {
  add: add,
  subtract: subtract,
  scale: scale,
  rotate: rotate,
  dotProduct: dotProduct,
  magnitude: magnitude,
  normalize: normalize
}


/**
 * @function rotate
 * Scales a vector
 * @param {Vector} a - the vector to scale
 * @param {float} scale - the scalar to multiply the vector by
 * @returns a new vector representing the scaled original
 */
function scale(a, scale) {
 return {x: a.x * scale, y: a.y * scale};
}

/**
 * @function add
 * Computes the sum of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed sum
*/
function add(a, b) {
 return {x: a.x + b.x, y: a.y + b.y};
}

/**
 * @function subtract
 * Computes the difference of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed difference
 */
function subtract(a, b) {
  return {x: a.x - b.x, y: a.y - b.y};
}

/**
 * @function rotate
 * Rotates a vector about the Z-axis
 * @param {Vector} a - the vector to rotate
 * @param {float} angle - the angle to roatate by (in radians)
 * @returns a new vector representing the rotated original
 */
function rotate(a, angle) {
  return {
    x: a.x * Math.cos(angle) - a.y * Math.sin(angle),
    y: a.x * Math.sin(angle) + a.y * Math.cos(angle)
  }
}

/**
 * @function dotProduct
 * Computes the dot product of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed dot product
 */
function dotProduct(a, b) {
  return a.x * b.x + a.y * b.y
}

/**
 * @function magnitude
 * Computes the magnitude of a vector
 * @param {Vector} a the vector
 * @returns the calculated magnitude
 */
function magnitude(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y);
}

/**
 * @function normalize
 * Normalizes the vector
 * @param {Vector} a the vector to normalize
 * @returns a new vector that is the normalized original
 */
function normalize(a) {
  var mag = magnitude(a);
  return {x: a.x / mag, y: a.y / mag};
}

},{}]},{},[1]);
