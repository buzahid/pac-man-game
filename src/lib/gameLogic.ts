export const CELL_SIZE = 20;
export const MAZE_WIDTH = 28;
export const MAZE_HEIGHT = 31;

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null;
export type GameStatus = 'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'LEVEL_COMPLETE';

export interface Position {
  x: number;
  y: number;
}

export interface Ghost {
  id: string;
  position: Position;
  direction: Direction;
  color: string;
  mode: 'CHASE' | 'SCATTER' | 'FRIGHTENED' | 'EATEN';
  targetTile: Position;
}

export interface GameState {
  pacman: {
    position: Position;
    direction: Direction;
    nextDirection: Direction;
    mouthOpen: boolean;
  };
  ghosts: Ghost[];
  dots: Set<string>;
  powerPellets: Set<string>;
  score: number;
  lives: number;
  status: GameStatus;
  level: number;
  powerUpTimer: number;
  frightenedMultiplier: number;
}

export const MAZE_LAYOUT = [
  "############################",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#O####.#####.##.#####.####O#",
  "#.####.#####.##.#####.####.#",
  "#..........................#",
  "#.####.##.########.##.####.#",
  "#.####.##.########.##.####.#",
  "#......##....##....##......#",
  "######.##### ## #####.######",
  "######.##### ## #####.######",
  "######.##          ##.######",
  "######.## ###--### ##.######",
  "######.## #      # ##.######",
  "      .   #      #   .      ",
  "######.## #      # ##.######",
  "######.## ######## ##.######",
  "######.##          ##.######",
  "######.## ######## ##.######",
  "######.## ######## ##.######",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#.####.#####.##.#####.####.#",
  "#O..##.......  .......##..O#",
  "###.##.##.########.##.##.###",
  "###.##.##.########.##.##.###",
  "#......##....##....##......#",
  "#.##########.##.##########.#",
  "#.##########.##.##########.#",
  "#..........................#",
  "############################"
];

export function positionToKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

export function keyToPosition(key: string): Position {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

export function isWall(x: number, y: number): boolean {
  if (y < 0 || y >= MAZE_HEIGHT || x < 0 || x >= MAZE_WIDTH) return true;
  return MAZE_LAYOUT[y][x] === '#';
}

export function isGhostHouse(x: number, y: number): boolean {
  return MAZE_LAYOUT[y][x] === '-';
}

export function canMove(x: number, y: number, isGhost: boolean = false): boolean {
  if (y < 0 || y >= MAZE_HEIGHT) return false;
  if (x < 0 || x >= MAZE_WIDTH) return true;
  const cell = MAZE_LAYOUT[y][x];
  if (cell === '#') return false;
  if (cell === '-' && !isGhost) return false;
  return true;
}

export function getNextPosition(pos: Position, dir: Direction): Position {
  if (!dir) return pos;
  
  let newPos = { ...pos };
  
  switch (dir) {
    case 'UP':
      newPos.y -= 1;
      break;
    case 'DOWN':
      newPos.y += 1;
      break;
    case 'LEFT':
      newPos.x -= 1;
      break;
    case 'RIGHT':
      newPos.x += 1;
      break;
  }
  
  if (newPos.x < 0) newPos.x = MAZE_WIDTH - 1;
  if (newPos.x >= MAZE_WIDTH) newPos.x = 0;
  
  return newPos;
}

export function initializeDots(): Set<string> {
  const dots = new Set<string>();
  for (let y = 0; y < MAZE_HEIGHT; y++) {
    for (let x = 0; x < MAZE_WIDTH; x++) {
      if (MAZE_LAYOUT[y][x] === '.') {
        dots.add(positionToKey({ x, y }));
      }
    }
  }
  return dots;
}

export function initializePowerPellets(): Set<string> {
  const pellets = new Set<string>();
  for (let y = 0; y < MAZE_HEIGHT; y++) {
    for (let x = 0; x < MAZE_WIDTH; x++) {
      if (MAZE_LAYOUT[y][x] === 'O') {
        pellets.add(positionToKey({ x, y }));
      }
    }
  }
  return pellets;
}

export function initializeGhosts(): Ghost[] {
  return [
    {
      id: 'blinky',
      position: { x: 13, y: 11 },
      direction: 'LEFT',
      color: 'var(--ghost-red)',
      mode: 'SCATTER',
      targetTile: { x: 25, y: 0 }
    },
    {
      id: 'pinky',
      position: { x: 13, y: 14 },
      direction: 'UP',
      color: 'var(--ghost-pink)',
      mode: 'SCATTER',
      targetTile: { x: 2, y: 0 }
    },
    {
      id: 'inky',
      position: { x: 11, y: 14 },
      direction: 'UP',
      color: 'var(--ghost-cyan)',
      mode: 'SCATTER',
      targetTile: { x: 27, y: 29 }
    },
    {
      id: 'clyde',
      position: { x: 15, y: 14 },
      direction: 'UP',
      color: 'var(--ghost-orange)',
      mode: 'SCATTER',
      targetTile: { x: 0, y: 29 }
    }
  ];
}

export function getDistance(pos1: Position, pos2: Position): number {
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
}

export function getGhostTarget(ghost: Ghost, pacmanPos: Position, pacmanDir: Direction): Position {
  if (ghost.mode === 'FRIGHTENED') {
    return {
      x: Math.floor(Math.random() * MAZE_WIDTH),
      y: Math.floor(Math.random() * MAZE_HEIGHT)
    };
  }
  
  if (ghost.mode === 'SCATTER') {
    if (Math.random() < 0.15) {
      return {
        x: Math.floor(Math.random() * MAZE_WIDTH),
        y: Math.floor(Math.random() * MAZE_HEIGHT)
      };
    }
    return ghost.targetTile;
  }
  
  switch (ghost.id) {
    case 'blinky':
      return pacmanPos;
    
    case 'pinky':
      const ahead = 4;
      let target = { ...pacmanPos };
      if (pacmanDir === 'UP') target.y -= ahead;
      if (pacmanDir === 'DOWN') target.y += ahead;
      if (pacmanDir === 'LEFT') target.x -= ahead;
      if (pacmanDir === 'RIGHT') target.x += ahead;
      return target;
    
    case 'inky':
      return pacmanPos;
    
    case 'clyde':
      const distance = getDistance(ghost.position, pacmanPos);
      return distance > 8 ? pacmanPos : ghost.targetTile;
    
    default:
      return pacmanPos;
  }
}

export function getBestDirection(currentPos: Position, currentDir: Direction, target: Position, isGhost: boolean = false): Direction {
  const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  const opposite: Record<string, Direction> = {
    'UP': 'DOWN',
    'DOWN': 'UP',
    'LEFT': 'RIGHT',
    'RIGHT': 'LEFT'
  };
  
  const validMoves: { dir: Direction; distance: number }[] = [];
  
  for (const dir of directions) {
    if (currentDir && dir === opposite[currentDir]) continue;
    
    const nextPos = getNextPosition(currentPos, dir);
    if (!canMove(nextPos.x, nextPos.y, isGhost)) continue;
    
    const distance = getDistance(nextPos, target);
    validMoves.push({ dir, distance });
  }
  
  if (validMoves.length === 0) {
    return currentDir || 'UP';
  }
  
  validMoves.sort((a, b) => a.distance - b.distance);
  
  const randomChance = Math.random();
  
  if (randomChance < 0.12) {
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex].dir;
  }
  
  if (randomChance < 0.30 && validMoves.length > 1) {
    return validMoves[1].dir;
  }
  
  return validMoves[0].dir;
}

export function checkCollision(pos1: Position, pos2: Position): boolean {
  return Math.abs(pos1.x - pos2.x) < 0.5 && Math.abs(pos1.y - pos2.y) < 0.5;
}
