# Planning Guide

A classic arcade-style Pac-Man game where players navigate a maze, collect dots, avoid ghosts, and eat power pellets to turn the tables on their pursuers.

**Experience Qualities**:
1. **Nostalgic** - Evokes the iconic feel of the original arcade game with familiar mechanics and visual style
2. **Intense** - Creates exciting tension through ghost AI pursuit and narrow escapes
3. **Responsive** - Provides immediate feedback to keyboard controls with smooth, predictable character movement

**Complexity Level**: Light Application (multiple features with basic state)
This is a single-screen game with core mechanics (movement, collision detection, scoring) and simple state management (lives, score, game status). It doesn't require multiple views but has interactive gameplay features beyond a simple tool.

## Essential Features

### Pac-Man Movement
- **Functionality**: Player controls Pac-Man using arrow keys or WASD to navigate the maze
- **Purpose**: Core gameplay mechanic that enables all other interactions
- **Trigger**: Keyboard arrow keys or WASD pressed
- **Progression**: Key press → Direction change → Pac-Man moves continuously → Collision detection → Wall stops movement or allows passage
- **Success criteria**: Pac-Man moves smoothly in four directions, stops at walls, and wraps around tunnel edges

### Dot Collection
- **Functionality**: Pac-Man collects dots (pellets) by moving over them, removing them from the maze and adding to score
- **Purpose**: Primary objective and score accumulation mechanism
- **Trigger**: Pac-Man's position overlaps with dot position
- **Progression**: Pac-Man moves over dot → Dot disappears → Score increases → Check if all dots collected → Level complete or continue
- **Success criteria**: Dots disappear on contact, score updates immediately, level ends when all dots collected

### Ghost AI & Chase Mechanics
- **Functionality**: Four ghosts patrol the maze with distinct movement patterns, chasing Pac-Man. Ghosts start in the ghost house and exit sequentially with staggered timers.
- **Purpose**: Creates challenge and tension in gameplay
- **Trigger**: Game start or ghost respawn
- **Progression**: Ghost waits in house until exit timer expires → Ghost navigates to exit point → Ghost enters maze → AI calculates movement → Ghost moves toward target → Collision check with Pac-Man → Player loses life or ghost eaten if powered up
- **Success criteria**: Ghosts exit the house sequentially, move smoothly, exhibit different behaviors, and can catch Pac-Man

### Power Pellets
- **Functionality**: Special large dots that temporarily allow Pac-Man to eat ghosts. When ghosts are eaten, they return to the ghost house and must exit again.
- **Purpose**: Adds strategic depth and score multipliers
- **Trigger**: Pac-Man collects power pellet
- **Progression**: Pac-Man eats power pellet → Ghosts turn blue and flee → Timer starts → Pac-Man can eat ghosts for bonus points → Eaten ghosts return to house → Ghost waits briefly then exits → Power-up expires → Remaining ghosts return to chase mode
- **Success criteria**: Ghosts change state visually, become vulnerable, award points when eaten, return to ghost house correctly, and return to normal after timeout

### Lives & Game Over
- **Functionality**: Player starts with 3 lives, loses one when caught by ghost, game ends at 0 lives
- **Purpose**: Stakes and failure condition
- **Trigger**: Ghost touches Pac-Man while not powered up
- **Progression**: Collision detected → Life lost → Pac-Man respawns at start → Continue playing or show game over → Display final score
- **Success criteria**: Lives display updates, respawn works correctly, game over shows with option to restart

## Edge Case Handling

- **Ghost House Exit**: Ghosts exit sequentially with staggered timers (1s, 2s, 3s delays) to prevent overcrowding
- **Multiple Ghost Collisions**: Only one life lost per collision event, brief invincibility period after respawn
- **Power Pellet Timing**: Multiple power pellets extend duration rather than stack
- **Rapid Direction Changes**: Input buffering for corner turns to feel responsive
- **Wall Clipping**: Robust collision detection prevents getting stuck in walls
- **Pause During Ghost Eating**: Brief animation pause when eating ghost for satisfying feedback

## Design Direction

The design should feel like a modern homage to the classic arcade game - vibrant, high-contrast colors with a digital/retro aesthetic that's polished rather than pixelated. The interface should be bold and unapologetic, with glowing neon elements against a dark background creating an arcade cabinet feel.

## Color Selection

A bold neon arcade palette with deep blacks and vibrant glowing colors:

- **Primary Color**: Deep Space Blue `oklch(0.15 0.05 250)` - Dark background that makes neon colors pop, communicates the void of the maze
- **Secondary Colors**: 
  - Neon Yellow `oklch(0.95 0.18 100)` for Pac-Man - Classic, instantly recognizable
  - Electric Cyan `oklch(0.8 0.15 195)` for UI accents and maze walls
  - Ghost Red `oklch(0.65 0.22 25)`, Ghost Pink `oklch(0.75 0.18 350)`, Ghost Cyan `oklch(0.7 0.16 200)`, Ghost Orange `oklch(0.75 0.18 50)` for the four ghosts
  - Frightened Blue `oklch(0.55 0.15 240)` for vulnerable ghosts
- **Accent Color**: Bright White `oklch(0.99 0 0)` for dots and score text - Creates stark contrast for visibility
- **Foreground/Background Pairings**:
  - Deep Space Blue background `oklch(0.15 0.05 250)`: White text `oklch(0.99 0 0)` - Ratio 11.2:1 ✓
  - Electric Cyan accents `oklch(0.8 0.15 195)`: Deep Space Blue text `oklch(0.15 0.05 250)` - Ratio 9.8:1 ✓
  - Neon Yellow `oklch(0.95 0.18 100)`: Deep Space Blue text `oklch(0.15 0.05 250)` - Ratio 13.5:1 ✓

## Font Selection

The typography should feel arcade-authentic with a modern digital twist - geometric, bold, and highly legible even at small sizes.

- **Typographic Hierarchy**:
  - H1 (Game Title): Press Start 2P Bold/32px/tight letter spacing - Authentic pixel-era feel
  - Score Display: Orbitron Bold/24px/wide letter spacing - Digital readout aesthetic
  - UI Labels: Orbitron Medium/16px/normal letter spacing - Clean and technical
  - Game Over/Ready: Press Start 2P Bold/28px/tight letter spacing - High impact messaging

## Animations

Animations should feel snappy and arcade-authentic with instant feedback and satisfying micro-interactions.

- **Character Movement**: Smooth 60fps animation with classic mouth-opening animation for Pac-Man
- **Ghost Movement**: Gentle floating/bobbing motion to distinguish from Pac-Man
- **Power-Up State**: Flashing/pulsing effect on frightened ghosts intensifying as timer expires
- **Death Animation**: Classic Pac-Man spin/collapse animation with brief pause
- **Dot Collection**: Small pop/pulse effect on collection with satisfying feel
- **Score Pop-ups**: Brief floating numbers when eating ghosts or completing levels
- **Game Start**: "READY!" text with fade-in before gameplay begins

## Component Selection

- **Components**: 
  - Custom Canvas component for game rendering (maze, characters, dots)
  - Card component for game container with glowing border effect
  - Button component (modified with neon styling) for Start/Restart
  - Badge component for lives display with custom styling
  - Alert Dialog for Game Over screen with final score
  - Progress bar (custom styled) for power-up timer visualization
- **Customizations**: 
  - Custom game canvas with pixel-perfect grid rendering
  - Custom character sprites using CSS/Canvas rendering
  - Neon glow effects using box-shadow and filters on maze walls
  - Score counter with animated increment effect
- **States**: 
  - Buttons: Neon border glow on hover, press effect with brightness increase, pulsing animation on Ready state
  - Game Canvas: Dim overlay when paused, victory flash effect on level complete
  - Lives Display: Shake animation when life lost, red flash effect
  - Ghost States: Color shift animations, opacity changes when vulnerable
- **Icon Selection**: 
  - Heart icon from Phosphor for lives display
  - Play/Pause icons for game controls
  - ArrowsClockwise for restart
  - Trophy for high score indicator
- **Spacing**: 
  - Game container: p-6 for breathing room around canvas
  - Score display: gap-4 between score and lives
  - Button groups: gap-2 for controls
  - Maze cells: Precise grid with 20px cells for clean alignment
- **Mobile**: 
  - Touch-friendly directional button overlay appears on screens <768px
  - Canvas scales proportionally maintaining aspect ratio
  - Score/lives stack vertically on mobile, horizontal on desktop
  - Larger touch targets (48px minimum) for mobile controls
  - Swipe gestures as alternative to on-screen buttons
