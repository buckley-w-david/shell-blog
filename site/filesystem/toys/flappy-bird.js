(async () => {
  const spriteLocations = {
    0: { x: 0, y: 0, width: 24, height: 36 },
    1: { x: 24, y: 0, width: 16, height: 36 },
    2: { x: 40, y: 0, width: 24, height: 36 },
    3: { x: 64, y: 0, width: 24, height: 36 },
    4: { x: 88, y: 0, width: 24, height: 36 },
    5: { x: 112, y: 0, width: 24, height: 36 },
    6: { x: 136, y: 0, width: 24, height: 36 },
    7: { x: 160, y: 0, width: 24, height: 36 },
    8: { x: 184, y: 0, width: 24, height: 36 },
    9: { x: 208, y: 0, width: 24, height: 36 },

    "Game Over": { x: 0, y: 36, width: 192, height: 42 },
    Message: { x: 0, y: 78, width: 184, height: 267 },

    "Green Pipe": { x: 232, y: 0, width: 52, height: 320 },
    "Red Pipe": { x: 284, y: 0, width: 52, height: 320 },

    "BG Day": { x: 0, y: 345, width: 288, height: 512 },
    "BG Night": { x: 288, y: 345, width: 288, height: 512 },

    "BB Downflap": { x: 198, y: 36, width: 34, height: 24 },
    "BB Midflap": { x: 198, y: 60, width: 34, height: 24 },
    "BB Upflap": { x: 198, y: 84, width: 34, height: 24 },

    "RB Downflap": { x: 198, y: 108, width: 34, height: 24 },
    "RB Midflap": { x: 198, y: 132, width: 34, height: 24 },
    "RB Upflap": { x: 198, y: 156, width: 34, height: 24 },

    "YB Downflap": { x: 198, y: 180, width: 34, height: 24 },
    "YB Midflap": { x: 198, y: 204, width: 34, height: 24 },
    "YB Upflap": { x: 198, y: 228, width: 34, height: 24 },

    Base: { x: 0, y: 856, width: 336, height: 112 },
  };
  const canvas = document.getElementById("display");
  const ctx = canvas.getContext("2d");
  const shell = document.getElementById("shell");
  const sprites = new Image();
  sprites.src = "/toys/flappy-bird.png";

  const flapUp = 5;
  const flapMid = 5;
  const flapDown = 5;
  const flapCycle = [
    ...Array(flapUp)
      .fill()
      .map((_) => "BB Upflap"),
    ...Array(flapDown)
      .fill()
      .map((_) => "BB Midflap"),
    ...Array(flapMid)
      .fill()
      .map((_) => "BB Downflap"),
  ];

  const draw = (sprite, dx, dy, rot) => {
    if (rot === undefined) rot = 0;
    const { x, y, width, height } = spriteLocations[sprite];

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

  const ready = new Promise((resolve, reject) => {
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

  const interacted = new Promise((resolve, reject) => {
    document.addEventListener(
      "click",
      (e) => {
        resolve();
      },
      { once: true }
    );
  });

  const randRange = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  };
  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

  let start,
    previous,
    frameIdx = 0,
    bgPosition = 0;
  let done = false;

  // Background Speed Factor
  const bgSpeed = 0.06;
  // Foreground Speed Factor
  const fgSpeed = 0.1;

  const gravityAcceleration = 0.03;
  const flapAcceleration = -1;
  const terminalVelocity = 7.0;

  const cw = 228;
  const ch = 512;
  canvas.className = "active";
  if (shell) shell.className = "inactive";
  canvas.width = cw;
  canvas.height = ch;

  const newPipeHeight = () => {
    return randRange(ch - 320, ch - 150);
  };

  const horizontalPipeGap = 250;
  const verticalPipeGap = 100;
  let bird = [cw / 3, ch / 3];
  let acceleration = 0;
  let velocity = flapAcceleration;
  let flapping = false;

  let p1 = [cw * 2, newPipeHeight()];
  let p2 = [cw * 2 + horizontalPipeGap, newPipeHeight()];

  const flap = (event) => {
    flapping = true;
  };
  document.addEventListener("click", flap);

  // FIXME: Remove magic numbers from logic
  const tick = (td) => {
    const bgMovement = td * bgSpeed;
    const fgMovement = td * fgSpeed;
    let ua,
      da = td * gravityAcceleration;

    if (flapping) ua = td * flapAcceleration;
    else ua = 0;

    acceleration = da + ua;
    velocity = clamp(
      velocity + acceleration,
      -terminalVelocity,
      terminalVelocity
    );

    bgPosition = (bgPosition - bgMovement) % cw;
    // bird[0] = bird[0] - fgMovement;
    bird[1] = bird[1] + velocity;

    if (bird[1] > ch) bird[1] = 0;
    else if (bird[1] < 0) bird[1] = ch;

    p1[0] = p1[0] - fgMovement;
    p2[0] = p2[0] - fgMovement;
    // 52 == pipe width
    if (p1[0] < -52) {
      p1[0] = p2[0] + horizontalPipeGap;
      p1[1] = newPipeHeight();
    }

    if (p2[0] < -52) {
      p2[0] = p1[0] + horizontalPipeGap;
      p2[1] = newPipeHeight();
    }
    flapping = false;
  };

  const render = () => {
    draw("BG Day", bgPosition, 0);
    draw("BG Day", cw + bgPosition, 0);

    draw(flapCycle[frameIdx % flapCycle.length], ...bird);
    draw("Green Pipe", ...p1);
    draw("Green Pipe", p1[0], p1[1] - 320 - verticalPipeGap, 180);
    draw("Green Pipe", ...p2);
    draw("Green Pipe", p2[0], p2[1] - 320 - verticalPipeGap, 180);

    draw("Base", 0, 400);
  };

  const checkCollisions = () => {
    if (bird[1] > ch - 112 - 24 || bird[1] < 0) return true;

    const birdRect = { x: bird[0], y: bird[1], w: 32, h: 24 };
    for (let p of [p1, p2]) {
      const topRect = { x: p[0], y: p[1], w: 52, h: 320 };
      const bottomRect = {
        x: p[0],
        y: p[1] - 320 - verticalPipeGap,
        w: 52,
        h: 320,
      };
      if (
        birdRect.x < topRect.x + topRect.w &&
        birdRect.x + birdRect.w > topRect.x &&
        birdRect.y < topRect.y + topRect.h &&
        birdRect.h + birdRect.y > topRect.y
      )
        return true;
      else if (
        birdRect.x < bottomRect.x + bottomRect.w &&
        birdRect.x + birdRect.w > bottomRect.x &&
        birdRect.y < bottomRect.y + bottomRect.h &&
        birdRect.h + birdRect.y > bottomRect.y
      )
        return true;
    }
    return false;
  };

  const main = async () => {
    await ready;
    render();
    ctx.font = "16px serif";
    ctx.fillText("Click to start!", cw / 2 - 45, ch / 2);
    await interacted;

    await new Promise((resolve, reject) => {
      const frame = (ts) => {
        frameIdx++;
        if (start === undefined) {
          start = ts;
          previous = ts;
        }
        const elapsed = ts - start;
        if (previous !== ts) {
          const diff = ts - previous;
          tick(diff);
          render();
          done = checkCollisions();
        }

        previous = ts;
        if (!done) window.requestAnimationFrame(frame);
        else resolve();
      };
      window.requestAnimationFrame(frame);
    });
  };

  const exit = () => {
    canvas.className = "inactive";
    if (shell) shell.className = "active";
    sprites.remove();
    document.removeEventListener("click", flap);
    window.postMessage("executables-close");
  };

  await main();
  exit();
})();
