import { hunt, moveTo, wander } from "./actions";
import { Palette, hslaToRgba, randomInt, slice } from "./engine";
import { Unit, UnitGroup } from "./game";
import * as sprites from "./sprites";

const COLOR_HORSE = 0x694636ff;
const COLOR_HORSE_HAIR = 0x45283cff;
const COLOR_CLOTH = 0x8a8733ff;
const COLOR_LEATHER = 0x8a6f30ff;
const COLOR_HIGHLIGHT = 0x9b9947ff;
const COLOR_HAIR = 0x222034ff;
const COLOR_SKIN = 0xd9a066ff;
const COLOR_WOOD = 0x7d6429ff;

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

let spiritPalette: Palette = {
  [COLOR_CLOTH]: 0x4fdaf590,
  [COLOR_LEATHER]: 0x2c659b60,
  [COLOR_HIGHLIGHT]: 0xa5ffff60,
  [COLOR_HORSE]: 0x31717d60,
  [COLOR_HORSE_HAIR]: 0x182e5560,
  [COLOR_WOOD]: 0x182e5560,
  [COLOR_HAIR]: 0x182e5560,
  [COLOR_SKIN]: 0xc8f6ff60,
};

export function SpiritRider() {
  let unit = Rider();
  unit.speed = 60;
  unit.invulnerable = true;
  unit.bored = () =>
    moveTo(unit, { x: randomInt(0, 1000), y: randomInt(0, 1000) });

  let group = new UnitGroup(unit, "#4fdaf560", spiritPalette);
  unit.mount!.palette = group.palette;
  return unit;
}

export function Yurt() {
  let unit = new Unit();
  unit.sprites = [sprites.yurt];
  unit.static = true;
  unit.invulnerable = true;
  unit.bored = () => {};
  return unit;
}
