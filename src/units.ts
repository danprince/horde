import { hunt, wander } from "./actions";
import { hslaToRgba, randomInt, slice } from "./engine";
import { Unit, UnitGroup } from "./game";
import * as sprites from "./sprites";

const COLOR_HORSE = 0x694636ff;
const COLOR_HORSE_HAIR = 0x45283cff;
const COLOR_CLOTH = 0x8a8733ff;
const COLOR_LEATHER = 0x8a6f30ff;
const COLOR_HIGHLIGHT = 0x9b9947ff;

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
    [COLOR_HORSE]: hslaToRgba(h, s, l),
    [COLOR_HORSE_HAIR]: hslaToRgba(h + 20, s - 8, l - 10),
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

  let honorable = Math.random() < 0.25;

  let h = randomInt(0, 360);
  let s = honorable ? randomInt(0, 10) : randomInt(20, 40);
  let l = honorable ? randomInt(20, 60) : randomInt(40, 50);

  let color = `hsl(${h}, ${s}%, ${l}%)`;

  let palette = {
    // Cloth color
    [COLOR_CLOTH]: hslaToRgba(h, s, l),
    // Leather color
    [COLOR_LEATHER]: hslaToRgba(h - 15, s - 10, l - 10),
    // Accent color
    [COLOR_HIGHLIGHT]: hslaToRgba(h, s + 10, l + 10),
  };

  let group = new UnitGroup(unit, color, palette);
  group.honorable = honorable;

  return unit;
}
