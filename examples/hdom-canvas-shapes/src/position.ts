import {cos2, sin2} from '@thi.ng/vectors/vec2';

var RAD2DEG = 180 / Math.PI
var DEG2RAD = Math.PI / 180


type Position = Array<number>;

const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] + b[0], a[1] - b[1]];

const scale = (a, s) => [a[0] * s, a[1] * s];
const multiply = (a, s) => [a[0] * s[0], a[1] * s[1]];

const toPolar = ([x, y]) => [Math.atan2(x, -y) * RAD2DEG, mag([x, y])];

const toCartesian = ([a, r]) => [r * Math.cos(a), r * Math.sin(a)];

const randpos =
    (s) => [Math.random() * s - (s / 2), Math.random() * s - (s / 2)];

const randdir =
    (n = 1) => [Math.random() * n * 2 - n, Math.random() * n * 2 - n];

const distance = (a, b) =>
    Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]));


const mag = ([x, y]) => Math.sqrt((x * x) + (y * y));


export {add, scale, randpos, randdir, distance, Position};