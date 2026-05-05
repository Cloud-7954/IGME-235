"use strict";

const app = new PIXI.Application();

let ball;                // you'll create this in TASK 1
let dx, dy;              // you'll set initial values in TASK 2
let screenWidth, screenHeight;
const ballRadius = 20;

setup();

async function setup() {
    await app.init({ width: 400, height: 400, background: "#222" });
    document.body.appendChild(app.canvas);

    screenWidth = app.renderer.width;
    screenHeight = app.renderer.height;

    // >>> TASK 1: Draw the ball.
    //
    //     Create a new PIXI.Graphics instance. Use the Graphics methods
    //     to draw a circle (radius `ballRadius`), fill it with a color
    //     of your choice (any 0xRRGGBB hex), and give it a visible
    //     border (use a different color from the fill).
    //
    //     Important: draw the circle at (0, 0) inside the Graphics
    //     object — that way `ball.x` and `ball.y` represent the
    //     CENTER of the ball, which makes the edge math in TASK 4
    //     much cleaner.
    //
    //     Then position the ball at the center of the canvas and
    //     add it to app.stage.

  
    ball = new PIXI.Graphics();
    ball.lineStyle(10, 0xff0000);
    ball.beginFill(0xff00);
    ball.drawCircle(0, 0, ballRadius);
    ball.endFill();

    // put ball atcenter
    ball.x = screenWidth / 2;
    ball.y = screenHeight / 2;
    app.stage.addChild(ball);




    // >>> TASK 2: Set the initial velocity.
    //
    //     Pick small non-zero values for dx and dy (e.g. 3 and 2).
    //     These represent how many pixels the ball moves per frame.
    dx = 3;
    dy = 2;



    // >>> TASK 3: Move the ball each frame.
    //
    //     Register a callback on app.ticker that runs every frame.
    //     Make the ball move each frame using the velocity (dx and dy).
    //
    //     Skeleton:
    //         app.ticker.add(() => {
    //             // your move + bounce code here (TASK 3 + TASK 4)
    //         });



        // >>> TASK 4: Make the ball bounce off the edges.
        //
        //     Inside the SAME ticker callback (after the move), check
        //     whether the ball has hit any of the four edges. If it has,
        //     reverse the velocity in that axis.
        //
        //     Pseudo-code:
        //         if (ball is past the right edge OR past the left edge)
        //             reverse dx
        //         if (ball is past the bottom edge OR past the top edge)
        //             reverse dy
        //
        //     Don't forget the radius. The ball is a circle of radius
        //     `ballRadius`,
        //
        //     If you skip the radius adjustment, half the ball will
        //     disappear past the edge before bouncing.
        //
        //     Test it: the ball should bounce cleanly off all four edges
        //     and stay fully inside the canvas.
app.ticker.add(() => {
        ball.x += dx;

        ball.y += dy;
        if (ball.x - ballRadius <= 0 || ball.x + ballRadius >= screenWidth) {
            dx = -dx;
        }
        if (ball.y - ballRadius <= 0 || ball.y + ballRadius >= screenHeight) {
            dy = -dy;
        }
    });



    // >>> TASK 5: Add a name plate (text label) to the canvas.
    //
    //     Create a PIXI.Text instance — same pattern you used in the
    //     Circle Blast HW (scoreLabel, lifeLabel, gameOverText).
    //
    //     The text should include your name AND a course identifier
    //     like "IGME 235 Final Practical" (or similar — anything that
    //     makes it clear whose submission this is).
    //
    //     Style it however you like (pick a fontSize, fill color, etc.)
    //     and position it somewhere visible on the canvas. Don't
    //     forget to add it to app.stage.
    let namePlate = new PIXI.Text("Cloud - IGME 235 Final", { fontSize: 16, fill: 0xFFFFFF });
    namePlate.x = 10;
    namePlate.y = 10;
    app.stage.addChild(namePlate);


}
