import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

const DEFAULT_NO_IMAGE_URL = "/asaren-starrank/noimage.png";

async function updatePlayersNoImage() {
  const playersRef = collection(db, "players");
  const playersSnap = await getDocs(playersRef);

  const updates = playersSnap.docs.map((playerDoc) =>
    updateDoc(doc(db, "players", playerDoc.id), { photoUrl: DEFAULT_NO_IMAGE_URL })
  );

  await Promise.all(updates);
  console.log("All player photoUrl values updated to default no-image.");
}

updatePlayersNoImage().catch((error) => {
  console.error("Failed to update player photoUrl:", error);
});
