# Dining Philosophers Simulation

An interactive, educational visualization of the classic Dining Philosophers Problem, based on Dijkstra's concurrency problem and the EUROSIM Comparison C4/C10 specification.

## Live Demo

Visit the live simulation: [Your GitHub Pages URL will be here]

## About the Problem

The Dining Philosophers Problem is a classic computer science problem that illustrates synchronization issues and resource sharing in concurrent systems. Five philosophers sit around a circular table with five chopsticks between them. Each philosopher alternates between thinking and eating, but needs both adjacent chopsticks to eat.

### Key Challenges

- **Concurrent Access**: What happens when multiple philosophers try to grab the same chopstick?
- **Deadlock**: What if all philosophers pick up their left chopstick simultaneously?
- **Starvation**: Can we ensure every philosopher eventually gets to eat?

## Features

### Educational Content
- Clear visualization of philosopher states (thinking, hungry, eating, waiting, deadlock)
- Real-time statistics tracking
- Step-by-step execution mode
- Educational explanations of key concepts

### Simulation Modes

1. **Basic (C10 Rules)**: Follows the EUROSIM C10 specification
   - Discrete uniform distribution [1, 10] for thinking/eating times
   - Always picks left chopstick first
   - Right philosopher gets priority in conflicts
   - Simulation terminates on deadlock

2. **Random Priority**: Random conflict resolution

3. **Waiter Solution**: Maximum 4 philosophers can attempt to eat (prevents deadlock)

4. **Resource Hierarchy**: Numbered resource ordering (prevents deadlock)

### Interactive Controls
- Start/Pause/Reset simulation
- Step-by-step execution
- Adjustable simulation speed (1x to 10x)
- Switch between different strategies
- Real-time statistics display

### Statistics Tracked
- Simulation time
- Events processed
- Simultaneous access occurrences
- Deadlock detection
- Per-philosopher metrics (thinking time, eating time, waiting time)

## Technical Implementation

Based on the EUROSIM Comparison C10 specification:

- **Event-driven discrete simulation**: Proper event queue management with time-ordered execution
- **Simultaneous event handling**: Detects and resolves concurrent access to resources
- **Deadlock detection**: Identifies when all philosophers are waiting in a circular dependency
- **Modular design**: Clean separation of simulation logic and visualization

## How to Use

### Running Locally

1. Clone this repository
2. Open `index.html` in a modern web browser
3. No build process or dependencies required!

### Controls

- **Start**: Begin the simulation
- **Pause/Resume**: Pause and resume execution
- **Reset**: Reset to initial state
- **Step**: Execute one event at a time (great for learning!)
- **Speed Slider**: Adjust simulation speed
- **Strategy Selector**: Try different conflict resolution strategies

## Deploying to GitHub Pages

1. **Create a GitHub repository** for this project

2. **Push the files**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Dining Philosophers Simulation"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click on "Settings"
   - Scroll down to "Pages" section
   - Under "Source", select "main" branch
   - Select "/ (root)" folder
   - Click "Save"

4. **Access your site**:
   - Your simulation will be available at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`
   - It may take a few minutes for the site to be published

## Educational Value

This simulation is perfect for:

- **Computer Science Students**: Understanding concurrency, synchronization, and deadlock
- **Algorithm Classes**: Visualizing discrete event simulation and resource allocation
- **Operating Systems Courses**: Demonstrating process synchronization problems
- **Young Learners**: Fun, colorful visualization makes complex concepts accessible

## Understanding the Visualization

### Philosopher Colors
- **Blue**: Thinking (peaceful)
- **Orange**: Hungry (wanting to eat)
- **Green**: Eating (happy!)
- **Red**: Waiting (frustrated)
- **Purple**: Deadlock (stuck forever!)

### Chopsticks
- **Gold**: Available
- **Gray**: In use
- **Numbers**: Chopstick ID (0-4)

### Indicators
- Small circles on philosophers show which chopsticks they're holding
- Facial expressions change based on state

## Technical Details

### C10 Specification Compliance

This implementation follows the EUROSIM Comparison C10 requirements:

1. ✅ All philosophers start thinking
2. ✅ Discrete uniform distribution [1, 10] for thinking and eating times
3. ✅ Left chopstick picked up first, then right
4. ✅ Right philosopher gets priority in simultaneous access
5. ✅ Simulation terminates on deadlock
6. ✅ Tracks average times and statistics
7. ✅ Demonstrates correct event queue management
8. ✅ Detects and reports deadlock situations

### Event Types
- `END_THINKING`: Philosopher becomes hungry
- `PICKUP_LEFT`: Attempt to pick up left chopstick
- `PICKUP_RIGHT`: Attempt to pick up right chopstick
- `END_EATING`: Philosopher finishes eating

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Files

- `index.html`: Main HTML structure
- `styles.css`: Styling and layout
- `simulation.js`: Simulation engine and visualization
- `README.md`: This file
- `C4-definition.pdf`: Original C4 problem definition
- `C10-definition.pdf`: C10 specification

## References

- Dijkstra, E. (1968): "Co-operating sequential processes"
- EUROSIM Comparison C4: Dining Philosophers Problem
- EUROSIM Comparison C10: Dining Philosophers II (redefined)

## License

This project is created for educational purposes. Feel free to use, modify, and share!

## Contributing

Suggestions and improvements welcome! This is an educational tool meant to help students learn about concurrent systems.

---

**Have fun watching the philosophers eat (or get stuck in deadlock)!**
