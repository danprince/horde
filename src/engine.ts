export interface Point {
  x: number;
  y: number;
}

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

export function drawSprite(spr: Sprite, x: number, y: number): void {
  if (spr.pivot) (x -= spr.pivot.x), (y -= spr.pivot.y);
  ctx.drawImage(s, spr.x, spr.y, spr.w, spr.h, x, y, spr.w, spr.h);
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

