"use strict";
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 32;
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
context.scale(BLOCK_SIZE / 32, BLOCK_SIZE / 32);
//Keydown Events
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    }
    else if (event.key === 'ArrowRight') {
        playerMove(1);
    }
    else if (event.key === 'ArrowDown') {
        playerDrop();
    }
    else if (event.key === 'ArrowUp') {
        playerRotate();
    }
});
//Functions for actions
function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}
function rotate(matrix) {
    const N = matrix.length;
    const result = matrix.map((_, i) => matrix.map(row => row[i])).reverse();
    return result;
}
function playerRotate() {
    const oldPosX = player.pos.x;
    player.matrix = rotate(player.matrix);
    let offset = 1;
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            player.matrix = rotate(rotate(rotate(player.matrix)));
            player.pos.x = oldPosX;
            return;
        }
    }
}
//Cleaning Arena
function arenaSweep() {
    outer: for (let y = arena.length - 1; y >= 0; y--) {
        for (let x = 0; x < arena[y].length; x++) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        y++;
    }
}
const player = {
    pos: { x: 0, y: 0 },
    matrix: [],
};
//Canvas
function createMatrix(cols, rows) {
    const matrix = [];
    for (let y = 0; y < rows; y++) {
        matrix.push(new Array(cols).fill(0));
    }
    return matrix;
}
const arena = createMatrix(COLS, ROWS);
//Elements
const figures = {
    T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
    ],
    O: [
        [2, 2],
        [2, 2],
    ],
    L: [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0],
    ],
    J: [
        [4, 0, 0],
        [4, 4, 4],
        [0, 0, 0],
    ],
    I: [
        [0, 0, 0, 0],
        [5, 5, 5, 5],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ],
    S: [
        [0, 6, 6],
        [6, 6, 0],
        [0, 0, 0],
    ],
    Z: [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
    ],
};
const colors = [
    null, // 0 — empty
    'purple', // 1 — T
    'yellow', // 2 — O
    'orange', // 3 — L
    'blue', // 4 — J
    'cyan', // 5 — I
    'green', // 6 — S
    'red', // 7 — Z
];
//Queue
const figureQueue = [];
function randomFigure() {
    const keys = Object.keys(figures);
    return keys[Math.floor(Math.random() * keys.length)];
}
//Game Over
let gameOver = false;
// Render for Arena
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect((x + offset.x) * BLOCK_SIZE, (y + offset.y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}
//New Piece Structure
function createPiece(type) {
    return figures[type];
}
function playerReset() {
    const type = randomFigure();
    player.matrix = createPiece(type);
    player.pos.y = 0;
    player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        gameOver = true;
        alert('Game Over!');
    }
}
//Checking Collide
function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}
//Dropdown
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        arenaSweep();
        playerReset();
    }
    dropCounter = 0;
}
//Merge with Arena
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}
//FastDrop for Mobile
function startFastDrop() {
    dropInterval = 1000 / 3;
}
function stopFastDrop() {
    dropInterval = 1000;
}
//Dropdown timer
let dropCounter = 0;
let dropInterval = 1000; // 1 sec
let lastTime = 0;
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    draw();
    if (!gameOver) {
        requestAnimationFrame(update);
    }
}
//Drawing Player
function draw() {
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}
playerReset();
update();
//Mobile Actions
let touchStartX = 0;
let touchStartY = 0;
let touchMoved = false;
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchMoved = false;
}, { passive: false });
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    touchMoved = true;
}, { passive: false });
canvas.addEventListener('touchend', (e) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    if (!touchMoved) {
        playerRotate();
    }
    else {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 30) {
                playerMove(1);
            }
            else if (deltaX < -30) {
                playerMove(-1);
            }
        }
        else {
            if (deltaY > 30) {
                startFastDrop();
                setTimeout(stopFastDrop, 3000);
            }
        }
    }
    touchStartX = 0;
    touchStartY = 0;
    touchMoved = false;
}, { passive: false });
