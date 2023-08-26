import {Component} from '@angular/core';
import {ModalController} from "@ionic/angular";

@Component({
  selector: 'app-game-list',
  templateUrl: './game-list.component.html',
  styleUrls: ['./game-list.component.scss'],
})
export class GameListComponent {
  public games: any[] | undefined;

  constructor(private modalCtrl: ModalController) {}

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm(game: string) {
    return this.modalCtrl.dismiss(game, 'confirm');
  }

}
