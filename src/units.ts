import { slice } from "./engine";
import { Unit } from "./game";
import * as sprites from "./sprites";

export function Player() {
  let unit = Rider();
  unit.speed = 50;
  return unit;
}

export function Horse() {
  let unit = new Unit();
  unit.sprites = slice(sprites.horse, 16);
  return unit;
}

export function Rider() {
  let unit = new Unit();
  unit.sprites = slice(sprites.rider, 16);
  unit.speed = 30;
  unit.mount = Horse();
  return unit;
}
