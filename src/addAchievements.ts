import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

async function addAchievements() {
  const achievements = [
    { playerCode: "P001", missionCode: "M001", starType: "gold", achievedAt: new Date() },
    { playerCode: "P002", missionCode: "M002", starType: "silver", achievedAt: new Date() },
    { playerCode: "P003", missionCode: "M003", starType: "bronze", achievedAt: new Date() },
    { playerCode: "P004", missionCode: "M004", starType: "gold", achievedAt: new Date() },
    { playerCode: "P005", missionCode: "M005", starType: "silver", achievedAt: new Date() },
    { playerCode: "P006", missionCode: "M006", starType: "bronze", achievedAt: new Date() },
    { playerCode: "P007", missionCode: "M007", starType: "gold", achievedAt: new Date() },
    { playerCode: "P008", missionCode: "M008", starType: "silver", achievedAt: new Date() },
    { playerCode: "P009", missionCode: "M009", starType: "bronze", achievedAt: new Date() },
    { playerCode: "P010", missionCode: "M010", starType: "gold", achievedAt: new Date() },
  ];

  for (const achievement of achievements) {
    await addDoc(collection(db, "achievements"), achievement);
  }

  console.log("Achievements added successfully");
}

addAchievements();