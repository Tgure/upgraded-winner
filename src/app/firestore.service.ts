import {Injectable, OnDestroy} from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  DocumentSnapshot,
  Firestore,
  getDocs,
  onSnapshot,
  updateDoc
} from "@angular/fire/firestore";
import {BehaviorSubject} from "rxjs";


@Injectable({
  providedIn: 'root'
})
export class FirestoreService implements OnDestroy {
  public unsub: any;
  public gameState: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private readonly firestore: Firestore) {
  }

  ngOnDestroy() {
    this.closeSubscription()
  }

  closeSubscription() {
    if (this.unsub) {
      this.unsub();
    }
  }

  addDocument(path: string, data: {}) {
    return addDoc(collection(this.firestore, path), data);
  }

  deleteDocument(path: string, id: string) {
    return deleteDoc(doc(this.firestore, path, id));
  }

  async getDocuments(path: string) {
    let games: any = [];
    const querySnapshot = await getDocs(collection(this.firestore, path));
    querySnapshot.forEach((doc: any) => {
      games.push({id: doc.id, data: doc.data()});
    });
    return games;
  }

  updateDocument(path: string, id: string, data: any) {
    return updateDoc(doc(this.firestore, path, id), data);
  }

  listenToGame(id: string) {
    this.unsub = onSnapshot(doc(this.firestore, "games", id), (gameSnapshot: DocumentSnapshot<DocumentData>) => {
      const gameState: any = gameSnapshot.data();
      this.gameState.next(gameState);
    });
  }
}
