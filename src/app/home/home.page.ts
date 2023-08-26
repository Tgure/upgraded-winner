import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {GameService} from "../game.service";
import {FirestoreService} from "../firestore.service";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  public gameId: string | null;
  public gameIdSub: Subscription;
  public gameState: any;
  public gameStateSub: Subscription;
  public userId: string | null;
  public userIdSub: Subscription;

  constructor(private gameService: GameService, private firestoreService: FirestoreService) {
  }

  ngOnInit() {
    this.gameIdSub = this.gameService.gameIdSub.subscribe((val) => {
      this.gameId = val;
    });
    this.gameStateSub = this.firestoreService.gameState.subscribe((val) => {
      this.gameState = val;
    });
    this.userIdSub = this.gameService.userIdSub.subscribe((val) => {
      this.userId = val;
    });
  }

  ngOnDestroy() {
    // User leaves delete game from DB, typically we would check if user created the game and then if only 1 player we
    // would delete, otherwise if two players we would notify other player of surrender and then delete
    if (this.gameId) {
      this.gameService.surrender();
    }
  }

  startGame() {
    this.gameService.startGame();
  }

  joinGame() {
    this.gameService.joinGame();
  }

  draw() {
    this.gameService.draw();
  }

}
