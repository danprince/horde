import { Palette, Sprite } from "./engine";
import {
  Direction,
  EAST,
  Point,
  Rectangle,
  isCircleInCircle,
} from "./geometry";

export class Game {
  player: Unit = undefined!;
  units = new Set<Unit>();
  decorations = new Set<Decoration>();

  update(dt: number) {
    for (let unit of this.units) {
      unit.update(dt);
    }

    for (let deco of this.decorations) {
      deco.update(dt);
    }
  }

  spawn(unit: Unit, x: number, y: number) {
    unit.x = x;
    unit.y = y;
    this.units.add(unit);
  }

  decorate(deco: Decoration, x: number, y: number) {
    deco.x = x;
    deco.y = y;
    this.decorations.add(deco);
  }

  despawn(unit: Unit) {
    this.units.delete(unit);
  }

  viewport(): Rectangle {
    return {
      x1: (this.player.x - c.width / 2) | 0,
      y1: (this.player.y - c.height / 2) | 0,
      x2: (this.player.x + c.width / 2) | 0,
      y2: (this.player.y + c.height / 2) | 0,
    };
  }

  screenToWorld(point: Point): Point {
    let rect = c.getBoundingClientRect();
    let x = ((point.x - rect.x) / (rect.width / c.width)) | 0;
    let y = ((point.y - rect.y) / (rect.height / c.height)) | 0;
    let { x1, y1 } = this.viewport();
    return { x: x + x1, y: y + y1 };
  }
}

export class Unit {
  x = 0;
  y = 0;
  z = 0;
  speed: number = 10;
  sprites: Sprite[] = [];
  direction: Direction = EAST;
  mount?: Unit;
  heading?: Point;
  palette?: Palette;
  group?: UnitGroup;
  influence: number = 10;
  goal?(dt: number): void;
  bored?(unit: Unit) {}

  isLeader() {
    return this.group?.leader === this;
  }

  intersects(unit: Unit) {
    return isCircleInCircle(
      this.x,
      this.y,
      this.influence,
      unit.x,
      unit.y,
      unit.influence,
    );
  }

  update(dt: number) {
    this.goal?.(dt);

    if (!this.goal) {
      this.bored?.(this);
    }

    if (this.group?.leader === this) {
      this.updateInfluence();
    }
  }

  updateInfluence() {
    for (let unit of game.units) {
      if (unit !== this) {
        if (this.intersects(unit) && !unit.group) {
          this.group!.add(unit);
        }
      }
    }
  }
}

export class UnitGroup {
  leader: Unit;
  units = new Set<Unit>();
  color: string;
  palette: Palette;

  constructor(leader: Unit, color: string, palette: Palette) {
    this.leader = leader;
    this.color = color;
    this.palette = palette;

    this.add(leader);
  }

  add(unit: Unit) {
    unit.group = this;
    unit.palette = this.palette;
    this.units.add(unit);
    this.leader.influence += 1;
  }
}

export class Decoration {
  x: number = 0;
  y: number = 0;
  sprite: Sprite;

  private animation: Sprite[];
  private timer: number = 0;
  private speed: number;
  private index: number = 0;

  constructor(sprites: Sprite[], speed: number = Infinity) {
    this.sprite = sprites[0];
    this.animation = sprites;
    this.speed = speed;
  }

  update(dt: number) {
    this.timer += dt;
    if (this.timer > this.speed) {
      this.index = (this.index + 1) % this.animation.length;
      this.timer = 0;
    }
    this.sprite = this.animation[this.index];
  }
}

export let game = new Game();
