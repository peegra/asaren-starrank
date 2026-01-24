import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

async function cleanAchievements() {
  const achievementsRef = collection(db, "achievements");
  const snapshot = await getDocs(achievementsRef);
  const achievements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const grouped = achievements.reduce((acc, ach) => {
    const key = `${ach.playerCode}-${ach.missionCode}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ach);
    return acc;
  }, {} as Record<string, any[]>);

  for (const key in grouped) {
    const group = grouped[key];
    if (group.length > 1) {
      // Keep the latest, delete others
      group.sort((a, b) => b.achievedAt.toDate() - a.achievedAt.toDate());
      for (let i = 1; i < group.length; i++) {
        await deleteDoc(doc(db, "achievements", group[i].id));
        console.log(`Deleted duplicate: ${group[i].id}`);
      }
    }
  }

  console.log("Cleaned achievements");
}

cleanAchievements();