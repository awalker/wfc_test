import chalk from "chalk";
console.log("Even Simpler Tiled Model");

enum Tile { SEA, COAST, LAND };
enum Direction { UP, DOWN, RIGHT, LEFT };
type Rule = [Tile, Tile, Direction];
type RuleHash = { [key: number]: { [key: number]: Tile[] } }; // [dir]: {[self]: [others]}
type TileWeights = { [key: number]: number };
type Superposition = Tile[];
type RuleCtx = {
    weights: TileWeights,
    rules: RuleHash,
}

const example: Rule = [Tile.COAST, Tile.SEA, Direction.RIGHT];
const inverse: Rule = [Tile.SEA, Tile.COAST, Direction.LEFT];

const inputMap = `
sscss
sclcc
sclcs
clllc
`.trim().split("\n");
console.log(inputMap);

function stringToTile(s: string): Tile {
    switch (s.toLowerCase()) {
        case "s": return Tile.SEA;
        case "c": return Tile.COAST;
        case "l": return Tile.LAND;
        default: throw new Error("Invalid tile");
    }
}

function stringToTiles(s: string): Tile[] {
    const tiles: Tile[] = [];
    for (let i = 0; i < s.length; i++) {
        if (s[i] !== " ") {
            tiles.push(stringToTile(s[i]));
        }
    }
    return tiles;
}

function stringToDirection(s: string): Direction {
    switch (s.toLowerCase()) {
        case "n": return Direction.UP;
        case "s": return Direction.DOWN;
        case "e": return Direction.RIGHT;
        case "w": return Direction.LEFT;
        default: throw new Error("Invalid direction");
    }
}

function stringifyTile(tile: Tile): string {
    switch (tile) {
        case Tile.SEA: return chalk.bgHex("#0000FF").white("s");
        case Tile.COAST: return chalk.bgHex("#F0F033").white("c");
        case Tile.LAND: return chalk.bgHex("#00FF00").white("l");
        default: return chalk.bgHex("#000000").hex("#FFFFFF").white("?");
    }
}

function stringifySuperposition(superposition: Superposition): string {
    if (!superposition) {
        return chalk.bgHex("#000000").hex("#FFFFFF").white("U");
    }
    if (superposition.length === 0) {
        return chalk.bgHex("#000000").hex("#FFFFFF").white("?");
    }
    if (superposition.length === 1) {
        return stringifyTile(superposition[0]);
    }
    let pairs = "";
    const tiles = superpositionToTiles(superposition);
    if (tiles.indexOf(Tile.COAST) !== -1) {
        pairs += "FF";
    } else {
        pairs += "00";
    }
    if (tiles.indexOf(Tile.LAND) !== -1) {
        pairs += "FF";
    } else {
        pairs += "00";
    }
    if (tiles.indexOf(Tile.SEA) !== -1) {
        pairs += "FF";
    } else {
        pairs += "00";
    }
    return chalk.bgHex(`#${pairs}`).hex(pairs === "FFFFFF" ? "#000" : "#FFFFFF").white(`${superposition.length}`);
}

function stringifyDirection(direction: Direction): string {
    switch (direction) {
        case Direction.UP: return chalk.bgBlack.green.bold("U");
        case Direction.DOWN: return chalk.bgBlack.red.bold("D");
        case Direction.RIGHT: return chalk.bgBlack.cyan.bold("R");
        case Direction.LEFT: return chalk.bgBlack.magenta.bold("L");
        default: throw new Error("Invalid direction");
    }
}

function stringifyRule(rule: Rule): string {
    return `${stringifyTile(rule[0])}${stringifyTile(rule[1])}${stringifyDirection(rule[2])}`;
}

function loadTiles(img: string[]): Tile[][] {
    const tiles: Tile[][] = [];
    for (let i = 0; i < img.length; i++) {
        tiles.push(stringToTiles(img[i]));
    }
    return tiles;
}

function stringifyTiles(tiles: Tile[][]): string {
    const lines: string[] = [];
    for (let i = 0; i < tiles.length; i++) {
        lines.push(tiles[i].map(stringifyTile).join(""));
    }
    return lines.join("\n");
}

function inferRules(map: Tile[][]): Rule[] {
    const rules: Rule[] = [];
    function addRule(p: Rule) {
        if (!rules.some(r => r[0] === p[0] && r[1] === p[1] && r[2] === p[2])) {
            rules.push(p);
        }
    }
    const h = map.length;
    const w = map[0].length;
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            const self = map[i][j];
            if (j < w - 1) {
                // EAST...
                const east = map[i][j + 1];
                addRule([self, east, Direction.RIGHT]);
            }

            if (j > 0) {
                // WEST...
                const west = map[i][j - 1];
                addRule([self, west, Direction.LEFT]);
            }

            if (i > 0) {
                // NORTH...
                const north = map[i - 1][j];
                addRule([self, north, Direction.UP]);
            }

            if (i < h - 1) {
                // SOUTH...
                const south = map[i + 1][j];
                addRule([self, south, Direction.DOWN]);
            }

        }
    }
    return rules.sort((a, b) => {
        if (a[0] === b[0]) {
            if (a[1] === b[1]) {
                return a[2] - b[2];
            } else {
                return a[1] - b[1];
            }
        } else {
            return a[0] - b[0];
        }
    });
}

function inferWeights(map: Tile[][]) {
    const weights: TileWeights = {};
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            const tile = map[i][j];
            weights[tile] = (weights[tile] || 0) + 1;
        }
    }
    return weights;
}

function hashRules(rules: Rule[]): RuleHash {

    const h = rules.reduce((acc, rule) => {
        const [self, other, dir] = rule;
        const a = acc[dir] || {};
        const b = a[self] || []
        a[self] = [...b, other];
        acc[dir] = a;
        return acc;
    }, {} as RuleHash);

    return h;
}

function initMap(w: number, h: number): Superposition[][] {
    const map: Superposition[][] = [];
    for (let i = 0; i < h; i++) {
        let row: Superposition[] = [];
        for (let j = 0; j < w; j++) {
            row.push([Tile.SEA, Tile.LAND, Tile.COAST]);
        }
        map.push(row);
    }
    return map;
}

function rand(max: number): number {
    return Math.round(Math.random() * max);
}

function superpositionToTiles(sp: Superposition): Tile[] {
    if (!sp || sp.length === 0) {
        throw new Error("Superposition is empty");
    }
    return sp as Tile[];
}

function collapseSingle(weights: TileWeights, sp: Superposition): Superposition {
    if (!sp || sp.length === 0) {
        throw new Error("Superposition is empty");
    }
    const tiles = sp as Tile[];
    if (tiles.length === 1) {
        return [tiles[0]];
    } else {
        const total = weightSuperposition(weights, sp);
        let r = rand(total);
        const or = r;
        for (let i = 0; i < tiles.length; i++) {
            const t = tiles[i];
            r -= weights[t];

            if (r <= 0) {
                return [t];
            }
        }
        throw new Error(`Could not collapse ${sp}`);
    }
}

const log = Math.log;

function weightSuperposition(weights: TileWeights, sp: Superposition): number {
    if (!sp || sp.length === 0) {
        throw new Error("Superposition is empty");
    }
    const tiles = superpositionToTiles(sp);
    let total = 0;
    for (let i = 0; i < tiles.length; i++) {
        total += weights[tiles[i]];
    }
    return total;
}

function calculateEntropy({ weights }: RuleCtx, sp: Superposition) {
    if (!sp || sp.length === 0) {
        throw new Error("Superposition is empty");
    }
    const len = sp.length
    if (len === 1) {
        return 0;
    }

    return log(weightSuperposition(weights, sp)) / log(3);
}

function findLowestEntropy(ctx: RuleCtx, map: number[][]): [number, number] {
    let coords = [-1, -1] as [number, number];
    let best = Infinity;

    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            const e = map[i][j];
            if (e === 0) {
                continue;
            }
            if (e < best) {
                best = e;
                coords = [i, j];
            }
        }
    }

    return coords;
}

function propagate(ctx: RuleCtx, entropyMap: number[][], map: Superposition[][], x: number, y: number): [Superposition[][], number[][]] {
    const { rules } = ctx;
    const selfSp = map[y][x];

    if (selfSp.length === 1) {
        const self = selfSp[0];
        let dir = Direction.RIGHT;
        const list: { xx: number, yy: number, dir: Direction }[] = [];
        try {
            if (x > 0) {
                list.push({ xx: x - 1, yy: y, dir: Direction.LEFT });
            }
            if (x < map[0].length - 1) {
                list.push({ xx: x + 1, yy: y, dir: Direction.RIGHT });
            }
            if (y > 0) {
                list.push({ xx: x, yy: y - 1, dir: Direction.UP });
            }
            if (y < map.length - 1) {
                list.push({ xx: x, yy: y + 1, dir: Direction.DOWN });
            }

            for (const op of list) {
                dir = op.dir;
                const { xx, yy } = op;
                const east = map[yy][xx];
                if (east.length > 1) {
                    map[yy][xx] = east.filter(t => rules[op.dir][self].indexOf(t) !== -1);
                    entropyMap[yy][xx] = calculateEntropy(ctx, map[yy][xx]);
                }

            }
        } catch (e) {
            console.warn("dir", Direction[dir].toString(), "self", Tile[self].toString());
            console.error(e);
            console.log(stringifySPMap(map));
            throw e;
        }
    }
    return [map, entropyMap];
}

function collapseMap(map: Superposition[][], rules: RuleCtx): Tile[][] {
    let entropyMap: number[][] = [];
    for (let i = 0; i < map.length; i++) {
        entropyMap[i] = [];
        for (let j = 0; j < map[i].length; j++) {
            entropyMap[i][j] = calculateEntropy(rules, map[i][j]);
        }
    }
    // Create base of new map;
    let workLeft = map.length * map[0].length;
    while (true) {
        const [i, j] = findLowestEntropy(rules, entropyMap);
        if (i === -1) {
            break;
        }
        const tile = map[i][j];
        map[i][j] = collapseSingle(rules.weights, tile);
        entropyMap[i][j] = 0;
        // update neighbors...
        [map, entropyMap] = propagate(rules, entropyMap, map, j, i);
    }
    return map.map(row => row.map(sp => sp[0]));
}

function stringifySPMap(map: Superposition[][]): string {
    return map.map(row => row.map(stringifySuperposition).join("")).join("\n");
}


const ourTiles = loadTiles(inputMap);
const ourRules = inferRules(ourTiles);
const ruleCtx = {
    weights: inferWeights(ourTiles),
    rules: hashRules(ourRules)
} as RuleCtx;
console.log("==== Our Rules ====");
console.log(ourRules.map(stringifyRule).join("\n"));
console.log(ruleCtx);
console.log("");

console.log("=== Rebuild Input Map ===");
console.log(stringifyTiles(ourTiles));

console.log("=== New Map ===");
let newMap = collapseMap(initMap(32, 10), ruleCtx);
console.log(stringifyTiles(newMap));
