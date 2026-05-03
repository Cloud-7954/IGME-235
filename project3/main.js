const bgm = new Audio('bgm.mp3');
bgm.loop = true;
bgm.volume = 0.4;

let bgmStarted = false;
// start bgm after click
document.body.addEventListener('click', () => {
    if (!bgmStarted) {
        bgm.play().catch(e => {}); 
        bgmStarted = true;
    }
}, { once: true });

// play sound helper function
function playSound(filename) {
    let audio = new Audio(filename);
    audio.play().catch(e => {}); 
}


let deck;
let playerHands = []; 
let currentHandIndex = 0; 
let dealerHand = [];
let gameIsOver = false;
let bankroll = 500;
let currentBet = 0; 
let consecutiveLosses = 0;

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

btnBet10.addEventListener('click', () => placeBet(10, 'ButtonPressed.mp3'));
btnAllIn.addEventListener('click', () => placeBet(bankroll, 'Allin.mp3'));

btnClearBet.addEventListener('click', clearBet);
btnDeal.addEventListener('click', startNewGame);
btnHit.addEventListener('click', playerHit);
btnStand.addEventListener('click', playerStand);
btnSplit.addEventListener('click', playerSplit);
btnNextRound.addEventListener('click', () => {
    playSound('ButtonPressed.mp3'); // sound for next round
    resetPhase();
});



// allin/10 bet placement with sound
function placeBet(amount, soundFile) {
    if (bankroll >= amount && amount > 0) {
        playSound(soundFile); 
        bankroll -= amount; 
        currentBet += amount;
        updateDashboard();
        btnDeal.disabled = false; 
    }
}

// returns the current bet
function clearBet() {
    playSound('clear.mp3'); // clear bet audio
    bankroll += currentBet; 
    currentBet = 0;
    updateDashboard();
    btnDeal.disabled = true;
}

// bankroll and bet display update
function updateDashboard() {
    bankrollText.textContent = bankroll;
    betText.textContent = currentBet;
}


// main game loop
// resets the board and ui
function resetPhase() {
    if (bankroll === 0) {
        bankroll = 500; 
        consecutiveLosses = 0; 
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

// secretly pull a specific better card 
function pullSpecificCard(conditionFn) {
    let index = deck.cards.findIndex(conditionFn);
    if (index !== -1) {
        return deck.cards.splice(index, 1)[0]; 
    }
    return deck.drawCard(); 
}

// new round and deals the first cards
function startNewGame() {
    playSound('card2.mp3'); // deal card
    bettingControls.style.display = 'none';
    actionControls.style.display = 'block';
    
    deck = new Deck(); 
    playerHands = [ [] ]; 
    currentHandIndex = 0;
    dealerHand = [];
    gameIsOver = false;

    // intervention if lost too many games
    let pCard1, pCard2;
    if (consecutiveLosses >= 5) {
        pCard1 = pullSpecificCard(c => c.value === 'A');
        pCard2 = pullSpecificCard(c => ['10', 'J', 'Q', 'K'].includes(c.value));
    } else if (consecutiveLosses > 3) {
        pCard1 = pullSpecificCard(c => c.value === 'A');
        pCard2 = deck.drawCard(); 
    } else if (consecutiveLosses === 3) {
        pCard1 = pullSpecificCard(c => ['10', 'J', 'Q', 'K'].includes(c.value));
        pCard2 = deck.drawCard();
    } else {
        pCard1 = deck.drawCard();
        pCard2 = deck.drawCard();
    }

    if (Math.random() > 0.5) {
        playerHands[0].push(pCard1, pCard2);
    } else {
        playerHands[0].push(pCard2, pCard1);
    }

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

// splits the current hand into 2 separate hands
function playerSplit() {
    if (bankroll < currentBet) return;
    playSound('card2.mp3'); // split audio
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

// adds a card to the active hand
function playerHit() {
    playSound('card2.mp3'); // hit audio
    btnSplit.style.display = 'none'; 
    playerHands[currentHandIndex].push(deck.drawCard());
    updateUI();
    checkHandState();
}

// ends the players current hand actions
function playerStand() {
    playSound('card1.mp3'); // stand/ dealer reveal card
    nextHand();
}

// busted or reached 21
function checkHandState() {
    let score = calculateScore(playerHands[currentHandIndex]);
    if (score >= 21) {
        nextHand();
    }
}

// progresses to  next split hand or ends turn if no hands left
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

// dealers logic after player finishes
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

// compares scores, updates bankroll, displays the outcome
function determineWinner() {
    const dScore = calculateScore(dealerHand);
    let results = [];
    let totalWinnings = 0;
    
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

    // trigger win sound
    if (roundHasWin) {
        playSound('win.mp3'); // win audio
        consecutiveLosses = 0; 
    } else if (!roundHasPush) {
        consecutiveLosses++;
    }

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

// best possible score for hand/aces
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

// current game state to dom
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

//  call to start the game loop
resetPhase();