import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC-oHZKSvRGj5MRCmxG7yJ7r_Rbu7rPqEg",
  authDomain: "asaren-starrank.firebaseapp.com",
  projectId: "asaren-starrank",
  storageBucket: "asaren-starrank.firebasestorage.app",
  messagingSenderId: "142760528885",
  appId: "1:142760528885:web:a1ade05fa4a38193e1aebc",
  measurementId: "G-W7Y69S7CH6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateMissions() {
  try {
    // 既存のミッションを全削除
    const missionsRef = collection(db, "missions");
    const missionsSnap = await getDocs(missionsRef);
    
    console.log(`削除中: ${missionsSnap.docs.length}件のミッション`);
    await Promise.all(
      missionsSnap.docs.map(d => deleteDoc(doc(db, "missions", d.id)))
    );
    
    // 新しいミッションを追加
    const missions = [
      { missionCode: "M001", missionName: "インサイド", content: "ブロンズは10回。シルバーは25回。ゴールドは100回。" },
      { missionCode: "M002", missionName: "アウトサイド", content: "ブロンズは10回。シルバーは25回。ゴールドは100回。" },
      { missionCode: "M003", missionName: "普通", content: "ブロンズは50回。シルバーは100回。ゴールドは300回。" },
      { missionCode: "M004", missionName: "ちょんちょん", content: "ブロンズは20回。シルバーは50回。ゴールドは300回。" },
      { missionCode: "M005", missionName: "インアウト", content: "ブロンズは15回。シルバーは50回。ゴールドは100回。" },
      { missionCode: "M006", missionName: "アウトアウト", content: "ブロンズは10回。シルバーは20回。ゴールドは50回。" },
      { missionCode: "M007", missionName: "3タッチ(3m)", content: "ブロンズは5回。シルバーは10回。ゴールドは20回。" },
      { missionCode: "M008", missionName: "もも", content: "ブロンズは10回。シルバーは25回。ゴールドは50回。" },
      { missionCode: "M009", missionName: "足足頭(頭の回数)", content: "ブロンズは3回。シルバーは10回。ゴールドは20回。" },
      { missionCode: "M010", missionName: "足足肩(肩の回数)", content: "ブロンズは3回。シルバーは10回。ゴールドは20回。" },
      { missionCode: "M011", missionName: "頭のみ", content: "ブロンズは5回。シルバーは10回。ゴールドは50回。" },
      { missionCode: "M012", missionName: "世界一周", content: "ブロンズは1周。シルバーは2周。ゴールドは3周。" },
      { missionCode: "M013", missionName: "世界逆一周", content: "ブロンズは1周。シルバーは2周。ゴールドは3周。" },
      { missionCode: "M014", missionName: "アジア一周", content: "ブロンズは1周。シルバーは2周。ゴールドは3周。" },
      { missionCode: "M015", missionName: "走りリフティング", content: "ブロンズは25m。シルバーは50m。ゴールドは200m。" },
      { missionCode: "M016", missionName: "そうまリフティング", content: "ブロンズは25m×1回。シルバーは25m×連続2回。ゴールドは25m×連続3回。" },
      { missionCode: "M017", missionName: "苦手足", content: "ブロンズは10回。シルバーは50回。ゴールドは100回。" },
      { missionCode: "M018", missionName: "苦手足アウト", content: "ブロンズは5回。シルバーは10回。ゴールドは30回。" },
      { missionCode: "M019", missionName: "苦手足イン", content: "ブロンズは5回。シルバーは10回。ゴールドは30回。" },
    ];

    console.log(`追加中: ${missions.length}件のミッション`);
    for (const mission of missions) {
      await addDoc(collection(db, "missions"), mission);
      console.log(`✓ ${mission.missionName}`);
    }

    console.log("\n✅ ミッションの更新が完了しました！");
    console.log("既存の達成データは保持されていますが、新しいミッションコードと一致しない場合は表示されません。");
  } catch (e) {
    console.error("❌ エラーが発生しました: ", e);
  }
}

updateMissions();
