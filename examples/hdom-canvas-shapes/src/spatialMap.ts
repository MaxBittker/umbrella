
import {push} from '@thi.ng/transducers/rfn/push';
import {transduce} from '@thi.ng/transducers/transduce';
import {mapcat} from '@thi.ng/transducers/xform/mapcat';

import {Position} from './position';


class SpatialMap {
  cell_size: number;
  grid: Map<String, Array<Position>>;
  constructor(cell_size: number) {
    this.cell_size = cell_size;
    this.grid = new Map();
  }

  _key(pos: Position, offset: Position = [0, 0]) {
    let x = Math.floor(pos[0] / this.cell_size) + offset[0];
    let y = Math.floor(pos[1] / this.cell_size) + offset[1];

    x *= this.cell_size;
    y *= this.cell_size;

    return `${x} ${y}`;
  };


  insert = function(pos: Position) {
    var obkey = this._key(pos);
    var grid = this.grid;

    if (!grid[obkey]) {
      grid[obkey] = [];
    }

    grid[obkey].push(pos);
  };

  getClosest = function(pos: Position, offset: Position = [0, 0]) {
    return this.grid[this._key(pos, offset)] || [];
  };
  getNeighbors = function(pos: Position) {
    let cells = [
      [0, 0],

      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],

      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ];

    return transduce(mapcat(cell => this.getClosest(pos, cell)), push(), cells);
  }
}

export {SpatialMap};