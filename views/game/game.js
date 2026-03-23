const params = new URLSearchParams(window.location.search);
const gameMusic = document.getElementById("game-bg-music");
const name = params.get("name");
const socket = io();

let countdownInterval;

socket.on("connect", () => {
  socket.emit("joinGame", name, (response) => {
    if (!response.success) {
      alert(response.error);
      window.location.href = "/";
    }
  });
});

const startMusic = () => {
  if (gameMusic.paused) {
      gameMusic.play().catch(err => {
          console.log("Autoplay prevented. Music will start on first click.");
      });
      gameMusic.volume = 0.3; // Keep it slightly lower for focus
  }
};



socket.on("updateUsers", (users) => {
  const container = document.getElementById("bubble-container");
  container.innerHTML = "";

  users.forEach((userName) => {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = userName;

    const randomTop = Math.floor(Math.random() * 70) + 10;
    const randomLeft = Math.floor(Math.random() * 80) + 10;

    bubble.style.top = randomTop + "%";
    bubble.style.left = randomLeft + "%";

    bubble.style.animationDelay = Math.random() * 5 + "s";

    container.appendChild(bubble);
  });
});

socket.on("newQuestion", (question) => {
  console.log("📝 Received question:", question);

  // Display the question
  document.getElementById("question-text").innerText = question.question;

  // Display the answer options
  const optionsContainer = document.getElementById("answer-options");
  optionsContainer.innerHTML = "";

  question.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.innerText = answer.text;
    button.className = "answer-btn";
    button.className = `answer-btn btn-${index}`;
    button.onclick = () => {
      socket.emit("submitAnswer", answer.id);
      const allButtons = document.querySelectorAll(".answer-btn");
      allButtons.forEach((btn) => {
        btn.disabled = true; // Stop further clicks

        if (btn === button) {
          // This is the one you chose!
          btn.classList.add("selected");
        } else {
          // These are the others - dim them out
          btn.classList.add("unselected");
        }
      });
    };
    optionsContainer.appendChild(button);
  });

  clearInterval(countdownInterval);
  const timerDisplay = document.getElementById("timer-seconds");
  const timerContainer = document.getElementById("timer-container");
  timerContainer.classList.remove("timer-low");

  let timeLeft = question.timeLimit;

  const updateTimer = () => {
    timerDisplay.innerText = timeLeft;

    if (timeLeft <= 5) {
      timerContainer.classList.add("timer-low");
    }

    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      // Lock buttons if time hits zero
      document
        .querySelectorAll(".answer-btn")
        .forEach((btn) => (btn.disabled = true));
    }
    timeLeft--;
  };
  updateTimer(); // Run once immediately
  countdownInterval = setInterval(updateTimer, 1000);
});

socket.on("gameStarted", () => {
  document.getElementById("lobby-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");
  startMusic();
});
document.addEventListener('click', startMusic, { once: true });

socket.on("reloadPage", () => {
  window.location.reload();
});

socket.on("countdown", (seconds) => {
  const lobby = document.getElementById("lobby-screen");

  if (seconds > 0) {
    lobby.innerHTML = `
      <h1>Game Starting!</h1>
      <p class="countdown-number">${seconds}</p>
    `;
  } else {
    lobby.innerHTML = `
      <h1>GO!</h1>
    `;
  }
});

socket.on("gameStarted", () => {
  document.getElementById("lobby-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");
});

socket.on("gameEnd", (leaderboard) => {
  document.getElementById("game-screen").classList.add("hidden");
  document.getElementById("winner-screen").classList.remove("hidden");

  const board = document.getElementById("leaderboard");
  board.innerHTML = leaderboard
    .map((player, index) => {
      let rankClass = "standard-rank";
      if (index === 0) rankClass = "gold-rank";
      else if (index === 1) rankClass = "silver-rank";
      else if (index === 2) rankClass = "bronze-rank";

      return `
        <div class="winner-row ${rankClass}">
          <div class="rank-info">
            <span class="rank-number">${index + 1}.</span>
            <span class="player-name">${player.name}</span>
          </div>
          <span class="player-score">${player.score} pts</span>
        </div>
      `;
    })
    .join("");
});

// Comment: this coment is for code review purposes.