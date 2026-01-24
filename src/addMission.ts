import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

async function addMission() {
  try {
    const docRef = await addDoc(collection(db, "missions"), {
      missionCode: "M001",
      missionName: "頭リフティング",
      content: "ゴールドは20回、シルバーは10回、ブロンズは5回"
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

addMission();