import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

async function addPlayer() {
  try {
    const docRef = await addDoc(collection(db, "players"), {
      playerCode: "P001",
      playerName: "TAKU",
      grade: "中3",
      comment: "がんばるぞ",
      photoUrl: "https://example.com/photo.jpg" // 仮のURL
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

addPlayer();