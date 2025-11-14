const scoreElement = document.querySelector("#score");
const highScoreElement = document.querySelector("#high-score");
const timerElement = document.querySelector("#timer");
const gameBoardElement = document.querySelector(".game-board");
const modalElement = document.querySelector(".modal");
const startGameElement = document.querySelector(".start-game");
const startButton = document.querySelector(".start-btn");
const restartGameElement = document.querySelector(".restart-game");
const restartButton = document.querySelector(".restart-btn");
const controllerKeysElement = document.querySelector(".controller-keys");

const cellSize = 30;
const numCols = Math.floor(gameBoardElement.clientWidth / cellSize);
const numRows = Math.floor(gameBoardElement.clientHeight / cellSize);

let boardCellElements = [];
let snake = initializeSnake();
let food = null;
let direction = "down";
let highScore = getHighScore();
let score = 0;
let timerSeconds = 0;
let keyPressPaused = false; // to prevent multiple press a t once

function renderCellsOnScreen() {
  gameBoardElement
    .style.gridTemplateColumns = `repeat(auto-fill, minmax(${cellSize}px, 1fr))`;

  for (let row = 0; row < numRows; row++) {
    const rowCellElements = [];

    for (let col = 0; col < numCols; col++) {
      const cellElement = document.createElement("div");
      cellElement.classList.add("cell");

      rowCellElements.push(cellElement);
      gameBoardElement.append(cellElement);
    }

    boardCellElements.push(rowCellElements);
  }
}

function renderSnakeOnScreen() {
  const head = snake.at(-1);

  if (
    head.x < 0 || head.y < 0 ||
    head.x >= numRows || head.y >= numCols) {
    const oldHead = snake.at(-2);
    boardCellElements[oldHead.x][oldHead.y]
      .classList.remove("head", "up", "down", "left", "right");
    return;
  }

  snake.forEach((segment) => {
    boardCellElements[segment.x][segment.y].classList.add("snake");
    boardCellElements[segment.x][segment.y]
      .classList.remove("head", "up", "down", "left", "right");
  });

  boardCellElements[head.x][head.y].classList.add("head", direction);
}

function updateSnakeTailOnScreen() {
  const oldTail = snake.shift();
  boardCellElements[oldTail.x][oldTail.y].classList.remove("snake");
}

function updateFoodOnBoard() {
  document.querySelector(".food")?.classList.remove("food");
  boardCellElements[food.x][food.y].classList.add("food");
}

function initializeSnake() {
  return [
    { x: 2, y: 2 }, // tail
    { x: 3, y: 2 }, // body
    { x: 4, y: 2 }  // head
  ];
}

function spawnFood() {
  while (true) {
    const x = Math.floor(Math.random() * numRows);
    const y = Math.floor(Math.random() * numCols);

    const isSnakeSegment = snake.some(segment => segment.x === x && segment.y === y);

    if (!isSnakeSegment) {
      food = { x, y };
      break;
    }
  }
}

function gameLoop() {
  spawnFood();
  updateFoodOnBoard();

  const timerIntervalId = setInterval(() => {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;

    timerElement.textContent =
      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    timerSeconds++;
  }, 1000);

  const snakeIntervalId = setInterval(() => {
    const head = { ...snake.at(-1) };

    if (direction === "up") {
      head.x--;
    } else if (direction === "down") {
      head.x++;
    } else if (direction === "left") {
      head.y--;
    } else if (direction === "right") {
      head.y++;
    }

    if (head.x === food.x && head.y === food.y) {
      score++;
      scoreElement.textContent = score;
      spawnFood();
      updateFoodOnBoard();
    } else if (checkCollision()) {
      if (score > highScore) {
        saveHighScore();
      }

      clearInterval(snakeIntervalId);
      clearInterval(timerIntervalId);
      modalElement.classList.remove("hide");
      restartGameElement.classList.remove("hide");
      return;
    } else {
      updateSnakeTailOnScreen();
    }

    snake.push(head);
    renderSnakeOnScreen();

    keyPressPaused = false;
  }, 250);
}

function checkCollision() {
  const checkSelfCollision = () => {
    return snake.slice(0, -1)
      .some(segment => segment.x === head.x && segment.y === head.y);
  }

  const head = snake.at(-1);

  if (
    head.x < 0 || head.y < 0 ||
    head.x >= numRows || head.y >= numCols ||
    checkSelfCollision()) {
    return true;
  }
  return false
};

function changeMoveDirection(key) {
  if (!keyPressPaused) {
    if (key === "ArrowUp" && direction !== "down") {
      direction = "up";
    } else if (key === "ArrowDown" && direction !== "up") {
      direction = "down";
    } else if (key === "ArrowLeft" && direction !== "right") {
      direction = "left";
    } else if (key === "ArrowRight" && direction !== "left") {
      direction = "right";
    }
  }

  keyPressPaused = true;
}

function saveHighScore() {
  localStorage.setItem("snake_hight_score", score);
}

function getHighScore() {
  return +localStorage.getItem("snake_hight_score") ?? 0;
}

function startGame() {
  highScoreElement.textContent = highScore;
  scoreElement.textContent = score;
  timerElement.textContent = "00:00";
  renderSnakeOnScreen();
  gameLoop();
}

function restartGame() {
  snake.forEach((segment) => {
    if (
      segment.x >= 0 && segment.x < numRows &&
      segment.y >= 0 && segment.y < numCols) {
      boardCellElements[segment.x][segment.y]
        .classList.remove("snake", "head", "up", "down", "left", "right");
    }
  });

  boardCellElements[food.x][food.y].classList.remove("food");

  snake = initializeSnake();
  food = null;
  highScore = getHighScore();
  score = 0;
  timerSeconds = 0;
  direction = "down";
  startGame();
}

renderCellsOnScreen();

startButton.addEventListener("click", () => {
  modalElement.classList.add("hide");
  startGameElement.classList.add("hide");
  startGame();
});

restartButton.addEventListener("click", () => {
  modalElement.classList.add("hide");
  restartGame();
});

document.addEventListener("keydown", e => changeMoveDirection(e.key));
controllerKeysElement.addEventListener("click", (e) => {
  const buttonElement = e.target.closest(".controller-key");

  if (!buttonElement) return;

  const key = buttonElement.dataset.key;

  changeMoveDirection(key);
});