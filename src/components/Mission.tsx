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
      <div className="flex flex-col gap-5" style={{ marginTop: '12px', marginBottom: '12px' }}>
        {missions.map((mission, index) => {
          const { gold, silver, bronze } = getStarSummary(mission.missionCode);
          return (
            <div
              key={mission.missionCode}
              className="card"
              style={{ marginBottom: index === missions.length - 1 ? '0' : '12px' }}
            >
              <h2 className="section-title mb-1 text-center">{mission.missionName}</h2>
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
                        {getPlayerName(ach.playerCode)}<br />
                        {formatAchievedAt(ach.achievedAt)}
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
                        {getPlayerName(ach.playerCode)}<br />
                        {formatAchievedAt(ach.achievedAt)}
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
                        {getPlayerName(ach.playerCode)}<br />
                        {formatAchievedAt(ach.achievedAt)}
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
  );
};

export default Mission;
