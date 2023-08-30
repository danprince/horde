import { Palette, Sprite } from "./engine";
import {
  Direction,
  EAST,
  Point,
  Rectangle,
  getDistanceBetweenPoints,
  isCircleInCircle,
  isPointInCircle,
} from "./geometry";

export class Game {
  player: Unit = undefined!;
  units = new Set<Unit>();
  groups = new Set<UnitGroup>();
  decorations = new Set<Decoration>();
  projectiles = new Set<Projectile>();
  cursor: Point | undefined;

  update(dt: number) {
    for (let unit of this.units) {
      unit.update(dt);
    }

    for (let deco of this.decorations) {
      deco.update(dt);
    }

    for (let group of this.groups) {
      group.update();
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
    unit.group?.remove(unit);
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

  getUnitsInCircle(x: number, y: number, r: number): Unit[] {
    return Array.from(this.units).filter(unit =>
      isCircleInCircle(x, y, r, unit.x, unit.y, 1),
    );
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

  followers(): Unit[] {
    return this.isLeader()
      ? Array.from(this.group!.units).filter(unit => unit !== this)
      : [];
  }

  isWithGroup() {
    return this.group ? this.intersects(this.group.leader) : false;
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

  distance(point: Point): number {
    return getDistanceBetweenPoints(this, point);
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
      if (unit === this || unit.group) continue;

      if (this.intersects(unit)) {
        this.group!.add(unit);
      }
    }
  }

  hasFollowers() {
    return this.isLeader() && this.group!.units.size > 1;
  }

  damage() {
    game.despawn(this);
  }
}

export class UnitGroup {
  leader: Unit;
  units = new Set<Unit>();
  color: string;
  palette: Palette;
  deathwish: boolean = false;

  constructor(leader: Unit, color: string, palette: Palette) {
    this.leader = leader;
    this.color = color;
    this.palette = palette;

    this.add(leader);
    game.groups.add(this);
  }

  add(unit: Unit) {
    unit.group = this;
    unit.palette = this.palette;
    unit.speed = this.leader.speed;
    this.units.add(unit);
    this.leader.influence += 1;
  }

  remove(unit: Unit) {
    unit.group = undefined;
    unit.palette = undefined;
    unit.speed = 10;
    this.units.delete(unit);
    this.leader.influence -= 1;

    if (unit.isLeader()) {
      this.destroy();
    }
  }

  update() {
    for (let group of game.groups) {
      if (this.canConsume(group)) {
        this.consume(group);
      }
    }
  }

  canConsume(group: UnitGroup): boolean {
    return (
      this !== group &&
      !group.deathwish &&
      this.leader.influence > group.leader.influence &&
      isPointInCircle(
        group.leader,
        this.leader.x,
        this.leader.y,
        this.leader.influence,
      )
    );
  }

  consume(group: UnitGroup) {
    group.destroy();
    for (let unit of group.units) {
      this.add(unit);
    }
  }

  destroy() {
    for (let unit of this.units) {
      this.remove(unit);
    }

    game.groups.delete(this);
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

export class Projectile {
  sprites: Sprite[];
  direction: Direction;
  x: number;
  y: number;
  z: number = 0;

  constructor(sprites: Sprite[], x: number, y: number, direction: Direction) {
    this.sprites = sprites;
    this.x = x;
    this.y = y;
    this.direction = direction;
  }
}

export let game = new Game();
