import * as sprites from "./sprites";

declare global {
  /**
   * The canvas object. Global variable created through id attribute.
   */
  const c: HTMLCanvasElement;
  /**
   * The spritesheet. Global variable created through id attribute.
   */
  const s: HTMLImageElement;
}

interface Point {
  x: number;
  y: number;
}

interface Sprite {
  x: number;
  y: number;
  w: number;
  h: number;
  pivot?: Point;
}

interface Decoration {
  x: number;
  y: number;
  sprites: Sprite[];
  spriteIndex: number;
  animationSpeed: number;
  animationTimer: number;
}

interface Projectile {
  x: number;
  y: number;
  z: number;
  sprite: Sprite;
  flip: boolean;
}

interface GameObject {
  x: number;
  y: number;
  z: number;
  sprite: Sprite[];
  riding?: Sprite[];
  direction: Direction;
  shadow?: boolean;
  ai?: boolean;
  speed: number;
}

const ctx = c.getContext("2d")!;
const width = (c.width = 400);
const height = (c.height = 225);
const objects: GameObject[] = [];
const decorations: Decoration[] = [];
const projectiles = new Set<Projectile>();
const camera = { x: 0, y: 0, z: 1.5 };

function resize() {
  const scale = Math.min(innerWidth / width, innerHeight / height);
  c.style.width = `${width * scale}px`;
  c.style.height = `${height * scale}px`;
}

function spr(sprite: Sprite, x: number, y: number, w = sprite.w, h = sprite.h) {
  ctx.drawImage(s, sprite.x, sprite.y, sprite.w, sprite.h, x | 0, y | 0, w, h);
}

function drawAnchoredSprite(
  sprite: Sprite,
  x: number,
  y: number,
  flip = false,
) {
  ctx.save();
  ctx.translate(x | 0, y | 0);
  ctx.scale(camera.z, camera.z);
  if (flip) ctx.scale(-1, 1);
  if (sprite.pivot) {
    spr(sprite, -sprite.pivot.x, -sprite.pivot.y);
  } else {
    spr(sprite, -sprite.w / 2, -sprite.h);
  }
  ctx.restore();
}

function drawSprite(
  sprite: Sprite,
  x: number,
  y: number,
) {
  if (sprite.pivot) {
    spr(sprite, x -sprite.pivot.x, y-sprite.pivot.y);
  } else {
    spr(sprite, x-sprite.w / 2, y-sprite.h);
  }
}

function strip(sprite: Sprite, w: number, h: number): Sprite[] {
  let sprites: Sprite[] = [];
  for (let y = 0; y < sprite.h; y += h) {
    for (let x = 0; x < sprite.w; x += w) {
      sprites.push({ ...sprite, x: sprite.x + x, y: sprite.y + y, w, h });
    }
  }
  return sprites;
}

let lastFrameTime: number;

function loop(time: number) {
  requestAnimationFrame(loop);
  let dt = time - (lastFrameTime || time);
  lastFrameTime = time;
  update(dt);
  render();
}

interface Rectangle {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function isPointInRect(point: Point, rectangle: Rectangle) {
  return (
    point.x >= rectangle.x1 &&
    point.y >= rectangle.y1 &&
    point.x <= rectangle.x2 &&
    point.y <= rectangle.y2
  );
}

function update(dt: number) {
  updateAnimations(dt);
  updateAI();
  updateDecorations(dt);
  player.x |= 0;
  player.y |= 0;
  camera.x = player.x;
  camera.y = player.y;
}

function randomPoint(): Point {
  return { x: random(width), y: random(height) };
}

function updateAI() {
  for (let object of objects) {
    if (object.ai) {
      let angle = Math.random() * Math.PI * 2;
      let radius = Math.random() * 100;
      let point = {
        x: object.x + Math.sin(angle) * radius,
        y: object.y + Math.cos(angle) * radius,
      };
      let path = findPath(object, point);
      delete object.ai;
      walk(object, path).then(() => (object.ai = true));
    }
  }
}

function updateDecorations(dt: number) {
  for (let d of decorations) {
    d.animationTimer += dt;
    if (d.animationTimer >= d.animationSpeed) {
      d.spriteIndex += 1;
      d.spriteIndex %= d.sprites.length;
      d.animationTimer = 0;
    }
  }
}

function getViewport(): Rectangle {
  let x1 = Math.floor(camera.x - width / 2);
  let y1 = Math.floor(camera.y - height / 2);
  let x2 = x1 + width;
  let y2 = y1 + height;
  return { x1, y1, x2, y2 };
}

function render() {
  let view = getViewport();

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(-view.x1, -view.y1);

  for (let decoration of decorations) {
    if (!isPointInRect(decoration, view)) continue;
    spr(decoration.sprites[decoration.spriteIndex], decoration.x, decoration.y);
  }

  for (let p of waypoints) {
    spr(sprites.waypoint, p.x - 1, p.y - 1);
  }

  for (let object of objects) {
    if (!isPointInRect(object, view)) continue;

    if (object.shadow) {
      drawSprite(sprites.shadow, object.x, object.y);
    }

    if (object.riding) {
      drawSprite(
        object.riding[object.direction],
        object.x,
        object.y - object.z,
      );
    }

    drawSprite(
      object.sprite[object.direction],
      object.x,
      object.y - object.z,
    );
  }

  for (let projectile of projectiles) {
    if (!isPointInRect(projectile, view)) continue;

    drawAnchoredSprite(
      projectile.sprite,
      projectile.x,
      projectile.y + projectile.z,
      projectile.flip,
    );
  }

  textAlign = "center";
  writeText("Raise a Horde", width / 2, 10);
  ctx.restore();
}

export let easeInOut = (t: number) =>
  (t *= 2) < 1 ? 0.5 * t * t : -0.5 * (--t * (t - 2) - 1);

let player = GameObject({
  x: 100,
  y: 100,
  speed: 30,
  sprite: strip(sprites.rider, 16, 16),
  riding: strip(sprites.horse, 16, 16),
  shadow: true,
});

/**
 * Convert screen coordinates into canvas coordinates. Accounts for visual
 * offset and canvas scale.
 */
function screenToCanvas(screenX: number, screenY: number): Point {
  let rect = c.getBoundingClientRect();
  let x = ((screenX - rect.x) / (rect.width / width)) | 0;
  let y = ((screenY - rect.y) / (rect.height / height)) | 0;
  return { x, y };
}

/**
 * Convert canvas coordinates to world coordinates. Accounting for camera
 * position.
 */
function canvasToWorld(canvasX: number, canvasY: number): Point {
  let view = getViewport();
  return { x: canvasX + view.x1, y: canvasY + view.y1 };
}

function screenToWorld(x: number, y: number): Point {
  let canvasPos = screenToCanvas(x, y);
  return canvasToWorld(canvasPos.x, canvasPos.y);
}

enum Direction {
  North = 0,
  NorthEast = 1,
  East = 2,
  SouthEast = 3,
  South = 4,
  SouthWest = 5,
  West = 6,
  NorthWest = 7,
}

const TWO_PI = Math.PI * 2;

function getBestDirectionBetweenPoints(p1: Point, p2: Point): Direction {
  let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) + Math.PI / 2;
  return getDirectionFromAngle(angle);
}

function getDirectionFromAngle(radians: number): Direction {
  if (radians < 0) radians = TWO_PI + radians;
  let normal = radians / TWO_PI;
  let index = Math.floor(normal * 8);
  return index as Direction;
}

function getDistanceBetweenPoints(p1: Point, p2: Point): number {
  return Math.hypot(p2.y - p1.y, p2.x - p1.x);
}

function findPath(p1: Point, p2: Point): Point[] {
  let dx = p2.x - p1.x;
  let dy = p2.y - p1.y;
  let d = Math.min(Math.abs(dx), Math.abs(dy));
  let checkpoint = { x: p1.x + d * Math.sign(dx), y: p1.y + d * Math.sign(dy) };
  return [checkpoint, p2];
}

interface Animation {
  duration: number;
  elapsed: number;
  step(t: number): void;
  done?(): void;
}

let animations: Animation[] = [];

function updateAnimations(dt: number) {
  animations = animations.filter(animation => {
    animation.elapsed += dt;
    let t = Math.min(1, animation.elapsed / animation.duration);
    animation.step(t);
    if (t === 1) animation.done?.();
    return t < 1;
  });
}

function animate({
  duration,
  step,
  done,
}: Pick<Animation, "duration" | "step" | "done">) {
  animations.push({ elapsed: 0, duration, step, done });
}

type Tweenable<T extends Record<string, any>> = {
  [K in keyof T as T[K] extends number ? K : never]?: T[K];
};

type Easing = (t: number) => number;

function tween<T extends Record<string, any>>(
  target: T,
  values: Tweenable<T>,
  duration: number = 300,
  easing: Easing = t => t,
): Promise<void> {
  let initial = { ...target };
  return new Promise(done =>
    animate({
      duration,
      done,
      step(t) {
        let k = easing(t);
        for (let key in values) {
          // @ts-ignore
          target[key] = initial[key] + k * (values[key] - initial[key]);
        }
      },
    }),
  );
}

let waypoints: Point[] = [];

function pathToWaypoints(start: Point, path: Point[]): Point[] {
  let last = start;
  let points: Point[] = [];

  for (let point of path) {
    let step = 10;
    let distance = getDistanceBetweenPoints(last, point);
    let steps = distance / step;
    for (let i = 1; i < steps; i++) {
      let p = lerp2(last, point, i / steps);
      points.push(p);
    }
    last = point;
  }
  return points;
}

async function walk(object: GameObject, path: Point[]) {
  for (let point of path) {
    let easing =
      point === path[0]
        ? easeInQuad
        : point === path[path.length - 1]
        ? easeOutQuad
        : easeInOutLinear;

    await walkTo(object, point, easing);
  }
}

function spawn(object: GameObject, x = object.x, y = object.y) {
  object.x = x;
  object.y = y;
  objects.push(object);
}

function despawn(object: GameObject) {
  let index = objects.indexOf(object);
  if (index >= 0) objects.splice(index, 1);
}

function walkTo(
  object: GameObject,
  point: Point,
  easing: Easing = easeInOutLinear,
): Promise<void> {
  let distance = getDistanceBetweenPoints(object, point);
  let direction = getBestDirectionBetweenPoints(object, point);
  let speed = object.speed; // Pixels per second
  let time = (distance / speed) * 1000; // Time in milliseconds
  object.direction = direction;

  animate({
    duration: time,
    step: t => {
      object.z = Math.abs(Math.sin((t * time) / 200) * 2);
    },
  });

  return tween(object, point, time, easing);
}

const easeInOutLinear: Easing = t => t;
const easeInQuad: Easing = t => t * t;
const easeOutQuad: Easing = t => -(t * (t - 2));

function lerp(v1: number, v2: number, t: number): number {
  return v1 + (v2 - v1) * t;
}

function lerp2(p1: Point, p2: Point, t: number): Point {
  return { x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t) };
}

function GameObject(init: Partial<GameObject>): GameObject {
  return { x: 0, y: 0, z: 0, direction: 0, speed: 0, sprite: [], ...init };
}

let cursor: Point | undefined;

onpointermove = (event: PointerEvent) => {
  cursor = screenToWorld(event.clientX, event.clientY);
};

onpointerdown = (event: PointerEvent) => {
  if (cursor) playerWalkTo(cursor);
};

onkeydown = (event: KeyboardEvent) => {
  if (event.key === " ") {
    if (cursor) playerThrow(cursor);
  }
};

function playerThrow(point: Point) {
  let thrower = player;
  let p: Projectile = {
    x: thrower.x,
    y: thrower.y,
    z: 0,
    sprite: sprites.javelin_1,
    flip: point.x < thrower.x,
  };
  point.x += Math.random() - 0.5;
  point.y += Math.random() - 0.5;

  // Looks weird if the thrower rotates whilst riding
  // thrower.direction = getBestDirectionBetweenPoints(thrower, point);

  let distance = getDistanceBetweenPoints(thrower, point);
  let duration = distance * 3;
  let step = (t: number) => {
    p.z = (Math.sin(Math.PI + t * Math.PI) * distance) / 10;
    p.sprite =
      t < 0.2
        ? sprites.javelin_1
        : t < 0.6
        ? sprites.javelin_2
        : sprites.javelin_3;
  };
  let done = () => {
    projectiles.delete(p);
    decorations.push(
      Decoration({
        x: p.x,
        y: p.y,
        sprites: [sprites.javelin_4],
      }),
    );
  };
  tween(p, point, duration, easeInOutLinear);
  animate({ duration, step, done });
  projectiles.add(p);
}

function Decoration(init: Partial<Decoration>): Decoration {
  return {
    x: 0,
    y: 0,
    animationSpeed: 0,
    animationTimer: 0,
    spriteIndex: 0,
    sprites: [],
    ...init,
  };
}

async function playerWalkTo(point: Point) {
  let path = findPath(player, point);
  let target = GameObject({
    x: point.x,
    y: point.y,
    sprite: [sprites.flag],
    shadow: true,
  });
  spawn(target);
  waypoints = pathToWaypoints(player, path);
  await walk(player, path);
  despawn(target);
  waypoints = [];
}

function random(max: number): number {
  return (Math.random() * max) | 0;
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function Horse() {
  return GameObject({
    sprite: strip(sprites.horse, 16, 16),
    shadow: true,
    ai: true,
    speed: 10,
  });
}

const GLYPH_WIDTH = 5;
const GLYPH_HEIGHT = 7;
const LINE_HEIGHT = 8;

const GLYPH_WIDTH_OVERRIDES: Record<string | number, number> = {
  i: 3,
  j: 3,
  l: 3,
  c: 4,
  t: 4,
  y: 4,
  r: 4,
  e: 4,
  f: 4,
  g: 4,
  h: 4,
  o: 4,
  q: 4,
  p: 4,
  v: 4,
  z: 3,
  s: 4,
  n: 4,
  I: 4,
  N: 6,

  m: 6,
  w: 6,
  "[": 3,
  "]": 3,
  "|": 2,
  " ": 3,
};

let tintCache: Record<string, HTMLCanvasElement> = {};

function tint(color: string): HTMLCanvasElement {
  if (tintCache[color]) return tintCache[color];
  let canvas = document.createElement("canvas");

  // Sprites haven't loaded yet, but we still need to give back a canvas
  if (!s.width) return canvas;

  let ctx = canvas.getContext("2d")!;
  canvas.width = s.width;
  canvas.height = s.height;
  ctx.fillStyle = color;
  ctx.globalCompositeOperation = "multiply";
  ctx.fillRect(0, 0, s.width, s.height);
  ctx.drawImage(s, 0, 0);
  ctx.globalCompositeOperation = "destination-atop";
  ctx.drawImage(s, 0, 0);
  return (tintCache[color] = canvas);
}

let textColor = "white";
let textShadow = "black";
let textAlign: "center" | "left" | "right";
let textX = 0;
let textY = 0;

function writeText(text: string, x: number = textX, y: number = textY): void {
  textX = Math.round(x);
  textY = Math.round(y);
  let source = tint(textColor);

  for (let line of text.split("\n")) {
    let width = measureText(line);
    if (textAlign === "center") textX -= (width / 2) | 0;
    if (textAlign === "right") textX -= width;

    for (let ch of line) {
      let code = ch.charCodeAt(0) - 32;
      let gx = code % 32;
      let gy = (code / 32) | 0;
      let sx = sprites.font.x + gx * GLYPH_WIDTH;
      let sy = sprites.font.y + gy * GLYPH_HEIGHT;
      let sw = GLYPH_WIDTH;
      let sh = GLYPH_HEIGHT;

      if (textShadow) {
        let source = tint(textShadow);
        ctx.drawImage(source, sx, sy, sw, sh, textX + 1, textY, sw, sh);
        ctx.drawImage(source, sx, sy, sw, sh, textX, textY + 1, sw, sh);
        ctx.drawImage(source, sx, sy, sw, sh, textX + 1, textY + 1, sw, sh);
      }

      ctx.drawImage(source, sx, sy, sw, sh, textX, textY, sw, sh);
      textX += GLYPH_WIDTH_OVERRIDES[ch] ?? GLYPH_WIDTH;
    }

    textY += LINE_HEIGHT;
  }
}

function measureText(text: string): number {
  let maxWidth = 0;
  let currentWidth = 0;

  for (let ch of text) {
    currentWidth += GLYPH_WIDTH_OVERRIDES[ch] ?? GLYPH_WIDTH;
    if (currentWidth > maxWidth) maxWidth = currentWidth;
  }

  return maxWidth;
}

function decorate() {
  let grass = strip(sprites.grass_1, 8, 6);
  let grass1 = [grass[0], grass[1], grass[2], grass[1], grass[0], grass[3]];
  let grass2 = strip(sprites.grass_2, 6, 6);
  let grass3 = [sprites.grass_3];
  let grass4 = [sprites.grass_4];

  for (let i = 0; i < 100; i++) {
    let { x, y } = randomPoint();
    let sprs = strip(sprites.rocks, 5, 5);
    decorations.push({
      x,
      y,
      sprites: [randomElement(sprs)],
      spriteIndex: 0,
      animationSpeed: 0,
      animationTimer: 0,
    });
  }

  for (let i = 0; i < 100; i++) {
    let { x, y } = randomPoint();
    decorations.push({
      x,
      y,
      sprites: randomElement([grass1, grass2, grass3, grass4]),
      spriteIndex: 0,
      animationSpeed: 200 + random(1000),
      animationTimer: 0,
    });
  }

  for (let i = 0; i < 10; i++) {
    let { x, y } = randomPoint();
    let rocks = [
      sprites.rock_1,
      sprites.rock_2,
      sprites.rock_3,
      sprites.rock_4,
      sprites.rock_5,
    ];
    decorations.push(
      Decoration({
        x,
        y,
        sprites: [randomElement(rocks)],
      }),
    );
  }
}

function init() {
  decorate();
  spawn(player);
  for (let i = 0; i < 8; i++) {
    spawn(Horse(), random(width), random(height));
  }
  resize();
  onresize = resize;
  requestAnimationFrame(loop);
}

init();
