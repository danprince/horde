import { Point } from "./geometry";

export interface Sprite {
  x: number;
  y: number;
  w: number;
  h: number;
  pivot?: Point;
}

declare global {
  let c: HTMLCanvasElement;
  let s: HTMLImageElement;
}

export let ctx = c.getContext("2d")!;

export function resize() {
  let scale = Math.min(innerWidth / c.width, innerHeight / c.height);
  c.style.width = `${c.width * scale}px`;
  c.style.height = `${c.height * scale}px`;
  ctx.imageSmoothingEnabled = false;
}

export function clear() {
  ctx.clearRect(0, 0, c.width, c.height);
}

export function drawSprite(
  spr: Sprite,
  x: number,
  y: number,
  palette?: Palette,
): void {
  if (spr.pivot) (x -= spr.pivot.x), (y -= spr.pivot.y);
  let source = palette ? remapPalette(palette) : s;
  ctx.drawImage(source, spr.x, spr.y, spr.w, spr.h, x | 0, y | 0, spr.w, spr.h);
}

export function loop(callback: (dt: number) => void) {
  let lastFrameTime = 0;
  requestAnimationFrame(function tick(time) {
    requestAnimationFrame(tick);
    lastFrameTime ||= time;
    callback(time - lastFrameTime);
    lastFrameTime = time;
  });
}

export function screenToCanvasCoords(screenX: number, screenY: number): Point {
  let rect = c.getBoundingClientRect();
  let x = ((screenX - rect.x) / (rect.width / c.width)) | 0;
  let y = ((screenY - rect.y) / (rect.height / c.height)) | 0;
  return { x, y };
}

interface Timer {
  duration: number;
  elapsed: number;
  step?(t: number): void;
  done(): void;
}

let timers = new Set<Timer>();

export function timer(ms: number, step?: Timer["step"]): Promise<void> {
  return new Promise(done =>
    timers.add({ duration: ms, elapsed: 0, step, done }),
  );
}

export function updateTimers(dt: number) {
  for (let timer of timers) {
    timer.elapsed += dt;
    let t = Math.min(1, timer.elapsed / timer.duration);
    timer.step?.(t);
    if (t >= 1) {
      timer.done();
      timers.delete(timer);
    }
  }
}

export function slice(sprite: Sprite, width: number): Sprite[] {
  let sprites: Sprite[] = [];
  for (let x = sprite.x; x < sprite.x + sprite.w; x += width) {
    sprites.push({ ...sprite, x, w: width });
  }
  return sprites;
}

export type Easing = (t: number) => number;

export const easeInOutQuad: Easing = t =>
  t < 0.5 ? 2 * t * t : -2 * t * t + 4 * t - 1;

export type Palette = Record<number, number>;

let remapPaletteCache = new Map<Palette, HTMLCanvasElement>();

function remapPalette(palette: Palette): HTMLCanvasElement {
  // Check if we've already recolored the spritesheet for this palette
  let canvas = remapPaletteCache.get(palette);
  if (canvas) return canvas;

  // If not create a new canvas to hold the recolored version
  canvas = document.createElement("canvas");
  canvas.width = s.width;
  canvas.height = s.height;
  let ctx = canvas.getContext("2d")!;

  // Draw the original sprite onto the canvas
  ctx.drawImage(s, 0, 0);

  // Remap from original palette to new one
  let imageData = ctx.getImageData(0, 0, s.width, s.height);
  let view = new DataView(imageData.data.buffer);

  for (let i = 0; i < view.byteLength; i += 4) {
    let rgba = view.getUint32(i);
    if (rgba) view.setUint32(i, palette[rgba]);
    view.setUint32(i, palette[rgba] || rgba);
  }

  ctx.putImageData(imageData, 0, 0);

  // Cache the recolored version of the sprites
  remapPaletteCache.set(palette, canvas);

  return canvas;
}

let sampleCanvas = document.createElement("canvas")!;
let sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true })!;

export function colorToRgba(color: string): number {
  sampleCtx.fillStyle = color;
  sampleCtx.fillRect(0, 0, 1, 1);
  let { data: [r, g, b, a] } = sampleCtx.getImageData(0, 0, 1, 1);
  return (r << 24) | (g << 16) | (b << 8) | a;
}

export function hslaToRgba(h: number, s: number, l: number, a: number = 100): number {
  return colorToRgba(`hsla(${h}, ${s}%, ${l}%, ${a}%)`)
}

export function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}
