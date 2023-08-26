import {Component, OnDestroy} from '@angular/core';
import {GameService} from "./game.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnDestroy {
  public gameInProgress = false;
  public gameInProgressSub: Subscription;

  constructor(private gameService: GameService) {
    this.gameInProgressSub = this.gameService.gameInProgress.subscribe((val) => {
      this.gameInProgress = val;
    });
  }

  ngOnDestroy() {
    this.gameInProgressSub.unsubscribe();
  }

  start() {
    this.gameService.startGame();
  }

  surrender() {
    this.gameService.surrender();
  }

  join() {
    this.gameService.joinGame();
  }
}
