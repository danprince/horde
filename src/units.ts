import { hunt, wander } from "./actions";
import { hslaToRgba, randomInt, slice } from "./engine";
import { Unit, UnitGroup } from "./game";
import * as sprites from "./sprites";

export function Player() {
  let unit = Leader();
  delete unit.bored;
  return unit;
}

export function Horse() {
  let unit = new Unit();
  unit.sprites = slice(sprites.horse, 16);

  let h = randomInt(10, 40);
  let s = randomInt(10, 30);
  let l = randomInt(30, 60);
  unit.palette = {
    // Horse skin color
    [0x694636ff]: hslaToRgba(h, s, l),
    // Horse hair color
    [0x45283cff]: hslaToRgba(h + 20, s - 8, l - 10),
  };

  return unit;
}

export function Rider() {
  let unit = new Unit();
  unit.sprites = slice(sprites.rider, 16);
  unit.mount = Horse();
  unit.bored = wander;
  return unit;
}

export function Leader() {
  let unit = new Unit();
  unit.mount = Horse();
  unit.sprites = slice(sprites.rider, 16);
  unit.speed = 30;
  unit.influence = 30;
  unit.bored = hunt;

  let h = randomInt(0, 360);
  let s = randomInt(20, 40);
  let l = randomInt(40, 50);

  let color = `hsl(${h}, ${s}%, ${l}%)`;
  let palette = {
    // Cloth color
    [0x8a8733ff]: hslaToRgba(h, s, l),
    // Leather color
    [0x8a6f30ff]: hslaToRgba(h - 15, s - 10, l - 10),
    // Accent color
    [0x9b9947ff]: hslaToRgba(h, s + 10, l + 10),
    // Hair color
    [0x222034ff]: hslaToRgba(30, s, l),
  };

  new UnitGroup(unit, color, palette);

  return unit;
}
