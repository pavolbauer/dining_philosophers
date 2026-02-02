// Dining Philosophers Simulation
// Based on EUROSIM Comparison C10 specification

class DiningPhilosophers {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.numPhilosophers = 5;
        this.currentTime = 0;
        this.eventQueue = [];
        this.philosophers = [];
        this.chopsticks = [];
        this.running = false;
        this.paused = false;
        this.speed = 5;
        this.strategy = 'basic';
        this.waiterPermissions = 4; // For waiter strategy
        
        // Statistics
        this.stats = {
            eventCount: 0,
            conflictCount: 0,
            deadlockDetected: false,
            startTime: 0
        };
        
        this.initialize();
    }
    
    initialize() {
        this.currentTime = 0;
        this.eventQueue = [];
        this.stats = {
            eventCount: 0,
            conflictCount: 0,
            deadlockDetected: false,
            startTime: 0
        };
        
        // Initialize chopsticks
        this.chopsticks = [];
        for (let i = 0; i < this.numPhilosophers; i++) {
            this.chopsticks.push({
                id: i,
                available: true,
                heldBy: null
            });
        }
        
        // Initialize philosophers
        this.philosophers = [];
        for (let i = 0; i < this.numPhilosophers; i++) {
            this.philosophers.push({
                id: i,
                state: 'THINKING',
                leftChopstick: i,
                rightChopstick: (i + 1) % this.numPhilosophers,
                hasLeftChopstick: false,
                hasRightChopstick: false,
                stats: {
                    thinkingTime: 0,
                    waitingTime: 0,
                    eatingTime: 0,
                    thinkingCount: 0,
                    eatingCount: 0,
                    waitingCount: 0
                }
            });
            
            // All philosophers start thinking (C10 rule)
            const thinkTime = this.randomTime();
            this.scheduleEvent(thinkTime, 'END_THINKING', i);
        }
        
        this.draw();
        this.updateStats();
    }
    
    // Discrete uniform distribution [1, 10] as per C10
    randomTime() {
        return Math.floor(Math.random() * 10) + 1;
    }
    
    scheduleEvent(time, type, philosopherId, priority = 0) {
        const event = {
            time: this.currentTime + time,
            type: type,
            philosopherId: philosopherId,
            priority: priority // Used for conflict resolution
        };
        
        this.eventQueue.push(event);
        // Sort by time, then by priority
        this.eventQueue.sort((a, b) => {
            if (a.time !== b.time) return a.time - b.time;
            return b.priority - a.priority; // Higher priority first
        });
    }
    
    processNextEvent() {
        if (this.eventQueue.length === 0) {
            this.running = false;
            return false;
        }
        
        // Get all events at the current time
        const currentEvents = [];
        const eventTime = this.eventQueue[0].time;
        
        while (this.eventQueue.length > 0 && this.eventQueue[0].time === eventTime) {
            currentEvents.push(this.eventQueue.shift());
        }
        
        this.currentTime = eventTime;
        
        // Handle simultaneous access detection
        this.handleSimultaneousEvents(currentEvents);
        
        // Check for deadlock after processing events
        if (this.checkDeadlock()) {
            this.handleDeadlock();
            return false;
        }
        
        this.stats.eventCount++;
        this.draw();
        this.updateStats();
        
        return true;
    }
    
    handleSimultaneousEvents(events) {
        // Group events by type
        const pickupEvents = events.filter(e => e.type === 'PICKUP_LEFT' || e.type === 'PICKUP_RIGHT');
        
        if (pickupEvents.length > 1) {
            // Check for conflicts on the same chopstick
            const chopstickRequests = {};
            
            pickupEvents.forEach(event => {
                const phil = this.philosophers[event.philosopherId];
                let chopstickId;
                
                if (event.type === 'PICKUP_LEFT') {
                    chopstickId = phil.leftChopstick;
                } else {
                    chopstickId = phil.rightChopstick;
                }
                
                if (!chopstickRequests[chopstickId]) {
                    chopstickRequests[chopstickId] = [];
                }
                chopstickRequests[chopstickId].push(event);
            });
            
            // Handle conflicts based on strategy
            Object.keys(chopstickRequests).forEach(chopstickId => {
                const requests = chopstickRequests[chopstickId];
                if (requests.length > 1) {
                    this.handleConflict(parseInt(chopstickId), requests);
                }
            });
        }
        
        // Process all events
        events.forEach(event => {
            this.processEvent(event);
        });
    }
    
    handleConflict(chopstickId, requests) {
        this.stats.conflictCount++;
        this.showConflictMessage();
        
        // Determine who gets the chopstick based on strategy
        let winner;
        
        switch (this.strategy) {
            case 'basic':
                // C10 Rule: philosopher on the RIGHT gets priority
                winner = this.getRightmostPhilosopher(requests);
                break;
            case 'random':
                winner = requests[Math.floor(Math.random() * requests.length)];
                break;
            case 'waiter':
            case 'resource-hierarchy':
                // These strategies prevent conflicts, but handle normally if they occur
                winner = requests[0];
                break;
        }
        
        // Mark others as waiting
        requests.forEach(req => {
            if (req !== winner) {
                const phil = this.philosophers[req.philosopherId];
                if (phil.state !== 'WAITING') {
                    phil.state = 'WAITING';
                    phil.stats.waitingCount++;
                }
                // Reschedule their pickup attempt
                this.scheduleEvent(1, req.type, req.philosopherId);
            }
        });
    }
    
    getRightmostPhilosopher(requests) {
        // The philosopher with the highest ID sitting to the right gets priority
        return requests.reduce((rightmost, current) => {
            return current.philosopherId > rightmost.philosopherId ? current : rightmost;
        });
    }
    
    processEvent(event) {
        const phil = this.philosophers[event.philosopherId];
        
        switch (event.type) {
            case 'END_THINKING':
                phil.state = 'HUNGRY';
                phil.stats.thinkingTime += this.currentTime - (phil.lastStateChange || 0);
                phil.stats.thinkingCount++;
                phil.lastStateChange = this.currentTime;
                
                // Try to pick up left chopstick first (C10 rule)
                this.scheduleEvent(0, 'PICKUP_LEFT', event.philosopherId);
                break;
                
            case 'PICKUP_LEFT':
                if (this.canPickupChopstick(phil, 'left')) {
                    this.pickupChopstick(phil, 'left');
                    // Try to pick up right chopstick
                    this.scheduleEvent(0, 'PICKUP_RIGHT', event.philosopherId);
                } else {
                    phil.state = 'WAITING';
                    phil.stats.waitingCount++;
                    // Try again later
                    this.scheduleEvent(1, 'PICKUP_LEFT', event.philosopherId);
                }
                break;
                
            case 'PICKUP_RIGHT':
                if (this.canPickupChopstick(phil, 'right')) {
                    this.pickupChopstick(phil, 'right');
                    // Start eating
                    phil.state = 'EATING';
                    const waitTime = this.currentTime - phil.lastStateChange;
                    phil.stats.waitingTime += waitTime;
                    phil.lastStateChange = this.currentTime;
                    
                    const eatTime = this.randomTime();
                    this.scheduleEvent(eatTime, 'END_EATING', event.philosopherId);
                } else {
                    phil.state = 'WAITING';
                    // Try again later
                    this.scheduleEvent(1, 'PICKUP_RIGHT', event.philosopherId);
                }
                break;
                
            case 'END_EATING':
                phil.state = 'THINKING';
                phil.stats.eatingTime += this.currentTime - phil.lastStateChange;
                phil.stats.eatingCount++;
                phil.lastStateChange = this.currentTime;
                
                // Put down both chopsticks
                this.putDownChopstick(phil, 'left');
                this.putDownChopstick(phil, 'right');
                
                // Start thinking again
                const thinkTime = this.randomTime();
                this.scheduleEvent(thinkTime, 'END_THINKING', event.philosopherId);
                break;
        }
    }
    
    canPickupChopstick(phil, side) {
        const chopstickId = side === 'left' ? phil.leftChopstick : phil.rightChopstick;
        
        // Apply strategy-specific rules
        if (this.strategy === 'waiter') {
            // Waiter strategy: max 4 philosophers can eat at once
            const eating = this.philosophers.filter(p => p.state === 'EATING').length;
            if (eating >= this.waiterPermissions && !phil.hasLeftChopstick) {
                return false;
            }
        } else if (this.strategy === 'resource-hierarchy') {
            // Resource hierarchy: always pick up lower-numbered chopstick first
            if (side === 'left' && phil.leftChopstick > phil.rightChopstick) {
                return false; // Should pick right first
            }
        }
        
        return this.chopsticks[chopstickId].available;
    }
    
    pickupChopstick(phil, side) {
        const chopstickId = side === 'left' ? phil.leftChopstick : phil.rightChopstick;
        this.chopsticks[chopstickId].available = false;
        this.chopsticks[chopstickId].heldBy = phil.id;
        
        if (side === 'left') {
            phil.hasLeftChopstick = true;
        } else {
            phil.hasRightChopstick = true;
        }
    }
    
    putDownChopstick(phil, side) {
        const chopstickId = side === 'left' ? phil.leftChopstick : phil.rightChopstick;
        this.chopsticks[chopstickId].available = true;
        this.chopsticks[chopstickId].heldBy = null;
        
        if (side === 'left') {
            phil.hasLeftChopstick = false;
        } else {
            phil.hasRightChopstick = false;
        }
    }
    
    checkDeadlock() {
        // Deadlock occurs when all philosophers have one chopstick and are waiting for another
        let potentialDeadlock = true;
        
        for (let i = 0; i < this.numPhilosophers; i++) {
            const phil = this.philosophers[i];
            // If any philosopher is not in a deadlock state, no global deadlock
            if (!(phil.hasLeftChopstick && !phil.hasRightChopstick && phil.state === 'WAITING')) {
                potentialDeadlock = false;
                break;
            }
        }
        
        // Additional check: ensure all chopsticks are held
        if (potentialDeadlock) {
            const allChopsticksHeld = this.chopsticks.every(c => !c.available);
            return allChopsticksHeld;
        }
        
        return false;
    }
    
    handleDeadlock() {
        this.stats.deadlockDetected = true;
        this.running = false;
        
        // Mark all waiting philosophers as deadlocked
        this.philosophers.forEach(phil => {
            if (phil.state === 'WAITING') {
                phil.state = 'DEADLOCK';
            }
        });
        
        this.draw();
        this.updateStats();
        this.showDeadlockMessage();
    }
    
    // Visualization
    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const tableRadius = 100;
        const philRadius = 60;
        const philDistance = 200;
        
        // Clear canvas
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, width, height);
        
        // Draw table
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(centerX, centerY, tableRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw philosophers and chopsticks
        for (let i = 0; i < this.numPhilosophers; i++) {
            const angle = (i * 2 * Math.PI / this.numPhilosophers) - Math.PI / 2;
            const x = centerX + Math.cos(angle) * philDistance;
            const y = centerY + Math.sin(angle) * philDistance;
            
            // Draw chopstick
            this.drawChopstick(i, angle, centerX, centerY, tableRadius);
            
            // Draw philosopher
            this.drawPhilosopher(this.philosophers[i], x, y, philRadius);
        }
        
        // Draw legend in corner
        this.drawSimulationInfo();
    }
    
    drawChopstick(id, angle, centerX, centerY, tableRadius) {
        const ctx = this.ctx;
        const chopstick = this.chopsticks[id];
        const chopstickLength = 40;
        const chopstickOffset = tableRadius + 10;
        
        const x = centerX + Math.cos(angle) * chopstickOffset;
        const y = centerY + Math.sin(angle) * chopstickOffset;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);
        
        // Chopstick color based on availability
        if (chopstick.available) {
            ctx.fillStyle = '#FFD700'; // Gold when available
        } else {
            ctx.fillStyle = '#999'; // Gray when taken
        }
        
        ctx.fillRect(-3, -chopstickLength / 2, 6, chopstickLength);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(-3, -chopstickLength / 2, 6, chopstickLength);
        
        ctx.restore();
        
        // Draw chopstick number
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(id, x, y);
    }
    
    drawPhilosopher(phil, x, y, radius) {
        const ctx = this.ctx;
        
        // Color based on state
        const stateColors = {
            'THINKING': '#2196F3',
            'HUNGRY': '#ff9800',
            'EATING': '#4CAF50',
            'WAITING': '#f44336',
            'DEADLOCK': '#9C27B0'
        };
        
        // Draw philosopher circle
        ctx.fillStyle = stateColors[phil.state];
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw face
        ctx.fillStyle = '#FFE4B5';
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw eyes
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(x - 15, y - 10, 5, 0, Math.PI * 2);
        ctx.arc(x + 15, y - 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw mouth based on state
        ctx.beginPath();
        if (phil.state === 'EATING') {
            ctx.arc(x, y + 10, 15, 0, Math.PI); // Smile
        } else if (phil.state === 'DEADLOCK' || phil.state === 'WAITING') {
            ctx.arc(x, y + 20, 15, Math.PI, 0); // Frown
        } else {
            ctx.moveTo(x - 15, y + 15);
            ctx.lineTo(x + 15, y + 15); // Neutral
        }
        ctx.stroke();
        
        // Draw philosopher number
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(phil.id, x, y - radius - 20);
        
        // Draw state text
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(phil.state, x, y + radius + 20);
        
        // Draw chopstick indicators
        if (phil.hasLeftChopstick) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(x - radius + 10, y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.stroke();
        }
        if (phil.hasRightChopstick) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(x + radius - 10, y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.stroke();
        }
    }
    
    drawSimulationInfo() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(10, 10, 200, 80);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(10, 10, 200, 80);
        
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Time: ${this.currentTime}`, 20, 30);
        ctx.fillText(`Events: ${this.stats.eventCount}`, 20, 50);
        ctx.fillText(`Conflicts: ${this.stats.conflictCount}`, 20, 70);
    }
    
    updateStats() {
        document.getElementById('simTime').textContent = this.currentTime;
        document.getElementById('eventCount').textContent = this.stats.eventCount;
        document.getElementById('conflictCount').textContent = this.stats.conflictCount;
        document.getElementById('deadlockStatus').textContent = this.stats.deadlockDetected ? 'YES!' : 'No';
        
        // Update philosopher stats
        const statsDiv = document.getElementById('philosopherStats');
        statsDiv.innerHTML = '';
        
        this.philosophers.forEach(phil => {
            const div = document.createElement('div');
            div.className = 'philosopher-stat';
            
            const avgThink = phil.stats.thinkingCount > 0 ? 
                (phil.stats.thinkingTime / phil.stats.thinkingCount).toFixed(2) : 0;
            const avgEat = phil.stats.eatingCount > 0 ? 
                (phil.stats.eatingTime / phil.stats.eatingCount).toFixed(2) : 0;
            const avgWait = phil.stats.waitingCount > 0 ? 
                (phil.stats.waitingTime / phil.stats.waitingCount).toFixed(2) : 0;
            
            div.innerHTML = `
                <h4>Philosopher ${phil.id}</h4>
                <div class="philosopher-stat-row">
                    <span>State:</span>
                    <span>${phil.state}</span>
                </div>
                <div class="philosopher-stat-row">
                    <span>Avg Think:</span>
                    <span>${avgThink}</span>
                </div>
                <div class="philosopher-stat-row">
                    <span>Avg Eat:</span>
                    <span>${avgEat}</span>
                </div>
                <div class="philosopher-stat-row">
                    <span>Avg Wait:</span>
                    <span>${avgWait}</span>
                </div>
            `;
            
            statsDiv.appendChild(div);
        });
    }
    
    showDeadlockMessage() {
        const msg = document.getElementById('statusMessage');
        msg.textContent = 'DEADLOCK DETECTED! All philosophers are waiting forever.';
        msg.className = 'status-message deadlock';
    }
    
    showConflictMessage() {
        const msg = document.getElementById('statusMessage');
        msg.textContent = `Simultaneous access detected at time ${this.currentTime}!`;
        msg.className = 'status-message conflict';
        
        setTimeout(() => {
            if (!this.stats.deadlockDetected) {
                msg.textContent = 'Simulation running...';
                msg.className = 'status-message';
            }
        }, 2000);
    }
    
    start() {
        if (this.stats.deadlockDetected) {
            this.initialize();
        }
        this.running = true;
        this.paused = false;
        this.run();
    }
    
    pause() {
        this.paused = true;
    }
    
    resume() {
        this.paused = false;
        this.run();
    }
    
    step() {
        if (!this.stats.deadlockDetected) {
            this.processNextEvent();
        }
    }
    
    run() {
        if (!this.running || this.paused) return;
        
        const processEvents = () => {
            if (!this.running || this.paused) return;
            
            if (this.processNextEvent()) {
                setTimeout(processEvents, 1000 / this.speed);
            }
        };
        
        processEvents();
    }
    
    reset() {
        this.running = false;
        this.paused = false;
        this.initialize();
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
    
    setStrategy(strategy) {
        this.strategy = strategy;
        this.reset();
    }
}

// Initialize the simulation when page loads
let simulation;

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('simulationCanvas');
    simulation = new DiningPhilosophers(canvas);
    
    // Button controls
    document.getElementById('startBtn').addEventListener('click', () => {
        if (!simulation.running) {
            simulation.start();
            document.getElementById('startBtn').disabled = true;
            document.getElementById('pauseBtn').disabled = false;
            document.getElementById('statusMessage').textContent = 'Simulation running...';
            document.getElementById('statusMessage').className = 'status-message';
        }
    });
    
    document.getElementById('pauseBtn').addEventListener('click', () => {
        if (simulation.running && !simulation.paused) {
            simulation.pause();
            document.getElementById('pauseBtn').textContent = 'Resume';
            document.getElementById('statusMessage').textContent = 'Simulation paused';
        } else if (simulation.paused) {
            simulation.resume();
            document.getElementById('pauseBtn').textContent = 'Pause';
            document.getElementById('statusMessage').textContent = 'Simulation running...';
        }
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
        simulation.reset();
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = 'Pause';
        document.getElementById('statusMessage').textContent = 'Click START to begin simulation';
        document.getElementById('statusMessage').className = 'status-message';
    });
    
    document.getElementById('stepBtn').addEventListener('click', () => {
        if (!simulation.running) {
            simulation.step();
        }
    });
    
    document.getElementById('speedSlider').addEventListener('input', (e) => {
        const speed = parseInt(e.target.value);
        simulation.setSpeed(speed);
        document.getElementById('speedValue').textContent = `${speed}x`;
    });
    
    document.getElementById('strategySelect').addEventListener('change', (e) => {
        simulation.setStrategy(e.target.value);
    });
});
