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
  source?: HTMLCanvasElement | HTMLImageElement;
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
  holding?: Sprite;
  direction: Direction;
  horde?: Horde;
  influenceRadius: number;
  hitpoints: number;
  shadow?: boolean;
  ai?: boolean;
  follower?: boolean;
  speed: number;
  palette?: HTMLImageElement | HTMLCanvasElement;
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

const ctx = c.getContext("2d")!;
const width = (c.width = 400);
const height = (c.height = 225);
const objects: GameObject[] = [];
const hordes: Horde[] = [];
const decorations: Decoration[] = [];
const projectiles = new Set<Projectile>();
const camera = { x: 0, y: 0, z: 2 };

function resize() {
  const scale = Math.min(innerWidth / width, innerHeight / height);
  c.style.width = `${width * scale}px`;
  c.style.height = `${height * scale}px`;
  ctx.imageSmoothingEnabled = false;
}

function spr(sprite: Sprite, x: number, y: number, w = sprite.w, h = sprite.h) {
  ctx.drawImage(
    sprite.source ?? s,
    sprite.x,
    sprite.y,
    sprite.w,
    sprite.h,
    x | 0,
    y | 0,
    w,
    h,
  );
}

function drawAnchoredSprite(
  sprite: Sprite,
  x: number,
  y: number,
  flip = false,
) {
  ctx.save();
  ctx.translate(x | 0, y | 0);
  if (flip) ctx.scale(-1, 1);
  if (sprite.pivot) {
    spr(sprite, -sprite.pivot.x, -sprite.pivot.y);
  } else {
    spr(sprite, -sprite.w / 2, -sprite.h);
  }
  ctx.restore();
}

function drawSprite(sprite: Sprite, x: number, y: number) {
  if (sprite.pivot) {
    spr(sprite, x - sprite.pivot.x, y - sprite.pivot.y);
  } else {
    spr(sprite, x - sprite.w / 2, y - sprite.h);
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

const COLOR_HORSE = 0x694636;
const COLOR_HORSE_ALT = 0x503528;
const COLOR_MANE = 0x45283c;
const COLOR_RIDER = 0x8a8733;
const COLOR_RIDER_ALT = 0x8a6f30;
const COLOR_BEARD = 0x222034;
const COLOR_FLAG_ALT = 0x9b9947;

// prettier-ignore
const palettes = [
  s,
  recolor({ [COLOR_HORSE]: 0x7e8687, [COLOR_HORSE_ALT]: 0x595e5f }),
  recolor({ [COLOR_HORSE]: 0x8a6f30, [COLOR_HORSE_ALT]: 0x7d6429, }),
  recolor({ [COLOR_HORSE]: 0xcbdbfc, [COLOR_HORSE_ALT]: 0xa2b5dc, [COLOR_MANE]: 0x7e8687, [COLOR_RIDER]: 0xac3232 }),
  recolor({ [COLOR_HORSE]: 0x45283c, [COLOR_HORSE_ALT]: 0x222034, [COLOR_MANE]: 0x222034 }),
  recolor({ [COLOR_RIDER]: 0x9b510d, [COLOR_BEARD]: 0xcbdbfc }),
  recolor({ [COLOR_RIDER]: 0x8a6f30, }),
  recolor({ [COLOR_RIDER]: 0x3f3f74, [COLOR_RIDER_ALT]: 0x5b6ee1 }),
];

function colorToRgb(color: string): number {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  let imageData = ctx.getImageData(0, 0, 1, 1);
  return (
    (imageData.data[0] << 16) | (imageData.data[1] << 8) | imageData.data[2]
  );
}

function generateHordePalette(hue: number) {
  return recolor({
    [COLOR_RIDER]: colorToRgb(`hsl(${hue}, 40%, 40%)`),
    [COLOR_RIDER_ALT]: colorToRgb(`hsl(${hue + 50}, 30%, 30%)`),
    [COLOR_FLAG_ALT]: colorToRgb(`hsl(${hue}, 30%, 50%)`),
  });
}

function recolor(mappings: Record<number, number>) {
  let c = document.createElement("canvas");
  let ctx = c.getContext("2d")!;
  ctx.drawImage(s, 0, 0);
  let imageData = ctx.getImageData(0, 0, s.width, s.height);
  for (let i = 0; i < imageData.data.length; i++) {
    let src =
      (imageData.data[i] << 16) |
      (imageData.data[i + 1] << 8) |
      imageData.data[i + 2];
    let dst = mappings[src] || src;
    imageData.data[i] = dst >> 16;
    imageData.data[i + 1] = (dst >> 8) & 0xff;
    imageData.data[i + 2] = dst & 0xff;
  }
  ctx.putImageData(imageData, 0, 0);
  return c;
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
  updateCollisions();
  camera.x = lerp(camera.x, player.x, 0.07) | 0;
  camera.y = lerp(camera.y, player.y, 0.07) | 0;
}

function randomPoint(): Point {
  return { x: randomInt(width), y: randomInt(height) };
}

function getRandomPointAround(point: Point, radius: number): Point {
  let angle = Math.random() * TWO_PI;
  return {
    x: point.x + Math.sin(angle) * radius,
    y: point.y + Math.cos(angle) * radius,
  };
}

function updateAI() {
  for (let object of objects) {
    if (object.ai) {
      updateObjectAI(object);
    }
  }
}

function updateCollisions() {
  for (let object of objects) {
    for (let other of objects) {
      if (object === other) continue;
      if (
        doCirclesIntersect(
          object.x,
          object.y,
          object.influenceRadius,
          other.x,
          other.y,
          other.influenceRadius,
        )
      ) {
        if (object.horde && !other.horde && other.follower) {
          object.horde.add(other);
        }
      }
    }
  }
}

function areObjectsInProximity(a: GameObject, b: GameObject): boolean {
  return doCirclesIntersect(
    a.x,
    a.y,
    a.influenceRadius,
    b.x,
    b.y,
    b.influenceRadius,
  );
}

async function updateObjectAI(object: GameObject) {
  if (
    object.horde &&
    object !== object.horde.leader &&
    areObjectsInProximity(object.horde.leader, object)
  ) {
    // No need to do anything if we're already inside the horde's influence radius
    return;
  }

  delete object.ai;
  let target = object.horde ? object.horde.leader : object;
  let radius = object.horde ? randomInt(50) : randomInt(100);
  let point = getRandomPointAround(target, radius);
  let path = findPath(object, point);
  await walk(object, path);
  object.ai = true;
}

function doCirclesIntersect(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
): boolean {
  return Math.hypot(x1 - x2, y1 - y2) <= r1 + r2;
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

  drawSprite(sprites.unit_indicator, player.x, player.y);

  for (let decoration of decorations) {
    if (!isPointInRect(decoration, view)) continue;
    spr(decoration.sprites[decoration.spriteIndex], decoration.x, decoration.y);
  }

  for (let p of waypoints) {
    spr(sprites.waypoint, p.x - 1, p.y - 1);
  }

  for (let object of objects) {
    if (!isPointInRect(object, view)) continue;
    if (object.influenceRadius <= 0) continue;
    ctx.save();
    ctx.beginPath();
    ctx.arc(object.x, object.y, object.influenceRadius, 0, TWO_PI);
    ctx.fillStyle = object.horde?.color ?? `rgba(255, 255, 255, 20%)`;
    //ctx.fill();
    ctx.restore();
  }

  for (let object of objects) {
    if (!isPointInRect(object, view)) continue;
    renderObject(object);
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
  writeText("Raise a Horde", 0, 10);
  ctx.restore();
}

function renderObject(object: GameObject) {
  let x = object.x | 0;
  let y = object.y | 0;
  let z = object.z | 0;
  if (object.shadow) drawSprite(sprites.shadow, x, y);
  if (object.riding) drawSprite(object.riding[object.direction], x, y - z);
  drawSprite(object.sprite[object.direction], x, y - z);
  if (object.holding) drawSprite(object.holding, x, y - z - 10);
}

export let easeInOut = (t: number) =>
  (t *= 2) < 1 ? 0.5 * t * t : -0.5 * (--t * (t - 2) - 1);

type SpriteSheet = HTMLImageElement | HTMLCanvasElement;

function setSpriteSource(object: GameObject, source: SpriteSheet) {
  object.palette = source;

  object.sprite = object.sprite.map(spr => {
    return { ...spr, source: object.palette };
  });

  if (object.holding) {
    object.holding = { ...object.holding, source: object.palette };
  }
}

class Horde {
  leader: GameObject;
  objects: GameObject[] = [];
  color: string;
  palette: HTMLCanvasElement;

  constructor(leader: GameObject) {
    let hue = randomInt(360);

    this.leader = leader;
    this.objects.push(leader);
    this.color = `hsla(${hue}, 50%, 40%, 10%)`;
    this.palette = generateHordePalette(hue);

    leader.horde = this;
    leader.holding = { ...sprites.flag, source: this.palette };
    setSpriteSource(this.leader, this.palette);
  }

  add(object: GameObject) {
    this.objects.push(object);
    object.horde = this;
    object.speed = this.leader.speed;
    setSpriteSource(object, this.leader.palette!);
  }

  remove(object: GameObject) {
    removeFromArray(this.objects, object);
    delete object.palette;
    delete object.horde;
    for (let sprite of object.sprite) {
      delete sprite.source;
    }
  }
}

function removeFromArray<T>(array: T[], element: T) {
  let index = array.indexOf(element);
  if (index >= 0) array.splice(index, 1);
}

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

let player = GameObject({
  x: 100,
  y: 100,
  speed: 30,
  sprite: strip(sprites.rider, 16, 16),
  riding: strip(sprites.horse, 16, 16),
  shadow: true,
  influenceRadius: 30,
  direction: Direction.East,
});

hordes.push(new Horde(player));

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
          target[key] = (initial[key] + k * (values[key] - initial[key])) | 0;
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

function jitter(point: Point, amount: number): Point {
  return {
    x: point.x + randomInt(amount * 2) - amount,
    y: point.y + randomInt(amount * 2) - amount,
  };
}

async function walk(object: GameObject, path: Point[]) {
  if (object.horde?.leader === object) {
    for (let follower of object.horde.objects) {
      if (follower !== object) {
        walk(
          follower,
          path.map(p => jitter(p, 20)),
        );
      }
    }
  }

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
  if (init.palette && init.sprite)
    init.sprite = init.sprite.map(s => ({ ...s, source: init.palette }));
  return {
    x: 0,
    y: 0,
    z: 0,
    direction: 0,
    speed: 0,
    influenceRadius: 0,
    hitpoints: 0,
    sprite: [],
    ...init,
  };
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
    playerThrow();
  }
};

function playerThrow() {
  if (!cursor) return;

  for (let object of player.horde!.objects) {
    throw_(object, cursor);
  }
}

function throw_(thrower: GameObject, point: Point) {
  let p: Projectile = {
    x: thrower.x,
    y: thrower.y,
    z: 0,
    sprite: sprites.javelin_1,
    flip: point.x < thrower.x,
  };

  let jitter = 10;

  point = {
    x: point.x + randomInt(jitter * 2) - jitter,
    y: point.y + randomInt(jitter * 2) - jitter,
  };

  // TODO: Enforce max throwing distance

  // TODO: Figure out how to do collisions. Should they be realtime or should
  // it just be computed based on where the mouse was when clicked?

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
    let objects = getObjectsInCircle(p.x, p.y, 10);

    for (let object of objects) {
      damage(object, 1);
    }

    if (objects.length) {
      decorations.push(Decoration({
        x: p.x,
        y: p.y,
        sprites: [randomElement(strip(sprites.blood, 5, 5))],
      }))
    }
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

function damage(object: GameObject, amount: number) {
  // Get scared when hit
  if (object.horde) {
    object.horde.remove(object);
  }

  // Die
  if ((object.hitpoints -= amount) <= 0) {
    despawn(object);
  }
}

function getObjectsInCircle(x: number, y: number, radius: number): GameObject[] {
  return objects.filter(object => doCirclesIntersect(x, y, radius, object.x, object.y, 3));
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
    palette: player.palette,
  });
  spawn(target);
  waypoints = pathToWaypoints(player, path);
  await walk(player, path);
  despawn(target);
  waypoints = [];
}

function randomInt(max: number): number {
  return (Math.random() * max) | 0;
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function Horse() {
  return GameObject({
    sprite: strip(sprites.horse, 16, 16),
    palette: randomElement(palettes),
    shadow: true,
    ai: true,
    speed: 10,
  });
}

function Rider() {
  return GameObject({
    sprite: strip(sprites.rider, 16, 16),
    influenceRadius: 10,
    riding: Horse().sprite,
    follower: true,
    shadow: true,
    ai: true,
    speed: 10,
    hitpoints: 3,
  });
}

function Leader() {
  let palette = randomElement(palettes);
  let flag = { ...sprites.flag, source: palette };
  return GameObject({
    sprite: strip(sprites.rider, 16, 16),
    influenceRadius: 20,
    palette,
    riding: Horse().sprite,
    holding: flag,
    follower: true,
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
  let grass2 = strip(sprites.grass_2, 5, 6);
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
      animationSpeed: 200 + randomInt(1000),
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
  camera.x = player.x;
  camera.y = player.y;
  for (let i = 0; i < 8; i++) {
    spawn(Horse(), randomInt(width), randomInt(height));
    spawn(Rider(), randomInt(width), randomInt(height));
  }

  for (let i = 0; i < 3; i++) {
    let leader = Leader();
    let horde = new Horde(leader);
    hordes.push(horde);
    spawn(leader, randomInt(width), randomInt(height));
  }

  resize();
  onresize = resize;
  requestAnimationFrame(loop);
}

init();
