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
const Laser = require('./laser');


/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);
var input = {
  up: false,
  down: false,
  left: false,
  right: false
}

// stars1 and stars2 keep track of the top and bot coords of the 2 images that maintain the constant scrolling background --
// if you go to the top half of stars1 then stars2 coords are set to be above stars1 so that you seamlessly transition to stars2
// but if you go to the bot half of stars1 then stars2 coords are set to be below stars1 so that you seamlessly transition to stars2 still
// likewise for moving from stars2 -> stars1
var stars1 = {
  top: -512,
  bot: 512
}
var stars2 = {
  top: -1536,
  bot: -512
}


var time = 0;
var levelTime = [60000, 75000, 90000];
var camera = new Camera(canvas);
var bullets = new BulletPool(10);
var missiles = [];
var upgrades = [];
var enemies = [];
var player = new Player(bullets, missiles);

var E = new Enemy(1, {x: 400, y: -200});
enemies.push(E);

var missileTimer = 0;
var upgradeTimer = 0;
var level = 1;
var score = 0;

var rand = (Math.random()*5000 + 5000);
var close = [];
var closeE = [];
var removeUps = [];
var markedForRemoval = [];
var removeLas = [];
var removeE = [];

var particles = [];
var removePart = [];

var stars = new Image();
var moons = new Image();


stars.src = "assets/layer-1.png";
moons.src = "assets/layer-2.png";

var background = new Audio("assets/bground.mp3");
background.loop = true;
background.volume = 0.05;
background.play();

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
      case "default":
        player.fireMissile();
        if (player.bool == true) missileTimer = 0;
        break;
      case "empowered":
        player.fireLaser();
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
  time += elapsedTime;
  checkHitEnemy();

  //reload missile after 5 seconds if the player has less than 4 missiles
  if (player.missileCount < 4) missileTimer += elapsedTime;
  if (missileTimer > 5000 && player.missileCount < 4) {
    player.missileCount++;
    missileTimer = 0;
  }
  manageBackgrounds();


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
    if(m.position.y < camera.y)
      markedForRemoval.unshift(i);
  });
  markedForRemoval.forEach(function(index){
    player.missiles.splice(index, 1);
  });

  //update lasers
  removeLas = [];
  player.lasers.forEach(function(l, i){
    l.update(elapsedTime);
    if (l.position.y < camera.y)
      removeLas.unshift(i);
  });
  removeLas.forEach(function(index){
    player.lasers.splice(index, 1);
  })

  //update upgrades
  removeUps = [];
  upgrades.forEach(function(u, i){
    u.update(elapsedTime);
    if (u.position.y > camera.y + 775)
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

  //update enemies
  enemies.forEach(function(e, i){
    e.update(elapsedTime, camera, player);
  })


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

    //render the enemies
    enemies.forEach(function(e){
      e.render(elapsedTime, ctx);
    })

    // Render the player
    player.render(elapsedTime, ctx);
    player.lasers.forEach(function(l){
      l.render(elapsedTime, ctx);
    });


}

function renderBackgrounds(elapsedTime, ctx) {

  ctx.save();
  ctx.translate(0, -camera.y);
  ctx.drawImage(stars, 0, stars1.top, canvas.width/2, 1024);
  ctx.drawImage(stars, 512, stars1.top, canvas.width/2, 1024);
  ctx.drawImage(stars, 0, stars2.top, canvas.width/2, 1024);
  ctx.drawImage(stars, 512, stars2.top, canvas.width/2, 1024);
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
  ctx.fillText("Health -- " + player.lives, 5,20);
  ctx.fillText("Armor -- " + player.armor, 5,40);

  ctx.fillText("Missiles -- " + player.missileCount, 5,80);
  ctx.fillText("Reload Time -- " + Math.ceil(5 -missileTimer/1000), 5,100);

  ctx.fillText("Time To Next Level -- " + Math.floor(levelTime[level-1] - time)/1000, 5, 730);
  ctx.fillText("Level -- " + level, 5,750);
  ctx.fillText("Score -- " + score, 5,770);

  if (player.state == "empowered") {
    ctx.font = "20px Impact";
    ctx.fillStyle = "LightBlue";
    ctx.fillText("Empowered Weapons for " + Math.floor((10 - (player.empoweredTimer/1000))), 400, 140);
  }
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
  var pos = {x: spot, y: camera.y + 10};
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

function manageBackgrounds() {
  if (player.stars == 1) {
    if (player.position.y < stars2.bot && player.position.y > stars2.top) player.stars = 2;
    if (player.position.y > stars2.top && player.position.y < stars2.bot) player.stars = 2;
    if (player.position.y < stars1.top + 512) { stars2.bot = stars1.top; stars2.top = stars2.bot - 1024;}
    if (player.position.y > stars1.top + 512) { stars2.top = stars1.bot; stars2.bot = stars2.top + 1024;}
  }

  if (player.stars == 2) {
    if (player.position.y < stars1.bot && player.position.y > stars1.top) player.stars = 1;
    if (player.position.y > stars1.top && player.position.y < stars1.bot) player.stars = 1;
    if (player.position.y < stars2.top + 512) { stars1.bot = stars2.top; stars1.top = stars1.bot - 1024;}
    if (player.position.y > stars2.top + 512) { stars1.top = stars2.bot; stars1.bot = stars1.top + 1024;}

  }
}

function checkHitEnemy() {
  player.missiles.forEach(function(m, i) {
    enemies.forEach(function(e, index){
      if (m.position.x > e.position.x && m.position.x < e.position.x + e.w && m.position.y < e.position.y + e.h && m.position.y > e.position.y)
      {
        score += 50;
        e.hp -= 5;
        if (e.hp > 0) { explosion(m.position, "red", "small"); explosion(m.position, "grey", "small"); }
        if (e.hp <= 0) { explosion(m.position, "red", "big"); explosion(m.position, "grey", "big"); enemies.splice(index, 1); score += 100;}
        player.missiles.splice(i, 1);
      }
    })
  });
  player.lasers.forEach(function(l, i) {
    enemies.forEach(function(e, index){
      if (l.position.x > e.position.x && l.position.x < e.position.x + e.w && l.position.y < e.position.y + e.h && l.position.y > e.position.y) {
        score += 200;
        e.hp -= 30;
        if (e.hp > 0) { explosion(l.position, "red", "small"); explosion(l.position, "LightCoral", "small"); }
        if (e.hp <= 0) { explosion(l.position, "blue", "big"); explosion(l.position, "white", "big"); enemies.splice(index, 1); score += 100;}
        player.lasers.splice(i, 1)
      }
    })
  });
  enemies.forEach(function(e, i){
    var index = 0;
    while (index <= bullets.end-3)
    {
      var bx = bullets.pool[index];
      var by = bullets.pool[index+1];
      if (bx > e.position.x && bx < e.position.x + e.w && by < e.position.y + e.h && by > e.position.y) {
        e.hp -= .5;
        bullets.pool[index] = 0;
        bullets.pool[index+1] = 0;
        var pos = {x: bx, y: by};
        if (e.hp > 0) { explosion(pos, "blue", "small"); explosion(pos, "LightBlue", "small"); }
        if (e.hp <= 0) { explosion(pos, "blue", "big"); explosion(pos, "white", "big"); enemies.splice(index, 1); score += 100;}
      }
      index += 4;
    }

  })
}
