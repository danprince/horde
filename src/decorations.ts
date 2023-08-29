import * as sprites from "./sprites";
import { randomElement, randomInt, slice } from "./engine";
import { Decoration } from "./game";

let grassSpriteVariants = [
  slice(sprites.grass_1, 8),
  slice(sprites.grass_2, 5),
  [sprites.grass_3],
  [sprites.grass_4],
];

let dirtSpriteVariants = slice(sprites.dirt, 6);

let rockSpriteVariants = [
  sprites.rock_1,
  sprites.rock_2,
  sprites.rock_3,
  sprites.rock_4,
  sprites.rock_5,
];

export function Grass() {
  return new Decoration(
    randomElement(grassSpriteVariants),
    randomInt(500, 2000),
  );
}

export function Dirt() {
  return new Decoration([randomElement(dirtSpriteVariants)]);
}

export function Rock() {
  return new Decoration([randomElement(rockSpriteVariants)]);
}
