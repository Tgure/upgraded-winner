import {Injectable} from '@angular/core';
import {BehaviorSubject, forkJoin} from "rxjs";
import {DeckService} from "./deck.service";
import {FirestoreService} from "./firestore.service";
import {AlertController, ModalController, ToastController} from "@ionic/angular";
import {GameListComponent} from "./game-list/game-list.component";

interface Card {
  value: string;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  public gameInProgress: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public userId: string;
  public userIdSub: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  public deckId: string;
  public gameId: any;
  public gameIdSub: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  public gameState: any;

  public cardRanks: { [key: string]: number } = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'JACK': 11,
    'QUEEN': 12,
    'KING': 13,
    'ACE': 14,
  };

  constructor(private deckService: DeckService, private firestoreService: FirestoreService,
              private modalCtrl: ModalController, private toastController: ToastController,
              private alertController: AlertController) {
    // Subscribe to game state so updates are propagated
    this.firestoreService.gameState.subscribe((gameState) => {
      this.gameState = gameState;
      // If both players have drawn, check match status for winner
      if (this.gameState?.playerOnesDraw?.drawComplete && this.gameState?.playerTwosDraw?.drawComplete) {
        this.checkMatch(this.gameState.playerOnesDraw.cards[this.gameState?.playerOnesDraw?.cards?.length - 1], this.gameState.playerTwosDraw.cards[this.gameState?.playerTwosDraw?.cards?.length - 1]);
      }
      // If player surrenders reset state
      if (this.gameState?.surrenderer) {
        if (this.gameState?.surrenderer !== this.userId) {
          this.presentToast('Other player has surrendered, You are the winner!', 'middle', 2000, 'success');
        }
        this.resetState();
      }
    })
  }

  getDeck() {
    return this.deckService.getShuffledNewDeck(1);
  }

  startGame() {
    // If we had authentication this would not be hard coded but as of now game starter is assumed as player One
    this.userId = 'playerOne';
    this.userIdSub.next(this.userId);
    // Get a new Deck
    this.getDeck().subscribe({
      next: (deck: any) => {
        this.deckId = deck.deck_id;
        // Create Document in DB
        this.createGame(this.userId, this.deckId).then((doc) => {
          this.processDeck(doc.id);
        });
      },
      error: (err) => {
        this.presentAlert(err);
      }
    });
  }

  surrender() {
    // If in game and user wants to quit surrender match to other player and notify them they won
    this.presentAlert('Are you sure you want to surrender the game?', true).then((res) => {
      if (res === 'confirm') {
        this.gameState.surrenderer = this.userId;
        const gameToBeDeleted = this.gameId;
        this.firestoreService.updateDocument('games', this.gameId, this.gameState).then(() => {
          this.firestoreService.deleteDocument('games', gameToBeDeleted).catch((err) => {
            this.presentAlert(err);
          });
        }, (err) => {
          this.presentAlert(err);
        });
      }
    });
  }

  joinGame() {
    this.firestoreService.getDocuments('games').then((docs: any) => {
      this.openGameSelectModal(docs.filter((doc: any) => doc.data.playerTwo === null));
    }, (err) => {
      this.presentAlert(err);
    });
  }

  splitDeckIntoTwoPiles(deckId: string) {
    // Split deck into two piles
    return forkJoin([this.deckService.drawCard(deckId, 26), this.deckService.drawCard(deckId, 26)]);
  }

  createGame(userId: string, deckId: string) {
    let doc = {
      deckId: deckId,
      playerOne: userId,
      playerTwo: null,
      playerOnesDraw: {
        drawComplete: false,
        cards: []
      },
      playerTwosDraw: {
        drawComplete: false,
        cards: []
      },
      playerOnesCardCount: 26,
      playerTwosCardCount: 26
    }
    return this.firestoreService.addDocument('games', doc);
  }

  async openGameSelectModal(games: any[]) {
    const modal = await this.modalCtrl.create({
      component: GameListComponent,
      componentProps: {
        games
      }
    });
    modal.present();

    const {data, role} = await modal.onWillDismiss();

    if (role === 'confirm') {
      this.deckId = data.data.deckId;
      data.data.playerTwo = 'playerTwo';
      this.userId = data.data.playerTwo;
      this.userIdSub.next(this.userId);
      this.firestoreService.updateDocument('games', data.id, data.data).then(() => {
        this.gameId = data.id;
        this.gameIdSub.next(this.gameId);
        this.gameInProgress.next(true);
        this.listenToGame();
      });
    }
  }

  processDeck(gameId: string) {
    // Split deck and add equal amount of cards to each players pile
    this.splitDeckIntoTwoPiles(this.deckId).subscribe({
      next: ([player1, player2]) => {
        forkJoin([
          this.deckService.addCardsToPile(this.deckId, 'playerOne', player1.cards.map((card: any) => card.code)),
          this.deckService.addCardsToPile(this.deckId, 'playerTwo', player2.cards.map((card: any) => card.code))
        ]).subscribe({
          next: () => {
            this.gameId = gameId;
            this.gameIdSub.next(this.gameId);
            this.gameInProgress.next(true);
            this.listenToGame();
          },
          error: (err) => {
            this.presentAlert(err);
          }
        })
      },
      error: (err) => {
        this.presentAlert(err);
      }
    });
  }

  draw() {
    this.deckService.drawCardFromPile(this.deckId, this.userId, 1).subscribe({
      next: (draw) => {
        this.gameState[`${this.userId}sDraw`].drawComplete = true;
        this.gameState[`${this.userId}sDraw`].cards = [...this.gameState[`${this.userId}sDraw`].cards, ...draw.cards];
        this.firestoreService.updateDocument('games', this.gameId, this.gameState).then(() => {
          // Success
        }, (err) => {
          this.presentAlert(err);
        });
      },
      error: (err) => {
        this.presentAlert(err);
      }
    });
  }

  checkMatch(player1: Card, player2: Card) {
    const player1Rank = this.cardRanks[player1.value];
    const player2Rank = this.cardRanks[player2.value];
    if (player1Rank > player2Rank) {
      this.presentToast('Player One Won this Round!', 'middle', 1500, 'success').finally(() => {
        this.processWinner('playerOne');
      });
    } else if (player1Rank < player2Rank) {
      this.presentToast('Player Two Won this Round!', 'middle', 1500, 'success').finally(() => {
        this.processWinner('playerTwo');
      });
    } else {
      this.presentToast(`Tie! Draw Again!`, 'middle', 1500, 'warning').finally(() => {
        this.gameState.playerOnesDraw.drawComplete = false;
        this.gameState.playerTwosDraw.drawComplete = false;
        this.firestoreService.updateDocument('games', this.gameId, this.gameState).then(() => {
          // Success
        }, (err) => {
          this.presentAlert(err);
        });
      });
    }
  }

  processWinner(pile: string) {
    // Gather match cards
    const matchCards = [...this.gameState.playerOnesDraw.cards, ...this.gameState.playerTwosDraw.cards];
    // Add cards to winners pile
    this.deckService.addCardsToPile(this.deckId, pile, matchCards.map((card: any) => card.code)).subscribe({
      next: (res) => {
        if (res.piles[pile].remaining === 52) {
          this.presentToast(`Game Over! Winner is: ${pile}`, 'middle', 5000, 'success');
          // Delete game from DB
          this.firestoreService.deleteDocument('games', this.gameId).then(() => {
            this.gameState = null;
          }, (err) => {
            this.presentAlert(err);
          })
        } else {
          this.deckService.shufflePile(this.deckId, pile).subscribe({
            next: (res) => {
              this.gameState.playerOnesCardCount = res.piles['playerOne'].remaining;
              this.gameState.playerTwosCardCount = res.piles['playerTwo'].remaining;
              this.gameState.playerOnesDraw.cards = [];
              this.gameState.playerTwosDraw.cards = [];
              this.gameState.playerOnesDraw.drawComplete = false;
              this.gameState.playerTwosDraw.drawComplete = false;
              this.firestoreService.updateDocument('games', this.gameId, this.gameState).then(() => {
                // Success
              }, (err) => {
                this.presentAlert(err);
              });
            },
            error: (err) => {
              this.presentAlert(err);
            }
          })
        }
      },
      error: (err) => {
        this.presentAlert(err);
      }
    })
  }

  async presentToast(message: string, position: 'top' | 'middle' | 'bottom', duration: number, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: duration,
      position: position,
      color: color
    });

    await toast.present();
  }

  listenToGame() {
    this.firestoreService.listenToGame(this.gameId);
  }

  async presentAlert(errorMsg: string, confirm?: boolean) {
    // const confirmButtons = [
    //     {
    //       text: 'Cancel',
    //       role: 'cancel',
    //     },
    //     {
    //       text: 'OK',
    //       role: 'confirm',
    //     }
    // ];
    const alert = await this.alertController.create({
      header: 'Alert',
      message: errorMsg,
      buttons: confirm ? [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'OK',
          role: 'confirm',
        }
      ] : ['OK'],
    });

    alert.present();

    const {role} = await alert.onWillDismiss();
    return role;
  }

  resetState() {
    this.gameId = null;
    this.gameIdSub.next(this.gameId);
    this.gameInProgress.next(false);
    this.firestoreService.closeSubscription();
  }
}
