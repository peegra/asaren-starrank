import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from '../firebase';
import noImageSrc from '../assets/noimage.png';

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
  const [isEditMode, setIsEditMode] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ playerName: '', grade: '', comment: '', photoFile: null as File | null, photoUrl: '' });

  useEffect(() => {
    const fetchData = async () => {
      const playersSnap = await getDocs(collection(db, "players"));
      const playersData = playersSnap.docs.map(doc => ({ ...doc.data() } as Player));
      setPlayers(playersData);
      if (playersData.length > 0) setSelectedPlayer(playersData[0]);

      const missionsSnap = await getDocs(collection(db, "missions"));
      const missionsData = missionsSnap.docs.map(doc => ({ ...doc.data() } as Mission));
      setMissions(missionsData);
      if (missionsData.length > 0) setSelectedMission(missionsData[0]);

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
    const missionAchievements = achievements.filter(a => a.playerCode === playerCode && a.missionCode === missionCode);
    return {
      bronze: missionAchievements.some(a => a.starType === 'bronze'),
      silver: missionAchievements.some(a => a.starType === 'silver'),
      gold: missionAchievements.some(a => a.starType === 'gold')
    };
  };

  const handleClearClick = async () => {
    if (!selectedPlayer || !selectedMission) return;

    const missionAchievements = achievements.filter(
      a => a.playerCode === selectedPlayer.playerCode && a.missionCode === selectedMission.missionCode
    );

    const status = getMissionStatus(selectedPlayer.playerCode, selectedMission.missionCode);

    // 全て獲得している場合はリセット確認
    if (status.bronze && status.silver && status.gold) {
      if (window.confirm('スターがリセットされます。よろしいですか？')) {
        // 全ての星を削除
        for (const ach of missionAchievements) {
          await deleteDoc(doc(db, "achievements", ach.id));
        }
        setAchievements(achievements.filter(a => !missionAchievements.includes(a)));
      }
      return;
    }

    // 次の星を追加
    let nextStarType: string;
    if (!status.bronze) {
      nextStarType = 'bronze';
    } else if (!status.silver) {
      nextStarType = 'silver';
    } else {
      nextStarType = 'gold';
    }

    const newAch = {
      playerCode: selectedPlayer.playerCode,
      missionCode: selectedMission.missionCode,
      starType: nextStarType,
      achievedAt: new Date()
    };
    const docRef = await addDoc(collection(db, "achievements"), newAch);
    setAchievements([...achievements, { id: docRef.id, ...newAch }]);
  };

  const handleAddPlayer = async () => {
    if (!isEditMode && !newPlayer.photoFile) {
      alert('写真を選択してください。');
      return;
    }

    try {
      if (isEditMode && selectedPlayer) {
        // 編集モード
        let photoUrl = newPlayer.photoUrl || selectedPlayer.photoUrl;
        
        if (newPlayer.photoFile) {
          // 新しい写真がアップロードされた場合
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = () => {
              // 正方形に切り取る（200x200）
              const size = 200;
              canvas.width = size;
              canvas.height = size;
              
              // 元の画像の中央をクロップ
              const sourceSize = Math.min(img.width, img.height);
              const sourceX = (img.width - sourceSize) / 2;
              const sourceY = (img.height - sourceSize) / 2;
              
              ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
              photoUrl = canvas.toDataURL('image/jpeg', 0.8);
              resolve(null);
            };
            img.src = URL.createObjectURL(newPlayer.photoFile!);
          });
        }

        // Firestoreで該当する選手を更新
        const playersSnapshot = await getDocs(collection(db, "players"));
        const playerDoc = playersSnapshot.docs.find(doc => doc.data().playerCode === selectedPlayer.playerCode);
        
        if (playerDoc) {
          const playerRef = doc(db, "players", playerDoc.id);
          await deleteDoc(playerRef);
          const updatedPlayer = {
            playerCode: selectedPlayer.playerCode,
            playerName: newPlayer.playerName,
            grade: newPlayer.grade,
            comment: newPlayer.comment,
            photoUrl
          };
          await addDoc(collection(db, "players"), updatedPlayer);
          
          // ローカルステートを更新
          const updatedPlayers = players.map(p => 
            p.playerCode === selectedPlayer.playerCode ? updatedPlayer : p
          );
          setPlayers(updatedPlayers);
          setSelectedPlayer(updatedPlayer);
        }
        
        setNewPlayer({ playerName: '', grade: '', comment: '', photoFile: null, photoUrl: '' });
        setShowAddPlayer(false);
        setIsEditMode(false);
      } else {
        // 新規登録モード
        const playerCode = `P${String(players.length + 1).padStart(3, '0')}`;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const img = new Image();
        img.onload = async () => {
          // 正方形に切り取る（200x200）
          const size = 200;
          canvas.width = size;
          canvas.height = size;
          
          // 元の画像の中央をクロップ
          const sourceSize = Math.min(img.width, img.height);
          const sourceX = (img.width - sourceSize) / 2;
          const sourceY = (img.height - sourceSize) / 2;
          
          ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
          const photoUrl = canvas.toDataURL('image/jpeg', 0.8);
          const newP = { playerCode, playerName: newPlayer.playerName, grade: newPlayer.grade, comment: newPlayer.comment, photoUrl };
          await addDoc(collection(db, "players"), newP);
          setPlayers([...players, newP]);
          setNewPlayer({ playerName: '', grade: '', comment: '', photoFile: null, photoUrl: '' });
          setShowAddPlayer(false);
        };
        img.src = URL.createObjectURL(newPlayer.photoFile!);
      }
    } catch (error: any) {
      console.error('選手登録エラー:', error);
      alert(`登録に失敗しました: ${error.message}`);
    }
  };

  const { gold, silver, bronze } = selectedPlayer ? getStarCounts(selectedPlayer.playerCode) : { gold: 0, silver: 0, bronze: 0 };

  return (
    <div className="flex flex-col gap-5 flex-1">
      <h1 className="card-title animate-bounce-in">HOME</h1>

      {selectedPlayer && (
        <div className="card animate-bounce-in max-w-4xl mx-auto">
          {/* iPad縦向き最適化グリッドレイアウト */}
          <div className="grid grid-cols-3 gap-6">
            {/* 上部：名前（左1/3）と年齢コメント（右2/3） */}
            <div className="col-span-1 flex flex-col items-center justify-start">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] text-center">{selectedPlayer.playerName}</h2>
            </div>
            <div className="col-span-2 flex flex-col items-start justify-center">
              <p className="text-[var(--color-accent)] font-medium text-lg">{selectedPlayer.grade}</p>
              <p className="text-sm text-[var(--color-muted)]">{selectedPlayer.comment}</p>
            </div>

            {/* 下部：選手写真（左1/3） */}
            <div className="col-span-1 flex flex-col items-center">
              <div className="w-full aspect-square flex-shrink-0 relative">
                <img
                  src={selectedPlayer.photoUrl || noImageSrc}
                  alt={selectedPlayer.playerName}
                  className="w-full h-full rounded-lg object-cover border-4 border-[rgba(20,241,255,0.4)] shadow-card"
                  onError={(e) => {
                    e.currentTarget.src = noImageSrc;
                  }}
                />
              </div>
            </div>

            {/* 星と数字（中央2/3） - 横並びレイアウト */}
            <div className="col-span-2 flex items-center justify-center gap-8">
              {/* ゴールド */}
              <div className="flex flex-col items-center justify-center gap-2" style={{ height: '100%' }}>
                <StarIcon variant="gold" size="5em" />
                <span className="text-base font-semibold text-[var(--color-text)]">GOLD</span>
                <div className="font-bold text-[var(--color-text)]" style={{ fontSize: '4rem' }}>{gold}</div>
              </div>
              {/* シルバー */}
              <div className="flex flex-col items-center justify-center gap-2" style={{ height: '100%' }}>
                <StarIcon variant="silver" size="5em" />
                <span className="text-base font-semibold text-[var(--color-text)]">SILVER</span>
                <div className="font-bold text-[var(--color-text)]" style={{ fontSize: '4rem' }}>{silver}</div>
              </div>
              {/* ブロンズ */}
              <div className="flex flex-col items-center justify-center gap-2" style={{ height: '100%' }}>
                <StarIcon variant="bronze" size="5em" />
                <span className="text-base font-semibold text-[var(--color-text)]">BRONZE</span>
                <div className="font-bold text-[var(--color-text)]" style={{ fontSize: '4rem' }}>{bronze}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <h3 className="section-title mb-4 flex items-center justify-center gap-2">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16l-6 3.4L7.5 13 2.5 8.6l6.6-.6L12 2z"/>
        </svg>
        <span>MISSION</span>
      </h3>

      {selectedMission && selectedPlayer && (
        <div className="card">
          {/* 一番上：星3つ（左）とタイトル（右）を横並び */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="flex gap-3 items-center">
              <StarIcon
                variant={getMissionStatus(selectedPlayer.playerCode, selectedMission.missionCode).gold ? 'gold' : 'disabled'}
                size="3em"
              />
              <StarIcon
                variant={getMissionStatus(selectedPlayer.playerCode, selectedMission.missionCode).silver ? 'silver' : 'disabled'}
                size="3em"
              />
              <StarIcon
                variant={getMissionStatus(selectedPlayer.playerCode, selectedMission.missionCode).bronze ? 'bronze' : 'disabled'}
                size="3em"
              />
            </div>
            <h4 style={{ fontSize: '1.8em', margin: 0, lineHeight: 1, display: 'flex', alignItems: 'center', color: 'var(--color-accent)', fontWeight: 600 }}>{selectedMission.missionName}</h4>
          </div>
          
          {/* 真ん中：説明 */}
          <div className="flex justify-center mb-6">
            <p className="text-[var(--color-muted)] text-center" style={{ fontSize: '1.5em' }}>{selectedMission.content}</p>
          </div>
          
          {/* 下：ボタン */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleClearClick}
              className="primary-button font-bold"
              style={{
                padding: '1.2rem 2rem',
                fontSize: '1.8rem',
                animation: 'pulse-glow 2s ease-in-out infinite',
                boxShadow: '0 0 20px rgba(20, 241, 255, 0.6), 0 0 40px rgba(20, 241, 255, 0.4), 0 16px 38px rgba(14, 165, 233, 0.42)'
              }}
            >
              {(() => {
                const status = getMissionStatus(selectedPlayer.playerCode, selectedMission.missionCode);
                if (status.bronze && status.silver && status.gold) {
                  return 'ゲットしたスターをリセット';
                } else if (status.silver && !status.gold) {
                  return 'ゴールドゲット';
                } else if (status.bronze && !status.silver) {
                  return 'シルバーゲット';
                } else {
                  return 'ブロンズゲット';
                }
              })()}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {missions.map((mission) => {
            const status = selectedPlayer ? getMissionStatus(selectedPlayer.playerCode, mission.missionCode) : null;
            return (
              <button
                key={mission.missionCode}
                type="button"
                onClick={() => setSelectedMission(mission)}
                className={`chip-button ${selectedMission?.missionCode === mission.missionCode ? 'is-selected' : ''}`}
                style={{ height: '180px', display: 'flex', flexDirection: 'row' }}
              >
                {/* 左側：星を縦並びで表示（ゴールド、シルバー、ブロンズ順） */}
                <div className="flex flex-col gap-1" style={{ width: '64px', justifyContent: 'center', flexShrink: 0 }}>
                  {status && (
                    <>
                      <div>{status.gold ? <StarIcon variant="gold" size="1.8em" /> : <div style={{ width: '1.8em', height: '1.8em' }}></div>}</div>
                      <div>{status.silver ? <StarIcon variant="silver" size="1.8em" /> : <div style={{ width: '1.8em', height: '1.8em' }}></div>}</div>
                      <div>{status.bronze ? <StarIcon variant="bronze" size="1.8em" /> : <div style={{ width: '1.8em', height: '1.8em' }}></div>}</div>
                    </>
                  )}
                </div>
                {/* 右側：タイトルと説明 */}
                <div className="flex flex-col gap-2 flex-1 overflow-hidden pl-2">
                  <div className="font-semibold text-sm">{mission.missionName}</div>
                  <div className="text-xs opacity-80 line-clamp-2">{mission.content}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="section-title mb-0">選手リスト</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (selectedPlayer) {
                  setIsEditMode(true);
                  setNewPlayer({
                    playerName: selectedPlayer.playerName,
                    grade: selectedPlayer.grade,
                    comment: selectedPlayer.comment,
                    photoFile: null,
                    photoUrl: selectedPlayer.photoUrl
                  });
                  setShowAddPlayer(true);
                } else {
                  alert('編集する選手を選択してください。');
                }
              }}
              className="secondary-button px-4 py-2 text-sm"
              disabled={!selectedPlayer}
            >
              編集
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditMode(false);
                setNewPlayer({ playerName: '', grade: '', comment: '', photoFile: null, photoUrl: '' });
                setShowAddPlayer(true);
              }}
              className="primary-button w-12 h-12 p-0 rounded-full flex items-center justify-center text-xl"
            >
              +
            </button>
          </div>
        </div>
        <div className="list-card flex-1 overflow-x-auto" style={{ padding: '8px' }}>
          <ul className="flex gap-1 list-none m-0 p-0" style={{ flexWrap: 'nowrap' }}>
            {players.map((player) => (
              <li key={player.playerCode} className="flex-shrink-0" style={{ height: '160px', display: 'flex' }}>
                <button
                  type="button"
                  onClick={() => setSelectedPlayer(player)}
                  className={`chip-button w-full ${selectedPlayer?.playerCode === player.playerCode ? 'is-selected' : ''}`}
                  style={{ width: '130px', padding: '8px' }}
                >
                  <div className="flex flex-col items-center gap-2 overflow-hidden h-full">
                    <div className="font-semibold text-[var(--color-text)] text-sm truncate w-full text-center flex-shrink-0">{player.playerName}</div>
                    <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center flex-1">
                      <img src={player.photoUrl || noImageSrc} alt={player.playerName} className="w-full h-full rounded object-cover border border-[rgba(20,241,255,0.3)] max-w-full max-h-full" onError={(e) => { e.currentTarget.src = noImageSrc; }} />
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {showAddPlayer && (
        <div className="modal-overlay">
          <div className="card modal-card">
            <h3 className="card-title">{isEditMode ? '選手編集' : '選手登録'}</h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="名前"
                value={newPlayer.playerName}
                onChange={(e) => setNewPlayer({ ...newPlayer, playerName: e.target.value })}
                className="pill-input"
              />
              <select
                value={newPlayer.grade}
                onChange={(e) => setNewPlayer({ ...newPlayer, grade: e.target.value })}
                className="pill-input"
              >
                <option value="">学年を選択</option>
                <option value="小1">小1</option>
                <option value="小2">小2</option>
                <option value="小3">小3</option>
                <option value="小4">小4</option>
                <option value="小5">小5</option>
                <option value="小6">小6</option>
                <option value="中1">中1</option>
                <option value="中2">中2</option>
                <option value="中3">中3</option>
                <option value="大人">大人</option>
              </select>
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
              {isEditMode && newPlayer.photoUrl && !newPlayer.photoFile && (
                <div className="text-sm text-[var(--color-muted)]">※写真を変更しない場合は、ファイルを選択しないでください</div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button type="button" onClick={() => {
                setShowAddPlayer(false);
                setIsEditMode(false);
                setNewPlayer({ playerName: '', grade: '', comment: '', photoFile: null, photoUrl: '' });
              }} className="secondary-button">
                キャンセル
              </button>
              <button type="button" onClick={handleAddPlayer} className="primary-button">
                {isEditMode ? '更新' : '登録'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
