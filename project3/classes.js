class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }

    getScore() {
        if (['J', 'Q', 'K'].includes(this.value)) return 10;
        if (this.value === 'A') return 11; 
        return parseInt(this.value);
    }

    createCardElement(isHidden = false) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        
        if (isHidden) {
            cardDiv.classList.add('hidden');
        } else {
            cardDiv.textContent = `${this.value}${this.suit}`;
            if (this.suit === '♥' || this.suit === '♦') {
                cardDiv.classList.add('red');
            }
        }
        return cardDiv;
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.buildDeck();
        this.shuffle();
    }

    buildDeck() {
        const suits = ['♠', '♥', '♣', '♦'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        for (let suit of suits) {
            for (let value of values) {
                this.cards.push(new Card(suit, value));
            }
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    drawCard() {
        return this.cards.pop();
    }
}