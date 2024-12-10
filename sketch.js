document.body.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

let ballRadius = 15;            // Radius of the draggable balls
let playableBallRadius;        // Radius of the playable ball (30% of draggable ball size)
let numDraggableBalls = 6;     // Total number of draggable balls
let ballPositions = [];        // Array to store positions of draggable balls
let velocities = [];           // Array to store velocities of draggable balls
let dragging = [];             // Array to track dragging state of each ball
let dragStart = [];            // Array to store drag start positions
let ballColors = [];           // Array to store colors of draggable balls
let currentTurn = 0;

let playableBallX, playableBallY;   // Position of the playable ball
let playableVelocity;                // Velocity of the playable ball

let goalWidth = 100;                 // Width of the goalposts
let goalHeight = 10;                 // Height of the goalposts

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);  // Set canvas to full window size
    canvas.style('display', 'block');  // Remove extra space below the canvas (optional)
    
    currentTurn = (random(1) < 0.5) ? 0 : 1;  // 50% chance for Red or Blue to start
    
    // Initialize ball arrays
    ballPositions = new Array(numDraggableBalls);
    velocities = new Array(numDraggableBalls);
    dragging = new Array(numDraggableBalls);
    dragStart = new Array(numDraggableBalls);
    ballColors = new Array(numDraggableBalls);
  
    let triangleSpacing = ballRadius * 2; // Spacing between the balls
  
    // Set positions for team 1 (Red Balls)
    let team1Count = numDraggableBalls / 2;
    let topTipX = width / 2; // Centered horizontally
    let topTipY = goalHeight + 20 + ballRadius; // 20 pixels below the top post
  
    let redIndex = 0;  // Ensure starting index for team 1
    for (let row = 0; row < team1Count; row++) {
      let ballsInRow = row + 1; // Number of balls increases by 1 per row
      let startX = topTipX - (ballsInRow - 1) * triangleSpacing / 2;
      let startY = topTipY + row * triangleSpacing;
  
      for (let col = 0; col < ballsInRow; col++) {
        if (redIndex < numDraggableBalls) {  // Check to ensure we don't exceed the array size
          ballPositions[redIndex] = createVector(startX + col * triangleSpacing, startY);
          ballColors[redIndex] = color(255, 0, 0); // Red
          velocities[redIndex] = createVector(0, 0);
          dragging[redIndex] = false;
          dragStart[redIndex] = createVector(ballPositions[redIndex].x, ballPositions[redIndex].y);
          redIndex++;
        }
      }
    }
  
    // Set positions for team 2 (Blue Balls)
    let bottomTipX = width / 2; // Centered horizontally
    let bottomTipY = height - goalHeight - 20 - ballRadius; // 20 pixels above the bottom post
  
    let blueIndex = team1Count; // Start from the index after team 1
    for (let row = 0; row < team1Count; row++) {
      let ballsInRow = row + 1;
      let startX = bottomTipX - (ballsInRow - 1) * triangleSpacing / 2;
      let startY = bottomTipY - row * triangleSpacing;
  
      for (let col = 0; col < ballsInRow; col++) {
        if (blueIndex < numDraggableBalls) {  // Check to ensure we don't exceed the array size
          ballPositions[blueIndex] = createVector(startX + col * triangleSpacing, startY);
          ballColors[blueIndex] = color(0, 0, 255); // Blue
          velocities[blueIndex] = createVector(0, 0);
          dragging[blueIndex] = false;
          dragStart[blueIndex] = createVector(ballPositions[blueIndex].x, ballPositions[blueIndex].y);
          blueIndex++;
        }
      }
    }
    
    // Initialize the playable ball
    playableBallRadius = ballRadius * 0.5; 
    playableVelocity = createVector(0, 0); // Properly initialize
    resetPlayableBall();
  }
  
  function resetDraggableBalls() {
    let triangleSpacing = ballRadius * 2; // Spacing between the balls

    // Reset positions for team 1 (Red Balls)
    let team1Count = numDraggableBalls / 2;
    let topTipX = width / 2; // Centered horizontally
    let topTipY = goalHeight + 20 + ballRadius; // 20 pixels below the top post

    let redIndex = 0;
    for (let row = 0; row < team1Count; row++) {
        let ballsInRow = row + 1; // Number of balls increases by 1 per row
        let startX = topTipX - (ballsInRow - 1) * triangleSpacing / 2;
        let startY = topTipY + row * triangleSpacing;

        for (let col = 0; col < ballsInRow; col++) {
            if (redIndex < numDraggableBalls) {
                ballPositions[redIndex] = createVector(startX + col * triangleSpacing, startY);
                velocities[redIndex] = createVector(0, 0);
                dragging[redIndex] = false;
                dragStart[redIndex] = createVector(ballPositions[redIndex].x, ballPositions[redIndex].y);
                redIndex++;
            }
        }
    }

    // Reset positions for team 2 (Blue Balls)
    let bottomTipX = width / 2; // Centered horizontally
    let bottomTipY = height - goalHeight - 20 - ballRadius; // 20 pixels above the bottom post

    let blueIndex = team1Count; // Start from the index after team 1
    for (let row = 0; row < team1Count; row++) {
        let ballsInRow = row + 1;
        let startX = bottomTipX - (ballsInRow - 1) * triangleSpacing / 2;
        let startY = bottomTipY - row * triangleSpacing;

        for (let col = 0; col < ballsInRow; col++) {
            if (blueIndex < numDraggableBalls) {
                ballPositions[blueIndex] = createVector(startX + col * triangleSpacing, startY);
                velocities[blueIndex] = createVector(0, 0);
                dragging[blueIndex] = false;
                dragStart[blueIndex] = createVector(ballPositions[blueIndex].x, ballPositions[blueIndex].y);
                blueIndex++;
            }
        }
    }
}

// Function to toggle turns
function toggleTurn() {
  // Switch turns: If it's 0 (Red), set to 1 (Blue), and vice versa
  currentTurn = (currentTurn === 0) ? 1 : 0;
}

// The draw function called continuously
function draw() {
  background(200);
  
  // Draw the goalposts
  drawGoalposts();

  // Update and draw the draggable balls
  for (let i = 0; i < numDraggableBalls; i++) {
    updateDraggableBall(i);
  }

  // Check collisions between the draggable balls
  for (let i = 0; i < numDraggableBalls; i++) {
    for (let j = i + 1; j < numDraggableBalls; j++) {
      checkCollision(ballPositions[i], velocities[i], ballRadius, ballPositions[j], velocities[j], ballRadius);
    }
  }

  // Update and draw the playable ball
  updatePlayableBall();

  // Check collisions between the playable ball and draggable balls
  for (let i = 0; i < numDraggableBalls; i++) {
    checkCollision(
      createVector(playableBallX, playableBallY), playableVelocity, playableBallRadius,
      ballPositions[i], velocities[i], ballRadius
    );
  }

  // Check if the playable ball hits the goalposts
  checkGoalCollision();
}

// Draw the goalposts
function drawGoalposts() {
  fill(0);
  // Top goalpost
  rect(width / 2 - goalWidth / 2, 0, goalWidth, goalHeight);
  // Bottom goalpost
  rect(width / 2 - goalWidth / 2, height - goalHeight, goalWidth, goalHeight);
}

// Update the draggable ball's state
function updateDraggableBall(index) {
  // If dragging, draw the drag line
  if (dragging[index]) {
    line(dragStart[index].x, dragStart[index].y, mouseX, mouseY);
  }
  
  // Draw the draggable ball
  fill(ballColors[index]);
  ellipse(ballPositions[index].x, ballPositions[index].y, ballRadius * 2, ballRadius * 2);
  
  // Update position using velocity if not dragging
  if (!dragging[index]) {
    ballPositions[index].add(velocities[index]);
    
    // Apply friction to slow the ball down
    velocities[index].mult(0.98);
    
    // Check boundaries
    if (ballPositions[index].x - ballRadius < 0 || ballPositions[index].x + ballRadius > width) {
      velocities[index].x *= -0.9;
      ballPositions[index].x = constrain(ballPositions[index].x, ballRadius, width - ballRadius);
    }
    if (ballPositions[index].y - ballRadius < 0 || ballPositions[index].y + ballRadius > height) {
      velocities[index].y *= -0.9;
      ballPositions[index].y = constrain(ballPositions[index].y, ballRadius, height - ballRadius);
    }
  }
}
// Update the playable ball's state
function updatePlayableBall() {
    // Draw the playable ball
    fill(0, 255, 0);
    ellipse(playableBallX, playableBallY, playableBallRadius * 2, playableBallRadius * 2);
    
    // Update the playable ball's position using its velocity
    playableBallX += playableVelocity.x;
    playableBallY += playableVelocity.y;
    
    // Apply friction to the playable ball's velocity
    playableVelocity.mult(0.98);
    
    // Check boundaries for the playable ball
    if (playableBallX - playableBallRadius < 0 || playableBallX + playableBallRadius > width) {
      playableVelocity.x *= -0.9;
      playableBallX = constrain(playableBallX, playableBallRadius, width - playableBallRadius);
    }
    if (playableBallY - playableBallRadius < 0 || playableBallY + playableBallRadius > height) {
      playableVelocity.y *= -0.9;
      playableBallY = constrain(playableBallY, playableBallRadius, height - playableBallRadius);
    }
  }
  
  // Check for goal collisions
  function checkGoalCollision() {
    // Top goalpost
    if (playableBallY - playableBallRadius <= goalHeight &&
        abs(playableBallX - width / 2) <= goalWidth / 2) {
      resetPlayableBall();
      resetDraggableBalls();
      toggleTurn();  // Switch turns after a goal
    }
  
    // Bottom goalpost
    if (playableBallY + playableBallRadius >= height - goalHeight &&
        abs(playableBallX - width / 2) <= goalWidth / 2) {
      resetPlayableBall();
      resetDraggableBalls();
      toggleTurn();  // Switch turns after a goal
    }
  }
  
  // Reset the playable ball to the center
  function resetPlayableBall() {
    playableBallX = width / 2;
    playableBallY = height / 2;
    playableVelocity.set(0, 0);
  }
  
  // Check for collisions between two balls
  function checkCollision(pos1, vel1, radius1, pos2, vel2, radius2) {
    let distance = dist(pos1.x, pos1.y, pos2.x, pos2.y);
    if (distance < radius1 + radius2) {
      // Calculate the collision normal
      let normal = createVector(pos1.x - pos2.x, pos1.y - pos2.y).normalize();
      
      // Calculate relative velocity along the normal
      let relativeVelocity = createVector(vel1.x - vel2.x, vel1.y - vel2.y);
      let velocityAlongNormal = relativeVelocity.dot(normal);
      
      // Ignore if balls are moving away from each other
      if (velocityAlongNormal > 0) return;
      
      // Calculate impulse scalar
      let restitution = 0.8; // Bounciness
      let impulse = -(1 + restitution) * velocityAlongNormal / 2;
      
      // Apply impulse to the velocities
      let impulseVector = normal.mult(impulse);
      vel1.add(impulseVector);
      vel2.sub(impulseVector);
      
      // Resolve penetration
      let overlap = radius1 + radius2 - distance;
      let correction = normal.mult(overlap / 2);
      pos1.add(correction);
      pos2.sub(correction);
    }
  }
  
  // Handle mouse press for dragging
  function mousePressed() {
    // Check if it's the current team's turn and if they're interacting with their own balls
    if (currentTurn === 0) { // Red team's turn
      for (let i = 0; i < numDraggableBalls / 2; i++) {  // Check only red balls
        if (dist(mouseX, mouseY, ballPositions[i].x, ballPositions[i].y) <= ballRadius) {
          dragging[i] = true;
          dragStart[i].set(ballPositions[i].x, ballPositions[i].y);
          break;
        }
      }
    } else if (currentTurn === 1) { // Blue team's turn
      for (let i = numDraggableBalls / 2; i < numDraggableBalls; i++) {  // Check only blue balls
        if (dist(mouseX, mouseY, ballPositions[i].x, ballPositions[i].y) <= ballRadius) {
          dragging[i] = true;
          dragStart[i].set(ballPositions[i].x, ballPositions[i].y);
          break;
        }
      }
    }
  }
  
  // Handle mouse release after dragging
  function mouseReleased() {
    // Check if it's the current team's turn and if they've dragged a ball
    if ((currentTurn === 0 && isDraggingRed()) || (currentTurn === 1 && isDraggingBlue())) {
      for (let i = 0; i < numDraggableBalls; i++) {
        if (dragging[i]) {
          // Calculate the drag vector
          let drag = createVector(dragStart[i].x - mouseX, dragStart[i].y - mouseY);
          
          // Use the drag vector as the velocity, scaled by speedFactor
          velocities[i].set(drag.mult(0.3));
          dragging[i] = false;
        }
      }
      
      // After a turn, toggle to the next team
      toggleTurn();
    }
  }
  
  // Helper functions to check if red or blue balls are being dragged
  function isDraggingRed() {
    for (let i = 0; i < numDraggableBalls / 2; i++) {
      if (dragging[i]) {
        return true;
      }
    }
    return false;
  }
  
  function isDraggingBlue() {
    for (let i = numDraggableBalls / 2; i < numDraggableBalls; i++) {
      if (dragging[i]) {
        return true;
      }
    }
    return false;
  }
  