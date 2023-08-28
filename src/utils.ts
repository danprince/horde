import { Sprite } from "./engine";

export function slice(sprite: Sprite, width: number): Sprite[] {
  let sprites: Sprite[] = [];
  for (let x = sprite.x; x < sprite.x + sprite.w; x += width) {
    sprites.push({ ...sprite, x, w: width });
  }
  return sprites;
}
