import React, { useEffect, useState } from 'react';
import { collection, getDocs } from "firebase/firestore";
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

const Mission: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

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

  return (
    <div className="flex flex-col gap-5 flex-1">
      <h1 className="card-title flex items-center justify-center gap-3">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16l-6 3.4L7.5 13 2.5 8.6l6.6-.6L12 2z"/>
        </svg>
        <span>MISSION</span>
      </h1>
      <div className="flex flex-col gap-5">
        {missions.map((mission) => {
          const { gold, silver, bronze } = getStarSummary(mission.missionCode);
          return (
            <div key={mission.missionCode} className="card">
              <h2 className="section-title mb-1">{mission.missionName}</h2>
              <p className="text-[var(--color-muted)] mb-4 text-sm">{mission.content}</p>
              <div className="flex flex-col gap-3">
                <div className="achievement-block" style={{ borderColor: 'rgba(245,197,66,0.35)' }}>
                  <h3 className="text-[#F5C542]">⭐ Gold ({gold.length})</h3>
                  <ul>
                    {gold.map((ach) => (
                      <li key={ach.id}>{getPlayerName(ach.playerCode)} — {formatAchievedAt(ach.achievedAt)}</li>
                    ))}
                  </ul>
                </div>
                <div className="achievement-block" style={{ borderColor: 'rgba(192,199,209,0.35)' }}>
                  <h3 className="text-[#C0C7D1]">⭐ Silver ({silver.length})</h3>
                  <ul>
                    {silver.map((ach) => (
                      <li key={ach.id}>{getPlayerName(ach.playerCode)} — {formatAchievedAt(ach.achievedAt)}</li>
                    ))}
                  </ul>
                </div>
                <div className="achievement-block" style={{ borderColor: 'rgba(197,123,57,0.35)' }}>
                  <h3 className="text-[#C57B39]">⭐ Bronze ({bronze.length})</h3>
                  <ul>
                    {bronze.map((ach) => (
                      <li key={ach.id}>{getPlayerName(ach.playerCode)} — {formatAchievedAt(ach.achievedAt)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Mission;
