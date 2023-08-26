import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class DeckService {

  constructor(private http: HttpClient) {
  }

  getShuffledNewDeck(count: number) {
    return this.http.get<any>(`https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${count}`);
  }

  drawCardFromPile(deckId: string, pileName: string, count: number) {
    return this.http.get<any>(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${pileName}/draw/?count=${count}`);
  }

  drawCard(deckId: string, count: number) {
    return this.http.get<any>(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`);
  }

  addCardsToPile(deckId: string, pile: string, cards: string[]) {
    return this.http.get<any>(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${pile}/add/?cards=${cards}`);
  }

  shufflePile(deckId: string, pile: string) {
    return this.http.get<any>(`https://deckofcardsapi.com/api/deck/${deckId}/pile/${pile}/shuffle/`);
  }
}
