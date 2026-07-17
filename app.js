/* ==========================================
   NEON ARENA CARD GAME JAVASCRIPT (V2)
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Lucide 아이콘 초기화
  lucide.createIcons();

  // 1. 게임 상태 정의
  const state = {
    p1Hp: 100,
    p2Hp: 100,
    p1Deck: [],
    p2Deck: [],
    p1Hand: [],
    p2Hand: [],
    p1Played: null, // P1이 이번 턴에 제출한 카드
    p2Played: null, // P2가 이번 턴에 제출한 카드
    currentTurn: "p1", // 'p1' 또는 'p2'
    gameActive: false,
    hasPlayedCardThisTurn: false,
    cardIdCounter: 0,
    
    // 비동기 모달 대기용 해결사(Resolver)
    specialChoiceResolver: null,
    defenseChoiceResolver: null
  };

  // 2. DOM 요소 참조
  const elements = {
    // 플레이어 정보
    p1HpText: document.getElementById("p1-hp-text"),
    p2HpText: document.getElementById("p2-hp-text"),
    p1HpBar: document.getElementById("p1-hp-bar"),
    p2HpBar: document.getElementById("p2-hp-bar"),
    p1HpBarShadow: document.getElementById("p1-hp-bar-shadow"),
    p2HpBarShadow: document.getElementById("p2-hp-bar-shadow"),
    
    // 덱 및 핸드
    p1DeckCount: document.getElementById("p1-deck-count"),
    p2DeckCount: document.getElementById("p2-deck-count"),
    p1HandContainer: document.getElementById("p1-hand-container"),
    p2HandContainer: document.getElementById("p2-hand-container"),
    
    // 플레이 필드
    p1PlayedContainer: document.getElementById("p1-played-card-container"),
    p2PlayedContainer: document.getElementById("p2-played-card-container"),
    p1DamagePopup: document.getElementById("p1-damage-popup"),
    p2DamagePopup: document.getElementById("p2-damage-popup"),
    
    // UI 컨트롤
    turnBadge: document.getElementById("turn-badge"),
    instructionText: document.getElementById("instruction-text"),
    endTurnBtn: document.getElementById("end-turn-btn"),
    battleLog: document.getElementById("battle-log"),
    appContainer: document.getElementById("app"),
    
    // 모달 관련
    startModal: document.getElementById("start-modal"),
    startGameBtn: document.getElementById("start-game-btn"),
    resultModal: document.getElementById("result-modal"),
    resultBadge: document.getElementById("result-badge"),
    resultTitle: document.getElementById("result-title"),
    resultSummary: document.getElementById("result-summary"),
    finalP1Hp: document.getElementById("final-p1-hp"),
    finalP2Hp: document.getElementById("final-p2-hp"),
    restartGameBtn: document.getElementById("restart-game-btn"),
    
    // 특수 카드 변환 모달
    specialModal: document.getElementById("special-modal"),
    specialPreviewValue: document.getElementById("special-preview-value"),
    specialChooseAtk: document.getElementById("special-choose-atk"),
    specialChooseDef: document.getElementById("special-choose-def"),
    specialChooseHeal: document.getElementById("special-choose-heal"),
    
    // 방어 리액션 모달
    defenseModal: document.getElementById("defense-modal"),
    incomingAtkValue: document.getElementById("incoming-atk-value"),
    predictedDamageValue: document.getElementById("predicted-damage-value"),
    defenseCardsList: document.getElementById("defense-cards-list"),
    defenseSkipBtn: document.getElementById("defense-skip-btn")
  };

  // 3. 카드 종류 정의 및 생성 헬퍼
  // 카드 구조: { id, type: 'attack'|'heal'|'defense'|'special', value }
  function generateCard(type) {
    state.cardIdCounter++;
    let value = 0;
    
    if (type === "attack") {
      value = Math.floor(Math.random() * 21) + 10; // 10 ~ 30
    } else if (type === "heal") {
      value = Math.floor(Math.random() * 11) + 10; // 10 ~ 20
    } else if (type === "defense") {
      value = Math.floor(Math.random() * 6) + 5;   // 5 ~ 10
    } else if (type === "special") {
      value = Math.floor(Math.random() * 21) + 10; // 10 ~ 30
    }

    return {
      id: `card_${state.cardIdCounter}`,
      type: type,
      value: value
    };
  }

  // 덱 생성: 총 30장 구성 (공격 15장, 회복 5장, 방어 5장, 특수 5장)
  function createNewDeck() {
    const cardPool = [];
    
    // 공격 15장
    for (let i = 0; i < 15; i++) cardPool.push(generateCard("attack"));
    // 회복 5장
    for (let i = 0; i < 5; i++) cardPool.push(generateCard("heal"));
    // 방어 5장
    for (let i = 0; i < 5; i++) cardPool.push(generateCard("defense"));
    // 특수 5장
    for (let i = 0; i < 5; i++) cardPool.push(generateCard("special"));
    
    // 피셔-예이츠 셔플 알고리즘 적용
    for (let i = cardPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPool[i], cardPool[j]] = [cardPool[j], cardPool[i]];
    }
    
    return cardPool;
  }

  // 4. 배틀 로그 기록
  function logMessage(text, type = "system") {
    const logItem = document.createElement("div");
    logItem.className = `log-message ${type}`;
    logItem.textContent = text;
    elements.battleLog.appendChild(logItem);
    
    // 로그 최하단 스크롤
    elements.battleLog.scrollTop = elements.battleLog.scrollHeight;
  }

  // 5. 게임 화면 동기화 (UI 업데이트)
  function updateUI() {
    // HP 텍스트 및 바 갱신
    elements.p1HpText.textContent = `${Math.max(0, state.p1Hp)}/100`;
    elements.p2HpText.textContent = `${Math.max(0, state.p2Hp)}/100`;

    const p1HpPercent = Math.max(0, (state.p1Hp / 100) * 100);
    const p2HpPercent = Math.max(0, (state.p2Hp / 100) * 100);
    elements.p1HpBar.style.width = `${p1HpPercent}%`;
    elements.p2HpBar.style.width = `${p2HpPercent}%`;

    // HP 잔상 쉐도우 싱크
    setTimeout(() => {
      elements.p1HpBarShadow.style.width = `${p1HpPercent}%`;
      elements.p2HpBarShadow.style.width = `${p2HpPercent}%`;
    }, 450);

    // 덱 카운트 갱신
    elements.p1DeckCount.textContent = state.p1Deck.length;
    elements.p2DeckCount.textContent = state.p2Deck.length;

    // P1 (유저) 핸드 렌더링
    elements.p1HandContainer.innerHTML = "";
    state.p1Hand.forEach(card => {
      const cardEl = document.createElement("div");
      cardEl.className = "card user-card";
      cardEl.setAttribute("data-type", card.type);
      cardEl.setAttribute("data-atk", card.value);
      
      // 내 턴인데 카드를 이미 냈거나, 방어 카드인 경우 직접 플레이 불가
      const isUnplayable = (state.currentTurn !== "p1") || state.hasPlayedCardThisTurn || (card.type === "defense");
      if (isUnplayable) {
        cardEl.classList.add("unplayable");
      }

      // 카드 헤더 아이콘 맵핑
      let iconMarkup = '<i data-lucide="zap" style="width:10px;height:10px;"></i>';
      let typeLabel = "공격";
      if (card.type === "heal") {
        iconMarkup = '<i data-lucide="heart" style="width:10px;height:10px;color:var(--color-heal);"></i>';
        typeLabel = "회복";
      } else if (card.type === "defense") {
        iconMarkup = '<i data-lucide="shield" style="width:10px;height:10px;color:var(--color-def);"></i>';
        typeLabel = "방어";
      }

      cardEl.innerHTML = `
        <div class="card-header">
          <span>${typeLabel}</span>
          ${iconMarkup}
        </div>
        <div class="card-body">
          <span class="attack-value">${card.value}</span>
        </div>
        <div class="card-footer">
          <span>VALUE</span>
        </div>
      `;
      
      // 유저 카드 클릭 이벤트
      cardEl.addEventListener("click", () => {
        if (state.currentTurn === "p1" && state.gameActive && !state.hasPlayedCardThisTurn) {
          if (card.type === "defense") {
            logMessage("💡 방어 카드는 직접 낼 수 없습니다. 상대가 공격해 올 때 방어용으로 소모됩니다.", "system");
            return;
          }
          playCardP1(card);
        }
      });

      elements.p1HandContainer.appendChild(cardEl);
    });

    // P2 (컴퓨터) 핸드 렌더링
    elements.p2HandContainer.innerHTML = "";
    state.p2Hand.forEach(() => {
      const cardEl = document.createElement("div");
      cardEl.className = "card back";
      cardEl.innerHTML = `
        <div class="card-pattern">
          <i data-lucide="cpu" style="width:20px;height:20px;opacity:0.3;"></i>
        </div>
      `;
      elements.p2HandContainer.appendChild(cardEl);
    });

    // 필드 낸 카드 - P1
    if (state.p1Played) {
      let iconMarkup = '<i data-lucide="zap" style="width:10px;height:10px;"></i>';
      let typeLabel = "공격";
      if (state.p1Played.type === "heal") {
        iconMarkup = '<i data-lucide="heart" style="width:10px;height:10px;color:var(--color-heal);"></i>';
        typeLabel = "회복";
      }
      elements.p1PlayedContainer.innerHTML = `
        <div class="card played-card user-played" data-type="${state.p1Played.type}" data-atk="${state.p1Played.value}">
          <div class="card-header">
            <span>${typeLabel}</span>
            ${iconMarkup}
          </div>
          <div class="card-body">
            <span class="attack-value">${state.p1Played.value}</span>
          </div>
          <div class="card-footer">
            <span>PLAYED</span>
          </div>
        </div>
      `;
    } else {
      elements.p1PlayedContainer.innerHTML = `
        <div class="card-placeholder">
          <i data-lucide="swords"></i>
          <span>대기 중</span>
        </div>
      `;
    }

    // 필드 낸 카드 - P2
    if (state.p2Played) {
      let iconMarkup = '<i data-lucide="zap" style="width:10px;height:10px;"></i>';
      let typeLabel = "공격";
      if (state.p2Played.type === "heal") {
        iconMarkup = '<i data-lucide="heart" style="width:10px;height:10px;color:var(--color-heal);"></i>';
        typeLabel = "회복";
      }
      elements.p2PlayedContainer.innerHTML = `
        <div class="card played-card cpu-played" data-type="${state.p2Played.type}" data-atk="${state.p2Played.value}">
          <div class="card-header">
            <span>${typeLabel}</span>
            ${iconMarkup}
          </div>
          <div class="card-body">
            <span class="attack-value">${state.p2Played.value}</span>
          </div>
          <div class="card-footer">
            <span>PLAYED</span>
          </div>
        </div>
      `;
    } else {
      elements.p2PlayedContainer.innerHTML = `
        <div class="card-placeholder">
          <i data-lucide="swords"></i>
          <span>대기 중</span>
        </div>
      `;
    }

    // 턴 관련 제어 인터랙션
    if (state.currentTurn === "p1") {
      elements.turnBadge.textContent = "P1 TURN";
      elements.turnBadge.className = "turn-badge p1-turn";
      
      if (!state.hasPlayedCardThisTurn) {
        elements.instructionText.textContent = "자신의 턴입니다. 공격 또는 회복 카드를 제출해 주세요.";
        elements.endTurnBtn.className = "neon-btn disabled";
        elements.endTurnBtn.disabled = true;
      } else {
        elements.instructionText.textContent = "행동을 완료했습니다. '턴 종료' 버튼을 눌러 컴퓨터에게 차례를 넘기세요.";
        elements.endTurnBtn.className = "neon-btn";
        elements.endTurnBtn.disabled = false;
      }
    } else {
      elements.turnBadge.textContent = "P2 TURN";
      elements.turnBadge.className = "turn-badge p2-turn";
      elements.instructionText.textContent = "P2 (COMPUTER)가 공격 준비 중...";
      elements.endTurnBtn.className = "neon-btn disabled";
      elements.endTurnBtn.disabled = true;
    }

    lucide.createIcons();
  }

  // 6. 특수 연출 (화면 흔들림 및 수치 플로팅)
  function triggerDamageEffect(target, amount, type = "damage") {
    // 화면 흔들기 (피격 시에만)
    if (type === "damage") {
      elements.appContainer.classList.add("shake");
      setTimeout(() => {
        elements.appContainer.classList.remove("shake");
      }, 350);
    }

    const popup = document.createElement("div");
    if (type === "damage") {
      popup.className = "damage-num-pop";
      popup.textContent = `-${amount}`;
    } else if (type === "heal") {
      popup.className = "heal-num-pop";
      popup.textContent = `+${amount}`;
    } else if (type === "defense") {
      popup.className = "defense-num-pop";
      popup.innerHTML = `<i data-lucide="shield" style="width:20px;height:20px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>-${amount}`;
    }

    if (target === "p2") {
      elements.p2DamagePopup.appendChild(popup);
    } else {
      elements.p1DamagePopup.appendChild(popup);
    }

    lucide.createIcons();

    popup.addEventListener("animationend", () => {
      popup.remove();
    });
  }

  // 7. 비동기 드로우 메커니즘 (특수 카드 비동기 입력 처리 포함)
  async function drawCard(player) {
    if (player === "p1") {
      if (state.p1Deck.length > 0) {
        const card = state.p1Deck.shift();
        
        // 특수 카드 감지 시 비동기 대기 분기 실행
        if (card.type === "special") {
          logMessage(`P1 (USER)이 특수 카드(기본값 ${card.value})를 획득했습니다! 타입을 정하는 중...`, "system");
          const chosenType = await waitForSpecialCardSelection(card.value);
          card.type = chosenType;
          logMessage(`P1 (USER)의 특수 카드가 [${chosenType === 'attack' ? '공격' : chosenType === 'defense' ? '방어' : '회복'}] 카드로 최종 변환되었습니다.`, "p1-action");
        } else {
          let typeKorean = card.type === "attack" ? "공격" : card.type === "defense" ? "방어" : "회복";
          logMessage(`P1 (USER)이 덱에서 [${typeKorean}] 카드를 드로우했습니다 (값: ${card.value}).`, "p1-action");
        }
        
        state.p1Hand.push(card);
        updateUI();
        return true;
      } else {
        logMessage(`P1 (USER)의 덱이 비어있어 카드를 드로우할 수 없습니다!`, "system");
        return false;
      }
    } else {
      // P2 (CPU) 드로우
      if (state.p2Deck.length > 0) {
        const card = state.p2Deck.shift();
        
        if (card.type === "special") {
          // AI 판단에 따른 속성 변환
          let chosenType = "attack";
          
          const hasHeal = state.p2Hand.some(c => c.type === "heal");
          const hasDef = state.p2Hand.some(c => c.type === "defense");
          
          if (state.p2Hp <= 50 && !hasHeal) {
            chosenType = "heal";
          } else if (!hasDef) {
            chosenType = "defense";
          }
          
          card.type = chosenType;
          logMessage(`P2 (CPU)가 특수 카드를 드로우하여 [${chosenType === 'attack' ? '공격' : chosenType === 'defense' ? '방어' : '회복'}] 카드로 임의 변환하여 패에 넣었습니다.`, "p2-action");
        } else {
          logMessage(`P2 (CPU)가 카드를 1장 드로우했습니다.`, "p2-action");
        }
        
        state.p2Hand.push(card);
        updateUI();
        return true;
      } else {
        logMessage(`P2 (CPU)의 덱이 비어있어 카드를 드로우할 수 없습니다!`, "system");
        return false;
      }
    }
  }

  // 특수 카드 결정 비동기 핸들러 (Promise 대기)
  function waitForSpecialCardSelection(cardValue) {
    elements.specialPreviewValue.textContent = cardValue;
    elements.specialModal.classList.add("active");

    return new Promise(resolve => {
      state.specialChoiceResolver = resolve;
    });
  }

  // 특수 카드 타입 결정 버튼 바인딩
  function resolveSpecialSelection(type) {
    if (state.specialChoiceResolver) {
      elements.specialModal.classList.remove("active");
      state.specialChoiceResolver(type);
      state.specialChoiceResolver = null;
    }
  }

  elements.specialChooseAtk.addEventListener("click", () => resolveSpecialSelection("attack"));
  elements.specialChooseDef.addEventListener("click", () => resolveSpecialSelection("defense"));
  elements.specialChooseHeal.addEventListener("click", () => resolveSpecialSelection("heal"));

  // 8. 플레이어 카드 제출 및 전투 상호작용
  async function playCardP1(card) {
    state.hasPlayedCardThisTurn = true;
    state.p1Played = card;
    
    // 유저 핸드에서 카드 제거
    state.p1Hand = state.p1Hand.filter(c => c.id !== card.id);
    updateUI();

    if (card.type === "attack") {
      logMessage(`P1 (USER)이 공격력 [${card.value}] 카드를 냈습니다! 상대방의 대응을 탐색합니다.`, "p1-action");
      
      // 컴퓨터의 방어 카드 자동 판단 로직 실행
      const p2DefCards = state.p2Hand.filter(c => c.type === "defense");
      if (p2DefCards.length > 0 && state.gameActive) {
        // CPU 지능적 방어 결정: 
        // 상대 공격력이 15 이상이고 본인 체력이 낮거나, 75%의 무작위 확률일 때 방어
        const shouldDefense = (card.value >= 15) || (state.p2Hp <= 40) || (Math.random() < 0.75);
        
        if (shouldDefense) {
          // 가장 방어력이 큰 방어 카드 소지품 중에서 소모
          p2DefCards.sort((a, b) => b.value - a.value);
          const usedDefCard = p2DefCards[0];
          
          // CPU 패에서 제거
          state.p2Hand = state.p2Hand.filter(c => c.id !== usedDefCard.id);
          
          const finalDamage = Math.max(0, card.value - usedDefCard.value);
          state.p2Hp -= finalDamage;
          
          logMessage(`🛡️ P2 (CPU)가 패에서 방어 카드(방어 수치: ${usedDefCard.value})를 소모하여 방어했습니다!`, "p2-action");
          logMessage(`P1의 최종 데미지가 ${card.value} ➔ ${finalDamage}로 감쇄되었습니다.`, "defense");
          
          triggerDamageEffect("p2", usedDefCard.value, "defense");
          
          setTimeout(() => {
            logMessage(`P2 (CPU)의 생명 점수가 ${state.p2Hp}점으로 감소했습니다.`, "damage");
            triggerDamageEffect("p2", finalDamage, "damage");
            updateUI();
            checkGameEnd();
          }, 800);
          
          return;
        }
      }
      
      // 방어가 발동되지 않은 경우 본 대미지 적용
      state.p2Hp -= card.value;
      logMessage(`P2 (CPU)에게 고스란히 ${card.value} 데미지가 적용되었습니다.`, "damage");
      logMessage(`P2 (CPU)의 생명 점수가 ${state.p2Hp}점으로 감소했습니다.`, "damage");
      triggerDamageEffect("p2", card.value, "damage");
      
    } else if (card.type === "heal") {
      // 회복 카드 적용
      const previousHp = state.p1Hp;
      state.p1Hp = Math.min(100, state.p1Hp + card.value);
      const actualHeal = state.p1Hp - previousHp;
      
      logMessage(`❤️ P1 (USER)이 회복 카드를 냈습니다! HP를 ${actualHeal} 회복하여 현재 ${state.p1Hp} HP입니다.`, "heal");
      triggerDamageEffect("p1", actualHeal, "heal");
    }

    updateUI();
    checkGameEnd();
  }

  // 9. 컴퓨터(CPU) 행동 루틴 및 방어 대응 모달 트리거
  async function playCardP2() {
    if (!state.gameActive) return;
    
    logMessage("P2 (CPU)가 카드를 고르고 있습니다...", "system");
    
    // CPU 지능형 플레이 전략
    setTimeout(async () => {
      // 플레이 가능한 공격 및 회복 카드 필터링 (방어 카드는 턴에 직접 낼 수 없음)
      const playableCards = state.p2Hand.filter(c => c.type === "attack" || c.type === "heal");
      
      if (playableCards.length === 0) {
        logMessage("P2 (CPU)가 이번 턴에 직접 낼 수 있는 카드가 존재하지 않습니다.", "system");
        
        // 덱과 핸드 체크 후 턴 넘기기
        setTimeout(() => endTurnP2(), 1000);
        return;
      }

      let selectedCard = null;
      
      // 1) 킬각 체크: 공격 카드 중 1장으로 플레이어를 이길 수 있는지 탐색
      const killCards = playableCards.filter(c => c.type === "attack" && c.value >= state.p1Hp);
      if (killCards.length > 0) {
        killCards.sort((a, b) => a.value - b.value);
        selectedCard = killCards[0]; // 가장 낮은 수치로 정밀 파괴
      } else {
        // 2) 상황에 따른 전략
        const heals = playableCards.filter(c => c.type === "heal");
        const attacks = playableCards.filter(c => c.type === "attack");
        
        // 체력이 낮을 때 회복 카드가 있으면 최우선 발동
        if (state.p2Hp <= 40 && heals.length > 0) {
          heals.sort((a, b) => b.value - a.value);
          selectedCard = heals[0];
        } else if (attacks.length > 0) {
          // 보통 상황에서는 공격 우선 (70% 확률로 최대 공격력 제출)
          if (Math.random() < 0.75) {
            attacks.sort((a, b) => b.value - a.value);
            selectedCard = attacks[0];
          } else {
            selectedCard = attacks[Math.floor(Math.random() * attacks.length)];
          }
        } else {
          // 회복 카드만 있는 경우
          heals.sort((a, b) => b.value - a.value);
          selectedCard = heals[0];
        }
      }

      // 카드 제출 적용
      state.p2Played = selectedCard;
      state.p2Hand = state.p2Hand.filter(c => c.id !== selectedCard.id);
      updateUI();

      if (selectedCard.type === "attack") {
        logMessage(`P2 (CPU)가 공격력 [${selectedCard.value}] 카드로 습격해 왔습니다!`, "p2-action");
        
        // 유저 방어 리액션 대기
        const p1DefCards = state.p1Hand.filter(c => c.type === "defense");
        
        if (p1DefCards.length > 0 && state.gameActive) {
          // 유저 방어 상호작용 비동기 시작
          const usedDefCard = await waitForUserDefenseReaction(selectedCard.value, p1DefCards);
          
          if (usedDefCard) {
            // 방어 수락
            state.p1Hand = state.p1Hand.filter(c => c.id !== usedDefCard.id);
            const finalDamage = Math.max(0, selectedCard.value - usedDefCard.value);
            state.p1Hp -= finalDamage;
            
            logMessage(`🛡️ P1 (USER)이 방어 카드(방어 수치: ${usedDefCard.value})를 소모해 피해를 감쇄했습니다!`, "p1-action");
            logMessage(`P2의 최종 데미지가 ${selectedCard.value} ➔ ${finalDamage}로 하락했습니다.`, "defense");
            
            triggerDamageEffect("p1", usedDefCard.value, "defense");
            
            setTimeout(() => {
              logMessage(`P1 (USER)의 생명 점수가 ${state.p1Hp}점으로 감소했습니다.`, "damage");
              triggerDamageEffect("p1", finalDamage, "damage");
              updateUI();
              checkGameEnd();
              
              // 다음 컴퓨터 턴 자동 리셋/턴교대
              if (state.gameActive) {
                setTimeout(() => endTurnP2(), 1200);
              }
            }, 800);
            
            return;
          }
        }
        
        // 방어를 선택하지 않았거나 방어 카드가 없는 경우
        state.p1Hp -= selectedCard.value;
        logMessage(`P1 (USER)은 회피 혹은 방어하지 못해 고스란히 ${selectedCard.value} 피해를 입었습니다.`, "damage");
        logMessage(`P1 (USER)의 생명 점수가 ${state.p1Hp}점으로 감소했습니다.`, "damage");
        triggerDamageEffect("p1", selectedCard.value, "damage");
        
      } else if (selectedCard.type === "heal") {
        const previousHp = state.p2Hp;
        state.p2Hp = Math.min(100, state.p2Hp + selectedCard.value);
        const actualHeal = state.p2Hp - previousHp;
        
        logMessage(`❤️ P2 (CPU)가 회복 카드를 사용하여 HP를 ${actualHeal} 회복했습니다. 현재 ${state.p2Hp} HP.`, "heal");
        triggerDamageEffect("p2", actualHeal, "heal");
      }

      updateUI();
      checkGameEnd();

      if (state.gameActive) {
        setTimeout(() => {
          endTurnP2();
        }, 1200);
      }

    }, 1200);
  }

  // 유저 방어 리액션 수신 비동기 Promise화
  function waitForUserDefenseReaction(atkValue, defenseCards) {
    elements.incomingAtkValue.textContent = atkValue;
    elements.predictedDamageValue.textContent = atkValue;
    elements.defenseCardsList.innerHTML = "";
    
    elements.defenseModal.classList.add("active");

    return new Promise(resolve => {
      // 1) 리졸버 캐시
      state.defenseChoiceResolver = resolve;

      // 2) 방어 카드 리스트 동적 추가
      defenseCards.forEach(card => {
        const cardEl = document.createElement("div");
        cardEl.className = "card user-card";
        cardEl.setAttribute("data-type", "defense");
        cardEl.innerHTML = `
          <div class="card-header">
            <span>방어</span>
            <i data-lucide="shield" style="width:10px;height:10px;color:var(--color-def);"></i>
          </div>
          <div class="card-body">
            <span class="attack-value">${card.value}</span>
          </div>
          <div class="card-footer">
            <span>DEF</span>
          </div>
        `;

        // 마우스 오버 시 예상 차감 데미지 실시간 뷰
        cardEl.addEventListener("mouseenter", () => {
          const predicted = Math.max(0, atkValue - card.value);
          elements.predictedDamageValue.textContent = predicted;
          elements.predictedDamageValue.style.color = "var(--color-heal)";
        });

        cardEl.addEventListener("mouseleave", () => {
          elements.predictedDamageValue.textContent = atkValue;
          elements.predictedDamageValue.style.color = "#fff";
        });

        // 카드 클릭 시 방어 확정
        cardEl.addEventListener("click", () => {
          elements.defenseModal.classList.remove("active");
          resolve(card);
          state.defenseChoiceResolver = null;
        });

        elements.defenseCardsList.appendChild(cardEl);
      });

      lucide.createIcons();
    });
  }

  // 방어 포기 버튼 바인딩
  elements.defenseSkipBtn.addEventListener("click", () => {
    if (state.defenseChoiceResolver) {
      elements.defenseModal.classList.remove("active");
      state.defenseChoiceResolver(null); // 방어 포기
      state.defenseChoiceResolver = null;
    }
  });

  // 10. 턴 종료 통제
  async function endTurnP1() {
    if (state.currentTurn !== "p1" || !state.gameActive) return;
    
    state.currentTurn = "p2";
    state.hasPlayedCardThisTurn = false;
    updateUI();
    
    // CPU 드로우 및 행동 페이즈 개시
    setTimeout(async () => {
      await drawCard("p2");
      updateUI();
      await playCardP2();
    }, 600);
  }

  function endTurnP2() {
    if (state.currentTurn !== "p2" || !state.gameActive) return;
    
    state.currentTurn = "p1";
    state.hasPlayedCardThisTurn = false;
    logMessage("P1 (USER)의 차례가 돌아왔습니다.", "system");
    
    // 유저 턴 시작 드로우
    setTimeout(async () => {
      await drawCard("p1");
      updateUI();
      checkEmptyHandAndDeck();
    }, 400);
  }

  // 11. 승리 판정 및 게임 끝처리
  function checkGameEnd() {
    if (state.p1Hp <= 0 || state.p2Hp <= 0) {
      finishGame();
      return true;
    }
    return false;
  }

  // 덱 & 패 모두 말랐을 때의 비교 처리
  function checkEmptyHandAndDeck() {
    const p1Empty = (state.p1Deck.length === 0 && state.p1Hand.length === 0);
    const p2Empty = (state.p2Deck.length === 0 && state.p2Hand.length === 0);
    
    if (p1Empty && p2Empty) {
      logMessage("양측 플레이어의 덱과 카드 패가 완전히 소진되었습니다. 최종 체력으로 판결합니다.", "system");
      finishGame();
    } else if (p1Empty && state.currentTurn === "p1") {
      logMessage("P1 (USER)은 카드 낼 수단이 없어 강제 턴 종료 처리됩니다.", "system");
      setTimeout(() => endTurnP1(), 1500);
    }
  }

  function finishGame() {
    state.gameActive = false;
    
    let winner = "p1";
    let isDraw = false;
    
    if (state.p1Hp <= 0 && state.p2Hp <= 0) {
      if (state.p1Hp === state.p2Hp) {
        isDraw = true;
      } else {
        winner = state.p1Hp > state.p2Hp ? "p1" : "p2";
      }
    } else if (state.p1Hp <= 0) {
      winner = "p2";
    } else if (state.p2Hp <= 0) {
      winner = "p1";
    } else {
      // 덱 고갈 시 판독
      if (state.p1Hp === state.p2Hp) {
        isDraw = true;
      } else {
        winner = state.p1Hp > state.p2Hp ? "p1" : "p2";
      }
    }

    elements.finalP1Hp.textContent = state.p1Hp;
    elements.finalP2Hp.textContent = state.p2Hp;

    if (isDraw) {
      elements.resultBadge.textContent = "TIE MATCH";
      elements.resultBadge.style.color = "var(--text-secondary)";
      elements.resultBadge.style.borderColor = "var(--text-secondary)";
      elements.resultBadge.style.background = "rgba(255, 255, 255, 0.05)";
      
      elements.resultTitle.textContent = "DRAW BATTLE";
      elements.resultTitle.className = "neon-title";
      elements.resultTitle.style.textShadow = "0 0 10px #fff, 0 0 20px var(--text-secondary)";
      
      elements.resultSummary.textContent = "양 아레나 영웅들의 잔존 생명력이 일치하여 무승부로 처리됩니다.";
      elements.resultModal.querySelector(".modal-content").classList.remove("lose");
    } else if (winner === "p1") {
      elements.resultBadge.textContent = "VICTOR";
      elements.resultBadge.style.color = "var(--gold)";
      elements.resultBadge.style.borderColor = "var(--gold)";
      elements.resultBadge.style.background = "rgba(251, 191, 36, 0.15)";
      
      elements.resultTitle.textContent = "VICTORY";
      elements.resultTitle.className = "neon-title winner-title";
      
      elements.resultSummary.textContent = "축하합니다! 전장에서 뛰어난 전술과 방어로 인공지능 P2를 무찔렀습니다.";
      elements.resultModal.querySelector(".modal-content").classList.remove("lose");
      logMessage("★ 게임 종료: P1 (USER)의 승리! ★", "win");
    } else {
      elements.resultBadge.textContent = "DEFEATED";
      elements.resultBadge.style.color = "var(--p2-neon)";
      elements.resultBadge.style.borderColor = "var(--p2-neon)";
      elements.resultBadge.style.background = "rgba(255, 0, 127, 0.15)";
      
      elements.resultTitle.textContent = "DEFEAT";
      elements.resultTitle.className = "neon-title";
      
      elements.resultSummary.textContent = "패배했습니다... P2(CPU)의 신속한 공격과 철벽 방어에 무너졌습니다. 전술을 가다듬으세요.";
      elements.resultModal.querySelector(".modal-content").classList.add("lose");
      logMessage("★ 게임 종료: P2 (CPU)의 승리! ★", "system");
    }

    elements.resultModal.classList.add("active");
  }

  // 12. 전체 리셋 및 새 게임 초기화
  async function initGame() {
    elements.startModal.classList.remove("active");
    elements.resultModal.classList.remove("active");
    
    // 로그 및 상태 초기화
    elements.battleLog.innerHTML = "";
    logMessage("네온 아레나 V2 매치가 활성화되었습니다!", "system");

    state.p1Hp = 100;
    state.p2Hp = 100;
    state.currentTurn = "p1";
    state.hasPlayedCardThisTurn = false;
    state.p1Played = null;
    state.p2Played = null;
    state.cardIdCounter = 0;

    // 덱 제작
    state.p1Deck = createNewDeck();
    state.p2Deck = createNewDeck();

    // 5장씩 초기 드로우 (초기 핸드 생성 시에는 '특수' 카드 타입을 결정하기 위한 사용자 인터랙션이 발생하면 게임 진행 흐름상 난잡해질 수 있으므로,
    // 초기 드로우에는 특수 카드를 포함시키지 않거나 또는 초기 핸드 드로우 시에도 동일하게 처리하되,
    // 여기서는 자연스러운 시작을 위해 초기 5장 드로우 시 만약 특수 카드가 뽑힌다면 비동기 선택 팝업을 연달아 띄우도록 보장합니다.)
    state.p1Hand = [];
    state.p2Hand = [];
    
    logMessage("양 플레이어가 초기 카드를 5장씩 획득합니다...", "system");
    
    // 비동기 드로우 연쇄 대기 (순차적으로 드로우하여 모달 충돌 방지)
    for (let i = 0; i < 5; i++) {
      await drawCard("p1");
      // 컴퓨터는 즉각 결정됨
      await drawCard("p2");
    }

    state.gameActive = true;

    // 첫 선공 유저 드로우 진행
    logMessage("P1 (USER) 선공으로 시작합니다.", "system");
    await drawCard("p1");
    
    updateUI();
  }

  // 13. 이벤트 리스너 등록
  elements.startGameBtn.addEventListener("click", initGame);
  elements.restartGameBtn.addEventListener("click", initGame);
  elements.endTurnBtn.addEventListener("click", endTurnP1);
});
