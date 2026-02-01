import React, { useEffect, useState } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../firebase';
import noImageSrc from '../assets/noimage.png';

interface Player {
  playerCode: string;
  playerName: string;
  grade: string;
  comment: string;
  photoUrl: string;
}

interface Achievement {
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
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={title} style={{ display: "inline-block", verticalAlign: "-0.125em" }}>
      <path fill={fill} d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16l-6 3.4L7.5 13 2.5 8.6l6.6-.6L12 2z" />
    </svg>
  );
}

const Ranking: React.FC = () => {
  const [rankings, setRankings] = useState<(Player & { gold: number; silver: number; bronze: number; total: number })[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const playersRef = collection(db, "players");
      const playersSnap = await getDocs(playersRef);
      const players = playersSnap.docs.map(doc => ({ ...doc.data() } as Player));

      const achievementsRef = collection(db, "achievements");
      const achievementsSnap = await getDocs(achievementsRef);
      const achievements = achievementsSnap.docs.map(doc => ({ ...doc.data() } as Achievement));

      const playerStars = players.map(player => {
        const gold = achievements.filter(ach => ach.playerCode === player.playerCode && ach.starType === 'gold').length;
        const silver = achievements.filter(ach => ach.playerCode === player.playerCode && ach.starType === 'silver').length;
        const bronze = achievements.filter(ach => ach.playerCode === player.playerCode && ach.starType === 'bronze').length;
        const total = gold + silver + bronze;
        return { ...player, gold, silver, bronze, total };
      });

      playerStars.sort((a, b) => b.total - a.total);
      setRankings(playerStars);
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-5 flex-1">
      <h1 className="card-title">🏆 RANKINGS</h1>
      <div className="flex flex-col gap-3">
        {rankings.map((player, index) => (
          <div
            key={player.playerCode}
            className="list-item flex items-center justify-between"
            style={{
              borderColor: index === 0 ? 'rgba(245,197,66,0.45)' : index === 1 ? 'rgba(192,199,209,0.4)' : index === 2 ? 'rgba(197,123,57,0.4)' : undefined,
              gap: '20px',
            }}
          >
            {/* 左側：ランク・写真・名前 */}
            <div className="flex items-center" style={{ gap: '12px', minWidth: 0, flex: 1 }}>
              {/* ランク番号を星形の中に表示 */}
              <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: '72px', height: '72px' }}>
                <svg viewBox="0 0 24 24" style={{
                  position: 'absolute',
                  fill: index === 0 ? '#F5C542' : index === 1 ? '#C0C7D1' : index === 2 ? '#C57B39' : 'rgba(255,61,252,0.3)',
                  width: '72px',
                  height: '72px',
                }}>
                  <path d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16l-6 3.4L7.5 13 2.5 8.6l6.6-.6L12 2z" />
                </svg>
                <span className="relative font-bold" style={{
                  color: index === 0 || index === 1 ? '#000' : '#fff',
                  textShadow: index === 0 ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
                  fontSize: '24px',
                }}>
                  {index + 1}
                </span>
              </div>
              
              {/* 画像 - 常に同じサイズを確保 */}
              <div className="relative flex-shrink-0 flex items-center justify-center rounded-[var(--radius-md)] border border-[rgba(20,241,255,0.3)]" style={{ width: '72px', height: '72px', overflow: 'hidden' }}>
                <img
                  src={player.photoUrl || noImageSrc}
                  alt={player.playerName}
                  style={
                    player.photoUrl
                      ? { width: '100%', height: '100%', objectFit: 'cover' }
                      : { width: '72px', height: '72px', objectFit: 'contain', padding: '4px' }
                  }
                  onError={(e) => {
                    e.currentTarget.style.width = '72px';
                    e.currentTarget.style.height = '72px';
                    e.currentTarget.style.objectFit = 'contain';
                    e.currentTarget.style.padding = '4px';
                  }}
                />
              </div>
              
              {/* 名前・学年 */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <h2 className="font-bold text-[var(--color-text)] truncate">{player.playerName}</h2>
                <p className="text-sm text-[var(--color-muted)]">{player.grade}</p>
              </div>
            </div>
            
            {/* 右側：スター取得数 */}
            <div className="flex gap-4 flex-shrink-0">
              <div className="stat-pill gold">
                <StarIcon variant="gold" size="1.25em" />
                <span className="value text-sm font-semibold">{player.gold}</span>
              </div>
              <div className="stat-pill silver">
                <StarIcon variant="silver" size="1.25em" />
                <span className="value text-sm font-semibold">{player.silver}</span>
              </div>
              <div className="stat-pill bronze">
                <StarIcon variant="bronze" size="1.25em" />
                <span className="value text-sm font-semibold">{player.bronze}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ranking;
