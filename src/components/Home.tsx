import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from '../firebase';

interface Player {
  playerCode: string;
  playerName: string;
  grade: string;
  comment: string;
  photoUrl: string;
}

interface Mission {
  missionCode: string;
  missionName: string;
  content: string;
}

interface Achievement {
  id: string;
  playerCode: string;
  missionCode: string;
  starType: string;
  achievedAt: Date;
}

type StarVariant = "gold" | "silver" | "bronze" | "disabled";

const STAR_COLORS: Record<StarVariant, string> = {
  gold: "#F5C542",
  silver: "#C0C7D1",
  bronze: "#C57B39",
  disabled: "rgba(255,255,255,0.18)",
};

function StarIcon({
  variant = "gold",
  size = "1.25em",
  title = "star",
}: {
  variant?: StarVariant;
  size?: string;
  title?: string;
}) {
  const fill = STAR_COLORS[variant];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      style={{ display: "inline-block", verticalAlign: "-0.125em" }}
    >
      <path
        fill={fill}
        d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16l-6 3.4L7.5 13 2.5 8.6l6.6-.6L12 2z"
      />
    </svg>
  );
}

const Home: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ playerName: '', grade: '', comment: '', photoFile: null as File | null });

  useEffect(() => {
    const fetchData = async () => {
      const playersSnap = await getDocs(collection(db, "players"));
      const playersData = playersSnap.docs.map(doc => ({ ...doc.data() } as Player));
      setPlayers(playersData);
      if (playersData.length > 0) setSelectedPlayer(playersData[0]);

      const missionsSnap = await getDocs(collection(db, "missions"));
      const missionsData = missionsSnap.docs.map(doc => ({ ...doc.data() } as Mission));
      setMissions(missionsData);

      const achievementsSnap = await getDocs(collection(db, "achievements"));
      const achievementsData = achievementsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Achievement));
      setAchievements(achievementsData);
    };
    fetchData();
  }, []);

  const getStarCounts = (playerCode: string) => {
    const playerAchievements = achievements.filter(a => a.playerCode === playerCode);
    const gold = playerAchievements.filter(a => a.starType === 'gold').length;
    const silver = playerAchievements.filter(a => a.starType === 'silver').length;
    const bronze = playerAchievements.filter(a => a.starType === 'bronze').length;
    return { gold, silver, bronze };
  };

  const getMissionStatus = (playerCode: string, missionCode: string) => {
    return achievements.find(a => a.playerCode === playerCode && a.missionCode === missionCode)?.starType || null;
  };

  const handleStarClick = async (starType: string) => {
    if (!selectedPlayer || !selectedMission) return;

    const existing = achievements.find(a => a.playerCode === selectedPlayer.playerCode && a.missionCode === selectedMission.missionCode);
    if (existing) {
      if (existing.starType === starType) {
        await deleteDoc(doc(db, "achievements", existing.id));
        setAchievements(achievements.filter(a => a.id !== existing.id));
      } else {
        await deleteDoc(doc(db, "achievements", existing.id));
        const newAch = { playerCode: selectedPlayer.playerCode, missionCode: selectedMission.missionCode, starType, achievedAt: new Date() };
        const docRef = await addDoc(collection(db, "achievements"), newAch);
        setAchievements([...achievements.filter(a => a.id !== existing.id), { id: docRef.id, ...newAch }]);
      }
    } else {
      const newAch = { playerCode: selectedPlayer.playerCode, missionCode: selectedMission.missionCode, starType, achievedAt: new Date() };
      const docRef = await addDoc(collection(db, "achievements"), newAch);
      setAchievements([...achievements, { id: docRef.id, ...newAch }]);
    }
  };

  const handleAddPlayer = async () => {
    if (!newPlayer.photoFile) {
      alert('写真を選択してください。');
      return;
    }

    try {
      const playerCode = `P${String(players.length + 1).padStart(3, '0')}`;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      img.onload = async () => {
        const maxWidth = 200;
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const photoUrl = canvas.toDataURL('image/jpeg', 0.8);
        const newP = { playerCode, playerName: newPlayer.playerName, grade: newPlayer.grade, comment: newPlayer.comment, photoUrl };
        await addDoc(collection(db, "players"), newP);
        setPlayers([...players, newP]);
        setNewPlayer({ playerName: '', grade: '', comment: '', photoFile: null });
        setShowAddPlayer(false);
      };
      img.src = URL.createObjectURL(newPlayer.photoFile);
    } catch (error: any) {
      console.error('選手登録エラー:', error);
      alert(`登録に失敗しました: ${error.message}`);
    }
  };

  const { gold, silver, bronze } = selectedPlayer ? getStarCounts(selectedPlayer.playerCode) : { gold: 0, silver: 0, bronze: 0 };

  return (
    <div className="flex flex-col gap-5 flex-1">
      <h1 className="card-title animate-bounce-in">選手状況確認</h1>

      {selectedPlayer && (
        <div className="card animate-bounce-in flex flex-col items-center text-center">
          <div className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-3">
            <img
              src={selectedPlayer.photoUrl}
              alt={selectedPlayer.playerName}
              className="w-full h-full rounded-full object-cover border-2 border-[rgba(20,241,255,0.4)] shadow-card"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0QzE0IDUuMSAxMy4xIDYgMTIgNkMxMC45IDYgMTAgNS4xIDEwIDRDMTAgMi45IDEwLjkgMiAxMiAyWk0yMSAxOVYyMEgzVjE5QzMgMTYuMzMgNS4zMyAxNCA4IDE0SDE2QzE4LjY3IDE0IDIxIDE2LjMzIDIxIDE5WiIgZmlsbD0iIzk5OSI+PC9wYXRoPgo8L3N2Zz4=';
              }}
            />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">{selectedPlayer.playerName}</h2>
          <p className="text-[var(--color-accent)] font-medium">{selectedPlayer.grade}</p>
          <p className="text-sm text-[var(--color-muted)] mb-4">{selectedPlayer.comment}</p>
          <div className="flex gap-4">
            <div className="stat-pill gold">
              <span className="value">{gold}</span>
              <span className="label">Gold</span>
            </div>
            <div className="stat-pill silver">
              <span className="value">{silver}</span>
              <span className="label">Silver</span>
            </div>
            <div className="stat-pill bronze">
              <span className="value">{bronze}</span>
              <span className="label">Bronze</span>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="section-title mb-4">⭐ MISSIONS</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {missions.map((mission) => (
            <button
              key={mission.missionCode}
              type="button"
              onClick={() => setSelectedMission(mission)}
              className={`chip-button ${selectedMission?.missionCode === mission.missionCode ? 'is-selected' : ''}`}
            >
              <div className="font-semibold">{mission.missionName}</div>
              <div className="text-sm opacity-80 mt-0.5">{mission.content}</div>
            </button>
          ))}
        </div>
        {selectedMission && selectedPlayer && (
          <div className="pt-4 border-t border-[rgba(255,61,252,0.25)]">
            <h4 className="section-title mb-3 text-center">{selectedMission.missionName}</h4>
            <div className="flex justify-center gap-6">
              {[{ type: 'bronze' }, { type: 'silver' }, { type: 'gold' }].map((star) => (
                <button
                  key={star.type}
                  type="button"
                  onClick={() => handleStarClick(star.type)}
                  className="cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                >
                  <span className={getMissionStatus(selectedPlayer.playerCode, selectedMission.missionCode) === star.type ? 'animate-star-pulse inline-block' : 'inline-block'}>
                    <StarIcon
                      variant={getMissionStatus(selectedPlayer.playerCode, selectedMission.missionCode) === star.type ? star.type as StarVariant : 'disabled'}
                      size="3em"
                    />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="section-title mb-0">選手リスト</h3>
          <button
            type="button"
            onClick={() => setShowAddPlayer(true)}
            className="primary-button w-12 h-12 p-0 rounded-full flex items-center justify-center text-xl"
          >
            +
          </button>
        </div>
        <div className="list-card flex-1">
          <ul className="flex flex-col gap-3 list-none m-0 p-0">
            {players.map((player) => (
              <li key={player.playerCode}>
                <div className="list-item">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={player.photoUrl} alt={player.playerName} className="w-12 h-12 md:w-14 md:h-14 rounded-[var(--radius-md)] object-cover border border-[rgba(20,241,255,0.3)] flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--color-text)] truncate">{player.playerName}</div>
                      <div className="text-sm text-[var(--color-muted)]">{player.grade}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPlayer(player)}
                    className="primary-button flex-shrink-0"
                  >
                    選択
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {showAddPlayer && (
        <div className="modal-overlay">
          <div className="card modal-card">
            <h3 className="card-title">選手登録</h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="名前"
                value={newPlayer.playerName}
                onChange={(e) => setNewPlayer({ ...newPlayer, playerName: e.target.value })}
                className="pill-input"
              />
              <input
                type="text"
                placeholder="学年"
                value={newPlayer.grade}
                onChange={(e) => setNewPlayer({ ...newPlayer, grade: e.target.value })}
                className="pill-input"
              />
              <input
                type="text"
                placeholder="コメント"
                value={newPlayer.comment}
                onChange={(e) => setNewPlayer({ ...newPlayer, comment: e.target.value })}
                className="pill-input"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewPlayer({ ...newPlayer, photoFile: e.target.files?.[0] || null })}
                className="input-file"
              />
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button type="button" onClick={() => setShowAddPlayer(false)} className="secondary-button">
                キャンセル
              </button>
              <button type="button" onClick={handleAddPlayer} className="primary-button">
                登録
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
