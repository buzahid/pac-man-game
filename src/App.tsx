import { useState, useEffect, useCallback, useRef } from 'react';
import { useKV } from '@github/spark/hooks';
import { GameCanvas } from '@/components/GameCanvas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Heart, Play, Pause, ArrowsClockwise } from '@phosphor-icons/react';
import {
  GameState,
  Direction,
  initializeDots,
  initializePowerPellets,
  initializeGhosts,
  getNextPosition,
  canMove,
  positionToKey,
  checkCollision,
  getGhostTarget,
  getBestDirection,
} from '@/lib/gameLogic';
import { toast } from 'sonner';

const INITIAL_LIVES = 3;
const POWER_UP_DURATION = 6000;
const GAME_SPEED = 150;
const GHOST_SPEED = 180;

function App() {
  const [highScore, setHighScore, deleteHighScore] = useKV<number>('pacman-high-score', 0);
  const [showGameOver, setShowGameOver] = useState(false);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const ghostLoopRef = useRef<number | undefined>(undefined);
  const lastMoveTimeRef = useRef<number>(0);
  const lastGhostMoveTimeRef = useRef<number>(0);
  const powerUpTimerRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>({
    pacman: {
      position: { x: 14, y: 23 },
      direction: null,
      nextDirection: null,
      mouthOpen: false,
    },
    ghosts: initializeGhosts(),
    dots: initializeDots(),
    powerPellets: initializePowerPellets(),
    score: 0,
    lives: INITIAL_LIVES,
    status: 'READY',
    level: 1,
    powerUpTimer: 0,
    frightenedMultiplier: 1,
  });

  const resetGame = useCallback(() => {
    setGameState({
      pacman: {
        position: { x: 14, y: 23 },
        direction: null,
        nextDirection: null,
        mouthOpen: false,
      },
      ghosts: initializeGhosts(),
      dots: initializeDots(),
      powerPellets: initializePowerPellets(),
      score: 0,
      lives: INITIAL_LIVES,
      status: 'READY',
      level: 1,
      powerUpTimer: 0,
      frightenedMultiplier: 1,
    });
    setShowGameOver(false);
    lastMoveTimeRef.current = 0;
    lastGhostMoveTimeRef.current = 0;
    powerUpTimerRef.current = 0;
  }, []);

  const startGame = useCallback(() => {
    setGameState((prev) => ({ ...prev, status: 'PLAYING' }));
    toast.success('Game Started!');
  }, []);

  const togglePause = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      status: prev.status === 'PLAYING' ? 'PAUSED' : 'PLAYING',
    }));
  }, []);

  const respawnPacman = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      pacman: {
        position: { x: 14, y: 23 },
        direction: null,
        nextDirection: null,
        mouthOpen: false,
      },
      ghosts: initializeGhosts(),
      status: 'READY',
    }));

    setTimeout(() => {
      setGameState((prev) => ({ ...prev, status: 'PLAYING' }));
    }, 2000);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.status === 'GAME_OVER') return;

      let newDirection: Direction = null;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          newDirection = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          newDirection = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newDirection = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          newDirection = 'RIGHT';
          break;
        case ' ':
          e.preventDefault();
          if (gameState.status === 'READY') {
            startGame();
          } else if (gameState.status === 'PLAYING' || gameState.status === 'PAUSED') {
            togglePause();
          }
          return;
      }

      if (newDirection) {
        e.preventDefault();
        if (gameState.status === 'READY') {
          startGame();
        }
        setGameState((prev) => ({
          ...prev,
          pacman: { ...prev.pacman, nextDirection: newDirection },
        }));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.status, startGame, togglePause]);

  useEffect(() => {
    if (gameState.status !== 'PLAYING') return;

    const gameLoop = () => {
      const now = Date.now();

      if (now - lastMoveTimeRef.current > GAME_SPEED) {
        lastMoveTimeRef.current = now;

        setGameState((prev) => {
          const newState = { ...prev };
          
          if (prev.pacman.nextDirection) {
            const testPos = getNextPosition(prev.pacman.position, prev.pacman.nextDirection);
            if (canMove(testPos.x, testPos.y)) {
              newState.pacman.direction = prev.pacman.nextDirection;
              newState.pacman.nextDirection = null;
            }
          }

          if (prev.pacman.direction) {
            const nextPos = getNextPosition(prev.pacman.position, prev.pacman.direction);
            if (canMove(nextPos.x, nextPos.y)) {
              newState.pacman.position = nextPos;
              newState.pacman.mouthOpen = !prev.pacman.mouthOpen;
            }
          }

          const posKey = positionToKey(newState.pacman.position);

          if (prev.dots.has(posKey)) {
            const newDots = new Set(prev.dots);
            newDots.delete(posKey);
            newState.dots = newDots;
            newState.score = prev.score + 10;

            if (newDots.size === 0) {
              newState.status = 'LEVEL_COMPLETE';
              toast.success('Level Complete!');
              setTimeout(() => {
                setGameState((s) => ({
                  ...s,
                  dots: initializeDots(),
                  powerPellets: initializePowerPellets(),
                  level: s.level + 1,
                  status: 'READY',
                }));
                setTimeout(() => {
                  setGameState((s) => ({ ...s, status: 'PLAYING' }));
                }, 2000);
              }, 2000);
            }
          }

          if (prev.powerPellets.has(posKey)) {
            const newPellets = new Set(prev.powerPellets);
            newPellets.delete(posKey);
            newState.powerPellets = newPellets;
            newState.score = prev.score + 50;
            newState.powerUpTimer = POWER_UP_DURATION;
            newState.frightenedMultiplier = 1;
            powerUpTimerRef.current = POWER_UP_DURATION;

            newState.ghosts = prev.ghosts.map((ghost) => ({
              ...ghost,
              mode: 'FRIGHTENED',
            }));

            toast.success('Power Up!');
          }

          if (prev.powerUpTimer > 0) {
            const newTimer = Math.max(0, prev.powerUpTimer - GAME_SPEED);
            newState.powerUpTimer = newTimer;
            powerUpTimerRef.current = newTimer;

            if (newTimer === 0) {
              newState.ghosts = prev.ghosts.map((ghost) => ({
                ...ghost,
                mode: ghost.mode === 'FRIGHTENED' ? 'CHASE' : ghost.mode,
              }));
            }
          }

          for (const ghost of prev.ghosts) {
            if (checkCollision(newState.pacman.position, ghost.position)) {
              if (ghost.mode === 'FRIGHTENED') {
                const points = 200 * newState.frightenedMultiplier;
                newState.score = prev.score + points;
                newState.frightenedMultiplier = prev.frightenedMultiplier * 2;
                toast.success(`+${points} points!`);

                newState.ghosts = prev.ghosts.map((g) =>
                  g.id === ghost.id
                    ? { ...g, position: { x: 13, y: 14 }, mode: 'CHASE' }
                    : g
                );
              } else {
                newState.lives = prev.lives - 1;
                toast.error('Life Lost!');

                if (newState.lives <= 0) {
                  newState.status = 'GAME_OVER';
                  setShowGameOver(true);
                  const currentHighScore = highScore || 0;
                  if (newState.score > currentHighScore) {
                    setHighScore(() => newState.score);
                    toast.success('New High Score!');
                  }
                } else {
                  setTimeout(() => respawnPacman(), 1000);
                }
                break;
              }
            }
          }

          return newState;
        });
      }

      if (now - lastGhostMoveTimeRef.current > GHOST_SPEED) {
        lastGhostMoveTimeRef.current = now;

        setGameState((prev) => {
          const newGhosts = prev.ghosts.map((ghost) => {
            const target = getGhostTarget(ghost, prev.pacman.position, prev.pacman.direction);
            const newDirection = getBestDirection(ghost.position, ghost.direction, target, true);
            const nextPos = getNextPosition(ghost.position, newDirection);

            if (canMove(nextPos.x, nextPos.y, true)) {
              return {
                ...ghost,
                position: nextPos,
                direction: newDirection,
              };
            }

            return ghost;
          });

          return { ...prev, ghosts: newGhosts };
        });
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.status, highScore, setHighScore, respawnPacman]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="font-arcade text-4xl md:text-5xl text-primary neon-glow mb-2">
            PAC-MAN
          </h1>
          <p className="text-muted-foreground text-sm">Arrow Keys or WASD to Move • Space to Pause</p>
        </div>

        <Card className="p-6 bg-card border-primary/30">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1">SCORE</p>
                <p className="text-2xl font-bold text-accent tracking-wider">
                  {gameState.score.toString().padStart(6, '0')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">HIGH SCORE</p>
                <p className="text-2xl font-bold text-primary tracking-wider">
                  {(highScore || 0).toString().padStart(6, '0')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">LEVEL</p>
                <p className="text-2xl font-bold text-foreground tracking-wider">
                  {gameState.level}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-2 text-lg gap-2">
                {Array.from({ length: gameState.lives }).map((_, i) => (
                  <Heart key={i} weight="fill" className="text-destructive" />
                ))}
              </Badge>
            </div>
          </div>

          <div className="flex justify-center mb-4">
            <GameCanvas gameState={gameState} />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {gameState.status === 'READY' && (
              <Button onClick={startGame} size="lg" className="neon-border">
                <Play weight="fill" className="mr-2" />
                Start Game
              </Button>
            )}
            {(gameState.status === 'PLAYING' || gameState.status === 'PAUSED') && (
              <>
                <Button onClick={togglePause} variant="secondary" size="lg">
                  {gameState.status === 'PLAYING' ? (
                    <>
                      <Pause weight="fill" className="mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play weight="fill" className="mr-2" />
                      Resume
                    </>
                  )}
                </Button>
                <Button onClick={resetGame} variant="outline" size="lg">
                  <ArrowsClockwise className="mr-2" />
                  Restart
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>

      <AlertDialog open={showGameOver} onOpenChange={setShowGameOver}>
        <AlertDialogContent className="neon-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-arcade text-3xl text-destructive neon-glow text-center">
              GAME OVER
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-4 pt-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">FINAL SCORE</p>
                <p className="text-4xl font-bold text-accent">
                  {gameState.score.toString().padStart(6, '0')}
                </p>
              </div>
              {gameState.score === (highScore || 0) && gameState.score > 0 && (
                <p className="text-primary font-bold neon-glow">NEW HIGH SCORE!</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={resetGame} className="w-full neon-border">
              <ArrowsClockwise className="mr-2" />
              Play Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;