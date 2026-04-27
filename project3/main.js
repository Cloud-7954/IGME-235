// main.js

// --- 游戏状态变量 ---
let deck;
let playerHands = []; 
let currentHandIndex = 0; 
let dealerHand = [];
let gameIsOver = false;

// --- 筹码系统与暗改(DDA)变量 ---
let bankroll = 500;
let currentBet = 0; 
let consecutiveLosses = 0; // 核心：连输计数器

// --- DOM 元素获取 ---
const dealerCardsContainer = document.querySelector('#dealer-cards');
const handsWrapper = document.querySelector('#hands-wrapper');
const dealerScoreText = document.querySelector('#dealer-score');
const messageArea = document.querySelector('#message-area');

const bankrollText = document.querySelector('#bankroll-text');
const betText = document.querySelector('#bet-text');

const bettingControls = document.querySelector('#betting-controls');
const actionControls = document.querySelector('#action-controls');
const roundControls = document.querySelector('#round-controls');

const btnBet10 = document.querySelector('#btn-bet-10');
const btnAllIn = document.querySelector('#btn-all-in');
const btnClearBet = document.querySelector('#btn-clear-bet');
const btnDeal = document.querySelector('#btn-deal');
const btnHit = document.querySelector('#btn-hit');
const btnStand = document.querySelector('#btn-stand');
const btnSplit = document.querySelector('#btn-split');
const btnNextRound = document.querySelector('#btn-next-round');

// --- 事件监听 ---
btnBet10.addEventListener('click', () => placeBet(10));
btnAllIn.addEventListener('click', () => placeBet(bankroll));
btnClearBet.addEventListener('click', clearBet);
btnDeal.addEventListener('click', startNewGame);
btnHit.addEventListener('click', playerHit);
btnStand.addEventListener('click', playerStand);
btnSplit.addEventListener('click', playerSplit);
btnNextRound.addEventListener('click', resetPhase);

// --- 筹码逻辑 ---
function placeBet(amount) {
    if (bankroll >= amount && amount > 0) {
        bankroll -= amount; 
        currentBet += amount;
        updateDashboard();
        btnDeal.disabled = false; 
    }
}

function clearBet() {
    bankroll += currentBet; 
    currentBet = 0;
    updateDashboard();
    btnDeal.disabled = true;
}

function updateDashboard() {
    bankrollText.textContent = bankroll;
    betText.textContent = currentBet;
}

// --- 游戏主循环 ---

function resetPhase() {
    if (bankroll === 0) {
        bankroll = 500; 
        consecutiveLosses = 0; // 破产重置时，连输也清零
    }
    
    currentBet = 0;
    updateDashboard();
    
    dealerCardsContainer.innerHTML = '';
    handsWrapper.innerHTML = '';
    dealerScoreText.textContent = '?';
    messageArea.textContent = "Place your bets!";
    
    roundControls.style.display = 'none';
    actionControls.style.display = 'none';
    bettingControls.style.display = 'block';
    
    btnDeal.disabled = true;
    btnBet10.disabled = false;
    btnAllIn.disabled = false;
    btnClearBet.disabled = false;
}

// --- 核心暗改逻辑：从牌堆中定向抽牌 ---
function pullSpecificCard(conditionFn) {
    // 在当前牌堆中寻找符合条件的牌
    let index = deck.cards.findIndex(conditionFn);
    if (index !== -1) {
        // 如果找到了，就把它从牌堆中间抽出来（避免发出重复牌）
        return deck.cards.splice(index, 1)[0]; 
    }
    // 如果牌堆里实在没有这种牌了（极小概率），就正常发最上面的一张
    return deck.drawCard(); 
}

function startNewGame() {
    bettingControls.style.display = 'none';
    actionControls.style.display = 'block';
    
    deck = new Deck(); // 正常洗牌
    playerHands = [ [] ]; 
    currentHandIndex = 0;
    dealerHand = [];
    gameIsOver = false;

    // --- Dynamic Difficulty Adjustment (DDA) 发牌介入 ---
    let pCard1, pCard2;

    if (consecutiveLosses >= 5) {
        // 连输5把及以上：强行做牌，极大概率天生 Blackjack (一张A + 一张10点牌)
        console.log("DDA Triggered: Level 3 (Blackjack Forced)"); // 开发调试用，交作业前记得删
        pCard1 = pullSpecificCard(c => c.value === 'A');
        pCard2 = pullSpecificCard(c => ['10', 'J', 'Q', 'K'].includes(c.value));
    } 
    else if (consecutiveLosses > 3) {
        // 连输4把：大幅提升拿到 A 的概率
        console.log("DDA Triggered: Level 2 (Ace Boost)");
        pCard1 = pullSpecificCard(c => c.value === 'A');
        pCard2 = deck.drawCard(); // 第二张顺其自然
    } 
    else if (consecutiveLosses === 3) {
        // 连输3把：必定拿到一张 10 点牌
        console.log("DDA Triggered: Level 1 (10-Value Boost)");
        pCard1 = pullSpecificCard(c => ['10', 'J', 'Q', 'K'].includes(c.value));
        pCard2 = deck.drawCard();
    } 
    else {
        // 正常发牌
        pCard1 = deck.drawCard();
        pCard2 = deck.drawCard();
    }

    // 随机打乱发给玩家的两张牌的顺序，防止每次都是第一张牌被暗改被看穿
    if (Math.random() > 0.5) {
        playerHands[0].push(pCard1, pCard2);
    } else {
        playerHands[0].push(pCard2, pCard1);
    }

    // 庄家正常发牌
    dealerHand.push(deck.drawCard(), deck.drawCard());

    btnHit.disabled = false;
    btnStand.disabled = false;
    
    if (playerHands[0][0].value === playerHands[0][1].value) {
        if (bankroll >= currentBet) {
            btnSplit.style.display = 'inline-block';
            btnSplit.disabled = false;
        } else {
            btnSplit.style.display = 'inline-block';
            btnSplit.disabled = true;
            messageArea.innerHTML = "Your turn. <br><span style='font-size:16px; color:#e74c3c;'>(Not enough chips to split)</span>";
        }
    } else {
        btnSplit.style.display = 'none';
    }

    if (messageArea.innerHTML.indexOf("Not enough") === -1) {
        messageArea.textContent = "Your turn. Hit, Stand or Split?";
    }
    
    updateUI();
    checkHandState(); 
}

function playerSplit() {
    if (bankroll < currentBet) return;
    bankroll -= currentBet;
    updateDashboard();

    let card1 = playerHands[0][0];
    let card2 = playerHands[0][1];
    
    playerHands = [
        [card1, deck.drawCard()],
        [card2, deck.drawCard()]
    ];
    
    btnSplit.style.display = 'none'; 
    updateUI();
    messageArea.textContent = "Playing Hand 1...";
    checkHandState(); 
}

function playerHit() {
    btnSplit.style.display = 'none'; 
    playerHands[currentHandIndex].push(deck.drawCard());
    updateUI();
    checkHandState();
}

function playerStand() {
    nextHand();
}

function checkHandState() {
    let score = calculateScore(playerHands[currentHandIndex]);
    if (score >= 21) {
        nextHand();
    }
}

function nextHand() {
    currentHandIndex++;
    if (currentHandIndex >= playerHands.length) {
        dealerTurn();
    } else {
        messageArea.textContent = `Playing Hand ${currentHandIndex + 1}...`;
        updateUI();
        checkHandState(); 
    }
}

function dealerTurn() {
    btnHit.disabled = true;
    btnStand.disabled = true;
    btnSplit.style.display = 'none';
    gameIsOver = true;

    let allBust = playerHands.every(hand => calculateScore(hand) > 21);

    if (!allBust) {
        let dealerScore = calculateScore(dealerHand);
        while (dealerScore < 17) {
            dealerHand.push(deck.drawCard());
            dealerScore = calculateScore(dealerHand);
        }
    }

    updateUI();
    determineWinner();
}

function determineWinner() {
    const dScore = calculateScore(dealerHand);
    let results = [];
    let totalWinnings = 0;
    
    // 用于判断这一轮整体算赢了还是输了
    let roundHasWin = false; 
    let roundHasPush = false;

    playerHands.forEach((hand, index) => {
        const pScore = calculateScore(hand);
        let prefix = playerHands.length > 1 ? `Hand ${index + 1}: ` : "";
        let isBlackjack = (hand.length === 2 && pScore === 21);
        
        if (pScore > 21) {
            results.push(`${prefix}Bust! (Lose $${currentBet})`);
        } else if (dScore > 21 || pScore > dScore) {
            roundHasWin = true;
            if (isBlackjack) {
                results.push(`${prefix}Blackjack! (Win 3:2)`);
                totalWinnings += currentBet + Math.floor(currentBet * 1.5); 
            } else {
                results.push(`${prefix}You Win! (Win 1:1)`);
                totalWinnings += currentBet * 2; 
            }
        } else if (dScore > pScore) {
            results.push(`${prefix}Dealer Wins. (Lose $${currentBet})`);
        } else {
            roundHasPush = true;
            results.push(`${prefix}Push (Tie). (Return $${currentBet})`);
            totalWinnings += currentBet; 
        }
    });

    bankroll += totalWinnings;
    updateDashboard();

    // --- 连输判定器更新 ---
    if (roundHasWin) {
        consecutiveLosses = 0; // 只要有一手赢了，连输就断了
    } else if (!roundHasPush) {
        // 没有赢，也没有平局，说明纯输
        consecutiveLosses++;
    }
    // 如果是纯平局，不增加连输计数，保持原状

    if (bankroll === 0) {
        results.push("<br><span style='color:#e74c3c; font-size: 30px;'>GG! You are Bankrupt!</span>");
        btnNextRound.textContent = "Restart Game";
    } else {
        btnNextRound.textContent = "Next Round";
    }

    messageArea.innerHTML = results.join('<br>'); 
    
    actionControls.style.display = 'none';
    roundControls.style.display = 'block';
}

function calculateScore(hand) {
    let score = 0;
    let aces = 0;
    for (let card of hand) {
        score += card.getScore();
        if (card.value === 'A') aces += 1;
    }
    while (score > 21 && aces > 0) {
        score -= 10;
        aces -= 1;
    }
    return score;
}

function updateUI() {
    dealerCardsContainer.innerHTML = '';
    dealerHand.forEach((card, index) => {
        let isHidden = (!gameIsOver && index === 1);
        dealerCardsContainer.appendChild(card.createCardElement(isHidden));
    });
    dealerScoreText.textContent = gameIsOver ? calculateScore(dealerHand) : dealerHand[0].getScore();

    handsWrapper.innerHTML = '';
    playerHands.forEach((hand, index) => {
        let handBox = document.createElement('div');
        handBox.className = 'hand-box';
        if (!gameIsOver && index === currentHandIndex) {
            handBox.classList.add('active-hand');
        }

        let scoreTitle = document.createElement('h3');
        scoreTitle.textContent = `Score: ${calculateScore(hand)}`;
        scoreTitle.style.margin = '0 0 10px 0';
        handBox.appendChild(scoreTitle);

        let cardsDiv = document.createElement('div');
        cardsDiv.className = 'card-container';
        hand.forEach(card => {
            cardsDiv.appendChild(card.createCardElement());
        });
        handBox.appendChild(cardsDiv);

        handsWrapper.appendChild(handBox);
    });
}

// 启动
resetPhase();