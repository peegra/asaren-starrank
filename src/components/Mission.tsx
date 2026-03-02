import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from '../firebase';

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

interface Player {
  playerCode: string;
  playerName: string;
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

const Mission: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showEditMission, setShowEditMission] = useState(false);
  const [missionToEdit, setMissionToEdit] = useState<Mission | null>(null);
  const [editMission, setEditMission] = useState({ missionName: '', content: '' });

  useEffect(() => {
    const fetchData = async () => {
      const missionsRef = collection(db, "missions");
      const missionsSnap = await getDocs(missionsRef);
      const missionsData = missionsSnap.docs.map(doc => ({ ...doc.data() } as Mission));

      const achievementsRef = collection(db, "achievements");
      const achievementsSnap = await getDocs(achievementsRef);
      const achievementsData = achievementsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Achievement));

      const playersRef = collection(db, "players");
      const playersSnap = await getDocs(playersRef);
      const playersData = playersSnap.docs.map(doc => ({ ...doc.data() } as Player));

      setMissions(missionsData);
      setAchievements(achievementsData);
      setPlayers(playersData);
    };
    fetchData();
  }, []);

  const getPlayerName = (playerCode: string) => {
    const player = players.find(p => p.playerCode === playerCode);
    return player ? player.playerName : playerCode;
  };

  const getAchievementsByMission = (missionCode: string) => {
    return achievements.filter(ach => ach.missionCode === missionCode);
  };

  const formatAchievedAt = (v: unknown): string => {
    const d = v && typeof (v as { toDate?: () => Date }).toDate === 'function'
      ? (v as { toDate: () => Date }).toDate()
      : v as Date;
    return d.toLocaleDateString();
  };

  const getStarSummary = (missionCode: string) => {
    const missionAchievements = getAchievementsByMission(missionCode);
    const gold = missionAchievements.filter(ach => ach.starType === 'gold');
    const silver = missionAchievements.filter(ach => ach.starType === 'silver');
    const bronze = missionAchievements.filter(ach => ach.starType === 'bronze');
    return { gold, silver, bronze };
  };

  const openEditMission = (mission: Mission) => {
    setMissionToEdit(mission);
    setEditMission({ missionName: mission.missionName, content: mission.content });
    setShowEditMission(true);
  };

  const handleUpdateMission = async () => {
    if (!missionToEdit) return;
    const missionName = editMission.missionName.trim();
    const content = editMission.content.trim();
    if (!missionName || !content) {
      alert('MISSION名・内容を入力してください。');
      return;
    }
    try {
      const missionsRef = collection(db, "missions");
      const missionsSnap = await getDocs(missionsRef);
      const target = missionsSnap.docs.find(d => d.data().missionCode === missionToEdit.missionCode);
      if (!target) throw new Error('対象のMISSIONが見つかりません');
      await updateDoc(doc(db, "missions", target.id), { missionName, content });
      const updated = missions.map(m =>
        m.missionCode === missionToEdit.missionCode ? { ...m, missionName, content } : m
      );
      setMissions(updated);
      setShowEditMission(false);
      setMissionToEdit(null);
      setEditMission({ missionName: '', content: '' });
    } catch (error: any) {
      console.error('MISSION更新エラー:', error);
      alert(`MISSIONの更新に失敗しました: ${error?.message ?? error}`);
    }
  };

  return (
    <>
    <div className="flex flex-col gap-5 flex-1">
      <h1 className="card-title flex items-center justify-center gap-3">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16l-6 3.4L7.5 13 2.5 8.6l6.6-.6L12 2z"/>
        </svg>
        <span>MISSION</span>
      </h1>
      <div className="flex flex-col gap-5" style={{ marginTop: '12px', marginBottom: '12px' }}>
        {[...missions].sort((a, b) => a.missionCode.localeCompare(b.missionCode)).map((mission, index) => {
          const { gold, silver, bronze } = getStarSummary(mission.missionCode);
          return (
            <div
              key={mission.missionCode}
              className="card"
              style={{ marginBottom: index === missions.length - 1 ? '0' : '12px', position: 'relative' }}
            >
              <button
                type="button"
                onClick={() => openEditMission(mission)}
                className="secondary-button w-12 h-12 p-0 flex items-center justify-center"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  borderRadius: '9999px',
                }}
                aria-label={`${mission.missionName} を編集`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
              </button>
              <h2 className="section-title mb-1 text-center" style={{ fontSize: '1.8rem', color: '#000000' }}>{mission.missionName}</h2>
              <p className="text-[var(--color-muted)] mb-4 text-sm text-center">{mission.content}</p>
              <div className="flex flex-col gap-6">
                {/* GOLD */}
                <div>
                  <h3 className="text-[#F5C542] flex items-center gap-2" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                    <StarIcon variant="gold" size="2.5em" />
                    <span>GOLD（クリア人数 {gold.length}人）</span>
                  </h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '1rem',
                    fontSize: 'clamp(1.4rem, 3.8vw, 1.6rem)'
                  }}>
                    {gold.map((ach) => (
                      <div key={ach.id}>
                        {getPlayerName(ach.playerCode)}（{formatAchievedAt(ach.achievedAt)}）
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* SILVER */}
                <div>
                  <h3 className="text-[#C0C7D1] flex items-center gap-2" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                    <StarIcon variant="silver" size="2.5em" />
                    <span>SILVER（クリア人数 {silver.length}人）</span>
                  </h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '1rem',
                    fontSize: 'clamp(1.4rem, 3.8vw, 1.6rem)'
                  }}>
                    {silver.map((ach) => (
                      <div key={ach.id}>
                        {getPlayerName(ach.playerCode)}（{formatAchievedAt(ach.achievedAt)}）
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* BRONZE */}
                <div>
                  <h3 className="text-[#C57B39] flex items-center gap-2" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                    <StarIcon variant="bronze" size="2.5em" />
                    <span>BRONZE（クリア人数 {bronze.length}人）</span>
                  </h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '1rem',
                    fontSize: 'clamp(1.4rem, 3.8vw, 1.6rem)'
                  }}>
                    {bronze.map((ach) => (
                      <div key={ach.id}>
                        {getPlayerName(ach.playerCode)}（{formatAchievedAt(ach.achievedAt)}）
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>

      {showEditMission && missionToEdit && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ padding: '2.5rem' }}>
            <h3 className="card-title" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>MISSION編集</h3>
            <div className="flex flex-col gap-6">
              <div className="pill-input" style={{ fontSize: '1.6rem', padding: '1.3rem 2rem', marginBottom: '12px', background: 'rgba(255, 255, 255, 0.7)' }}>
                MISSIONコード：{missionToEdit.missionCode}
              </div>
              <input
                type="text"
                placeholder="MISSION名"
                value={editMission.missionName}
                onChange={(e) => setEditMission({ ...editMission, missionName: e.target.value })}
                className="pill-input"
                style={{ fontSize: '1.6rem', padding: '1.3rem 2rem', marginBottom: '12px' }}
              />
              <textarea
                placeholder="内容"
                value={editMission.content}
                onChange={(e) => setEditMission({ ...editMission, content: e.target.value })}
                className="pill-input"
                style={{ fontSize: '1.6rem', padding: '1.3rem 2rem', marginBottom: '12px', minHeight: '140px', resize: 'vertical' }}
              />
            </div>
            <div className="flex justify-end gap-6 mt-8">
              <button
                type="button"
                onClick={() => {
                  setShowEditMission(false);
                  setMissionToEdit(null);
                  setEditMission({ missionName: '', content: '' });
                }}
                className="secondary-button"
                style={{ fontSize: '1.6rem', padding: '1.2rem 2rem' }}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleUpdateMission}
                className="primary-button"
                style={{ fontSize: '1.6rem', padding: '1.2rem 2rem', marginLeft: '16px' }}
              >
                更新
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Mission;
