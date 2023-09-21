let anaglyph;
let fontValorax;

const BOX_WIDTH = 700;
const BOX_HEIGHT = 400;
const BOX_DEPTH = 600;
const BALL_RADIUS = 25;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 70;
const PADDLE_DEPTH = 16; 

let position;
let acceleration;

let gameOn = false;
let gameOver = false;
let score = 0; 

function preload() {
  fontValorax = loadFont('fonts/Valorax.otf');
}

function setup() {
  const r = createCanvas(windowWidth, windowHeight, WEBGL);
  const gl = r.canvas.getContext('webgl2');
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); 
  
  position = createVector(0, 0, 0);
  acceleration = createVector(5, 5, 12); 

  anaglyph = createAnaglyph(this); 
}

function draw() {
  anaglyph.draw(scene);
}

function hfov_from_vfov(vfov, aspectRatio) {
  return 2 * atan(aspectRatio * tan(vfov * 0.5));
}

function scene(pg) {
  pg.background(0);

  // Draw the box
  pg.push(); 
  pg.stroke(255);
  pg.noFill();
  pg.translate(0, 0, 0);
  pg.box(BOX_WIDTH, BOX_HEIGHT, BOX_DEPTH);
  pg.pop();

  // Draw the paddle
  pg.push();

  const paddleZ = BOX_DEPTH/2 + PADDLE_DEPTH/2;
  let paddleX = 0;
  let paddleY = 0;

  // If in-game, have paddle follow the mouse
  if(gameOn) {
    // -- Get the mouse X and Y coords in 3D system
    let paddleMouseX = mouseX - windowWidth/2;
    let paddleMouseY = mouseY - windowHeight/2;

    // -- Get some constants about the world and camera
    const vfov = PI/3;
    const hfov = hfov_from_vfov(vfov, windowWidth/windowHeight);
    const eyeZ = (windowHeight/2) / (tan(PI/6));
    const worldWidth = tan(hfov/2) * (9/10) * eyeZ * 2; 
    const worldHeight = tan(vfov/2) * (9/10) * eyeZ * 2;

    // -- Normalize the mouse X and Y to the world size
    paddleMouseX = map(paddleMouseX, -windowWidth/2, windowWidth/2, -worldWidth/2, worldWidth/2);
    paddleMouseY = map(paddleMouseY, -windowHeight/2, windowHeight/2, -worldHeight/2, worldHeight/2); 

    // -- Project mouse X and Y to the paddle's Z plane to get paddle X and Y
    const thetaX = atan(paddleMouseX / (9 * eyeZ / 10));
    paddleX = tan(thetaX) * (eyeZ - paddleZ);
    
    const thetaY = atan(paddleMouseY / (9 * eyeZ / 10));
    paddleY = tan(thetaY) * (eyeZ - paddleZ);

    // -- Make sure paddle's X and Y are within bounds of the box
    if(paddleX - PADDLE_WIDTH/2 < -BOX_WIDTH/2) {
      paddleX = -BOX_WIDTH/2 + PADDLE_WIDTH/2; 
    }
    if(paddleX + PADDLE_WIDTH/2 > BOX_WIDTH/2) {
      paddleX = BOX_WIDTH/2 - PADDLE_WIDTH/2; 
    }
    if(paddleY - PADDLE_HEIGHT/2 < -BOX_HEIGHT/2) {
      paddleY = -BOX_HEIGHT/2 + PADDLE_HEIGHT/2; 
    }
    if(paddleY + PADDLE_HEIGHT/2 > BOX_HEIGHT/2) {
      paddleY = BOX_HEIGHT/2 - PADDLE_HEIGHT/2; 
    }
  }
  
  // -- Render the paddle
  pg.translate(paddleX, paddleY, paddleZ);
  pg.stroke(255);
  pg.strokeWeight(10); 
  pg.noFill();
  pg.box(PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_DEPTH); 
  pg.pop(); 
  
  // Draw the ball
  pg.push();
  pg.fill(255);

  // -- Move the ball as long as we're not on the Game Over screen
  if(!gameOver) {
    position = position.add(acceleration);
    if(position.x - BALL_RADIUS < -(BOX_WIDTH/2) || position.x + BALL_RADIUS > BOX_WIDTH/2) {
      acceleration.x *= -1; 
    }
    if(position.y - BALL_RADIUS < -(BOX_HEIGHT/2) || position.y + BALL_RADIUS > BOX_HEIGHT/2) {
      acceleration.y *= -1; 
    }
    if(position.z - BALL_RADIUS < -(BOX_DEPTH/2)) {
      acceleration.z *= -1; 
    } else if(position.z + BALL_RADIUS > BOX_DEPTH/2) {
      // If currently in a game, check if ball hit the paddle
      if(gameOn) {
        // Check if the ball hit the paddle
        if(position.x > paddleX - PADDLE_WIDTH/2
           && position.x < paddleX + PADDLE_WIDTH/2
           && position.y > paddleY - PADDLE_HEIGHT/2
           && position.y < paddleY + PADDLE_HEIGHT/2) {
          // Ball hit the paddle; bounce it and increase score
          score++; 
          acceleration.z *= -1; 
        } else {
          // Ball missed the paddle; game over
          setTimeout(() => {
            gameOn = false;
            gameOver = true; 
          }, 250);
        }
      } else {
        // If on the main menu, just keep bouncing
        acceleration.z *= -1; 
      }
    }
  }

  pg.translate(position.x, position.y, position.z);
  
  pg.sphere(BALL_RADIUS);
  pg.pop();

  // Render text and buttons (main menu, game over screen, or score if game is in progress)
  // gameOn = game is in progress
  // gameOver = game just ended (show game over screen)
  // neither is true = show main menu

  /*
     When starting a game, toggle gameOn = true, gameOver = false, and add "in-game" class to <main>
     When game is over, toggle gameOn = false, gameOver = true, and remove "in-game" class from <main>
     When returning to main menu, toggle gameOn = false, gameOver = false
   */

  if(gameOn) {
    // Render score
    pg.push();
    pg.fill(255);
    pg.textFont(fontValorax, 30);
    pg.text(`Score: ${score}`, -BOX_WIDTH/2, -BOX_HEIGHT/2, BOX_WIDTH, 200);
    pg.pop(); 
  } else if(gameOver) {
    // Render Game Over screen
    pg.push();
    pg.fill(255);
    pg.textFont(fontValorax, 60);
    pg.textAlign(CENTER); 
    pg.text("Game Over", -BOX_WIDTH/2, -BOX_HEIGHT/2, BOX_WIDTH, 300);
    pg.text(`Final Score: ${score}`, -BOX_WIDTH/2, -BOX_HEIGHT/2 + 100, BOX_WIDTH, 300);
    
    const nMouseX = mouseX - windowWidth / 2;
    const nMouseY = mouseY - windowHeight / 2;

    if(nMouseX > -160 && nMouseX < 160
       && nMouseY > 80 && nMouseY < 240) {
      pg.fill(166); 
    }
    pg.textFont(fontValorax, 50); 
    pg.text(">>Restart<<", -80, 200, 160, 160);
    
    pg.pop(); 
  } else {
    // Render Main Menu
    pg.push();
    pg.fill(255); 
    pg.textFont(fontValorax, 75);
    pg.textAlign(CENTER);
    
    // -- Render game title
    pg.text("Curveball 3D", -BOX_WIDTH/2, -BOX_HEIGHT/2, BOX_WIDTH, BOX_HEIGHT); 
    
    // -- Render button to start game
    const nMouseX = mouseX - windowWidth / 2;
    const nMouseY = mouseY - windowHeight / 2;
    
    // I don't even understand these numbers
    if(nMouseX > -160 && nMouseX < 160
       && nMouseY > 80 && nMouseY < 240) {
      pg.fill(166); 
    }
    pg.textFont(fontValorax, 50); 
    pg.text(">>Play<<", -80, 200, 160, 160);
    
    pg.pop(); 
  }
}

function mouseClicked() {
  const nMouseX = mouseX - windowWidth / 2;
  const nMouseY = mouseY - windowHeight / 2;

  if(nMouseX > -160 && nMouseX < 160
     && nMouseY > 80 && nMouseY < 240) {
    if(gameOver || (!gameOver && !gameOn)) {
      gameOn = true;
      gameOver = false;
      score = 0;
      position = createVector(0, 0, 0);
      acceleration = createVector(5, 5, 12); 
    }
  }      
}
