/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  Sparkles, 
  Heart, 
  Volume2, 
  VolumeX, 
  Zap, 
  Shield, 
  Wrench, 
  ChevronLeft, 
  ArrowLeft, 
  RefreshCw, 
  Play, 
  Check, 
  Coins 
} from "lucide-react";

// =========================================================================
// 【じゆうにかいぞうしよう！】
// ここをかきかえると、ゲームのルールがかわるよ！
// しょうがく2ねんせいでも じゆうにかいぞうして あそべます。
// =========================================================================
const SETTINGS = {
  // 🏎️ プレイヤーののりもの
  MY_CAR_EMOJI: "🚗", 

  // 🪙 レースクリアでもらえるコイン（たくさんもらえるようにできるよ！）
  GOAL_REWARD_COINS: 100, 

  // 💔 クラッシュしたとき（ざんねん）でも、がんばったしょうでもらえるコイン
  CRASH_REWARD_COINS: 15, 

  // 🏁 ゴールまでのきょり（ちいさくすると、すぐにゴールできるよ！）
  GOAL_TOTAL_DISTANCE: 1200, 

  // てきのくるまたち（えもじをふやしたり、かえたりしてみてね！）
  ENEMY_CAR_EMOJIS: ["🚓", "🚕", "🚒", "🚚", "🚌", "🏎️", "🚜", "🚔", "🚘", "🚑"],

  // どうろにおちているコインのえもじ
  COIN_EMOJI: "💰",

  // ⚡ ターボアイテム（ガソリン）のえもじ
  GASOLINE_EMOJI: "⛽",

  // 🌟 むてきスターのえもじ
  STAR_EMOJI: "⭐",

  // はじめから もっているコイン
  INITIAL_COINS: 100,
};

// =========================================================================
// 🎵 おとをならすシステム（Web Audio API）
// なにもファイルをダウンロードしなくても、ブラウザだけでピコピコおとがなります！
// =========================================================================
class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;
  private bgmInterval: any = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playCoin() {
    this.init();
    if (!this.ctx || this.muted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, this.ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }

  playTurbo() {
    this.init();
    if (!this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.5);
    } catch (e) {}
  }

  playLevelUp() {
    this.init();
    if (!this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      const scale = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C, E, G, C, E, G, C
      scale.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.12, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.15);
      });
    } catch (e) {}
  }

  playHit() {
    this.init();
    if (!this.ctx || this.muted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.setValueAtTime(90, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }

  playCrash() {
    this.init();
    if (!this.ctx || this.muted) return;
    try {
      // はげしいばくはつおと
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.5);
    } catch (e) {}
  }

  playGoalFanfare() {
    this.init();
    if (!this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      // 🏁 お祝いの音色！ (C4 -> E4 -> G4 -> C5 -> E5 -> G5(ちょうおん)!!)
      const notes = [
        { f: 523.25, d: 0.1 },  // C5
        { f: 659.25, d: 0.1 },  // E5
        { f: 783.99, d: 0.1 },  // G5
        { f: 1046.50, d: 0.5 }  // C6!!
      ];
      notes.forEach((note, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(note.f, now + idx * 0.15);
        gain.gain.setValueAtTime(0.15, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + note.d);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + note.d);
      });
    } catch (e) {}
  }

  startBGMLoop() {
    this.init();
    if (this.bgmInterval) return;
    let step = 0;
    // やさしいピコピコBGM
    const melody = [
      392.00, 440.00, 493.88, 523.25, 587.33, 587.33, 659.25, 587.33,
      523.25, 493.88, 440.00, 392.00, 440.00, 493.88, 440.00, 587.33
    ];
    this.bgmInterval = setInterval(() => {
      if (this.muted || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = melody[step % melody.length];
        gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.22);
        step++;
      } catch (e) {}
    }, 280);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

const sfx = new SoundEngine();

// =========================================================================
// 🚗 きせかえのかーラインナップ
// コインをためて あたらしいクルマ（絵文字）をゲットしよう！
// =========================================================================
interface CarItem {
  id: string;
  emoji: string;
  name: string;
  cost: number;
  desc: string;
  specbonus: string; // かえだねの見た目などのせつめい
}

const CAR_SHOP: CarItem[] = [
  { id: "red", emoji: "🚗", name: "ヒーローレッド", cost: 0, desc: "さいしょの かっこいい赤いレースカー！", specbonus: "バランスばつぐん！" },
  { id: "police", emoji: "🚓", name: "ウインウインパトカー", cost: 100, desc: "ピカピカ パトランプつきの パトカー！", specbonus: "サイレンが かっこいい！" },
  { id: "fire", emoji: "🚒", name: "レスキューしょうぼう車", cost: 200, desc: "みんなをたすける 大きなしょうぼうしゃ！", specbonus: "ぶつかっても へっちゃら！？" },
  { id: "f1", emoji: "🏎️", name: "フォーミュラ・ワン", cost: 350, desc: "ちょうハイスピードの ほんかくレーサー！", specbonus: "ターボが すこしながくつづく！" },
  { id: "ufo", emoji: "🛸", name: "ピカピコUFO", cost: 500, desc: "うちゅうから やってきた、そらとぶUFO！", specbonus: "コインが すこしすいよせられる！" },
  { id: "dragon", emoji: "🦖", name: "キングダイナソー号", cost: 800, desc: "さいきょうの きょうりゅうロードスター！", specbonus: "ハッパのはっぱエフェクトがでるよ！" },
];

export default function App() {
  // -----------------------------------------------------------------------
  // ゲームのセーブデータを読み込むリアクティブ・ステート
  // -----------------------------------------------------------------------
  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem("jr_race_coins");
    return saved ? parseInt(saved, 10) : SETTINGS.INITIAL_COINS;
  });

  const [levels, setLevels] = useState<{ engine: number; tire: number; body: number }>(() => {
    const saved = localStorage.getItem("jr_race_levels");
    return saved ? JSON.parse(saved) : { engine: 1, tire: 1, body: 1 };
  });

  const [ownedCars, setOwnedCars] = useState<string[]>(() => {
    const saved = localStorage.getItem("jr_race_owned_cars");
    return saved ? JSON.parse(saved) : ["🚗"];
  });

  const [selectedCar, setSelectedCar] = useState<string>(() => {
    const saved = localStorage.getItem("jr_race_selected_car");
    return saved ? saved : "🚗";
  });

  const [gameState, setGameState] = useState<"GARAGE" | "RACING" | "RESULT">("GARAGE");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"UPGRADE" | "GARAGE_SELECT">("UPGRADE");

  // レースのけっか
  const [raceResult, setRaceResult] = useState<{
    success: boolean;
    collected: number;
    reward: number;
    bonus: number;
  }>({
    success: false,
    collected: 0,
    reward: 0,
    bonus: 0,
  });

  // 音まわり
  useEffect(() => {
    sfx.muted = isMuted;
  }, [isMuted]);

  // データほぞん
  useEffect(() => {
    localStorage.setItem("jr_race_coins", coins.toString());
  }, [coins]);

  useEffect(() => {
    localStorage.setItem("jr_race_levels", JSON.stringify(levels));
  }, [levels]);

  useEffect(() => {
    localStorage.setItem("jr_race_owned_cars", JSON.stringify(ownedCars));
  }, [ownedCars]);

  useEffect(() => {
    localStorage.setItem("jr_race_selected_car", selectedCar);
  }, [selectedCar]);

  // レース開始時にBGMを流す
  useEffect(() => {
    if (gameState === "RACING") {
      sfx.startBGMLoop();
    } else {
      sfx.stopBGM();
    }
    return () => {
      sfx.stopBGM();
    };
  }, [gameState]);

  // 各アップグレードのひよう
  const getCost = (type: "engine" | "tire" | "body", level: number) => {
    if (type === "body") {
      // ライフはレベル5がMAX
      if (level >= 5) return Infinity;
      return level * 120; // 120, 240, 360, 480
    }
    // エンジンとタイヤはレベル10がMAX
    if (level >= 10) return Infinity;
    return level * 35 + Math.floor(Math.pow(level, 1.6) * 15); // やさしいお値段カーブ
  };

  // -----------------------------------------------------------------------
  // かいぞう（パワーアップ）をする処理
  // -----------------------------------------------------------------------
  const handleUpgrade = (type: "engine" | "tire" | "body") => {
    const currentLevel = levels[type];
    const cost = getCost(type, currentLevel);
    if (coins >= cost) {
      setCoins((prev) => prev - cost);
      setLevels((prev) => ({ ...prev, [type]: prev[type] + 1 }));
      sfx.playLevelUp();
    }
  };

  // -----------------------------------------------------------------------
  // クルマをかう（きせかえ）処理
  // -----------------------------------------------------------------------
  const handleBuyCar = (car: CarItem) => {
    if (ownedCars.includes(car.emoji)) {
      setSelectedCar(car.emoji);
      sfx.playCoin();
    } else if (coins >= car.cost) {
      setCoins((prev) => prev - car.cost);
      setOwnedCars((prev) => [...prev, car.emoji]);
      setSelectedCar(car.emoji);
      sfx.playLevelUp();
    }
  };

  // -----------------------------------------------------------------------
  // 🎉 レース画面コンポーネント (Canvas)
  // -----------------------------------------------------------------------
  const handleRaceFinish = (success: boolean, coinsCollected: number) => {
    const rewardBase = success ? SETTINGS.GOAL_REWARD_COINS : SETTINGS.CRASH_REWARD_COINS;
    // エンジンレベルに応じたハイスピードボーナス
    const bonus = success ? levels.engine * 5 : 0;
    const finalReward = rewardBase + coinsCollected + bonus;

    setCoins((prev) => prev + finalReward);
    setRaceResult({
      success,
      collected: coinsCollected,
      reward: rewardBase,
      bonus: bonus,
    });
    setGameState("RESULT");

    if (success) {
      sfx.playGoalFanfare();
    } else {
      sfx.playCrash();
    }
  };

  return (
    <div className="flex justify-center items-center my-0 mx-auto min-h-[100dvh] bg-slate-100 font-sans select-none touch-none antialiased">
      {/* スマホ画面のサイズにフィットするメインフレーム */}
      <div 
        id="app-container"
        className="relative w-full max-w-[480px] h-[100dvh] sm:h-[840px] bg-gradient-to-b from-sky-400 via-sky-300 to-amber-100 flex flex-col justify-between overflow-hidden shadow-2xl sm:rounded-3xl border-4 border-slate-800"
      >
        
        {/* ==================== 音＆共通ヘッダー ==================== */}
        <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
          <button 
            id="sound-toggle-btn"
            onClick={() => setIsMuted(!isMuted)} 
            className="p-2 rounded-full bg-white/90 border-2 border-slate-800 shadow-md active:scale-90 transition-transform cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5 text-green-600 animate-pulse" />}
          </button>
        </div>

        {/* ========================================================= */}
        {/* 1. ガレージ画面（ホーム＆パワーアップ・きせかえ） */}
        {/* ========================================================= */}
        {gameState === "GARAGE" && (
          <div className="w-full h-full flex flex-col justify-between py-3 px-3.5 bg-slate-900 text-white overflow-hidden">
            
            {/* 上部固定コンテンツ */}
            <div className="flex flex-col shrink-0 gap-1">
              {/* ゲームタイトルロゴ */}
              <div className="text-center pt-0.5">
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="inline-block bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-transparent bg-clip-text font-black text-2xl tracking-wider pb-0.5 filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                >
                  🏁はしれ！スーパーカー🏁
                </motion.div>
                <p className="text-[10px] text-slate-300 -mt-0.5">パワーアップして てきの車をよけまくれ！</p>
              </div>

              {/* コインメーター */}
              <motion.div 
                id="coins-meter"
                className="my-1.5 bg-slate-800/80 border-2 border-yellow-400 rounded-xl p-2 flex justify-between items-center shadow-[0_0_10px_rgba(250,204,21,0.2)]"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2">
                  <div className="text-xl animate-bounce">🪙</div>
                  <div>
                    <div className="text-[10px] text-yellow-400 font-bold">しょじコイン</div>
                    <div className="text-xl font-black font-mono tracking-wide text-yellow-300">
                      {coins} <span className="text-xs">コイン</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] py-0.5 px-1.5 rounded bg-slate-700 text-slate-300 font-mono">
                    v1.2.0
                  </span>
                  <span className="text-[10px] py-0.5 px-2 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                    しょうがく2ねんせい むけ
                  </span>
                </div>
              </motion.div>

              {/* マイカーのビジュアル表示 */}
              <div className="relative flex justify-center items-center py-3 bg-gradient-to-b from-indigo-900/40 to-slate-800/80 rounded-2xl border-2 border-indigo-500/30 overflow-hidden min-h-[105px] shadow-inner">
                <div className="absolute top-1.5 left-2.5 text-[10px] text-indigo-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-400 animate-spin" /> いまのってりゅ！
                </div>
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.25)_0%,transparent_70%)] animate-pulse" />
                
                <div className="relative z-10 flex flex-col items-center">
                  {/* くるま絵文字（少し小さく表示） */}
                  <motion.div 
                    id="selected-car-visual"
                    className="text-5xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                    animate={{ 
                      y: [-3, 3, -3],
                      rotate: [-1, 1, -1] 
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {selectedCar}
                  </motion.div>
                  <div className="mt-1.5 font-bold text-xs text-yellow-200 bg-black/40 px-2.5 py-0.5 rounded-full border border-yellow-200/20">
                    {CAR_SHOP.find(c => c.emoji === selectedCar)?.name || "スペシャルカー"}
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">
                    {CAR_SHOP.find(c => c.emoji === selectedCar)?.specbonus || "スピードバツグン！"}
                  </div>
                </div>
              </div>

              {/* メインタブ切り替え */}
              <div className="flex gap-2 my-1.5">
                <button
                  id="tab-btn-upgrade"
                  onClick={() => { setActiveTab("UPGRADE"); sfx.playCoin(); }}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 border-2 transition-all cursor-pointer ${
                    activeTab === "UPGRADE"
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 scale-102"
                      : "bg-slate-800 text-slate-300 border-transparent hover:bg-slate-700"
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5 text-indigo-300" /> かいぞう＆強化
                </button>
                <button
                  id="tab-btn-garage"
                  onClick={() => { setActiveTab("GARAGE_SELECT"); sfx.playCoin(); }}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 border-2 transition-all cursor-pointer ${
                    activeTab === "GARAGE_SELECT"
                      ? "bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-600/30 scale-102"
                      : "bg-slate-800 text-slate-300 border-transparent hover:bg-slate-700"
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-yellow-300" /> きせかえ車やさん
                </button>
              </div>
            </div>

            {/* タブコンテンツ */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 my-1">
              
              {/* 【強化タブ】 */}
              {activeTab === "UPGRADE" && (
                <div className="flex flex-col gap-2 pb-2">
                  
                  {/* リスト1: エンジン改造 */}
                  <div className="bg-slate-800/90 rounded-xl p-2 border border-slate-700 flex justify-between items-center shadow-md">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400 text-xl font-bold">
                        🚀
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-100 flex items-center gap-1">
                          エンジンのかいぞう 
                          <span className="text-[10px] text-orange-400 bg-orange-400/10 px-1 py-0.5 rounded ml-1 font-mono">
                            LV.{levels.engine}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300 -mt-0.5">さいこうスピードが UPするぞ！</div>
                        <div className="text-[10px] text-orange-300 font-bold mt-0.5">
                          スピード: {Math.round(100 + (levels.engine - 1) * 12)}%
                        </div>
                      </div>
                    </div>
                    <div>
                      {levels.engine >= 10 ? (
                        <div className="text-[10px] font-bold text-green-400 bg-green-500/10 py-1.5 px-2 rounded-lg border border-green-500/20 text-center">
                          さいきょう!!
                        </div>
                      ) : (
                        <button
                          id="btn-upgrade-engine"
                          onClick={() => handleUpgrade("engine")}
                          disabled={coins < getCost("engine", levels.engine)}
                          className={`py-1.5 px-2.5 rounded-lg font-black text-[10px] min-w-[70px] text-center border-2 shadow-md flex flex-col items-center transition-all cursor-pointer ${
                            coins >= getCost("engine", levels.engine)
                              ? "bg-gradient-to-b from-orange-400 to-orange-600 text-white border-orange-300 active:scale-95"
                              : "bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed opacity-60"
                          }`}
                        >
                          <span>パワーUP!</span>
                          <span className="font-mono mt-0.5 text-yellow-300">
                            🪙{getCost("engine", levels.engine)}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* リスト2: タイヤ改造 */}
                  <div className="bg-slate-800/90 rounded-xl p-2 border border-slate-700 flex justify-between items-center shadow-md">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-xl font-bold">
                        🏎️
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-100 flex items-center gap-1">
                          タイヤのかいぞう 
                          <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-1 py-0.5 rounded ml-1 font-mono">
                            LV.{levels.tire}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300 -mt-0.5">左右によけやすくなる！</div>
                        <div className="text-[10px] text-cyan-300 font-bold mt-0.5">
                          ハンドルかるさ: {Math.round(100 + (levels.tire - 1) * 15)}%
                        </div>
                      </div>
                    </div>
                    <div>
                      {levels.tire >= 10 ? (
                        <div className="text-[10px] font-bold text-green-400 bg-green-500/10 py-1.5 px-2 rounded-lg border border-green-500/20 text-center">
                          さいきょう!!
                        </div>
                      ) : (
                        <button
                          id="btn-upgrade-tire"
                          onClick={() => handleUpgrade("tire")}
                          disabled={coins < getCost("tire", levels.tire)}
                          className={`py-1.5 px-2.5 rounded-lg font-black text-[10px] min-w-[70px] text-center border-2 shadow-md flex flex-col items-center transition-all cursor-pointer ${
                            coins >= getCost("tire", levels.tire)
                              ? "bg-gradient-to-b from-cyan-400 to-cyan-600 text-white border-cyan-300 active:scale-95"
                              : "bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed opacity-60"
                          }`}
                        >
                          <span>パワーUP!</span>
                          <span className="font-mono mt-0.5 text-yellow-300">
                            🪙{getCost("tire", levels.tire)}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* リスト3: ボディ（ライフ）改造 */}
                  <div className="bg-slate-800/90 rounded-xl p-2 border border-slate-700 flex justify-between items-center shadow-md">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 text-xl font-bold">
                        💖
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-100 flex items-center gap-1">
                          ボディのかいぞう 
                          <span className="text-[10px] text-rose-400 bg-rose-400/10 px-1 py-0.5 rounded ml-1 font-mono">
                            LV.{levels.body}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300 -mt-0.5">ぶつかってもライフでセーフ！</div>
                        <div className="text-[10px] text-rose-300 font-bold mt-0.5 flex items-center gap-0.5">
                          ライフ: {Array.from({ length: Math.min(5, levels.body) }).map((_, i) => (
                            <Heart key={i} className="w-3 h-3 text-rose-400 fill-rose-500" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      {levels.body >= 5 ? (
                        <div className="text-[10px] font-bold text-green-400 bg-green-500/10 py-1.5 px-2 rounded-lg border border-green-500/20 text-center">
                          さいきょう!!
                        </div>
                      ) : (
                        <button
                          id="btn-upgrade-body"
                          onClick={() => handleUpgrade("body")}
                          disabled={coins < getCost("body", levels.body)}
                          className={`py-1.5 px-2.5 rounded-lg font-black text-[10px] min-w-[70px] text-center border-2 shadow-md flex flex-col items-center transition-all cursor-pointer ${
                            coins >= getCost("body", levels.body)
                              ? "bg-gradient-to-b from-rose-400 to-rose-600 text-white border-rose-300 active:scale-95"
                              : "bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed opacity-60"
                          }`}
                        >
                          <span>ライフUP!</span>
                          <span className="font-mono mt-0.5 text-yellow-300">
                            🪙{getCost("body", levels.body)}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* 【きせかえ車やさんタブ】 */}
              {activeTab === "GARAGE_SELECT" && (
                <div className="grid grid-cols-2 gap-2 pb-2">
                  {CAR_SHOP.map((car) => {
                    const isOwned = ownedCars.includes(car.emoji);
                    const isSelected = selectedCar === car.emoji;
                    const canBuy = coins >= car.cost;
                    
                    return (
                      <button
                        id={`btn-car-shop-${car.id}`}
                        key={car.id}
                        onClick={() => handleBuyCar(car)}
                        className={`p-1.5 rounded-xl flex flex-col items-center justify-between border-2 transition-all text-center relative cursor-pointer ${
                          isSelected 
                            ? "bg-amber-500/20 border-amber-400 text-white scale-102"
                            : isOwned
                            ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                            : "bg-slate-950/80 border-slate-800 text-slate-400"
                        }`}
                      >
                        {/* えもじ */}
                        <div className="text-3xl my-0.5 filter drop-shadow-md">{car.emoji}</div>
                        
                        {/* くるまの名前 */}
                        <div className="font-bold text-[10px] text-yellow-100 truncate w-full">{car.name}</div>
                        
                        {/* ステータス */}
                        <div className="mt-0.5 w-full bg-slate-900/60 rounded py-0.5 px-0.5 text-[9px] text-slate-300 truncate">
                          {isOwned ? (
                            isSelected ? (
                              <span className="text-amber-300 font-bold flex items-center justify-center gap-0.5">
                                <Check className="w-2.5 h-2.5 text-amber-400" /> のり中
                              </span>
                            ) : (
                              <span className="text-green-400">のる！</span>
                            )
                          ) : (
                            <span className="text-yellow-400 font-bold flex items-center justify-center gap-0.5">
                              🪙 {car.cost}
                            </span>
                          )}
                        </div>

                        {/* ロック状態の鍵マーク */}
                        {!isOwned && !canBuy && (
                          <div className="absolute top-0.5 right-1.5 text-[10px]">🔒</div>
                        )}
                        {!isOwned && canBuy && (
                          <div className="absolute top-0.5 right-1.5 text-[9px] bg-red-500 text-white rounded-full px-1 font-bold animate-bounce">
                            OK!
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 「レースにで発車！」ボタン */}
            <div className="pt-1 shrink-0">
              <motion.button
                id="btn-race-start"
                onClick={() => {
                  sfx.init();
                  setGameState("RACING");
                }}
                className="w-full py-3 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white text-base font-black rounded-xl border-b-4 border-red-700 shadow-lg active:translate-y-0.5 active:border-b-2 hover:brightness-105 transition-all flex items-center justify-center gap-1.5 cursor-pointer cursor-pulse"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Play className="w-5 h-5 fill-white" /> レースにしゅっぱつ！🚀
              </motion.button>
              <div className="text-center text-[9px] text-slate-400 mt-1">
                スマホは画面下の「👈」「👉」をタッチ！パソコンは「←」「→」キーでうごくよ！
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* 2. レース画面 (Canvasゲームエンジン) */}
        {/* ========================================================= */}
        {gameState === "RACING" && (
          <GameCanvas 
            levels={levels} 
            selectedCar={selectedCar} 
            onFinish={handleRaceFinish} 
            isMuted={isMuted}
          />
        )}

        {/* ========================================================= */}
        {/* 3. リザルト（けっか）画面 */}
        {/* ========================================================= */}
        {gameState === "RESULT" && (
          <div className="w-full h-full flex flex-col justify-between p-6 bg-slate-900 text-white overflow-hidden relative">
            
            {/* かみふぶきエフェクトのかざり */}
            {raceResult.success && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden text-lg select-none opacity-20">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute animate-bounce"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      transform: `rotate(${Math.random() * 360}deg)`
                    }}
                  >
                    🎉🎈🌟✨
                  </div>
                ))}
              </div>
            )}

            {/* ヘッダー */}
            <div className="text-center pt-6 relative z-10">
              <span className="text-sm tracking-widest text-slate-400 uppercase font-black">レース おしまい！</span>
              <h2 className="text-4xl font-extrabold mt-1 text-yellow-300">けっかはっぴょう！</h2>
            </div>

            {/* 結果カード */}
            <div className="flex-1 my-6 flex flex-col justify-center items-center relative z-10">
              <AnimatePresence>
                {raceResult.success ? (
                  /* 大成功ゴールゴールのカード */
                  <motion.div 
                    initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    className="bg-gradient-to-b from-yellow-400 to-amber-500 text-slate-950 p-6 rounded-3xl w-full border-4 border-white text-center shadow-[0_20px_50px_rgba(251,191,36,0.3)]"
                  >
                    <div className="text-6xl animate-bounce mb-2">🏆</div>
                    <h3 className="text-3xl font-black mb-1">🏁ゴーーール！🏁</h3>
                    <p className="text-xs font-bold text-slate-900 opacity-90">さいごまで はしりきったぞ！えらいね！</p>
                    
                    <div className="mt-4 bg-white/90 p-4 rounded-2xl flex flex-col gap-2 font-black border-2 border-slate-900">
                      <div className="flex justify-between items-center text-sm border-b border-slate-300/60 pb-1.5">
                        <span className="text-slate-600">ゴールしたほうしゅう :</span>
                        <span className="text-green-600">🪙 {raceResult.reward}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-slate-300/60 pb-1.5 border-dashed">
                        <span className="text-slate-600">みちで ひろったコイン :</span>
                        <span className="text-green-600">🪙 {raceResult.collected}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-slate-300/60 pb-1.5 border-dashed">
                        <span className="text-slate-600">エンジンボーナス🚀 :</span>
                        <span className="text-green-600">🪙 {raceResult.bonus}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg text-slate-900 font-extrabold pt-1">
                        <span>ごーけい :</span>
                        <span className="text-rose-600 text-2xl font-mono">
                          🪙 {raceResult.reward + raceResult.collected + raceResult.bonus}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* 失敗カード */
                  <motion.div 
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-slate-800 text-white p-6 rounded-3xl w-full border-4 border-slate-700 text-center shadow-lg"
                  >
                    <div className="text-6xl mb-2">💥🚀</div>
                    <h3 className="text-2xl font-black text-red-400 mb-1">クラッシュしちゃった！</h3>
                    <p className="text-xs text-slate-300">てきの車に ぶつかっちゃった。つぎは よけよう！</p>
                    
                    <div className="mt-4 bg-slate-950/60 p-4 rounded-2xl flex flex-col gap-2 font-black border-2 border-slate-800">
                      <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">がんばったしょう :</span>
                        <span className="text-yellow-300">🪙 {raceResult.reward}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-1.5 border-dashed">
                        <span className="text-slate-400">みちで ひろったコイン :</span>
                        <span className="text-yellow-300">🪙 {raceResult.collected}</span>
                      </div>
                      <div className="flex justify-between items-center text-base pt-1">
                        <span>ごーけい :</span>
                        <span className="text-yellow-400 text-2xl font-mono">
                          🪙 {raceResult.reward + raceResult.collected}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-orange-400 font-bold mt-4 animate-pulse">
                      💡タイヤやボディを パワーアップすると ぶつかりにくくなるぞ！
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 操作・ガレージへ戻るボタン */}
            <div className="relative z-10 pt-4">
              <motion.button 
                id="btn-return-garage"
                onClick={() => {
                  sfx.playLevelUp();
                  setGameState("GARAGE");
                }}
                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:brightness-110 active:scale-98 transition-transform font-black text-slate-950 text-lg rounded-2xl border-b-6 border-amber-700 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowLeft className="w-5 h-5 text-slate-950 stroke-[3px]" /> ガレージにもどってパワーアップ！🛠️
              </motion.button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

// =========================================================================
// 🏎️ ゲームエンジンの本体（Canvas描画）
// =========================================================================
interface GameCanvasProps {
  levels: { engine: number; tire: number; body: number };
  selectedCar: string;
  onFinish: (success: boolean, coinsCollected: number) => void;
  isMuted: boolean;
}

function GameCanvas({ levels, selectedCar, onFinish, isMuted }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // いまのパワーアップをじょうほうとして 取得
  const SPEED_FACTOR = 1 + (levels.engine - 1) * 0.12;       // 最高スピードにえいきょう
  const HANDLING_FACTOR = 1 + (levels.tire - 1) * 0.15;     // 左右移動速度にえいきょう
  const MAX_LIFE = levels.body;                              // 初期・最大ライフ。ボディのレベルと等しい

  // HUD表示のためのReact状態管理
  const [currentLife, setCurrentLife] = useState(MAX_LIFE);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [isStarActiveState, setIsStarActiveState] = useState(false);

  // 進捗バーとスピードメーターを直接DOM制御するためのRef
  const progressBarRef = useRef<HTMLDivElement>(null);
  const speedTextRef = useRef<HTMLParagraphElement>(null);

  // ゲーム状態を内部Refで保持（描画の再レンダリング防止、スムーズな60FPS）
  const stateRef = useRef({
    distanceWalked: 0,
    coinsCollected: 0,
    life: MAX_LIFE,
    playerX: 180, // 初期位置 (中央)
    playerY: 480,
    playerH: 60,
    playerW: 36,
    isStarActive: false, // スター(無敵)状態
    starTime: 0, // 無敵のこりフレーム
    isStarFlash: false, // ちかちか
    keys: { Left: false, Right: false },
    touchMode: "" as "left" | "right" | "",
    enemies: [] as {
      x: number;
      y: number;
      speed: number;
      emoji: string;
      w: number;
      h: number;
      color: string;
      isLightOn: boolean;
    }[],
    items: [] as {
      x: number;
      y: number;
      type: "coin" | "star" | "gasoline";
      emoji: string;
      w: number;
      h: number;
      collected: boolean;
    }[],
    particles: [] as {
      x: number;
      y: number;
      vx: number;
      vy: number;
      emoji?: string;
      color?: string;
      size: number;
      alpha: number;
      life: number;
    }[],
    roadScrollOffset: 0,
    environmentDecos: [] as {
      x: number;
      y: number;
      emoji: string;
    }[],
    crashCooldown: 0, // 無敵ちかのノックバックちか
    gameEnded: false,
    screenWidth: 360,
    screenHeight: 600,
  });

  // かんたんな環境デコレーション（木々など）
  useEffect(() => {
    const list = [];
    for (let i = 0; i < 12; i++) {
      list.push({
        x: Math.random() < 0.5 ? Math.random() * 50 : 310 + Math.random() * 50,
        y: Math.random() * 600,
        emoji: Math.random() < 0.6 ? "🌲" : Math.random() < 0.7 ? "🌳" : "🪻",
      });
    }
    stateRef.current.environmentDecos = list;
    stateRef.current.life = MAX_LIFE; // 確実にライフをレベルと同じにする
    stateRef.current.distanceWalked = 0;
    stateRef.current.coinsCollected = 0;
    stateRef.current.isStarActive = false;
    setCurrentLife(MAX_LIFE);
    setCoinsCollected(0);
    setIsStarActiveState(false);
  }, [MAX_LIFE]);

  useEffect(() => {
    const state = stateRef.current;
    
    // --------------------------------------------------
    // キーボード入力うけつけ
    // --------------------------------------------------
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        state.keys.Left = true;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        state.keys.Right = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        state.keys.Left = false;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        state.keys.Right = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // --------------------------------------------------
    // ゲームのメインフーループ（60FPS）
    // --------------------------------------------------
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frameCount = 0;

    const gameLoop = () => {
      if (state.gameEnded) return;

      frameCount++;

      // スピード決定：エンジンパワーアップとスター無敵状態、クラッシュまわり
      let currentCarSpeed = 4 * SPEED_FACTOR;
      if (state.isStarActive) {
        currentCarSpeed *= 1.8; // スター時は超・爆速！
      }
      if (state.crashCooldown > 0) {
        currentCarSpeed *= 0.2; // ぶつかった直後はスロー
        state.crashCooldown--;
      }

      // スター時間の消費
      if (state.isStarActive) {
        state.starTime--;
        state.isStarFlash = frameCount % 6 < 3;
        if (state.starTime <= 0) {
          state.isStarActive = false;
          setIsStarActiveState(false);
        }
      }

      // スクロール・走ったきょりをふやす
      // ゴールデンタイム
      if (state.distanceWalked < SETTINGS.GOAL_TOTAL_DISTANCE) {
        state.distanceWalked += currentCarSpeed * 0.15;
      }

      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${Math.min(100, (state.distanceWalked / SETTINGS.GOAL_TOTAL_DISTANCE) * 100)}%`;
      }
      if (speedTextRef.current) {
        if (state.isStarActive) {
          speedTextRef.current.innerText = "🚀TURBO";
        } else {
          const displayedSpeed = Math.round(40 * SPEED_FACTOR * (state.crashCooldown > 0 ? 0.2 : 1));
          speedTextRef.current.innerText = `${displayedSpeed}km`;
        }
      }

      // 背景どうろのスクロール
      state.roadScrollOffset = (state.roadScrollOffset + currentCarSpeed) % 600;

      // 環境デコのスクロール
      state.environmentDecos.forEach((deco) => {
        deco.y += currentCarSpeed;
        if (deco.y > state.screenHeight) {
          deco.y = -50;
          deco.x = Math.random() < 0.5 ? Math.random() * 50 : 310 + Math.random() * 50;
        }
      });

      // --------------------------------------------------
      // プレイヤーの移動
      // --------------------------------------------------
      let moveSpeed = 4.5 * HANDLING_FACTOR;
      if (state.keys.Left || state.touchMode === "left") {
        state.playerX -= moveSpeed;
        // ちょっとまがる火花
        if (frameCount % 4 === 0) {
          state.particles.push({
            x: state.playerX + state.playerW / 2,
            y: state.playerY + state.playerH - 5,
            vx: (Math.random() - 0.5) * 2,
            vy: 2 + Math.random() * 2,
            color: "#64748b", // けむり
            size: 4 + Math.random() * 6,
            alpha: 0.6,
            life: 15,
          });
        }
      }
      if (state.keys.Right || state.touchMode === "right") {
        state.playerX += moveSpeed;
        if (frameCount % 4 === 0) {
          state.particles.push({
            x: state.playerX - state.playerW / 2,
            y: state.playerY + state.playerH - 5,
            vx: (Math.random() - 0.5) * 2,
            vy: 2 + Math.random() * 2,
            color: "#64748b",
            size: 4 + Math.random() * 6,
            alpha: 0.6,
            life: 15,
          });
        }
      }

      // どうろ（幅260px：50px〜310px）からはみでないようにガード
      const leftBound = 70;
      const rightBound = 290;
      if (state.playerX < leftBound) state.playerX = leftBound;
      if (state.playerX > rightBound) state.playerX = rightBound;

      // 走行中のけむり（うしろから）
      if (frameCount % 3 === 0 && currentCarSpeed > 1) {
        state.particles.push({
          x: state.playerX + (Math.random() - 0.5) * 16,
          y: state.playerY + state.playerH - 5,
          vx: (Math.random() - 0.5) * 1.5,
          vy: currentCarSpeed * 0.4 + Math.random() * 2,
          color: state.isStarActive ? "#fcd34d" : "#cbd5e1", // スター時はきらきら
          emoji: state.isStarActive ? "✨" : undefined,
          size: state.isStarActive ? 12 : 5 + Math.random() * 8,
          alpha: 0.8,
          life: state.isStarActive ? 20 : 18,
        });
      }

      // UFOのスペシャルトラック
      if (selectedCar === "🛸" && frameCount % 6 === 0) {
        state.particles.push({
          x: state.playerX + (Math.random() - 0.5) * 24,
          y: state.playerY + 20,
          vx: (Math.random() - 0.5) * 1,
          vy: 2,
          color: "#a855f7",
          emoji: "✨",
          size: 10,
          alpha: 0.7,
          life: 20,
        });
      }

      // 🦖 きょうりゅうのパッパエフェクト
      if (selectedCar === "🦖" && frameCount % 6 === 0) {
        state.particles.push({
          x: state.playerX + (Math.random() - 0.5) * 20,
          y: state.playerY + state.playerH,
          vx: (Math.random() - 0.5) * 3,
          vy: 3,
          emoji: "🌿",
          size: 14,
          alpha: 0.9,
          life: 25,
        });
      }

      // --------------------------------------------------
      // てきの車をだす＆うごかす
      // --------------------------------------------------
      // スポーンレート：すすむほど、てきが増える
      const spawnFrequency = Math.max(25, 65 - Math.floor(state.distanceWalked / 20));
      if (
        frameCount % spawnFrequency === 0 && 
        state.distanceWalked < SETTINGS.GOAL_TOTAL_DISTANCE - 150 // ゴール間近は安全に
      ) {
        const laneX = [95, 145, 195, 245, 290]; // 車線
        const pickedX = laneX[Math.floor(Math.random() * laneX.length)];
        const emoji = SETTINGS.ENEMY_CAR_EMOJIS[Math.floor(Math.random() * SETTINGS.ENEMY_CAR_EMOJIS.length)];
        
        state.enemies.push({
          x: pickedX,
          y: -80,
          speed: 2.5 + Math.random() * 3.5 + Math.floor(state.distanceWalked / 180), // 後半ほど速くなる
          emoji: emoji,
          w: 36,
          h: 60,
          color: "#" + Math.floor(Math.random()*16777215).toString(16),
          isLightOn: true,
        });
      }

      // てきのうごき＆衝突チェック
      for (let i = state.enemies.length - 1; i >= 0; i--) {
        const enemy = state.enemies[i];
        
        // プレイヤーよりゆっくり前へ進む（相対的にプレイヤーが追い抜かすので下に流れる）
        // スピード差が大きいほど早く流れ去る
        enemy.y += currentCarSpeed - enemy.speed;

        // サイレンをピカピカさせる (🚓、🚔、🚒)
        if (frameCount % 10 < 5) {
          enemy.isLightOn = !enemy.isLightOn;
        }

        // コイン吸い寄せ (🛸 UFO のじりょくボーナス：ごくうっすらコインを寄せる)
        if (selectedCar === "🛸") {
          // コインとの距離判定を後でおこなう
        }

        // がめんがいに消えたらリストからデリート
        if (enemy.y > state.screenHeight + 100 || enemy.y < -150) {
          state.enemies.splice(i, 1);
          continue;
        }

        // あたり判定 (プレイヤーとコライダ)
        const playerBox = {
          x: state.playerX - state.playerW / 2,
          y: state.playerY,
          w: state.playerW,
          h: state.playerH
        };
        const enemyBox = {
          x: enemy.x - enemy.w / 2,
          y: enemy.y,
          w: enemy.w,
          h: enemy.h
        };

        const isColliding = 
          playerBox.x < enemyBox.x + enemyBox.w - 5 &&
          playerBox.x + playerBox.w - 5 > enemyBox.x &&
          playerBox.y < enemyBox.y + enemyBox.h - 5 &&
          playerBox.y + playerBox.h - 5 > enemyBox.y;

        if (isColliding && state.crashCooldown === 0) {
          if (state.isStarActive) {
            // スター状態なら、てきを吹き飛ばす！💥爽快！
            sfx.playCrash();
            // 吹き飛ぶエフェクト
            for (let p = 0; p < 12; p++) {
              state.particles.push({
                x: enemy.x,
                y: enemy.y,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12 - 4,
                emoji: "💥",
                size: 20,
                alpha: 1,
                life: 30,
              });
            }
            state.enemies.splice(i, 1);
          } else {
            // クラッシュ！
            state.life--;
            setCurrentLife(state.life);
            state.crashCooldown = 50; // しばらくチカチカ無敵＆ノックバック
            
            // クラッシュのエフェクト
            sfx.playHit();
            for (let p = 0; p < 10; p++) {
              state.particles.push({
                x: state.playerX,
                y: state.playerY + 20,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 3,
                emoji: Math.random() < 0.5 ? "💥" : "🔥",
                size: 18,
                alpha: 1,
                life: 25,
              });
            }

            // ライフが0になったらゲームオーバー！
            if (state.life <= 0) {
              state.gameEnded = true;
              // ゲームオーバー画面へ遷移
              setTimeout(() => {
                onFinish(false, state.coinsCollected);
              }, 1200);
            }
          }
        }
      }

      // --------------------------------------------------
      // コインやアイテムをだす＆うごかす
      // --------------------------------------------------
      if (frameCount % 45 === 0 && state.distanceWalked < SETTINGS.GOAL_TOTAL_DISTANCE - 100) {
        const laneX = [100, 150, 200, 250, 280];
        const pickedX = laneX[Math.floor(Math.random() * laneX.length)];
        
        // ときどきスター(3%)、ガソリン(8%)、コイン(89%)
        const roll = Math.random();
        let type: "coin" | "star" | "gasoline" = "coin";
        let emoji = SETTINGS.COIN_EMOJI;

        if (roll < 0.04) {
          type = "star";
          emoji = SETTINGS.STAR_EMOJI;
        } else if (roll < 0.12) {
          type = "gasoline";
          emoji = SETTINGS.GASOLINE_EMOJI;
        }

        state.items.push({
          x: pickedX,
          y: -40,
          type: type,
          emoji: emoji,
          w: 24,
          h: 24,
          collected: false,
        });
      }

      // アイテムうごき＆ひろう判定
      for (let i = state.items.length - 1; i >= 0; i--) {
        const item = state.items[i];
        item.y += currentCarSpeed;

        // 🛸 UFOのじりょく（じわっとコインのみを寄せる）
        if (selectedCar === "🛸" && item.type === "coin") {
          const dx = state.playerX - item.x;
          const dy = state.playerY - item.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) { // 磁力はんい
            item.x += (dx / dist) * 4;
            item.y += (dy / dist) * 4;
          }
        }

        if (item.y > state.screenHeight + 50) {
          state.items.splice(i, 1);
          continue;
        }

        // ひろったあたりの判定
        const distToPlayer = Math.sqrt(
          Math.pow(state.playerX - item.x, 2) + Math.pow((state.playerY + 25) - item.y, 2)
        );

        if (distToPlayer < 35 && !item.collected) {
          item.collected = true;
          
          if (item.type === "coin") {
            state.coinsCollected += 1;
            setCoinsCollected(state.coinsCollected);
            sfx.playCoin();
            // コインひろったキラキラ
            for (let p = 0; p < 4; p++) {
              state.particles.push({
                x: item.x,
                y: item.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: "#eab308",
                size: 3 + Math.random() * 4,
                alpha: 1,
                life: 12,
              });
            }
          } else if (item.type === "star") {
            // 🌟 スーパー無敵モード！
            state.isStarActive = true;
            setIsStarActiveState(true);
            state.starTime = 240; // 約4秒間
            sfx.playTurbo();
            for (let p = 0; p < 15; p++) {
              state.particles.push({
                x: item.x,
                y: item.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                emoji: "✨",
                size: 16,
                alpha: 1,
                life: 20,
              });
            }
          } else if (item.type === "gasoline") {
            // ⛽ ガソリンスピードアップ！
            state.crashCooldown = 30; // すこしの無敵
            // 一瞬ターボをかけて 進む
            sfx.playTurbo();
            for (let p = 0; p < 10; p++) {
              state.particles.push({
                x: item.x,
                y: item.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                emoji: "🔥",
                size: 16,
                alpha: 1,
                life: 18,
              });
            }
            // 距離をワープするようにブブーン！
            state.distanceWalked = Math.min(SETTINGS.GOAL_TOTAL_DISTANCE, state.distanceWalked + 80);
          }

          state.items.splice(i, 1);
        }
      }

      // --------------------------------------------------
      // パーティクル(ひばな、けむり)のうごき
      // --------------------------------------------------
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = Math.max(0, p.life / 20);

        if (p.life <= 0) {
          state.particles.splice(i, 1);
        }
      }

      // --------------------------------------------------
      // 🏁 ゴールデンタイム・クリア判定 
      // --------------------------------------------------
      if (
        state.distanceWalked >= SETTINGS.GOAL_TOTAL_DISTANCE && 
        !state.gameEnded
      ) {
        state.gameEnded = true;
        // ゴール！
        setTimeout(() => {
          onFinish(true, state.coinsCollected);
        }, 1500);
      }

      // --------------------------------------------------
      // Canvasに描画をする
      // --------------------------------------------------
      ctx.clearRect(0, 0, state.screenWidth, state.screenHeight);

      // 1. 背景の芝生・土手などのベース
      ctx.fillStyle = "#22c55e"; // きれいな緑色の芝生
      ctx.fillRect(0, 0, state.screenWidth, state.screenHeight);

      // どうろの左右のベージュ色の歩道ライン
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(66, 0, 8, state.screenHeight);
      ctx.fillRect(286, 0, 8, state.screenHeight);

      // 2. 道路 (アスファルト) の描画
      ctx.fillStyle = "#475569"; // 綺麗なチャコールグレーのアスファルト
      ctx.fillRect(74, 0, 212, state.screenHeight);

      // 3. 道路の白線 (スクロール点線)
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.setLineDash([20, 25]);
      ctx.lineDashOffset = -state.roadScrollOffset;

      // 2車線用の点線
      ctx.beginPath();
      ctx.moveTo(144, 0);
      ctx.lineTo(144, state.screenHeight);
      ctx.moveTo(216, 0);
      ctx.lineTo(216, state.screenHeight);
      ctx.stroke();

      // 中央の太い分離・黄線
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath();
      // どう路はしっこ
      ctx.moveTo(76, 0); ctx.lineTo(76, state.screenHeight);
      ctx.moveTo(284, 0); ctx.lineTo(284, state.screenHeight);
      ctx.stroke();

      // 木や花、デコレーションの描画
      state.environmentDecos.forEach((deco) => {
        ctx.font = "24px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(deco.emoji, deco.x, deco.y);
      });

      // 4. アイテムの描画
      state.items.forEach((item) => {
        ctx.font = "24px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.emoji, item.x, item.y);
      });

      // 5. パーティクルの描画
      state.particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        if (p.emoji) {
          ctx.font = `${p.size}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.emoji, p.x, p.y);
        } else if (p.color) {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // 6. 敵の描画
      state.enemies.forEach((enemy) => {
        ctx.save();
        
        // くるま本体（絵文字をベースに綺麗に描く）
        ctx.font = "38px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(enemy.emoji, enemy.x, enemy.y + 30); // 30pxズレを調整して中央に

        // クルマの影つけ（下部）
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 8;

        // 特殊：パトカーや消防車のパトランプ赤青点滅！
        if (["🚓", "🚨", "🚒", "🚑", "🚔"].includes(enemy.emoji)) {
          ctx.font = "12px sans-serif";
          ctx.fillText(enemy.isLightOn ? "🔴" : "🔵", enemy.x - 6, enemy.y + 12);
          ctx.fillText(enemy.isLightOn ? "🔵" : "🔴", enemy.x + 6, enemy.y + 12);
        }

        ctx.restore();
      });

      // 7. 🏁 ゴール線のスクロール
      if (state.distanceWalked >= SETTINGS.GOAL_TOTAL_DISTANCE - 100) {
        // 残り距離から、ゴール線のY座標を逆算して描画
        const goalY = state.playerY - (SETTINGS.GOAL_TOTAL_DISTANCE - state.distanceWalked) * 5;
        
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(74, goalY, 212, 16);
        ctx.fillStyle = "#000000";
        // チェッカーフラッグ市松模様
        for (let col = 74; col < 286; col += 16) {
          for (let row = 0; row < 16; row += 8) {
            if ((Math.floor((col - 74) / 16) + Math.floor(row / 8)) % 2 === 0) {
              ctx.fillRect(col, goalY + row, 16, 8);
            }
          }
        }
        ctx.font = "24px sans-serif";
        ctx.fillText("🏁 GOAL! 🏁", 180, goalY - 20);
        ctx.restore();
      }

      // 8. プレイヤー（自分）の車 描画
      ctx.save();

      // クラッシュ時の赤点滅チカチカ・通常とスターのチカチカ
      let canDrawPlayer = true;
      if (state.crashCooldown > 0 && frameCount % 6 < 3) {
        canDrawPlayer = false; // ダメージ中点滅
      }
      if (state.isStarActive && state.isStarFlash) {
        // スター時の点滅
      }

      if (canDrawPlayer) {
        // スーパースター時のオーラ（円）
        if (state.isStarActive) {
          const grad = ctx.createRadialGradient(
            state.playerX, state.playerY + 30, 10,
            state.playerX, state.playerY + 30, 40
          );
          grad.addColorStop(0, "rgba(251, 191, 36, 0.8)");
          grad.addColorStop(1, "rgba(251, 191, 36, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(state.playerX, state.playerY + 30, 45, 0, Math.PI*2);
          ctx.fill();

          // ビッグオーラえもじ
          ctx.font = "20px sans-serif";
          ctx.fillText("✨", state.playerX - 25, state.playerY);
          ctx.fillText("✨", state.playerX + 25, state.playerY + 50);
        }

        // マイカー描画
        ctx.font = "40px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // 少し傾くアニメーション（曲がるとき）
        let tilt = 0;
        if (state.keys.Left || state.touchMode === "left") tilt = -0.12;
        if (state.keys.Right || state.touchMode === "right") tilt = 0.12;

        ctx.translate(state.playerX, state.playerY + 30);
        ctx.rotate(tilt);
        ctx.fillText(selectedCar, 0, 0);
      }

      ctx.restore();

      // キャンバスをループ
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [SPEED_FACTOR, HANDLING_FACTOR, MAX_LIFE, selectedCar, onFinish]);

  // タッチ操作（画面の左・右を押しっぱなし）
  const handleTouchStart = (side: "left" | "right") => {
    stateRef.current.touchMode = side;
  };

  const handleTouchEnd = () => {
    stateRef.current.touchMode = "";
  };

  // いまのライフ（ハート）数
  // (React状態のcurrentLifeを使用するため、Refからの読み込みはコメントアウト)

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex flex-col justify-between bg-slate-900 select-none touch-none overflow-hidden"
    >
      
      {/* ================= ヘッダー：ライフ表示・進捗メーター ================= */}
      <div className="absolute top-0 inset-x-0 bg-slate-950/80 p-2 text-white flex justify-between items-center border-b border-white/10 z-10">
        
        {/* 🧡 ライフメーター */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 py-1.5 px-3 rounded-full border border-rose-500/30">
          <span className="text-[10px] text-slate-300 font-bold mr-1">ライフ:</span>
          {Array.from({ length: MAX_LIFE }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8 }}
              animate={{ scale: i < currentLife ? 1 : 0.4 }}
              transition={{ duration: 0.2 }}
            >
              <Heart 
                className={`w-4.5 h-4.5 ${
                  i < currentLife 
                    ? "text-rose-500 fill-rose-500 filter drop-shadow-[0_0_2px_rgba(244,63,94,0.6)]" 
                    : "text-slate-600 fill-slate-800"
                }`} 
              />
            </motion.div>
          ))}
        </div>

        {/* 💰 みちでひろったコイン */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 py-1.5 px-3 rounded-full border border-yellow-500/30 font-black">
          <span className="text-yellow-400">🪙</span>
          <span className="text-sm font-mono text-yellow-300">
            {coinsCollected}
          </span>
        </div>

      </div>

      {/* ================= メインの2D描画Canvas ================= */}
      <div className="flex-1 min-h-0 w-full bg-slate-800 relative flex items-center justify-center">
        
        <canvas
          ref={canvasRef}
          width={360}
          height={600}
          className="w-full h-full object-contain max-w-[480px] bg-green-700 shadow-inner"
        />

        {/* スーパー無敵スターのチカチカメーター */}
        {isStarActiveState && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-950 px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-1 animate-pulse border border-white shadow-lg">
            <Zap className="w-4 h-4 fill-slate-950" /> 🌟ちょうむてき＆ハイスピード！🌟
          </div>
        )}

        {/* コインゲットアニメーション（真ん中に大きく出す） */}
        {stateRef.current.gameEnded && stateRef.current.life > 0 && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/60 z-30">
            <motion.div 
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <span className="text-6xl animate-bounce">🏁</span>
              <h2 className="text-3xl font-extrabold text-yellow-300 mt-2 filter drop-shadow">
                おめでとう！ゴール！
              </h2>
              <p className="text-slate-300 text-xs mt-1">
                コインを ざくざくゲットしたよ！
              </p>
            </motion.div>
          </div>
        )}

        {/* 衝突中ノックバック・ダメージフラッシュ */}
        {stateRef.current.crashCooldown > 0 && (
          <div className="absolute inset-0 bg-red-600/10 pointer-events-none z-20 animate-pulse border-4 border-red-500/30" />
        )}
      </div>

      {/* ================= 画面うえの 進捗メーター (ゴールまであとどれくらい？) ================= */}
      <div className="bg-slate-950/90 py-2.5 px-4 flex items-center gap-3 border-t border-white/10 relative z-10">
        <span className="text-xs text-slate-400 font-bold whitespace-nowrap">スタート</span>
        <div className="flex-1 h-3.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 p-0.5 flex items-center">
          <motion.div 
            ref={progressBarRef}
            className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-full"
            style={{ 
              width: `0%` 
            }}
          />
        </div>
        <span className="text-xs text-yellow-400 font-bold flex items-center gap-0.5 whitespace-nowrap">
          🏁 ゴール!
        </span>
      </div>

      {/* ================= スマホ用の 巨大タッチ領域 (ボタン) ================= */}
      <div className="h-[155px] bg-slate-950 flex border-t border-white/20 select-none touch-none relative">
        
        {/* 左タッチエリア */}
        <div
          onPointerDown={(e) => { e.preventDefault(); handleTouchStart("left"); }}
          onPointerUp={(e) => { e.preventDefault(); handleTouchEnd(); }}
          onPointerLeave={(e) => { e.preventDefault(); handleTouchEnd(); }}
          onPointerCancel={(e) => { e.preventDefault(); handleTouchEnd(); }}
          className="flex-1 bg-slate-900 border-r border-slate-800 active:bg-slate-800 flex flex-col justify-center items-center transition-colors cursor-pointer"
        >
          <div className="text-4xl text-slate-400 font-bold animate-pulse">👈</div>
          <span className="text-[13px] text-slate-400 font-black mt-1">ひだりにうごく</span>
        </div>

        {/* 中央のミニメーター（おまけ） */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-slate-950 border-2 border-slate-800 flex flex-col justify-center items-center pointer-events-none">
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">speed</p>
          <p 
            ref={speedTextRef}
            className="text-xs font-mono font-black text-rose-500 animate-pulse"
          >
            {`${Math.round(40 * SPEED_FACTOR)}km`}
          </p>
        </div>

        {/* 右タッチエリア */}
        <div
          onPointerDown={(e) => { e.preventDefault(); handleTouchStart("right"); }}
          onPointerUp={(e) => { e.preventDefault(); handleTouchEnd(); }}
          onPointerLeave={(e) => { e.preventDefault(); handleTouchEnd(); }}
          onPointerCancel={(e) => { e.preventDefault(); handleTouchEnd(); }}
          className="flex-1 bg-slate-900 active:bg-slate-800 flex flex-col justify-center items-center transition-colors cursor-pointer"
        >
          <div className="text-4xl text-slate-400 font-bold animate-pulse">👉</div>
          <span className="text-[13px] text-slate-400 font-black mt-1">みぎにうごく</span>
        </div>

      </div>

    </div>
  );
}
