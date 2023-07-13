(async () => {
  const spriteSheet = {
    Apple: { x: 0, y: 0, width: 30, height: 30 },
    SnakeSegment: { x: 30, y: 0, width: 30, height: 30 },
    SnakeHead: { x: 60, y: 0, width: 30, height: 30 },
    SnakeTurn: { x: 90, y: 0, width: 30, height: 30 },
    SnakeTail: { x: 120, y: 0, width: 30, height: 30 },
  };

  const thisScript = document.currentScript;
  const process = document.getElementById(thisScript.dataset.processId);
  const argv = JSON.parse(process.dataset.argv);
  const canvas = document.createElement("canvas");

  let cw, ch;
  if (argv.includes("--max")) {
    cw = process.offsetWidth;
    ch = process.offsetHeight;
  } else {
    cw = Math.min(512, process.offsetWidth);
    ch = Math.min(512, process.offsetHeight);
  }
  canvas.width = cw;
  canvas.height = ch;
  process.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const lineInterval = 30;
  let gridWidth = Math.floor(cw / lineInterval)-2;
  let gridHeight = Math.floor(ch / lineInterval)-2;

  const sprites = new Image();
  sprites.src = "/toys/snek.png";

  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

  // ================= GAME OBJECTS =================
  let emptySpaces = [];
  for (let i = 0; i < gridWidth; i++) {
    for (let j = 0; j < gridHeight; j++) {
      emptySpaces.push({ x: i, y: j});
    }
  }
  // The first 3 spaces contain the starting snake position
  emptySpaces.splice(0, 3);

  let takeEmpty = () => {
    let index = Math.floor(Math.random()*emptySpaces.length);
    let space = emptySpaces[index];
    emptySpaces.splice(index, 1);
    return space;
  };

  let apple = takeEmpty();

  let nextDir = { dx: 1, dy: 0 }
  let snake = [
    { x: 0, y: 2, dx: 0, dy: 1 },
    { x: 0, y: 1, dx: 0, dy: 1 },
    { x: 0, y: 0, dx: 0, dy: 1 },
  ];

  // ================= Drawing Functions =================
  const squareSize = lineInterval-1;
  const paddingLeft = 1;
  const paddingTop = 1;

  const draw = (sprite, dx, dy, rot) => {
    if (rot === undefined) rot = 0;
    const { x, y, width, height } = sprite;

    ctx.translate(dx + width / 2, dy + height / 2);
    ctx.rotate((rot * Math.PI) / 180);

    ctx.drawImage(
      sprites,
      x,
      y,
      width,
      height,
      -width / 2,
      -height / 2,
      width,
      height
    );

    ctx.rotate((-rot * Math.PI) / 180);
    ctx.translate(-dx - width / 2, -dy - height / 2);
  };

  const drawCentered = (sprite) => {
    draw(sprite, (cw - sprite.width) / 2, (ch - sprite.height) / 2);
  };

  const drawOutline = () => {
    ctx.moveTo(1, 0);
    ctx.lineTo(1, lineInterval*(gridHeight+1));

    ctx.moveTo(lineInterval*(gridWidth+1), 0);
    ctx.lineTo(lineInterval*(gridWidth+1), lineInterval*(gridHeight+1));

    ctx.moveTo(0, 1);
    ctx.lineTo(lineInterval*(gridWidth+1), 1);

    ctx.moveTo(0, lineInterval*(gridHeight+1));
    ctx.lineTo(lineInterval*(gridWidth+1), lineInterval*(gridHeight+1));

    ctx.stroke()
  };

  const drawGrid = () => {
   ctx.strokeStyle = 'lightgrey'
   ctx.beginPath()
   for (var x = paddingLeft; x <= cw; x += lineInterval) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, ch)
   }
   for (var y = paddingTop; y <= ch; y += lineInterval) {
      ctx.moveTo(0, y)
      ctx.lineTo(cw, y)
   }
   ctx.stroke()
  };

  const drawInGrid = (sprite, x, y, rot) => {
    draw(sprite, x*lineInterval+0+paddingLeft, y*lineInterval+0+paddingTop, rot);
  };

  const drawSegment = (sprite, segment, dx, dy) => {
    let rot = 0;
    if (dx === 0) {
      rot = dy === 1 ? 90 : 270;
    } else {
      rot = dx === 1 ? 0 : 180;
    }
    drawInGrid(sprite, segment.x, segment.y, rot)
  };

  // ================= Game Lifecycle =================
  const turn = (event) => {
    let dir = { dx: snake[0].dx, dy: snake[0].dy };
    switch (event.keyCode) {
      case 37:
        // Left
        if (dir.dx === 1) return;
        nextDir = { dx: -1, dy: 0 };
        break;
      case 38:
        // Up
        if (dir.dy === 1) return;
        nextDir = { dx: 0, dy: -1 };
        break;
      case 39:
        // Right
        if (dir.dx === -1) return;
        nextDir = { dx: 1, dy: 0 };
        break;
      case 40:
        // Down
        if (dir.dy === -1) return;
        nextDir = { dx: 0, dy: 1 };
        break;
    }
  };
  document.addEventListener("keydown", turn);

  const fps = 9;
  let start = window.performance.now(),
    then = start,
    done = false;

  let frameIdx = 0;

  const render = (now) => {
    // TODO: Better clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // drawGrid();
    drawOutline();

    drawInGrid(spriteSheet.Apple, apple.x, apple.y);

    for (let i = 1; i < snake.length - 1; i++) {
      let prev = snake[i-1],
        curr = snake[i],
        next = snake[+i];

      let rot = 0;
      let sprite = spriteSheet.SnakeSegment;

      if (curr.dx !== prev.dx || curr.dy !== prev.dy || curr.dx !== next.dx || curr.dy !== next.dy) {
        // This is going to be ugly...
        sprite = spriteSheet.SnakeTurn;
        if (prev.dy === -1 && curr.dx === 1 && next.dx === 1) rot = 180;
        else if (prev.dx === -1 && curr.dy === 1 && next.dy === 1) rot = 180;
        else if (prev.dx === 1 && curr.dy === 1 && next.dy === 1) rot = 270;
        else if (prev.dy === -1 && curr.dx === -1 && next.dx === -1) rot = 270;
        else if (prev.dy === 1 && curr.dx === -1 && next.dx === -1) rot = 0;
        else if (prev.dx === 1 && curr.dy === -1 && next.dy === -1) rot = 0;
        else if (prev.dx === -1 && curr.dy === -1 && next.dy === -1) rot = 90;
        else if (prev.dy === 1 && curr.dx === 1 && next.dx === 1) rot = 90;

      } else {
        if (curr.dx === 0) {
          rot = curr.dy === 1 ? 90 : 270;
        } else {
          rot = curr.dx === 1 ? 0 : 180;
        }
      }

      drawInGrid(sprite, curr.x, curr.y, rot)
    }

    let head = snake[0]
    drawSegment(spriteSheet.SnakeHead, head, head.dx, head.dy);
    let tail = snake[snake.length-1];
    let afterTail = snake[snake.length-2];
    drawSegment(spriteSheet.SnakeTail, tail, afterTail.dx, afterTail.dy);
  };

  const tick = () => {
    let oldHead = snake[0];
    let newHead = { x: oldHead.x+nextDir.dx, y: oldHead.y+nextDir.dy, dx: nextDir.dx, dy: nextDir.dy};

    snake.unshift(newHead);
    if (newHead.x !== apple.x || newHead.y !== apple.y) {
      // Don't love having to search the emptySpaces every frame
      let idx = emptySpaces.findIndex(space => space.x == newHead.x && space.y == newHead.y);
      emptySpaces.splice(idx, 1, snake.pop());
    } else {
      apple = takeEmpty();
    }
  };

  const checkCollisions = () => {
    let head = snake[0];

    if (head.x < 0 || head.x > gridWidth || head.y < 0 || head.y > gridHeight) return true;
    for (let segment of snake.slice(1)) {
      if (segment.x === head.x && segment.y === head.y) return true
    }
    return false;
  };

  const main = async () => {
    await new Promise((resolve, reject) => {
      if (sprites.complete) resolve();
      else {
        sprites.addEventListener("load", (e) => {
          resolve();
        });
        sprites.addEventListener("error", (e) => {
          reject();
        });
      }
    });

    render(0);
    // drawCentered(spriteSheet.Splash);

    await new Promise((resolve, reject) => {
      document.addEventListener(
        "keydown",
        (e) => {
          resolve();
        },
        { once: true }
      );
    });

    console.log("Go!");

    await new Promise((resolve, reject) => {
      let interval = 1000 / fps;

      const frame = (ts) => {
        if (done) {
          resolve();
          return;
        }

        window.requestAnimationFrame(frame)

        let now = ts;
        let elapsed = now - then;

        if (elapsed > interval) {
          then = now - (elapsed % interval);

          tick();
          render(now);
          done = checkCollisions();
        }
      };

      window.requestAnimationFrame(frame)
    });
  };

  const exit = () => {
    sprites.remove();
    canvas.remove();
    // document.removeEventListener("click", flap);

    const event = new CustomEvent("syscall", { detail: { type: "exit", process: process } });
    window.dispatchEvent(event);
  };

  await main();
  exit();
})();
