"use strict";
const app = new PIXI.Application();

let sceneWidth, sceneHeight;

let stage;
let assets;

let startScene;
let gameScene, ship, scoreLabel, lifeLabel, shootSound, hitSound, fireballSound;
let gameOverScene;

let circles = [];
let bullets = [];
let aliens = [];
let explosions = [];
let explosionTextures;
let score = 0;
let life = 100;
let levelNum = 1;
let paused = true;
loadImages();

async function loadImages() {
  PIXI.Assets.addBundle("sprites", {
    spaceship: "images/spaceship.png",
    explosions: "images/explosions.png",
    move: "images/move.png",
  });


  assets = await PIXI.Assets.loadBundle("sprites", (progress) => {
    console.log(`progress=${(progress * 100).toFixed(2)}%`);
  });

  setup();
}

async function setup() {
  await app.init({ width: 600, height: 600 });

  document.body.appendChild(app.canvas);

  stage = app.stage;
  sceneWidth = app.renderer.width;
  sceneHeight = app.renderer.height;


  startScene = new PIXI.Container();
  stage.addChild(startScene);


  gameScene = new PIXI.Container();
  gameScene.visible = false; 
  stage.addChild(gameScene);


  gameOverScene = new PIXI.Container();
  gameOverScene.visible = false; 
  stage.addChild(gameOverScene);

  createLabelsAndButtons();
  ship = new Ship(assets.spaceship);
  gameScene.addChild(ship);

  shootSound = new Howl({
      src: ["sounds/shoot.wav"]
  });

  hitSound = new Howl({
      src: ["sounds/hit.mp3"]
  });

  fireballSound = new Howl({
      src: ["sounds/fireball.mp3"]
  });

  explosionTextures = loadSpriteSheet();
  
  app.ticker.add(gameLoop);
}

function createLabelsAndButtons() {
    let buttonStyle = {
        fill: 0xff0000,
        fontSize: 48,
        fontFamily: "Futura",
    };


    let startLabel1 = new PIXI.Text({
        text: "Circle Blast!",
        style: {
            fill: 0xffffff,
            fontSize: 96,
            fontFamily: "Futura",
            stroke: { color: 0xff0000, width: 6 },
        },
    });
    startLabel1.x = 50;
    startLabel1.y = 120;
    startScene.addChild(startLabel1);


    let startLabel2 = new PIXI.Text({
        text: "R U worthy..?",
        style: {
            fill: 0xffffff,
            fontSize: 32,
            fontFamily: "Futura",
            fontStyle: "italic",
            stroke: { color: 0xff0000, width: 6 },
        },
    });
    startLabel2.x = 185;
    startLabel2.y = 300;
    startScene.addChild(startLabel2);


    let startButton = new PIXI.Text({ text: "Enter, ... if you dare!", style: buttonStyle });
    startButton.x = sceneWidth / 2 - startButton.width / 2;
    startButton.y = sceneHeight - 100;
    
    startButton.eventMode = "static";
    startButton.cursor = "pointer";
    startButton.on("pointerup", startGame);
    startButton.on("pointerover", (e) => (e.target.alpha = 0.7));
    startButton.on("pointerout", (e) => (e.currentTarget.alpha = 1.0));
    startScene.addChild(startButton);


    let textStyle = {
        fill: 0xffffff,
        fontSize: 18,
        fontFamily: "Futura",
        stroke: { color: 0xff0000, width: 4 },
    };


    scoreLabel = new PIXI.Text({ text: "", style: textStyle });
    scoreLabel.x = 5;
    scoreLabel.y = 5;
    gameScene.addChild(scoreLabel);
    increaseScoreBy(0);

    // 2B make life label
    lifeLabel = new PIXI.Text({ text: "", style: textStyle });
    lifeLabel.x = 5;
    lifeLabel.y = 26;
    gameScene.addChild(lifeLabel);
    decreaseLifeBy(0);


    let gameOverText = new PIXI.Text({
        text: "Game Over!\n        :-O",
        style: {
            fill: 0xffffff,
            fontSize: 64,
            fontFamily: "Futura",
            stroke: { color: 0xff0000, width: 6 },
        },
    });
    gameOverText.x = sceneWidth / 2 - gameOverText.width / 2;
    gameOverText.y = sceneHeight / 2 - 160;
    gameOverScene.addChild(gameOverText);


    let playAgainButton = new PIXI.Text({ text: "Play Again?", style: buttonStyle });
    playAgainButton.x = sceneWidth / 2 - playAgainButton.width / 2;
    playAgainButton.y = sceneHeight - 100;
    playAgainButton.eventMode = "static";
    playAgainButton.cursor = "pointer";
    playAgainButton.on("pointerup", startGame); 
    playAgainButton.on("pointerover", (e) => (e.target.alpha = 0.7)); 
    playAgainButton.on("pointerout", (e) => (e.currentTarget.alpha = 1.0)); 
    gameOverScene.addChild(playAgainButton);
}


function startGame() {
    console.log("startGame called");
    startScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = true;
    app.canvas.onclick = fireBullet;
    
    levelNum = 1;
    score = 0;
    life = 100;
    increaseScoreBy(0);
    decreaseLifeBy(0);
    ship.x = 300;
    ship.y = 550;
    loadLevel();

    setTimeout(() => {
        paused = false;
    }, 50);
}

function increaseScoreBy(value) {
    score += value;
    scoreLabel.text = `Score: ${score}`;
}

function decreaseLifeBy(value) {
    life -= value;
    life = parseInt(life); 
    lifeLabel.text = `Life: ${life}`;
}

function gameLoop() {
    if (paused) return; 

    let dt = 1 / app.ticker.FPS;
    if (dt > 1 / 12) dt = 1 / 12;


    let mousePosition = app.renderer.events.pointer.global;
    let amt = 6 * dt; 
    let newX = lerp(ship.x, mousePosition.x, amt);
    let newY = lerp(ship.y, mousePosition.y, amt);
    let w2 = ship.width / 2;
    let h2 = ship.height / 2;
    ship.x = clamp(newX, 0 + w2, sceneWidth - w2);
    ship.y = clamp(newY, 0 + h2, sceneHeight - h2);

    for (let c of circles) {
        c.move(dt);
        if (c.x <= c.radius || c.x >= sceneWidth - c.radius) {
            c.reflectX();
            c.move(dt);
        }
        if (c.y <= c.radius || c.y >= sceneHeight - c.radius) {
            c.reflectY();
            c.move(dt);
        }
    }

    for (let b of bullets) {
        b.move(dt);
        if (b.y < 0) b.isAlive = false; 
    }

    for (let c of circles) {
        for (let b of bullets) {
            if (rectsIntersect(c, b)) {
                fireballSound.play();
                createExplosion(c.x, c.y, 64, 64);
                gameScene.removeChild(c);
                c.isAlive = false;
                gameScene.removeChild(b);
                b.isAlive = false;
                increaseScoreBy(1);
                break;
            }
        }


        if (c.isAlive && rectsIntersect(c, ship)) {
            hitSound.play();
            gameScene.removeChild(c);
            c.isAlive = false;
            decreaseLifeBy(20);
        }
    }

    bullets = bullets.filter((b) => b.isAlive);


    circles = circles.filter((c) => c.isAlive);


    explosions = explosions.filter((e) => e.playing);


    if (life <= 0) {
        end();
        return; 
    }

    if (circles.length == 0) {
        levelNum++;
        loadLevel();
    }
}

function createCircles(numCircles = 10) {
    for (let i = 0; i < numCircles; i++) {
        let c = new Circle(10, 0xFFFF00);
        c.x = Math.random() * (sceneWidth - 50) + 25;
        c.y = Math.random() * (sceneHeight - 400) + 25;
        circles.push(c);
        gameScene.addChild(c);
    }
}

function loadLevel(){
    createCircles(levelNum * 5);
}



function end() {
    paused = true;

    circles.forEach((c) => gameScene.removeChild(c));
    circles = [];

    bullets.forEach((b) => gameScene.removeChild(b));
    bullets = [];

    explosions.forEach((e) => gameScene.removeChild(e));
    explosions = [];

    app.canvas.onclick = null; 

    gameOverScene.visible = true;
    gameScene.visible = false;
}

function loadSpriteSheet() {
    let spriteSheet = assets.explosions;
    let width = 64;
    let height = 64;
    let numFrames = 16;
    let textures = [];
    for (let i = 0; i < numFrames; i++) {
        let frame = new PIXI.Texture({
            source: spriteSheet.source,
            frame: new PIXI.Rectangle(i * width, 64, width, height),
        });
        textures.push(frame);
    }
    return textures;
}

function createExplosion(x, y, frameWidth, frameHeight) {
    let w2 = frameWidth / 2;
    let h2 = frameHeight / 2;
    let expl = new PIXI.AnimatedSprite(explosionTextures);
    expl.x = x - w2;
    expl.y = y - h2;
    expl.animationSpeed = 1 / 7;
    expl.loop = false;
    expl.onComplete = () => gameScene.removeChild(expl);
    explosions.push(expl);
    gameScene.addChild(expl);
    expl.play();
}

function fireBullet() {
    if (paused) return;
    if (score >= 5) {
        let b1 = new Bullet(0xFFFFFF, ship.x, ship.y);
        let b2 = new Bullet(0xFFFFFF, ship.x - 15, ship.y);
        let b3 = new Bullet(0xFFFFFF, ship.x + 15, ship.y);
        bullets.push(b1, b2, b3);
        gameScene.addChild(b1, b2, b3);
    } else {
        let b = new Bullet(0xFFFFFF, ship.x, ship.y);
        bullets.push(b);
        gameScene.addChild(b);
    }
    
    shootSound.play();
}