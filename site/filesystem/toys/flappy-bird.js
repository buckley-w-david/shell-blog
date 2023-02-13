(async () => {
  const spriteSheet = {
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

    GameOver: { x: 0, y: 36, width: 192, height: 42 },
    Splash: { x: 0, y: 78, width: 184, height: 267 },

    GreenPipe: { x: 232, y: 0, width: 52, height: 320 },
    RedPipe: { x: 284, y: 0, width: 52, height: 320 },

    BackgroundDay: { x: 0, y: 345, width: 288, height: 512 },
    BackgroundNight: { x: 288, y: 345, width: 288, height: 512 },

    BlueBirdDown: { x: 198, y: 36, width: 34, height: 24 },
    BlueBirdMid: { x: 198, y: 60, width: 34, height: 24 },
    BlueBirdUp: { x: 198, y: 84, width: 34, height: 24 },

    RedBirdDown: { x: 198, y: 108, width: 34, height: 24 },
    RedBirdMid: { x: 198, y: 132, width: 34, height: 24 },
    RedBirdUp: { x: 198, y: 156, width: 34, height: 24 },

    YellowBirdDown: { x: 198, y: 180, width: 34, height: 24 },
    YellowBirdMid: { x: 198, y: 204, width: 34, height: 24 },
    YellowBirdUp: { x: 198, y: 228, width: 34, height: 24 },

    Base: { x: 0, y: 857, width: 336, height: 112 },
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
      .map((_) => spriteSheet.BlueBirdUp),
    ...Array(flapMid)
      .fill()
      .map((_) => spriteSheet.BlueBirdMid),
    ...Array(flapDown)
      .fill()
      .map((_) => spriteSheet.BlueBirdDown),
  ];

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

  const kern = 2;
  const drawScore = (n) => {
    const digits = String(n).split("");
    const totalWidth = digits.reduce(
      (acc, val, i) => acc + spriteSheet[val].width + kern,
      0
    );
    let x = (cw - totalWidth) / 2;
    let y = ch / 6;
    digits.forEach((digit) => {
      const sprite = spriteSheet[digit];
      draw(sprite, x, y);
      x += sprite.width;
    });
  };

  const randRange = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  };
  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

  let start,
    previous,
    frameIdx = 0,
    bgPosition = 0,
    fgPosition = 0,
    score = 0;
  let done = false;

  // Background Speed Factor
  const bgSpeed = 0.06;
  // Foreground Speed Factor
  const fgSpeed = 0.1;

  const gravityAcceleration = 0.03;
  const flapAcceleration = -1;
  const terminalVelocity = 7.0;

  const pipeWidth = spriteSheet.GreenPipe.width;
  const pipeHeight = spriteSheet.GreenPipe.height;
  const birdWidth = spriteSheet.BlueBirdUp.width;
  const birdHeight = spriteSheet.BlueBirdUp.height;
  const baseHeight = spriteSheet.Base.height;
  const baseWidth = spriteSheet.Base.width;

  const cw = 228;
  const ch = 512;
  canvas.className = "active";
  if (shell) shell.className = "inactive";
  canvas.width = cw;
  canvas.height = ch;

  const newPipeHeight = () => {
    return randRange(ch - pipeHeight, ch - 150);
  };

  const horizontalPipeGap = 250;
  const verticalPipeGap = 100;
  let bird = { x: cw / 3, y: ch / 3 };
  let acceleration = 0;
  let velocity = flapAcceleration;
  let flapping = false;

  let p1 = { x: cw * 2, y: newPipeHeight() };
  let p2 = { x: cw * 2 + horizontalPipeGap, y: newPipeHeight() };

  const flap = (event) => {
    flapping = true;
  };
  document.addEventListener("click", flap);

  const tick = (td) => {
    const bgMovement = td * bgSpeed;
    const fgMovement = td * fgSpeed;
    let ua = 0,
      da = td * gravityAcceleration;

    if (flapping) ua = td * flapAcceleration;

    acceleration = da + ua;
    velocity = clamp(
      velocity + acceleration,
      -terminalVelocity,
      terminalVelocity
    );

    bgPosition = (bgPosition - bgMovement) % cw;
    fgPosition = (fgPosition - fgMovement) % baseWidth;
    bird.y += velocity;

    if (bird.y > ch) bird.y = ch;
    else if (bird.y < 0) bird.y = 0;

    let p1CanScore = p1.x > bird.x,
      p2CanScore = p2.x > bird.x;

    p1.x -= fgMovement;
    p2.x -= fgMovement;
    if (p1.x < -pipeWidth) {
      p1.x = p2.x + horizontalPipeGap;
      p1.y = newPipeHeight();
    }

    if (p2.x < -pipeWidth) {
      p2.x = p1.x + horizontalPipeGap;
      p2.y = newPipeHeight();
    }

    if ((p1.x < bird.x && p1CanScore) || (p2.x < bird.x && p2CanScore))
      score += 1;

    flapping = false;
  };

  const render = () => {
    draw(spriteSheet.BackgroundDay, bgPosition, 0);
    draw(spriteSheet.BackgroundDay, cw + bgPosition, 0);

    draw(flapCycle[frameIdx % flapCycle.length], bird.x, bird.y);
    draw(spriteSheet.GreenPipe, p1.x, p1.y);
    draw(spriteSheet.GreenPipe, p1.x, p1.y - pipeHeight - verticalPipeGap, 180);
    draw(spriteSheet.GreenPipe, p2.x, p2.y);
    draw(spriteSheet.GreenPipe, p2.x, p2.y - pipeHeight - verticalPipeGap, 180);

    draw(spriteSheet.Base, fgPosition, ch - baseHeight);
    draw(spriteSheet.Base, baseWidth + fgPosition - 1, ch - baseHeight);
    drawScore(score);
  };

  const checkCollisions = () => {
    if (bird.y >= ch - baseHeight - birdHeight || bird.y <= 0) return true;

    const birdRect = { ...spriteSheet.BlueBirdUp, ...bird };
    for (let p of [p1, p2]) {
      const topRect = { ...spriteSheet.GreenPipe, ...p };
      const bottomRect = {
        ...spriteSheet.GreenPipe,
        x: p.x,
        y: p.y - pipeHeight - verticalPipeGap,
      };
      if (
        birdRect.x < topRect.x + topRect.width &&
        birdRect.x + birdRect.width > topRect.x &&
        birdRect.y < topRect.y + topRect.height &&
        birdRect.height + birdRect.y > topRect.y
      )
        return true;
      else if (
        birdRect.x < bottomRect.x + bottomRect.width &&
        birdRect.x + birdRect.width > bottomRect.x &&
        birdRect.y < bottomRect.y + bottomRect.height &&
        birdRect.height + birdRect.y > bottomRect.y
      )
        return true;
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

    render();
    drawCentered(spriteSheet.Splash);

    await new Promise((resolve, reject) => {
      document.addEventListener(
        "click",
        (e) => {
          resolve();
        },
        { once: true }
      );
    });

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

    drawCentered(spriteSheet.GameOver);
    await new Promise((resolve, reject) => {
      setTimeout(resolve, 1000);
    });
  };

  const exit = () => {
    canvas.className = "inactive";
    if (shell) shell.className = "active";
    sprites.remove();
    document.removeEventListener("click", flap);
    window.postMessage({ type: "executables-close" });
  };

  await main();
  exit();
})();
