document.body.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

let fieldImage; //store field image
let ballRadius = 15;            // Radius of the draggable balls
let playableBallRadius;        // Radius of the playable ball (30% of draggable ball size)
let numDraggableBalls = 12;     // Total number of draggable balls
let ballPositions = [];        // Array to store positions of draggable balls
let velocities = [];           // Array to store velocities of draggable balls
let dragging = [];             // Array to track dragging state of each ball
let dragStart = [];            // Array to store drag start positions
let ballColors = [];           // Array to store colors of draggable balls
let currentTurn = 0;

let playableBallX, playableBallY;   // Position of the playable ball
let playableVelocity;                // Velocity of the playable ball

let goalWidth = 90;                 // Width of the goalposts
let goalHeight = 10;                 // Height of the goalposts
let redScore = 0; // Red team's score
let blueScore = 0; // Blue team's score
let ballCollisionSound;
let boundaryHitSound;
let goalScoreSound;

class SparkleParticle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.size = random(5, 15);
    this.color = color(255, random(200, 255), random(50, 150), 255);
    this.velocity = p5.Vector.random2D().mult(random(1, 3));
    this.lifetime = 30; // Number of frames the particle will exist
    this.opacity = 255;
  }

  update() {
    this.pos.add(this.velocity);
    this.velocity.mult(0.95); // Slight deceleration
    this.size *= 0.9; // Shrink over time
    this.opacity -= 8; // Fade out
  }

  display() {
    noStroke();
    fill(red(this.color), green(this.color), blue(this.color), this.opacity);
    ellipse(this.pos.x, this.pos.y, this.size);
  }

  isDead() {
    return this.opacity <= 0;
  }
}

class SparkleSystem {
  constructor() {
    this.particles = [];
  }

  addSparkle(x, y) {
    // Add multiple particles for a burst effect
    for (let i = 0; i < 10; i++) {
      this.particles.push(new SparkleParticle(x, y));
    }
  }

  update() {
    // Update and remove dead particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }

  display() {
    this.particles.forEach(particle => particle.display());
  }
}

// Global sparkle system
let sparkleSystem;


function preload() {
  // Load the field image
  fieldImage = loadImage('img/field.jfif');  // place image
  //game sounds
  ballCollisionSound = loadSound('audio/soccer-ball-kick-37625.mp3');
  boundaryHitSound = loadSound('audio/hammer-hitting-a-head-100624.mp3');
  goalScoreSound = loadSound('audio/mixkit-winning-a-coin-video-game-2069.mp3');
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);  // Make canvas responsive
}

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
  let trapeziumFactor = map(row, 0, team1Count - 1, 4, 6); // Spread factor between rows
  
  // Adjust the X position for trapezium effect
  let spreadX = triangleSpacing * trapeziumFactor; // Increase spread with row depth
  let startX = topTipX - (ballsInRow - 1) * spreadX / 2; // Center the balls in the row
  
  let startY = topTipY + row * triangleSpacing; // Vertical positioning
  
  for (let col = 0; col < ballsInRow; col++) {
    if (redIndex < numDraggableBalls) {  // Check to ensure we don't exceed the array size
      // Adjust X position for each ball to create the trapezium effect
      ballPositions[redIndex] = createVector(startX + col * spreadX, startY);
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
  
  // Apply trapezium effect for blue team
  let trapeziumFactor = map(row, 0, team1Count - 1, 4, 6); // Adjust the spread factor as needed
  let spreadX = triangleSpacing * trapeziumFactor; // Increase spread with row depth
  let startX = bottomTipX - (ballsInRow - 1) * spreadX / 2; // Center the balls horizontally
  let startY = bottomTipY - row * triangleSpacing * 1.3; // Increase vertical spacing (adjust as needed)

  for (let col = 0; col < ballsInRow; col++) {
    if (blueIndex < numDraggableBalls) {
      // Adjust X position for each ball to create the trapezium effect
      ballPositions[blueIndex] = createVector(startX + col * spreadX, startY);
      velocities[blueIndex] = createVector(0, 0);
      dragging[blueIndex] = false;
      dragStart[blueIndex] = createVector(ballPositions[blueIndex].x, ballPositions[blueIndex].y);
      ballColors[blueIndex] = color(0, 0, 255); // Blue color for blue team
      blueIndex++;
    }
  }
}

    
    // Initialize the playable ball
    playableBallRadius = ballRadius * 0.5; 
    playableVelocity = createVector(1, 1); // Properly initialize
    resetPlayableBall();

    sparkleSystem = new SparkleSystem();
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
        let trapeziumFactor = map(row, 0, team1Count - 1, 4, 6); // Spread factor between rows
        
        // Adjust the X position for trapezium effect
        let spreadX = triangleSpacing * trapeziumFactor; // Increase spread with row depth
        let startX = topTipX - (ballsInRow - 1) * spreadX / 2; // Center the balls in the row
        
        let startY = topTipY + row * triangleSpacing; // Vertical positioning
        
        for (let col = 0; col < ballsInRow; col++) {
            if (redIndex < numDraggableBalls) {
                // Adjust X position for each ball to create the trapezium effect
                ballPositions[redIndex] = createVector(startX + col * spreadX, startY);
                ballColors[redIndex] = color(255, 0, 0); // Red color for red team
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

        // Apply trapezium effect for blue team
        let trapeziumFactor = map(row, 0, team1Count - 1, 4, 6); // Adjust the spread factor as needed
        let spreadX = triangleSpacing * trapeziumFactor; // Increase spread with row depth
        let startX = bottomTipX - (ballsInRow - 1) * spreadX / 2; // Center the balls horizontally
        let startY = bottomTipY - row * triangleSpacing * 1.3; // Increase vertical spacing (adjust as needed)

        for (let col = 0; col < ballsInRow; col++) {
            if (blueIndex < numDraggableBalls) {
                // Adjust X position for each ball to create the trapezium effect
                ballPositions[blueIndex] = createVector(startX + col * spreadX, startY);
                ballColors[blueIndex] = color(0, 0, 255); // Blue color for blue team
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
function displayTurnIndicator() {
  textSize(30);
  noFill(); // No fill for the text

  // Create a gradient-like effect using stroke color
  let strokeColor = color(100, 255, 255); // Light cyan for a beautiful stroke
  stroke(strokeColor);

  // Determine the turn text
  let turnText = currentTurn === 0 ? "Red's Turn" : "Blue's Turn"; // Display based on the current turn

  // Set padding and positions
  let padding = 10; // Set padding for spacing from the edge
  let xPos = padding; // Left side edge with some space
  let yPos = windowHeight / 2 - 75; // Vertically centered

  // Apply rotation for vertical text (rotate around the top-left corner)
  push(); // Save current drawing state
  translate(xPos, yPos); // Move origin to the starting position
  rotate(HALF_PI); // Rotate 90 degrees (vertical text)

  text(turnText, 0, 0); // Draw the text at the new rotated position
  pop(); // Restore original drawing state
}



function draw() {
  image(fieldImage, 0, 0, width, height);  // Fill canvas with the image

// Update and draw the draggable balls
for (let i = 0; i < numDraggableBalls; i++) {
  updateDraggableBall(i);
}

// Check collisions between the draggable balls (no sparkles)
for (let i = 0; i < numDraggableBalls; i++) {
  for (let j = i + 1; j < numDraggableBalls; j++) {
    checkCollision(ballPositions[i], velocities[i], ballRadius, ballPositions[j], velocities[j], ballRadius);
  }
}

// Update and draw the playable ball
updatePlayableBall();

// Check collisions between the playable ball and draggable balls (with sparkles)
for (let i = 0; i < numDraggableBalls; i++) {
  checkCollision(
    createVector(playableBallX, playableBallY), playableVelocity, playableBallRadius,
    ballPositions[i], velocities[i], ballRadius,
    true  // This enables sparkles only for playable ball collisions
  );
}

// Draw the goalposts
drawGoalposts();

// Check if the playable ball hits the goalposts
checkGoalCollision();
displayTurnIndicator();
displayScore();

// Update and display sparkle system
sparkleSystem.update();
sparkleSystem.display();
}

// Draw the goalposts
function drawGoalposts() {
  let netSpacing = 10; // Space between the grid lines
  let goalWidth = 90; // goal width
  let goalHeight = 35; // goal height

  // Top goalpost
  drawNet(width / 2 - goalWidth / 2, 0, goalWidth, goalHeight, netSpacing);

  // Bottom goalpost
  drawNet(width / 2 - goalWidth / 2, height - goalHeight, goalWidth, goalHeight, netSpacing);
}
function drawNet(x, y, goalWidth, goalHeight, spacing) {
  stroke(255); // White color for the net lines
  strokeWeight(2); // Thin lines
  noFill();

  // Vertical lines
  for (let i = x; i <= x + goalWidth; i += spacing) {
    line(i, y, i, y + goalHeight);
  }

  // Horizontal lines
  for (let j = y; j <= y + goalHeight; j += spacing) {
    line(x, j, x + goalWidth, j);
  }
}

// Update the draggable ball's state
function updateDraggableBall(index) {
  // If dragging, draw the drag line and expanding cone effect
  if (dragging[index]) {
    // Calculate the drag direction vector (opposite to mouse drag)
    let dragVector = createVector(dragStart[index].x - mouseX, dragStart[index].y - mouseY); // Invert the direction
    
    // Draw the drag line
    line(dragStart[index].x, dragStart[index].y, mouseX, mouseY);

    // Now create the expanding cone effect in the opposite direction
    let maxLength = dragVector.mag();  // Maximum length of the cone (distance dragged)
    let stepSize = 10;  // How many steps (sections) to draw for the expanding effect
    
    // Calculate the angle of the drag vector (this is the direction the ball is going)
    let coneAngle = dragVector.heading(); // The direction of the drag (opposite direction of the mouse drag)

    // Set the color for the cone with transparency (light orange)
    fill(255, 165, 0, 100);  // Light orange with transparency
    noStroke();  // No outline for the cone

    // Draw the cone using a triangle shape
    for (let i = 0; i <= maxLength; i += stepSize) {
      let lineLength = map(i, 0, maxLength, 5, 20);  // Increase the line length as the cone expands

      // Calculate the points of the cone shape at the current step
      let x1 = dragStart[index].x + cos(coneAngle - PI / 4) * i;
      let y1 = dragStart[index].y + sin(coneAngle - PI / 4) * i;
      let x2 = dragStart[index].x + cos(coneAngle + PI / 4) * i;
      let y2 = dragStart[index].y + sin(coneAngle + PI / 4) * i;

      // Now create the shape (triangle for each segment of the cone)
      beginShape();
      vertex(dragStart[index].x, dragStart[index].y); // Start at the drag point
      vertex(x1, y1); // Left side of the cone
      vertex(x2, y2); // Right side of the cone
      endShape(CLOSE); // Close the shape to form a triangle
    }
  }

  // Draw the draggable ball (on top of the cone)
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
      boundaryHitSound.play();
    }
    if (ballPositions[index].y - ballRadius < 0 || ballPositions[index].y + ballRadius > height) {
      velocities[index].y *= -0.9;
      ballPositions[index].y = constrain(ballPositions[index].y, ballRadius, height - ballRadius);
      boundaryHitSound.play();
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
       // Top goalpost (Red's goal)
       if (playableBallY - playableBallRadius <= goalHeight &&
        abs(playableBallX - width / 2) <= goalWidth / 2) {
        // Goal for the blue team (red team scored)
        blueScore++;  // Award a goal to the blue team
        goalScoreSound.play();
        resetPlayableBall();
        resetDraggableBalls();
        toggleTurn();  // Switch turns after a goal
    }
  
    // Bottom goalpost (Blue's goal)
    if (playableBallY + playableBallRadius >= height - goalHeight &&
      abs(playableBallX - width / 2) <= goalWidth / 2) {
      // Goal for the red team (blue team scored)
      redScore++;  // Award a goal to the red team
      goalScoreSound.play();
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
  function displayScore() {
    textSize(32);
    stroke(255, 255, 255); // White color for the stroke
    noFill(); // No fill for the text
    
    text(redScore, windowWidth - 30, windowHeight / 2 - 20); // Display Red score
    text(blueScore, windowWidth - 30, windowHeight / 2 + 40); // Display Blue score
}
  
  // Check for collisions between two balls
  function checkCollision(pos1, vel1, radius1, pos2, vel2, radius2, isPlayableBallCollision = false) {
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

      // Add sparkles only for playable ball collisions
      if (isPlayableBallCollision) {
        ballCollisionSound.play();
        let collisionX = (pos1.x + pos2.x) / 2;
        let collisionY = (pos1.y + pos2.y) / 2;
        sparkleSystem.addSparkle(collisionX, collisionY);
      }
      
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
  