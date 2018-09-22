import {canvas, normalizeTree} from '@thi.ng/hdom-canvas';
// import { canvas2D, adaptDPI } from "@thi.ng/hdom-components/canvas";
import {dropdown} from '@thi.ng/hdom-components/dropdown';
// for testing SVG conversion
import {serialize} from '@thi.ng/hiccup';
import {convertTree} from '@thi.ng/hiccup-svg/convert';
import {svg} from '@thi.ng/hiccup-svg/svg';
import {fromRAF} from '@thi.ng/rstream/from/raf';
import {stream} from '@thi.ng/rstream/stream';
import {sync} from '@thi.ng/rstream/stream-sync';
import {updateDOM} from '@thi.ng/transducers-hdom';
import {range} from '@thi.ng/transducers/iter/range';
import {repeatedly} from '@thi.ng/transducers/iter/repeatedly';
import {map} from '@thi.ng/transducers/xform/map';
import {add2o, subN2} from '@thi.ng/vectors/vec2';
import Perlin from 'pf-perlin';

import logo from '../assets/logo-64.png'; // ignore error, resolved by parcel

import {download} from './download';
import {distance, Position, randdir, randpos, scale} from './position';
import {SpatialMap} from './spatialMap';



// canvas size
const W = 500;
const W2 = W / 2;

const stiple = (n) => {
  const perlin3D = new Perlin({dimensions: 2, wavelength: 0.5, octaves: 5})

  let points = [];
  let h = new SpatialMap(10);
  for (var i = 0; i < n; i++) {
    let newpos = randpos(W);
    let d = 10;
    d -= perlin3D.get(scale(newpos, 1 / W2)) * 10;

    // d *= distance(newpos, [0, 0]) / W2;
    // d = 10 - d;
    // d *= 0.9;
    // d *= Math.sin(d / 2);
    // d *= 2.;
    let cellSize = W2 / 6.;
    let cellPos = newpos.map((x) => Math.floor(x / cellSize) * cellSize);
    // d = distance(subN2(cellPos, -cellSize / 2), [0, 0]) / W2;

    let p = perlin3D.get(scale(cellPos, 5 / W2))
    d = p * p * 16;

    // d *= 20;
    // let cellpos = newpos
    // d = Math.abs(d);
    // d = x + y;
    d += 1.9;
    // d = Math.max(d, 2.0);

    // d = Math.min(d, 10);

    // console.log(d);
    let closePoints = h.getNeighbors(newpos);
    if (!closePoints.some((a) => distance(a, newpos) < d)) {
      points.push(newpos);
      h.insert(newpos);
    }
  }
  // return points;
  return spatialSort(points);
};

const weirdSort = (points: Array<Position>) => {
  return points.sort((a, b) => {
    let gs = W / 20;  // gridSize
    let xslot = Math.floor(a[0] / gs) - Math.floor(b[0] / gs);
    let yslot = Math.floor(a[1] / gs) - Math.floor(b[1] / gs);
    return xslot * yslot;
  })
};
const spatialSort = (points: Array<Position>) => {
  return points.sort((a, b) => {
    let n = 10;
    let gs = W / n;  // gridSize
    let xslot = Math.floor(a[0] / gs) - Math.floor(b[0] / gs);
    let yslot = Math.floor(a[1] / gs) - Math.floor(b[1] / gs);
    let flip = Math.floor(a[1] / gs) % 2 === 0 ? 1 : -1
    return (xslot * flip) - yslot * n;
  })
};
// various tests for different shapes & canvas drawing options
// each test is a standalone component (only one used at a time)
const TESTS = {

  'stiple': {
    attribs: {__diff: false},
    desc: '10,000 random rects',
    body: () =>
        ['points', {
          fill: '#000',
          stroke: 'none',
          translate: [W2, W2],
          size: 0.8,
        },
         [...stiple(20000)]],
  },

  'sortedPath': {
    attribs: {__diff: false},
    desc: '10,000 random rects',
    body: () =>
        ['polyline', {
          fill: 'none',
          stroke: '#000',
          translate: [W2, W2],
          weight: 0.2,
        },
         [...stiple(50000)]],
  },


  'dash offset': {
    attribs: {},
    desc: 'Simple path w/ animated stroke dash pattern',
    body: () =>
        ['path', {
          fill: 'blue',
          stroke: '#000',
          weight: 3,
          dash: [4, 8],
          dashOffset: (Date.now() * 0.01) % 12
        },
         [
           ['M', [10, 10]], ['Q', [W2, W2], [W2, W - 10]],
           ['Q', [W2, W2], [W - 10, 10]], ['Q', [W2, W2], [10, 10]]
         ]]
  },


  'points 1k': {
    attribs: {__diff: false},
    desc: '1,000 random circles',
    body: () =>
        ['points', {
          fill: '#000',
          stroke: 'none',
          size: 4,
          translate: [W2, W2],
          scale: 0.6 + 0.4 * Math.sin(Date.now() * 0.005),
          shape: 'circle'
        },
         [...repeatedly(() => randpos(W), 1000)]],
  },


  'rounded rects': {
    attribs: {},
    desc: 'Rounded rects w/ animated corner radii',
    body: () => {
      const t = Date.now() * 0.01;
      const r = 100 * (Math.sin(t * 0.5) * 0.5 + 0.5);
      return [
        'g', {
          weight: 1,
          stroke: '#00f',
          align: 'center',
          baseLine: 'middle',
          font: '48px Menlo',
          __normalize: false
        },
        ...map(
            (i) => ['rect', null, [i, i], W - 2 * i, W - 2 * i, r],
            range(10, 50, 5)),
        ['text', {}, [W2, W2], Math.round(r)]
      ];
    }
  },


  'images 1k': {
    attribs: {},
    desc: '1,000 stateful image sprite components',
    body: (() => {
      const img = new Image();
      img.src = logo;
      const w = W - 64;
      const ball = () => {
        const p = randpos(W);
        const v = randdir(4);
        return () => {
          let x = p[0] + v[0];
          let y = p[1] + v[1];
          (x < 0) && (x *= -1, v[0] *= -1);
          (y < 0) && (y *= -1, v[1] *= -1);
          (x > w) && (x = w - (x - w), v[0] *= -1);
          (y > w) && (y = w - (y - w), v[1] *= -1);
          p[0] = x;
          p[1] = y;
          return ['img', {}, [...p], img];
        };
      };
      const body = ['g', {}, ...repeatedly(ball, 1000)];
      return () => body;
    })()
  },

};

// test case selection dropdown
const choices = (_, target, id) =>
    [dropdown, {
      class: 'w4 ma2',
      onchange: (e) => {
        window.location.hash = e.target.value.replace(/\s/g, '-');
        target.next(e.target.value);
      }
    },
     Object.keys(TESTS).map((k) => [k, k]), id];

// event stream for triggering SVG conversion / export
const trigger = stream<boolean>();
// stream supplying current test ID
const selection = stream<string>();

// stream combinator updating & normalizing selected test component tree
// (one of the inputs is linked to RAF to trigger updates)
const scene =
    sync({src: {id: selection, time: fromRAF()}})
        .transform(
            map(({id}) => ({id, shapes: normalizeTree({}, TESTS[id].body())})));

// stream transformer to produce & update main user interface root component
scene.transform(
    map(({id, shapes}) =>
            ['div.vh-100.flex.flex-column.justify-center.items-center.code.f7',
             [
               'div', [choices, selection, id],
               [
                 'button.ml2', {onclick: () => trigger.next(true)},
                 'convert & export'
               ]
             ],

             // hdom-canvas component w/ injected `scene` subtree
             // turn __normalize off because `scene` already contains
             // normalized tree
             [
               canvas, {
                 class: 'ma2',
                 width: W,
                 height: W,
                 __normalize: false,
                 ...TESTS[id].attribs
               },
               shapes
             ],
]),
    updateDOM());

// stream combinator which triggers SVG conversion and file download
// when both inputs have triggered (one of them being linked to the export
// button)
sync({
  src: {scene, trigger},
  reset: true,
  xform:
      map(({scene}) => download(
              new Date().toISOString().replace(/[:.-]/g, '') + '.svg',
              serialize(
                  svg({width: 300, height: 300, stroke: 'none', fill: 'none'},
                      convertTree(scene.shapes)))))
});

// seed initial test selection
selection.next(
    window.location.hash.length > 1 ?
        window.location.hash.substr(1).replace(/-/g, ' ') :
        'stiple');

// HMR handling
// terminate `scene` rstream to avoid multiple running instances after HMR
// (this will also terminate all attached child streams/subscriptions)
const hot = (<any>module).hot;
if (hot) {
  hot.dispose(() => scene.done());
}
