import { RANKS, SUITS, type Card } from '@/data/constants';

export class Deck {
  private cards: Card[] = [];
  private index = 0;

  constructor() {
    this.reset();
  }

  reset() {
    this.cards = [];
    for (const rank of RANKS) {
      for (const suit of SUITS) {
        this.cards.push({ rank, suit });
      }
    }
    this.shuffle();
    this.index = 0;
  }

  private shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(n: number): Card[] {
    const dealt = this.cards.slice(this.index, this.index + n);
    this.index += n;
    return dealt;
  }

  burnAndDeal(n: number): Card[] {
    this.index += 1; // burn
    return this.deal(n);
  }
}
