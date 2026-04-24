let deck;
let playerHands = []; 
let currentHandIndex = 0; 
let dealerHand = [];
let gameIsOver = false;

const dealerCardsContainer = document.querySelector('#dealer-cards');
const handsWrapper = document.querySelector('#hands-wrapper');
const dealerScoreText = document.querySelector('#dealer-score');
const messageArea = document.querySelector('#message-area');

const btnDeal = document.querySelector('#btn-deal');
const btnHit = document.querySelector('#btn-hit');
const btnStand = document.querySelector('#btn-stand');
const btnSplit = document.querySelector('#btn-split');

btnDeal.addEventListener('click', startNewGame);
btnHit.addEventListener('click', playerHit);
btnStand.addEventListener('click', playerStand);
btnSplit.addEventListener('click', playerSplit);

function startNewGame() {
    deck = new Deck();
    playerHands = [ [] ]; 
    currentHandIndex = 0;
    dealerHand = [];
    gameIsOver = false;

    playerHands[0].push(deck.drawCard(), deck.drawCard());
    dealerHand.push(deck.drawCard(), deck.drawCard());

    btnDeal.disabled = true;
    btnHit.disabled = false;
    btnStand.disabled = false;
    
    if (playerHands[0][0].value === playerHands[0][1].value) {
        btnSplit.style.display = 'inline-block';
        btnSplit.disabled = false;
    } else {
        btnSplit.style.display = 'none';
    }

    updateUI();
    messageArea.textContent = "Your turn. Hit, Stand or Split?";

    checkHandState(); 
}

function playerSplit() {
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

    playerHands.forEach((hand, index) => {
        const pScore = calculateScore(hand);
        let prefix = playerHands.length > 1 ? `Hand ${index + 1}: ` : "";
        
        if (pScore > 21) {
            results.push(`${prefix}Bust!`);
        } else if (dScore > 21) {
            results.push(`${prefix}You Win! (Dealer Bust)`);
        } else if (pScore > dScore) {
            results.push(`${prefix}You Win!`);
        } else if (dScore > pScore) {
            results.push(`${prefix}Dealer Wins.`);
        } else {
            results.push(`${prefix}Push (Tie).`);
        }
    });

    messageArea.innerHTML = results.join('<br>'); 
    btnDeal.disabled = false;
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