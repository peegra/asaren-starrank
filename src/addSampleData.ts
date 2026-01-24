import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

async function addSampleData() {
  // Clear existing data
  const playersRef = collection(db, "players");
  const playersSnap = await getDocs(playersRef);
  playersSnap.docs.forEach(async (d) => {
    await deleteDoc(doc(db, "players", d.id));
  });

  const missionsRef = collection(db, "missions");
  const missionsSnap = await getDocs(missionsRef);
  missionsSnap.docs.forEach(async (d) => {
    await deleteDoc(doc(db, "missions", d.id));
  });

  const achievementsRef = collection(db, "achievements");
  const achievementsSnap = await getDocs(achievementsRef);
  achievementsSnap.docs.forEach(async (d) => {
    await deleteDoc(doc(db, "achievements", d.id));
  });

  // Add players
  const players = [
    { playerCode: "P001", playerName: "Player1", grade: "中3", comment: "がんばるぞ", photoUrl: "https://example.com/photo1.jpg" },
    { playerCode: "P002", playerName: "Player2", grade: "中2", comment: "楽しい", photoUrl: "https://example.com/photo2.jpg" },
    { playerCode: "P003", playerName: "Player3", grade: "中1", comment: "頑張ります", photoUrl: "https://example.com/photo3.jpg" },
    { playerCode: "P004", playerName: "Player4", grade: "中3", comment: "好き", photoUrl: "https://example.com/photo4.jpg" },
    { playerCode: "P005", playerName: "Player5", grade: "中2", comment: "挑戦", photoUrl: "https://example.com/photo5.jpg" },
    { playerCode: "P006", playerName: "Player6", grade: "中1", comment: "楽しい", photoUrl: "https://example.com/photo6.jpg" },
    { playerCode: "P007", playerName: "Player7", grade: "中3", comment: "がんばる", photoUrl: "https://example.com/photo7.jpg" },
    { playerCode: "P008", playerName: "Player8", grade: "中2", comment: "好き", photoUrl: "https://example.com/photo8.jpg" },
    { playerCode: "P009", playerName: "Player9", grade: "中1", comment: "挑戦", photoUrl: "https://example.com/photo9.jpg" },
    { playerCode: "P010", playerName: "Player10", grade: "中3", comment: "がんばるぞ", photoUrl: "https://example.com/photo10.jpg" },
  ];

  for (const player of players) {
    await addDoc(collection(db, "players"), player);
  }

  // Add missions
  const missions = [
    { missionCode: "M001", missionName: "頭リフティング", content: "ゴールドは20回、シルバーは10回、ブロンズは5回" },
    { missionCode: "M002", missionName: "アウトサイドリフティング", content: "ゴールドは30回、シルバーは15回、ブロンズは7回" },
    { missionCode: "M003", missionName: "インサイドリフティング", content: "ゴールドは25回、シルバーは12回、ブロンズは6回" },
    { missionCode: "M004", missionName: "クロスオーバー", content: "ゴールドは40回、シルバーは20回、ブロンズは10回" },
    { missionCode: "M005", missionName: "ステップオーバー", content: "ゴールドは35回、シルバーは18回、ブロンズは9回" },
    { missionCode: "M006", missionName: "ラボーナ", content: "ゴールドは50回、シルバーは25回、ブロンズは12回" },
    { missionCode: "M007", missionName: "チップキック", content: "ゴールドは45回、シルバーは22回、ブロンズは11回" },
    { missionCode: "M008", missionName: "オーバーヘッドキック", content: "ゴールドは60回、シルバーは30回、ブロンズは15回" },
    { missionCode: "M009", missionName: "フリック", content: "ゴールドは55回、シルバーは27回、ブロンズは13回" },
    { missionCode: "M010", missionName: "ノールックパス", content: "ゴールドは65回、シルバーは32回、ブロンズは16回" },
  ];

  for (const mission of missions) {
    await addDoc(collection(db, "missions"), mission);
  }

  // Add achievements
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

  console.log("Sample data added successfully");
}

addSampleData();