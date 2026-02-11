import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from '../firebase';
const noImageSrc = `${import.meta.env.BASE_URL}noimage.png`;

const resolvePhotoUrl = (photoUrl?: string) => {
  if (!photoUrl || photoUrl === '/noimage.png') return noImageSrc;
  return photoUrl;
};
import bronzeSound from '../assets/bronze.mp3';
import silverSound from '../assets/silver.mp3';
import goldSound from '../assets/gold.mp3';

interface Player {
  playerCode: string;
  playerName: string;
  grade: string;
  comment: string;
  photoUrl: string;
  isDeleted?: boolean;
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
  const isDisabled = variant === "disabled";
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
        fill={isDisabled ? "none" : fill}
        stroke={isDisabled ? "var(--color-muted)" : "none"}
        strokeWidth={isDisabled ? 1.6 : 0}
        strokeLinejoin="round"
        strokeOpacity={isDisabled ? 0.7 : 1}
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
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  const getGradeOrder = (grade: string) => {
    const match = grade.match(/(小|中)(\d+)/);
    if (!match) return Number.MAX_SAFE_INTEGER;
    const [, group, year] = match;
    const base = group === '小' ? 0 : 10;
    return base + Number(year);
  };
  
  // Audio要素への参照（HTML要素として配置）
  const bronzeAudioRef = useRef<HTMLAudioElement>(null);
  const silverAudioRef = useRef<HTMLAudioElement>(null);
  const goldAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const playersSnap = await getDocs(collection(db, "players"));
      const playersData = playersSnap.docs.map(doc => ({ ...doc.data() } as Player));
      const activePlayers = playersData.filter(player => !player.isDeleted);
      const sortedPlayers = [...activePlayers].sort((a, b) => {
        const gradeDiff = getGradeOrder(a.grade) - getGradeOrder(b.grade);
        if (gradeDiff !== 0) return gradeDiff;
        return a.playerName.localeCompare(b.playerName, 'ja');
      });
      setPlayers(sortedPlayers);
      if (sortedPlayers.length > 0) setSelectedPlayer(sortedPlayers[0]);

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

  const handleClearClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 初回クリック時に音声をアンロック（無音再生）
    if (!audioUnlocked) {
      try {
        const audioElements = [bronzeAudioRef.current, silverAudioRef.current, goldAudioRef.current].filter(Boolean) as HTMLAudioElement[];
        await Promise.all(
          audioElements.map(audio => {
            return new Promise<void>(resolve => {
              try {
                audio.muted = true;
                audio.play().then(() => {
                  audio.pause();
                  audio.currentTime = 0;
                  audio.muted = false;
                  resolve();
                }).catch(() => resolve());
              } catch (e) {
                resolve();
              }
            });
          })
        );
        setAudioUnlocked(true);
      } catch (error) {
        console.error('音声アンロックエラー:', error);
      }
    }
    
    if (!selectedPlayer || !selectedMission) return;

    const missionAchievements = achievements.filter(
      a => a.playerCode === selectedPlayer.playerCode && a.missionCode === selectedMission.missionCode
    );

    const status = getMissionStatus(selectedPlayer.playerCode, selectedMission.missionCode);

    // 全て獲得している場合はリセット
    if (status.bronze && status.silver && status.gold) {
      try {
        // 全ての星を並列で削除
        await Promise.all(
          missionAchievements.map(ach => deleteDoc(doc(db, "achievements", ach.id)))
        );
        setAchievements(achievements.filter(a => !missionAchievements.includes(a)));
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました。もう一度お試しください。');
      }
      return;
    }

    // 次の星を追加
    let nextStarType: 'bronze' | 'silver' | 'gold';
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
    
    try {
      const docRef = await addDoc(collection(db, "achievements"), newAch);
      setAchievements([...achievements, { id: docRef.id, ...newAch }]);
      
      // 花火演出を表示
      setShowFireworks(true);
      setTimeout(() => setShowFireworks(false), 2000);
      
      // 音声を再生
      const audioRef = nextStarType === 'bronze' ? bronzeAudioRef : nextStarType === 'silver' ? silverAudioRef : goldAudioRef;
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => {
          console.error('音声再生エラー:', err);
        });
      }
    } catch (error) {
      console.error('追加エラー:', error);
      alert('スターの追加に失敗しました。もう一度お試しください。');
    }
  };

  const handleAddPlayer = async () => {
    if (!isEditMode && !newPlayer.photoFile) {
      // 写真がない場合はデフォルト画像を使う
      const playerCode = `P${String(players.length + 1).padStart(3, '0')}`;
      const newP = {
        playerCode,
        playerName: newPlayer.playerName,
        grade: newPlayer.grade,
        comment: newPlayer.comment,
        photoUrl: noImageSrc,
        isDeleted: false,
      };
      await addDoc(collection(db, "players"), newP);
      setPlayers([...players, newP]);
      setNewPlayer({ playerName: '', grade: '', comment: '', photoFile: null, photoUrl: '' });
      setShowAddPlayer(false);
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
            photoUrl,
            isDeleted: false,
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
          const newP = { playerCode, playerName: newPlayer.playerName, grade: newPlayer.grade, comment: newPlayer.comment, photoUrl, isDeleted: false };
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

  const handleDeletePlayer = async () => {
    if (!selectedPlayer) return;
    if (!window.confirm('この選手を削除しますか？（後で復元可能な論理削除です）')) return;
    try {
      const playersSnapshot = await getDocs(collection(db, "players"));
      const playerDoc = playersSnapshot.docs.find(doc => doc.data().playerCode === selectedPlayer.playerCode);
      if (!playerDoc) return;
      await updateDoc(doc(db, "players", playerDoc.id), { isDeleted: true });

      const updatedPlayers = players.filter(p => p.playerCode !== selectedPlayer.playerCode);
      setPlayers(updatedPlayers);
      setSelectedPlayer(updatedPlayers[0] ?? null);
      setShowAddPlayer(false);
      setIsEditMode(false);
      setNewPlayer({ playerName: '', grade: '', comment: '', photoFile: null, photoUrl: '' });
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div className="flex flex-col gap-5 flex-1">
      <div className="flex items-center justify-center">
        <h1 className="card-title animate-bounce-in text-center w-full flex items-center justify-center gap-3">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>HOME</span>
        </h1>
      </div>

      <div style={{ marginTop: '12px', marginBottom: '12px' }}>
        <div className="flex-1 overflow-x-auto" style={{ padding: '8px' }}>
          <ul className="flex list-none m-0 p-0" style={{ flexWrap: 'nowrap', gap: '12px' }}>
            {players.map((player) => (
              <li key={player.playerCode} className="flex-shrink-0" style={{ height: '180px', display: 'flex' }}>
                <button
                  type="button"
                  onClick={() => setSelectedPlayer(player)}
                  className={`chip-button w-full ${selectedPlayer?.playerCode === player.playerCode ? 'is-selected' : ''}`}
                  style={{ width: '150px', padding: '10px' }}
                >
                  <div className="flex flex-col items-center gap-2 overflow-hidden h-full">
                    <div className="font-semibold text-[var(--color-text)] text-base truncate w-full text-center flex-shrink-0">{player.playerName}</div>
                    <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center flex-1 rounded-[var(--radius-md)] overflow-hidden" style={{ border: 'none' }}>
                      <img src={resolvePhotoUrl(player.photoUrl)} alt={player.playerName} className="w-full h-full object-cover max-w-full max-h-full" onError={(e) => { e.currentTarget.src = noImageSrc; }} />
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {selectedPlayer && (
        <div className="card animate-bounce-in max-w-4xl mx-auto">
          {/* iPad縦向き最適化グリッドレイアウト */}
          <div className="grid grid-cols-3 gap-6">
            {/* 上部：名前（左1/3）と年齢コメント（右2/3） */}
            <div className="col-span-1 flex flex-col items-center justify-start">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] text-center">{selectedPlayer.playerName}</h2>
            </div>
            <div className="col-span-2 flex items-center justify-between">
              <div className="flex flex-col items-start justify-center" style={{ paddingLeft: '12px' }}>
                <p className="text-[var(--color-accent)] font-medium text-lg">{selectedPlayer.grade}</p>
                <p className="text-sm text-[var(--color-muted)]">{selectedPlayer.comment}</p>
              </div>
              <div className="flex gap-3">
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
                  className="secondary-button w-12 h-12 p-0 flex items-center justify-center"
                  style={{ borderRadius: '9999px' }}
                  aria-label="選手を編集"
                  disabled={!selectedPlayer}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditMode(false);
                    setNewPlayer({ playerName: '', grade: '', comment: '', photoFile: null, photoUrl: '' });
                    setShowAddPlayer(true);
                  }}
                  className="primary-button w-12 h-12 p-0 flex items-center justify-center"
                  style={{ borderRadius: '9999px', marginLeft: '12px' }}
                  aria-label="新規作成"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 下部：選手写真（左1/3） */}
            <div className="col-span-1 flex flex-col items-center">
              <div className="w-full aspect-square flex-shrink-0 relative rounded-[var(--radius-md)] overflow-hidden" style={{ border: 'none' }}>
                <img
                  src={resolvePhotoUrl(selectedPlayer.photoUrl)}
                  alt={selectedPlayer.playerName}
                  className="w-full h-full object-cover shadow-card"
                  onError={(e) => {
                    e.currentTarget.src = noImageSrc;
                  }}
                />
              </div>
            </div>

            {/* 星と数字（中央2/3） - 横並びレイアウト */}
            <div className="col-span-2 flex items-center justify-center gap-12">
              {/* ゴールド */}
              <div className="flex flex-col items-center justify-center gap-3" style={{ height: '100%' }}>
                <StarIcon variant="gold" size="6em" />
                <span className="text-lg font-semibold" style={{ color: '#F5C542', textShadow: '0 0 10px rgba(245,197,66,0.5)' }}>GOLD</span>
                <div className="font-bold" style={{ fontSize: '4.5rem', color: '#F5C542', textShadow: '0 0 10px rgba(245,197,66,0.5)' }}>{gold}</div>
              </div>
              {/* シルバー */}
              <div className="flex flex-col items-center justify-center gap-3" style={{ height: '100%' }}>
                <StarIcon variant="silver" size="6em" />
                <span className="text-lg font-semibold" style={{ color: '#C0C7D1', textShadow: '0 0 8px rgba(192,199,209,0.4)' }}>SILVER</span>
                <div className="font-bold" style={{ fontSize: '4.5rem', color: '#C0C7D1', textShadow: '0 0 8px rgba(192,199,209,0.4)' }}>{silver}</div>
              </div>
              {/* ブロンズ */}
              <div className="flex flex-col items-center justify-center gap-3" style={{ height: '100%' }}>
                <StarIcon variant="bronze" size="6em" />
                <span className="text-lg font-semibold" style={{ color: '#C57B39', textShadow: '0 0 8px rgba(197,123,57,0.4)' }}>BRONZE</span>
                <div className="font-bold" style={{ fontSize: '4.5rem', color: '#C57B39', textShadow: '0 0 8px rgba(197,123,57,0.4)' }}>{bronze}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedMission && selectedPlayer && (
        <div className="card" style={{ marginTop: '12px' }}>
          <h1 className="card-title flex items-center justify-center gap-3">
            <span>MISSIONクリアでSTARをゲットしよう！</span>
          </h1>
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
              className="font-bold"
              style={(() => {
                const status = getMissionStatus(selectedPlayer.playerCode, selectedMission.missionCode);
                if (status.bronze && status.silver && status.gold) {
                  // リセットボタン: グレー、光らない
                  return {
                    padding: '1.2rem 2rem',
                    fontSize: '1.8rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, opacity 0.2s',
                    WebkitTapHighlightColor: 'transparent' as any,
                    touchAction: 'manipulation' as any,
                  };
                } else if (status.silver && !status.gold) {
                  // ゴールドクリア: ゴールド色
                  return {
                    padding: '1.2rem 2rem',
                    fontSize: '1.8rem',
                    backgroundColor: '#fbbf24',
                    color: '#78350f',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    animation: 'pulse-glow-gold 2s ease-in-out infinite',
                    WebkitTapHighlightColor: 'transparent' as any,
                    touchAction: 'manipulation' as any,
                  };
                } else if (status.bronze && !status.silver) {
                  // シルバークリア: シルバー色
                  return {
                    padding: '1.2rem 2rem',
                    fontSize: '1.8rem',
                    backgroundColor: '#d1d5db',
                    color: '#1f2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    animation: 'pulse-glow-silver 2s ease-in-out infinite',
                    WebkitTapHighlightColor: 'transparent' as any,
                    touchAction: 'manipulation' as any,
                  };
                } else {
                  // ブロンズクリア: ブロンズ色
                  return {
                    padding: '1.2rem 2rem',
                    fontSize: '1.8rem',
                    backgroundColor: '#b45309',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    animation: 'pulse-glow-bronze 2s ease-in-out infinite',
                    WebkitTapHighlightColor: 'transparent' as any,
                    touchAction: 'manipulation' as any,
                  };
                }
              })()}
            >
              {(() => {
                const status = getMissionStatus(selectedPlayer.playerCode, selectedMission.missionCode);
                if (status.bronze && status.silver && status.gold) {
                  return 'ゲットしたスターをリセット';
                } else if (status.silver && !status.gold) {
                  return 'ゴールドクリア！';
                } else if (status.bronze && !status.silver) {
                  return 'シルバークリア！';
                } else {
                  return 'ブロンズクリア！';
                }
              })()}
            </button>
          </div>
        </div>
      )}

      <h1 className="card-title flex items-center justify-center gap-3">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16l-6 3.4L7.5 13 2.5 8.6l6.6-.6L12 2z"/>
        </svg>
        <span>MISSION</span>
      </h1>

      <div className="grid grid-cols-3 mb-4" style={{ gap: '8px' }}>
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
              <div className="flex flex-col gap-1 flex-1 overflow-hidden pl-2">
                <div className="font-semibold text-sm">{mission.missionName}</div>
                <div className="text-xs opacity-80 line-clamp-3">{mission.content}</div>
              </div>
            </button>
          );
        })}
      </div>

      {showAddPlayer && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ padding: '2.5rem' }}>
            <h3 className="card-title" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>{isEditMode ? '選手編集' : '選手登録'}</h3>
            <div className="flex flex-col gap-6">
              <input
                type="text"
                placeholder="名前"
                value={newPlayer.playerName}
                onChange={(e) => setNewPlayer({ ...newPlayer, playerName: e.target.value })}
                className="pill-input"
                style={{ fontSize: '1.6rem', padding: '1.3rem 2rem', marginBottom: '12px' }}
              />
              <select
                value={newPlayer.grade}
                onChange={(e) => setNewPlayer({ ...newPlayer, grade: e.target.value })}
                className="pill-input"
                style={{ fontSize: '1.6rem', padding: '1.3rem 2rem', marginBottom: '12px' }}
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
                style={{ fontSize: '1.6rem', padding: '1.3rem 2rem', marginBottom: '12px' }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewPlayer({ ...newPlayer, photoFile: e.target.files?.[0] || null })}
                className="input-file"
                style={{ fontSize: '1.6rem', padding: '1.5rem 2rem', marginBottom: '12px' }}
              />
              {isEditMode && newPlayer.photoUrl && !newPlayer.photoFile && (
                <div className="text-[var(--color-muted)]" style={{ fontSize: '1.2rem', marginBottom: '12px' }}>※写真を変更しない場合は、ファイルを選択しないでください</div>
              )}
            </div>
            <div className="flex justify-end gap-6 mt-8">
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleDeletePlayer}
                  className="secondary-button"
                  style={{ fontSize: '1.6rem', padding: '1.2rem 2rem', marginRight: 'auto' }}
                >
                  削除
                </button>
              )}
              <button type="button" onClick={() => {
                setShowAddPlayer(false);
                setIsEditMode(false);
                setNewPlayer({ playerName: '', grade: '', comment: '', photoFile: null, photoUrl: '' });
              }} className="secondary-button" style={{ fontSize: '1.6rem', padding: '1.2rem 2rem' }}>
                キャンセル
              </button>
              <button type="button" onClick={handleAddPlayer} className="primary-button" style={{ fontSize: '1.6rem', padding: '1.2rem 2rem', marginLeft: '16px' }}>
                {isEditMode ? '更新' : '登録'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Audio要素をHTMLとして配置 */}
      <audio ref={bronzeAudioRef} src={bronzeSound} preload="auto" />
      <audio ref={silverAudioRef} src={silverSound} preload="auto" />
      <audio ref={goldAudioRef} src={goldSound} preload="auto" />
      
      {/* 爆発的なクリア演出 */}
      {showFireworks && (
        <div className="celebration-container">
          {/* 背景フラッシュ */}
          <div className="celebration-flash" />
          
          {/* 中心の大きな光 */}
          <div className="celebration-center" />
          
          {/* 第1波：大きい丸いパーティクル */}
          {Array.from({ length: 80 }).map((_, i) => {
            const angle = (i / 80) * Math.PI * 2;
            const distance = 400 + Math.random() * 500;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            const colors = ['#F5C542', '#14f1ff', '#ff3dfc', '#38fdfc', '#C57B39', '#fbbf24', '#C0C7D1'];
            return (
              <div
                key={`circle-${i}`}
                className="celebration-particle"
                style={{
                  left: '50%',
                  top: '50%',
                  animationDelay: `${Math.random() * 0.1}s`,
                  animationDuration: `${1.2 + Math.random() * 0.6}s`,
                  backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                  width: `${20 + Math.random() * 30}px`,
                  height: `${20 + Math.random() * 30}px`,
                  '--tx': `${tx}px`,
                  '--ty': `${ty}px`,
                } as React.CSSProperties}
              />
            );
          })}
          
          {/* 第2波：小さいパーティクル */}
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = (i / 60) * Math.PI * 2 + Math.random() * 0.3;
            const distance = 300 + Math.random() * 400;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            const colors = ['#F5C542', '#14f1ff', '#ff3dfc', '#fbbf24'];
            return (
              <div
                key={`small-${i}`}
                className="celebration-particle celebration-particle-small"
                style={{
                  left: '50%',
                  top: '50%',
                  animationDelay: `${0.1 + Math.random() * 0.15}s`,
                  animationDuration: `${1.0 + Math.random() * 0.5}s`,
                  backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                  width: `${12 + Math.random() * 16}px`,
                  height: `${12 + Math.random() * 16}px`,
                  '--tx': `${tx}px`,
                  '--ty': `${ty}px`,
                } as React.CSSProperties}
              />
            );
          })}
          
          {/* 大きな星形パーティクル */}
          {Array.from({ length: 40 }).map((_, i) => {
            const angle = (i / 40) * Math.PI * 2 + Math.random() * 0.5;
            const distance = 350 + Math.random() * 450;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            const colors = ['#F5C542', '#ff3dfc', '#14f1ff', '#fbbf24'];
            return (
              <div
                key={`star-${i}`}
                className="celebration-star"
                style={{
                  left: '50%',
                  top: '50%',
                  animationDelay: `${Math.random() * 0.2}s`,
                  animationDuration: `${1.3 + Math.random() * 0.5}s`,
                  color: colors[Math.floor(Math.random() * colors.length)],
                  fontSize: `${40 + Math.random() * 40}px`,
                  '--tx': `${tx}px`,
                  '--ty': `${ty}px`,
                } as React.CSSProperties}
              >
                ★
              </div>
            );
          })}
          
          {/* キラキラ光る小さな星 */}
          {Array.from({ length: 30 }).map((_, i) => {
            const angle = Math.random() * Math.PI * 2;
            const distance = 250 + Math.random() * 350;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            return (
              <div
                key={`sparkle-${i}`}
                className="celebration-sparkle"
                style={{
                  left: '50%',
                  top: '50%',
                  animationDelay: `${0.15 + Math.random() * 0.3}s`,
                  fontSize: `${24 + Math.random() * 24}px`,
                  '--tx': `${tx}px`,
                  '--ty': `${ty}px`,
                } as React.CSSProperties}
              >
                ✨
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Home;
