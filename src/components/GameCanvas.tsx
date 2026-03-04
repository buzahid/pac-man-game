import { useEffect, useRef } from 'react';
import { 
  CELL_SIZE, 
  MAZE_LAYOUT, 
  MAZE_WIDTH, 
  MAZE_HEIGHT,
  GameState,
  positionToKey
} from '@/lib/gameLogic';

interface GameCanvasProps {
  gameState: GameState;
}

export function GameCanvas({ gameState }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawMaze(ctx);
    drawDots(ctx, gameState.dots);
    drawPowerPellets(ctx, gameState.powerPellets);
    drawGhosts(ctx, gameState.ghosts, gameState.powerUpTimer);
    drawPacman(ctx, gameState.pacman);

    if (gameState.status === 'READY') {
      drawText(ctx, 'READY!', canvas.width / 2, canvas.height / 2, '#00ffff', 28);
    } else if (gameState.status === 'GAME_OVER') {
      drawText(ctx, 'GAME OVER', canvas.width / 2, canvas.height / 2, '#ff0000', 28);
    } else if (gameState.status === 'LEVEL_COMPLETE') {
      drawText(ctx, 'LEVEL COMPLETE!', canvas.width / 2, canvas.height / 2, '#00ff00', 28);
    }
  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      width={MAZE_WIDTH * CELL_SIZE}
      height={MAZE_HEIGHT * CELL_SIZE}
      className="neon-border rounded-lg"
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
}

function drawMaze(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  ctx.lineWidth = 2;
  ctx.shadowBlur = 5;
  ctx.shadowColor = ctx.strokeStyle;

  for (let y = 0; y < MAZE_HEIGHT; y++) {
    for (let x = 0; x < MAZE_WIDTH; x++) {
      if (MAZE_LAYOUT[y][x] === '#') {
        const hasTop = y > 0 && MAZE_LAYOUT[y - 1][x] !== '#';
        const hasBottom = y < MAZE_HEIGHT - 1 && MAZE_LAYOUT[y + 1][x] !== '#';
        const hasLeft = x > 0 && MAZE_LAYOUT[y][x - 1] !== '#';
        const hasRight = x < MAZE_WIDTH - 1 && MAZE_LAYOUT[y][x + 1] !== '#';

        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        ctx.beginPath();
        if (hasTop) {
          ctx.moveTo(px, py);
          ctx.lineTo(px + CELL_SIZE, py);
        }
        if (hasBottom) {
          ctx.moveTo(px, py + CELL_SIZE);
          ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE);
        }
        if (hasLeft) {
          ctx.moveTo(px, py);
          ctx.lineTo(px, py + CELL_SIZE);
        }
        if (hasRight) {
          ctx.moveTo(px + CELL_SIZE, py);
          ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE);
        }
        ctx.stroke();
      }
    }
  }

  ctx.shadowBlur = 0;
}

function drawDots(ctx: CanvasRenderingContext2D, dots: Set<string>) {
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim();
  
  dots.forEach(key => {
    const [x, y] = key.split(',').map(Number);
    const px = x * CELL_SIZE + CELL_SIZE / 2;
    const py = y * CELL_SIZE + CELL_SIZE / 2;
    
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPowerPellets(ctx: CanvasRenderingContext2D, pellets: Set<string>) {
  const time = Date.now();
  const pulse = Math.sin(time / 200) * 0.3 + 0.7;
  
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim();
  ctx.shadowBlur = 10 * pulse;
  ctx.shadowColor = ctx.fillStyle;
  
  pellets.forEach(key => {
    const [x, y] = key.split(',').map(Number);
    const px = x * CELL_SIZE + CELL_SIZE / 2;
    const py = y * CELL_SIZE + CELL_SIZE / 2;
    
    ctx.beginPath();
    ctx.arc(px, py, 5 * pulse, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.shadowBlur = 0;
}

function drawPacman(ctx: CanvasRenderingContext2D, pacman: GameState['pacman']) {
  const px = pacman.position.x * CELL_SIZE + CELL_SIZE / 2;
  const py = pacman.position.y * CELL_SIZE + CELL_SIZE / 2;
  const radius = CELL_SIZE / 2 - 2;
  
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--pacman-yellow').trim();
  ctx.shadowBlur = 10;
  ctx.shadowColor = ctx.fillStyle;
  
  let startAngle = 0;
  let endAngle = Math.PI * 2;
  
  if (pacman.mouthOpen) {
    const mouthAngle = Math.PI / 6;
    switch (pacman.direction) {
      case 'RIGHT':
        startAngle = mouthAngle;
        endAngle = Math.PI * 2 - mouthAngle;
        break;
      case 'LEFT':
        startAngle = Math.PI + mouthAngle;
        endAngle = Math.PI - mouthAngle;
        break;
      case 'UP':
        startAngle = Math.PI * 1.5 + mouthAngle;
        endAngle = Math.PI * 1.5 - mouthAngle;
        break;
      case 'DOWN':
        startAngle = Math.PI * 0.5 + mouthAngle;
        endAngle = Math.PI * 0.5 - mouthAngle;
        break;
    }
  }
  
  ctx.beginPath();
  ctx.arc(px, py, radius, startAngle, endAngle);
  ctx.lineTo(px, py);
  ctx.fill();
  
  ctx.shadowBlur = 0;
}

function drawGhosts(ctx: CanvasRenderingContext2D, ghosts: GameState['ghosts'], powerUpTimer: number) {
  const frightenedColor = getComputedStyle(document.documentElement).getPropertyValue('--ghost-frightened').trim();
  const time = Date.now();
  
  ghosts.forEach(ghost => {
    const px = ghost.position.x * CELL_SIZE + CELL_SIZE / 2;
    const py = ghost.position.y * CELL_SIZE + CELL_SIZE / 2;
    const radius = CELL_SIZE / 2 - 2;
    
    let color = ghost.color;
    if (ghost.mode === 'FRIGHTENED') {
      if (powerUpTimer < 2000 && Math.floor(time / 200) % 2 === 0) {
        color = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim();
      } else {
        color = frightenedColor;
      }
    }
    
    ctx.fillStyle = color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    
    ctx.beginPath();
    ctx.arc(px, py - 2, radius, Math.PI, 0, false);
    ctx.lineTo(px + radius, py + radius);
    ctx.lineTo(px + radius * 0.6, py + radius - 3);
    ctx.lineTo(px + radius * 0.2, py + radius);
    ctx.lineTo(px - radius * 0.2, py + radius);
    ctx.lineTo(px - radius * 0.6, py + radius - 3);
    ctx.lineTo(px - radius, py + radius);
    ctx.closePath();
    ctx.fill();
    
    if (ghost.mode !== 'FRIGHTENED') {
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      
      const eyeOffset = 3;
      const eyeRadius = 3;
      
      let eyeX = 0;
      let eyeY = 0;
      switch (ghost.direction) {
        case 'LEFT': eyeX = -2; break;
        case 'RIGHT': eyeX = 2; break;
        case 'UP': eyeY = -2; break;
        case 'DOWN': eyeY = 2; break;
      }
      
      ctx.beginPath();
      ctx.arc(px - eyeOffset + eyeX, py - 2 + eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.arc(px + eyeOffset + eyeX, py - 2 + eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000000';
      const pupilRadius = 1.5;
      ctx.beginPath();
      ctx.arc(px - eyeOffset + eyeX, py - 2 + eyeY, pupilRadius, 0, Math.PI * 2);
      ctx.arc(px + eyeOffset + eyeX, py - 2 + eyeY, pupilRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  
  ctx.shadowBlur = 0;
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size: number) {
  ctx.font = `bold ${size}px 'Press Start 2P', cursive`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 15;
  ctx.shadowColor = color;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
}
