import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import firebaseConfig from "./config.js";

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const display = document.getElementById('display');
const controlBtn = document.getElementById('controlBtn');
const restartBtn = document.getElementById('restartBtn');
const resultBox = document.getElementById('resultBox');
const scoreDisplay = document.getElementById('scoreDisplay');
const detailDisplay = document.getElementById('detailDisplay');
const rankingForm = document.getElementById('rankingForm');
const nicknameInput = document.getElementById('nickname');
const messageInput = document.getElementById('message');
const leaderboardBody = document.getElementById('leaderboardBody');
const goldShower = document.getElementById('goldShower');

let startTime = 0;
let timerInterval = null;
let isRunning = false;
let elapsedMs = 0;
let calculatedScore = 0;
let topRankings = [];

// Format millisecond to MM:SS.mmm
function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const mmm = String(milliseconds).padStart(3, '0');

  return `${mm}:${ss}.${mmm}`;
}

// Load Rankings
async function loadRankings() {
  try {
    const q = query(collection(db, "ranking"), orderBy("score", "desc"), limit(10));
    const querySnapshot = await getDocs(q);
    topRankings = [];
    leaderboardBody.innerHTML = '';

    let index = 1;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      topRankings.push({ ...data, id: doc.id });

      const row = document.createElement('tr');
      row.className = `rank-row ${index === 1 ? 'first-place' : ''}`;

      // Format display time
      const timeVal = data.time !== undefined ? data.time : data.timeMs;
      const timeText = formatTime(Number(timeVal));
      const nameVal = data.name !== undefined ? data.name : data.nickname;

      // Format date from timestamp
      let dateText = '-';
      if (data.timestamp) {
        const date = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        const yy = String(date.getFullYear()).slice(-2);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const mi = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        dateText = `${yy}.${mm}.${dd} ${hh}:${mi}:${ss}`;
      }

      row.innerHTML = `
        <td class="col-rank"><span class="rank-badge">${data.rank || index}</span></td>
        <td class="col-date">${dateText}</td>
        <td class="col-name">${escapeHTML(nameVal || '')}</td>
        <td class="col-time">${timeText}</td>
        <td class="col-score">${data.score}점</td>
        <td class="col-message"><span>${escapeHTML(data.message || '')}</span></td>
      `;
      leaderboardBody.appendChild(row);
      index++;
    });

    // 10명이 안 채워졌을 경우 자리 보충
    if (topRankings.length === 0) {
      leaderboardBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 20px;">아직 등록된 랭킹이 없습니다. 첫 주자가 되어보세요!</td></tr>`;
    }
  } catch (e) {
    console.error("랭킹 가져오기 실패: ", e);
  }
}

// HTML escape utility
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Trigger Gold Shower for 1st place
function triggerGoldShower() {
  goldShower.innerHTML = '';
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'gold-particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDelay = Math.random() * 2 + 's';
    p.style.backgroundColor = ['#ffd700', '#ffa500', '#fff', '#ffd700'][Math.floor(Math.random() * 4)];
    goldShower.appendChild(p);
  }
  setTimeout(() => {
    goldShower.innerHTML = '';
  }, 5000);
}

// Start Stopwatch
function startTimer() {
  startTime = performance.now();
  display.classList.add('running');
  display.classList.remove('stopped');
  isRunning = true;
  controlBtn.textContent = '멈춤';
  controlBtn.style.background = 'linear-gradient(135deg, var(--accent-color), #ff0055)';
  controlBtn.style.boxShadow = '0 4px 15px rgba(255, 51, 102, 0.3)';

  timerInterval = setInterval(() => {
    elapsedMs = Math.floor(performance.now() - startTime);
    display.textContent = formatTime(elapsedMs);
  }, 10);
}

// Stop Stopwatch & Calculate Score
function stopTimer() {
  clearInterval(timerInterval);
  display.classList.remove('running');
  display.classList.add('stopped');
  isRunning = false;

  controlBtn.style.display = 'none';
  restartBtn.style.display = 'inline-flex';

  // 5초 (5000ms) 목표 계산
  // 5초를 넘기면 0점, 5초 이하인 경우 5초에 가까울수록 높은 점수
  let score = 0;
  let errorMs = 5000 - elapsedMs;

  if (elapsedMs > 5000) {
    score = 0;
  } else {
    // 오차가 작을수록 5000점에 가깝게 부여 (완벽히 맞출 경우 5000점)
    score = Math.max(0, 5000 - Math.abs(errorMs));
  }

  calculatedScore = score;
  scoreDisplay.textContent = `${score}점`;

  if (elapsedMs > 5000) {
    detailDisplay.textContent = `기록: ${formatTime(elapsedMs)} (5초 초과로 0점 처리)`;
    scoreDisplay.style.color = 'var(--accent-color)';
  } else {
    const errorText = errorMs === 0 ? "정확히 맞췄습니다!" : `오차: -${errorMs}ms`;
    detailDisplay.textContent = `기록: ${formatTime(elapsedMs)} (${errorText})`;
    scoreDisplay.style.color = 'var(--primary-color)';
  }

  resultBox.style.display = 'block';

  // Check if user enters TOP 10
  const isTopTen = topRankings.length < 10 || score > topRankings[topRankings.length - 1].score;
  if (score > 0 && isTopTen) {
    rankingForm.style.display = 'flex';
    // 만약 기존의 1등보다 높은 경우 골드 샤워 효과
    if (topRankings.length === 0 || score > topRankings[0].score) {
      triggerGoldShower();
    }
  } else {
    rankingForm.style.display = 'none';
  }
}

// Control Button click handler
controlBtn.addEventListener('click', () => {
  if (!isRunning) {
    startTimer();
  } else {
    stopTimer();
  }
});

// Restart Button click handler
restartBtn.addEventListener('click', () => {
  elapsedMs = 0;
  calculatedScore = 0;
  display.textContent = '00:00.000';
  display.className = 'stopwatch-display';
  resultBox.style.display = 'none';
  rankingForm.style.display = 'none';
  rankingForm.reset();

  restartBtn.style.display = 'none';
  controlBtn.style.display = 'inline-flex';
  controlBtn.textContent = '시작';
  controlBtn.style.background = 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))';
  controlBtn.style.boxShadow = '0 4px 15px rgba(0, 242, 254, 0.2)';
});

// Submit Ranking Form
rankingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nickname = nicknameInput.value.trim();
  const message = messageInput.value.trim();

  if (!nickname || !message) return;

  // 랭킹 등극할 위치 계산
  let targetRank = 1;
  for (let i = 0; i < topRankings.length; i++) {
    if (calculatedScore > topRankings[i].score) {
      targetRank = i + 1;
      break;
    }
    targetRank = i + 2;
  }
  if (targetRank > 10) targetRank = 10;

  try {
    await addDoc(collection(db, "ranking"), {
      name: nickname,
      message: message,
      score: calculatedScore,
      time: elapsedMs,
      rank: targetRank,
      timestamp: serverTimestamp()
    });

    rankingForm.reset();
    rankingForm.style.display = 'none';

    // Reload Rankings immediately
    await loadRankings();
  } catch (err) {
    console.error("랭킹 등록 중 에러 발생: ", err);
    alert("랭킹 등록에 실패했습니다. 다시 시도해 주세요.");
  }
});

// Initial Loading
loadRankings();
