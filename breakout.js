const canvas = document.getElementById('breakout');
const context = canvas.getContext('2d');
let paused = true;
let score = null;
let lives = null;
let bat, ball, bricks = null;

//get DPI
let dpi = window.devicePixelRatio;

let style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);//get CSS width
let style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);//scale the canvas
canvas.setAttribute('height', style_height * dpi);
canvas.setAttribute('width', style_width * dpi);

class Bat {
  constructor (canvas, context) {
    this.context = context;
    this.canvas = canvas;
    this.move = 0;
    this.pos_x = null;
    this.pos_y = null;
    this.width = this.canvas.width / 15;
    this.height = this.width / 5;
  }

  moveLeft () {
    this.move = -(canvas.width / 150);
  }

  moveRight () {
    this.move = (canvas.width / 150);
  }

  stop () {
    this.move = 0;
  }

  render () {
    if (!this.pos_x && !this.pos_y) {
      this.pos_x = (this.canvas.width / 2) - (this.width / 2);
      this.pos_y = this.canvas.height - (this.height + (this.canvas.width / 40) + 40);
    } else {
      if ((this.move < 0 && this.pos_x > 0) || (this.move > 0 && this.pos_x < (this.canvas.width - this.width))) {
        this.pos_x = this.pos_x + this.move;
      }
    }

    this.context.fillStyle = 'white';
    this.context.fillRect(this.pos_x, this.pos_y, this.width, this.height);
  }
}

class Brick {
  constructor (canvas, context, pos_x, pos_y) {
    this.canvas = canvas;
    this.context = context;
    this.pos_x = pos_x;
    this.pos_y = pos_y;

    let colours = ['cyan', 'magenta', 'yellow'];
    this.colour = colours[Math.floor(Math.random() *3)];
  }

  render () {
    this.context.fillStyle = this.colour;
    this.context.fillRect(this.pos_x, this.pos_y, this.canvas.width / 40, this.canvas.width / 100);
  }
}

class Ball {
  constructor (canvas, context, bat, bricks) {
    this.canvas = canvas;
    this.context = context;
    this.bat = bat;
    this.pos_x = (this.canvas.width / 2) + (this.canvas.width / 120);
    this.pos_y = (this.canvas.height / 2) + (this.canvas.width / 120);
    this.move_x = 0;
    this.move_y = 0;
    this.bricks = bricks;
  }

  startMoving () {
    this.move_y = (this.canvas.width / 150);
    this.move_x = (Math.random() * 2 - 1) * (this.canvas.width / 150);
  }

  render () {
    if ((this.pos_x - (this.canvas.width / 120)) <= 0 || (this.pos_x + (this.canvas.width / 120)) >= this.canvas.width) {
      this.move_x = -this.move_x;
    } else if ((this.pos_y - (this.canvas.width / 120)) <= 0) {
      this.move_y = -this.move_y;
    } else if ((this.pos_y + (this.canvas.width / 120)) >= this.canvas.height) {
      lives--;
      this.pos_x = (this.canvas.width / 2) + (this.canvas.width / 120);
      this.pos_y = (this.canvas.height / 2) + (this.canvas.width / 120);
      paused = true;
    }

    let centre_bat_x = this.bat.pos_x + (this.bat.width / 2);
    let centre_bat_y = this.bat.pos_y + (this.bat.height / 2);

    if (Math.abs(this.pos_x - centre_bat_x) <= ((this.canvas.width / 120) + (centre_bat_x - this.bat.pos_x)) && Math.abs(this.pos_y - centre_bat_y) <= ((this.canvas.width / 120) + (centre_bat_y - this.bat.pos_y))) {
      if (this.pos_x <= (this.bat.pos_x + (this.bat.width / 4))) {
        if (this.move_x > 0) {
          this.move_x = -this.move_x;
        }
      } else if (this.pos_x >= (this.bat.pos_x + (this.bat.width / 4 * 3))) {
        if (this.move_x < 0) {
          this.move_x = -this.move_x;
        }
      }

      this.move_y = -this.move_y;
    }

    for (let r = 0; r < this.bricks.length; r++) {
      let centre_brick_x = this.bricks[r].pos_x + (this.canvas.width / 80);
      let centre_brick_y = this.bricks[r].pos_y + (this.canvas.width / 200);

      if (Math.abs(this.pos_x - centre_brick_x) <= ((this.canvas.width / 120) + (centre_brick_x - this.bricks[r].pos_x)) && Math.abs(this.pos_y - centre_brick_y) <= ((this.canvas.width / 120) + (centre_brick_y - this.bricks[r].pos_y))) {
        // Remove Brick from Bricks Array
        this.bricks.splice(r, 1);
        score++;

        if ((this.pos_x + (this.canvas.width / 120)) <= this.bricks[r].pos_x || (this.pos_x - (this.canvas.width / 120)) >= (this.bricks[r].pos_x + (this.canvas.width / 40))) {
          if (this.pos_y >= this.bricks[r].pos_y && this.pos_y <= (this.bricks[r].pos_y + (this.canvas.width / 100))) {
            this.move_x = -this.move_x;
          } else {
            this.move_y = -this.move_y;
          }
        } else {
          this.move_y = -this.move_y;
        }

        // Don't want to interact with more than one brick in the same render as this resulted in strange bounce behaviour
        break;
      }
    }

    this.pos_x = this.pos_x + this.move_x;
    this.pos_y = this.pos_y + this.move_y;

    this.context.fillStyle = 'white';
    this.context.beginPath();
    this.context.arc(this.pos_x, this.pos_y, this.canvas.width / 120, 0, 2 * Math.PI);
    this.context.fill();
  }
}

const setup_game = () => {
  bat = new Bat(canvas, context);
  bricks = [];
  score = 0;
  lives = 3;

  let column = 1;

  for (let i = 1; i <= 300; i++) {
    if (column == 31) {
      column = 1;
    }

    let row = Math.ceil(i / 30);
    brick_x_pos = column * (canvas.width / 40) + ((column - 1) * (canvas.width / 4) / 29);
    brick_y_pos = row * (canvas.width / 100) + (row - 1) * (canvas.width / 200);
    bricks.push(new Brick(canvas, context, brick_x_pos, brick_y_pos));

    column++;
  }

  ball = new Ball(canvas, context, bat, bricks);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'black';
  context.fillRect(0, 0, canvas.width, canvas.height);
  bat.render();
  ball.render();
}

/* let bat = new Bat(canvas, context);
let bricks = [];
let column = 1;

for (let i = 1; i <= 300; i++) {
  if (column == 31) {
    column = 1;
  }

  let row = Math.ceil(i / 30);
  brick_x_pos = column * (canvas.width / 40) + ((column - 1) * (canvas.width / 4) / 29);
  brick_y_pos = row * (canvas.width / 100) + (row - 1) * (canvas.width / 200);
  bricks.push(new Brick(canvas, context, brick_x_pos, brick_y_pos));

  column++;
}

let ball = new Ball(canvas, context, bat, bricks);

context.clearRect(0, 0, canvas.width, canvas.height);
context.fillStyle = 'black';
context.fillRect(0, 0, canvas.width, canvas.height);
bat.render();
ball.render(); */
setup_game();

window.addEventListener('keydown', (e) => {
  if (e.key == "ArrowRight") {
    bat.moveRight();
  } else if (e.key == "ArrowLeft") {
    bat.moveLeft();
  } else if (e.key == " ") {
    if (lives > 0) {
      paused = !paused;
      ball.startMoving();
    } else {
      setup_game();
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key == "ArrowLeft" || e.key == "ArrowRight") {
    bat.stop();
  }
});

function clearScreen() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'black';
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop () {
  if (!paused) {
    clearScreen();

    if (lives > 0) {
      context.font = `${canvas.width / 40}px Arial`;
      context.fillStyle = 'white';
      context.fillText(`Score: ${score}`, (canvas.width / 240 * 198), canvas.height - (canvas.width / 40));
      context.fillText(`Lives: ${lives}`, 0, canvas.height - (canvas.width / 40));

      bat.render();
      ball.render();

      for (let k = 0; k < bricks.length; k++) {
        bricks[k].render();
      }
    }
  }

  if (lives <= 0) {
    clearScreen();
    
    context.font = `${canvas.width / 15}px Arial`;
    context.fillStyle = "white";
    let {width} = context.measureText("Game Over!");

    context.fillText("Game Over!", (canvas.width - width) / 2, canvas.height / 2);

    context.font = `${canvas.width / 30}px Arial`;
    let score_string = `Score: ${score}`;
    width = context.measureText(score_string).width;

    context.fillText(score_string, (canvas.width - width) / 2, (canvas.height / 2) + (canvas.width / 15));
  }
}

setInterval(gameLoop, 17);
