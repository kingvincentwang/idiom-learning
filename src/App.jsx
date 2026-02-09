import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  onAuthStateChanged,
  updateProfile,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  BookOpen, Trophy, User, LogOut, CheckCircle, Brain, 
  BarChart3, Mail, Lock, Loader2, AlertCircle, Plus, Trash2, Settings, ShieldAlert, FileJson,
  Library, Edit3, TrendingUp, Home, LayoutDashboard, XCircle, ExternalLink, Book, List, ChevronRight
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyB4iiFv3knAGF-JuvR554-6YaBWrTkGI8Y",
  authDomain: "idiom-learning.firebaseapp.com",
  projectId: "idiom-learning",
  storageBucket: "idiom-learning.firebasestorage.app",
  messagingSenderId: "267603143127",
  appId: "1:267603143127:web:afa6c02a92940793fc4392",
  measurementId: "G-ETWXCMNVCH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- 🔒 管理員設定 ---
const ADMIN_EMAILS = [
  "teacher@example.com", 
  "admin@idiom-master.com",
  "hs3591@gses.hcc.edu.tw" 
];

// --- Initialization Data ---
const INITIAL_IDIOMS = [
  { word: '半途而廢', pinyin: 'bàn tú ér fèi', meaning: '事情沒有做完就停止。比喻做事有始無終。', example: '學習任何技能都不能半途而廢，否則永遠無法精通。', options: ['堅持到底', '半途而廢', '持之以恆', '廢寢忘食'] },
  { word: '一石二鳥', pinyin: 'yī shí èr niǎo', meaning: '比喻做一件事獲得兩種效果。', example: '這次出差既處理了公務，又順道拜訪了老友，真是一石二鳥。', options: ['一石二鳥', '畫蛇添足', '緣木求魚', '顧此失彼'] },
  { word: '畫蛇添足', pinyin: 'huà shé tiān zú', meaning: '比喻多此一舉，不但無益，反而有害。', example: '這篇文章的結尾已經很完美了，你再加這一段簡直是畫蛇添足。', options: ['錦上添花', '雪中送炭', '畫蛇添足', '畫龍點睛'] },
  { word: '因材施教', pinyin: 'yīn cái shī jiào', meaning: '依據受教者不同的資質，給予不同的教導。', example: '老師懂得因材施教，讓每個學生都能發揮特長。', options: ['有教無類', '因材施教', '揠苗助長', '循循善誘'] },
  { word: '緣木求魚', pinyin: 'yuán mù qiú yú', meaning: '爬到樹上去找魚。比喻用錯誤的方法，不可能達到目的。', example: '想不努力就獲得成功，無異於緣木求魚。', options: ['緣木求魚', '按圖索驥', '刻舟求劍', '水中撈月'] },
  { word: '錦上添花', pinyin: 'jǐn shàng tiān huā', meaning: '在美麗的錦緞上再繡上花朵。比喻美上加美，喜上加喜。', example: '他的到來為這場晚會錦上添花，氣氛更加熱烈。', options: ['雪中送炭', '落井下石', '錦上添花', '推波助瀾'] },
  { word: '臥薪嘗膽', pinyin: 'wò xīn cháng dǎn', meaning: '比喻刻苦自勵，發憤圖強。', example: '這家公司經過十年的臥薪嘗膽，終於成為行業龍頭。', options: ['臥薪嘗膽', '忍氣吞聲', '苟且偷生', '韜光養晦'] },
  { word: '破釜沉舟', pinyin: 'pò fǔ chén zhōu', meaning: '比喻下定決心，不顧一切地幹到底。', example: '面對強大的對手，我們必須有破釜沉舟的決心才能獲勝。', options: ['背水一戰', '破釜沉舟', '臨陣脫逃', '優柔寡斷'] },
];

const INITIAL_READING_DATA = [
  {
    title: "勤學的阿明",
    content: "阿明是個聰明的學生，但他有個缺點，就是做事常常【半途而廢】... (略)",
    questions: [
      { question: "阿明一開始最大的缺點是什麼？", options: ["不夠聰明", "半途而廢", "喜歡睡覺", "不愛說話"], answer: "半途而廢" },
      { question: "「畫蛇添足」在故事中是指阿明做了什麼事？", options: ["給蛇畫腳", "給老虎畫翅膀", "給貓畫鬍鬚", "給鳥畫牙齒"], answer: "給老虎畫翅膀" },
      { question: "阿明後來模仿什麼精神來刻苦練習？", options: ["守株待兔", "臥薪嘗膽", "緣木求魚", "掩耳盜鈴"], answer: "臥薪嘗膽" },
      { question: "故事最後說「一石二鳥」是指什麼？", options: ["抓到兩隻鳥", "考一百分且當模範生", "畫畫得獎", "老師稱讚他"], answer: "考一百分且當模範生" },
      { question: "這則故事主要想告訴我們什麼道理？", options: ["畫畫不能畫翅膀", "做人要誠實", "做事要堅持且恰到好處", "運氣很重要"], answer: "做事要堅持且恰到好處" }
    ]
  },
  {
    title: "將軍的決策",
    content: "古代有一位將軍帶兵出征... (略)",
    questions: [
      { question: "將軍為什麼要鑿沉船隻、打破鍋子？", options: ["發瘋了", "表示破釜沉舟的決心", "物資太多帶不走", "敵人要求的"], answer: "表示破釜沉舟的決心" },
      { question: "「破釜沉舟」是用來比喻什麼？", options: ["做事衝動", "下定決心，不顧一切", "破壞環境", "放棄希望"], answer: "下定決心，不顧一切" },
      { question: "這場戰爭最後的結果如何？", options: ["將軍輸了", "雙方平手", "將軍獲勝", "沒有打起來"], answer: "將軍獲勝" },
      { question: "故事最後提到的「錦上添花」是指什麼？", options: ["將軍穿了花衣服", "將軍去種花", "將軍謙虛求教讓聲望更高", "將軍收到了花"], answer: "將軍謙虛求教讓聲望更高" },
      { question: "這個故事主要在強調什麼的重要性？", options: ["武器精良", "人數眾多", "決心與士氣", "地形優勢"], answer: "決心與士氣" }
    ]
  }
];

// --- Components ---

const LeaderboardItem = ({ rank, name, score, unit = '分', highlight = false }) => (
  <div className={`flex items-center p-3 rounded-lg mb-2 shadow-sm transition-all ${highlight ? 'bg-orange-50 border border-orange-200 transform scale-[1.02]' : 'bg-white border border-gray-100 hover:bg-gray-50'}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 text-white shadow-sm
      ${rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' : rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400' : rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-500' : 'bg-gray-200 text-gray-500'}
    `}>
      {rank}
    </div>
    <div className="flex-1">
      <p className="font-bold text-gray-700 text-sm">{name || '無名氏'}</p>
    </div>
    <div className="font-mono font-bold text-red-700">
      {score} <span className="text-xs text-gray-500 font-normal">{unit}</span>
    </div>
  </div>
);

const Dashboard = ({ user, userStats, idioms, navigateTo }) => {
  const totalIdioms = idioms.length || 1;
  const learnedCount = userStats.learnedCount || 0;
  const learnedPct = Math.min(100, Math.round((learnedCount / totalIdioms) * 100));
  const totalScore = userStats.totalScore || 0;
  const scoreGoal = 2000;
  const scorePct = Math.min(100, Math.round((totalScore / scoreGoal) * 100));
  const readingScore = userStats.readingScore || 0;
  const readingGoal = 3000;
  const readingPct = Math.min(100, Math.round((readingScore / readingGoal) * 100));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-200">
        <LayoutDashboard className="text-red-800 w-8 h-8" />
        <h2 className="text-2xl font-bold text-gray-800">個人學習儀表板</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Progress Cards */}
        {[
          { title: "成語學習進度", pct: learnedPct, color: "bg-blue-600", text: "text-blue-600" },
          { title: "文意測驗進度", pct: scorePct, color: "bg-red-600", text: "text-red-600", sub: `(目標: ${scoreGoal}分)` },
          { title: "閱讀測驗進度", pct: readingPct, color: "bg-green-600", text: "text-green-600", sub: `(目標: ${readingGoal}分)` }
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center">
            <h3 className="text-gray-700 font-bold mb-1 text-lg">{item.title}</h3>
            {item.sub && <span className="text-xs text-gray-400 mb-4">{item.sub}</span>}
            <div className="relative w-32 h-32 flex items-center justify-center mb-2">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" 
                  strokeDasharray={351.86} strokeDashoffset={351.86 - (351.86 * item.pct) / 100} 
                  className={`${item.text} transition-all duration-1000 ease-out`} strokeLinecap="round" 
                />
              </svg>
              <span className={`absolute text-3xl font-bold ${item.text}`}>{item.pct}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 hover:shadow-lg transition">
          <h4 className="text-blue-800 font-bold mb-3 text-lg flex items-center gap-2"><BookOpen size={20}/> 學習進度</h4>
          <p className="text-gray-600 text-sm mb-6 min-h-[40px]">
            {learnedCount === 0 ? "尚未開始學習，千里之行始於足下！" : `已學習 ${learnedCount} 個成語，總題庫 ${totalIdioms} 個。`}
          </p>
          <button onClick={() => navigateTo('learn')} className="w-full py-2 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition">前往學習區</button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500 hover:shadow-lg transition">
          <h4 className="text-red-800 font-bold mb-3 text-lg flex items-center gap-2"><Edit3 size={20}/> 文意測驗</h4>
          <p className="text-gray-600 text-sm mb-6 min-h-[40px]">
             {totalScore === 0 ? "尚未參加測驗，快來挑戰自己！" : `目前累積積分：${totalScore} 分。繼續加油！`}
          </p>
          <button onClick={() => navigateTo('quiz')} className="w-full py-2 rounded-lg bg-red-50 text-red-700 font-bold hover:bg-red-100 transition">前往測驗區</button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500 hover:shadow-lg transition">
          <h4 className="text-green-800 font-bold mb-3 text-lg flex items-center gap-2"><Book size={20}/> 閱讀測驗</h4>
          <p className="text-gray-600 text-sm mb-6 min-h-[40px]">
            {readingScore === 0 ? "尚未完成閱讀測驗，透過故事學成語！" : `閱讀測驗積分：${readingScore} 分。`}
          </p>
          <button onClick={() => navigateTo('reading')} className="w-full py-2 rounded-lg bg-green-50 text-green-700 font-bold hover:bg-green-100 transition">前往閱讀區</button>
        </div>
      </div>
    </div>
  );
};

const HomePage = ({ navigateTo, user }) => {
  const [scoreLeaders, setScoreLeaders] = useState([]);
  const [readingLeaders, setReadingLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'user_stats'));
        const users = [];
        querySnapshot.forEach((doc) => users.push(doc.data()));
        setScoreLeaders([...users].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0)).slice(0, 3));
        setReadingLeaders([...users].sort((a, b) => (b.readingScore || 0) - (a.readingScore || 0)).slice(0, 3));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div className="w-full animate-fade-in">
      <div className="bg-gradient-to-br from-red-900 to-red-800 text-white py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-wide drop-shadow-md">探索中華文化寶藏</h1>
          <p className="text-xl text-red-100 mb-10 tracking-wider">成語學習一手掌握 · 增進語文核心素養</p>
          <div className="flex justify-center gap-6">
            <button onClick={() => navigateTo(user ? 'dashboard' : 'login')} className="bg-white text-red-900 font-bold py-3 px-10 rounded-full shadow-lg transition transform hover:scale-105 hover:bg-gray-100">
              {user ? '進入儀表板' : '開始學習'}
            </button>
            {!user && <button onClick={() => navigateTo('login')} className="bg-transparent border-2 border-white text-white font-bold py-3 px-10 rounded-full transition hover:bg-white/10">立即註冊</button>}
          </div>
        </div>
      </div>

      <div className="bg-[#F9FAFB] py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 inline-block border-b-4 border-red-800 pb-2">榮譽榜單</h2>
            <p className="text-gray-500 mt-4">看看誰是今天的成語狀元！</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
              <h3 className="text-center font-bold text-red-800 mb-6 text-xl bg-red-50 py-2 rounded-lg">文意測驗排行</h3>
              {loading ? <div className="text-center py-10 text-gray-400">載入中...</div> : 
               <div className="min-h-[200px]">{scoreLeaders.map((u, i) => <LeaderboardItem key={i} rank={i+1} name={u.displayName} score={u.totalScore || 0} unit="分" highlight={user && u.uid === user.uid} />)}{scoreLeaders.length === 0 && <p className="text-center text-gray-400 mt-10">尚無資料</p>}</div>}
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
              <h3 className="text-center font-bold text-blue-800 mb-6 text-xl bg-blue-50 py-2 rounded-lg">閱讀測驗排行</h3>
              {loading ? <div className="text-center py-10 text-gray-400">載入中...</div> : 
               <div className="min-h-[200px]">{readingLeaders.map((u, i) => <LeaderboardItem key={i} rank={i+1} name={u.displayName} score={u.readingScore || 0} unit="分" highlight={user && u.uid === user.uid} />)}{readingLeaders.length === 0 && <p className="text-center text-gray-400 mt-10">尚無資料</p>}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthPage = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: username });
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_stats', cred.user.uid), { uid: cred.user.uid, displayName: username, totalScore: 0, readingScore: 0, learnedCount: 0, lastActive: serverTimestamp() }, { merge: true });
      } else { await signInWithEmailAndPassword(auth, email, password); }
      onLoginSuccess();
    } catch (err) { setError(err.code === 'auth/wrong-password' ? '密碼錯誤' : err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-200">
        <div className="text-center"><div className="mx-auto h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-4"><Lock className="h-8 w-8 text-red-800" /></div><h2 className="text-3xl font-extrabold text-gray-900">{isRegister ? '註冊新帳號' : '歡迎回來'}</h2><p className="mt-2 text-sm text-gray-600">開啟您的成語學習之旅</p></div>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm flex items-center gap-2"><AlertCircle size={16}/>{error}</div>}
        <form className="mt-8 space-y-5" onSubmit={handleAuth}>
          {isRegister && <div><label className="block text-sm font-medium text-gray-700">暱稱</label><input type="text" required className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" value={username} onChange={e => setUsername(e.target.value)} /></div>}
          <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" required className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-gray-700">密碼</label><input type="password" required className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" value={password} onChange={e => setPassword(e.target.value)} /></div>
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-800 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md transition">{loading ? '處理中...' : (isRegister ? '註冊' : '登入')}</button>
        </form>
        <div className="text-center"><button onClick={() => setIsRegister(!isRegister)} className="font-medium text-red-800 hover:text-red-700 text-sm">{isRegister ? '已有帳號？登入' : '還沒有帳號？註冊'}</button></div>
      </div>
    </div>
  );
};

const LearningMode = ({ user, idioms, refreshStats }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [learnedIds, setLearnedIds] = useState(new Set());
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (!user || idioms.length === 0) return;
    if (isReady) return;

    const init = async () => {
      const q = collection(db, 'artifacts', appId, 'users', user.uid, 'learned_idioms');
      const snap = await getDocs(q);
      const ids = new Set();
      snap.forEach(d => ids.add(d.data().idiomId));
      setLearnedIds(ids);

      const idx = idioms.findIndex(i => !ids.has(i.id));
      if (idx !== -1) setCurrentIndex(idx);
      
      setIsReady(true);
    };
    init();
  }, [user, idioms, isReady]);

  if (!isReady || !idioms || idioms.length === 0) return <div className="p-10 text-center"><Loader2 className="animate-spin inline mr-2"/>題庫載入中...</div>;
  const current = idioms[currentIndex];
  if (!current) return null;
  const isLearned = learnedIds.has(current.id);

  const markLearned = async () => {
    if (!user || isLearned) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'learned_idioms', current.id), { idiomId: current.id, idiomWord: current.word, learnedAt: serverTimestamp() });
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_stats', user.uid), { learnedCount: increment(1), displayName: user.displayName }, { merge: true });
    setLearnedIds(prev => new Set(prev).add(current.id));
    refreshStats();
  };

  return (
    <div className="max-w-3xl mx-auto my-10 px-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-red-800 to-red-700 text-white p-6 flex justify-between items-center"><h2 className="text-2xl font-bold flex items-center gap-2"><BookOpen/> 成語學習卡</h2><span className="bg-white/20 px-4 py-1 rounded-full text-sm font-bold backdrop-blur-sm">進度: {learnedIds.size} / {idioms.length}</span></div>
        <div className="p-10 text-center bg-gray-50/50">
          {isLearned && <div className="inline-flex items-center gap-1 text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm font-bold mb-4 shadow-sm"><CheckCircle size={16}/> 已收藏</div>}
          <h1 className="text-6xl font-extrabold text-gray-800 mb-2 tracking-widest">{current.word}</h1>
          <p className="text-2xl text-gray-500 font-serif mb-8">{current.pinyin}</p>
          <div className="text-left space-y-6 max-w-xl mx-auto">
            <div className="bg-white p-5 rounded-lg border-l-4 border-amber-400 shadow-sm"><span className="font-bold text-amber-600 block mb-2 uppercase text-xs tracking-wider">釋義 Definition</span><p className="text-gray-700 text-lg leading-relaxed">{current.meaning}</p></div>
            <div className="bg-white p-5 rounded-lg border-l-4 border-blue-400 shadow-sm"><span className="font-bold text-blue-600 block mb-2 uppercase text-xs tracking-wider">例句 Example</span><p className="text-gray-700 text-lg leading-relaxed">{current.example || "暫無例句"}</p></div>
          </div>
        </div>
        <div className="bg-white p-6 border-t border-gray-100 flex justify-between items-center">
          <button onClick={() => setCurrentIndex((currentIndex - 1 + idioms.length) % idioms.length)} className="flex items-center gap-2 text-gray-500 hover:text-red-800 font-bold px-4 py-2 hover:bg-red-50 rounded-lg transition"><div className="transform rotate-180"><ChevronRight size={20}/></div> 上一則</button>
          <button onClick={markLearned} disabled={isLearned} className={`px-8 py-3 rounded-full shadow-md font-bold text-white transition transform active:scale-95 ${isLearned ? 'bg-gray-400 cursor-default' : 'bg-red-700 hover:bg-red-800'}`}>{isLearned ? '已完成學習' : '標記為已學'}</button>
          <button onClick={() => setCurrentIndex((currentIndex + 1) % idioms.length)} className="flex items-center gap-2 text-gray-500 hover:text-red-800 font-bold px-4 py-2 hover:bg-red-50 rounded-lg transition">下一則 <ChevronRight size={20}/></button>
        </div>
      </div>
    </div>
  );
};

const ReadingMode = ({ user, readingMaterials, refreshStats }) => {
  const [selectedStory, setSelectedStory] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [completedStories, setCompletedStories] = useState(new Set()); 

  // Auto-fetch history
  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        const q = collection(db, 'artifacts', appId, 'users', user.uid, 'reading_results');
        const snap = await getDocs(q);
        const done = new Set();
        snap.forEach(d => done.add(d.data().story));
        setCompletedStories(done);
      } catch (e) { console.error(e); }
    };
    fetchHistory();
  }, [user, finished]);

  if (!readingMaterials || readingMaterials.length === 0) return <div className="p-10 text-center"><Loader2 className="animate-spin inline mr-2"/>閱讀教材載入中... (請至後台匯入)</div>;

  if (!selectedStory) {
    return (
      <div className="max-w-5xl mx-auto my-10 px-4 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 border-l-8 border-red-800 pl-4">成語閱讀測驗列表</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {readingMaterials.map((item, idx) => {
            const isDone = completedStories.has(item.title);
            return (
              <div key={idx} className={`bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition group cursor-pointer ${isDone ? 'bg-green-50/30 ring-1 ring-green-200' : ''}`} onClick={() => { setSelectedStory(item); setCurrentQIndex(0); setScore(0); setFinished(false); setSelectedOption(null); setIsCorrect(null); }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-gray-800 group-hover:text-red-800 transition">{item.title}</h3>
                    {isDone && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm"><CheckCircle size={12}/> 已測驗</span>}
                  </div>
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">5 題</span>
                </div>
                <p className="text-gray-500 text-base mb-6 line-clamp-3 leading-relaxed">{item.content}</p>
                <button className={`w-full py-3 rounded-xl font-bold transition ${isDone ? 'bg-green-600 text-white hover:bg-green-700 shadow-md' : 'bg-gray-50 text-gray-600 group-hover:bg-red-800 group-hover:text-white'}`}>
                  {isDone ? '再次挑戰' : '立即閱讀並挑戰'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="max-w-lg mx-auto my-10 bg-white p-8 rounded-xl shadow-lg text-center border-t-8 border-red-800 animate-fade-in">
        <Trophy className="w-24 h-24 mx-auto text-yellow-500 mb-6 drop-shadow-md" /><h2 className="text-3xl font-bold text-gray-800">測驗完成！</h2>
        <p className="text-gray-500 mt-2 text-lg">故事：{selectedStory.title}</p><div className="bg-red-50 my-8 py-4 rounded-xl"><p className="text-6xl font-extrabold text-red-700">{score} <span className="text-xl font-medium text-gray-500">分</span></p></div>
        <button onClick={() => setSelectedStory(null)} className="bg-gray-800 text-white px-8 py-3 rounded-full hover:bg-gray-900 shadow-lg transition">返回列表</button>
      </div>
    );
  }

  const currentQ = selectedStory.questions[currentQIndex];
  const handleAnswer = (opt) => {
    if (selectedOption) return;
    setSelectedOption(opt);
    const correct = opt === currentQ.answer;
    setIsCorrect(correct);
    let currentScore = score;
    if (correct) { currentScore += 20; setScore(currentScore); }
    setTimeout(async () => {
      setSelectedOption(null); setIsCorrect(null);
      if (currentQIndex < selectedStory.questions.length - 1) { setCurrentQIndex(prev => prev + 1); } 
      else {
        setFinished(true);
        if (user) {
           await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'reading_results', `${selectedStory.title}_${Date.now()}`), { story: selectedStory.title, score: currentScore, ts: serverTimestamp() });
           await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_stats', user.uid), { readingScore: increment(currentScore), displayName: user.displayName }, { merge: true });
           refreshStats();
        }
      }
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto my-8 px-4 flex flex-col lg:flex-row gap-8 animate-fade-in h-[calc(100vh-120px)]">
      <div className="flex-1 bg-white p-10 rounded-2xl shadow-md border border-gray-200 overflow-y-auto custom-scrollbar">
        <button onClick={() => setSelectedStory(null)} className="mb-4 text-sm text-gray-500 hover:text-red-800 flex items-center gap-1"><ChevronRight className="transform rotate-180" size={14}/> 返回列表</button>
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3 border-b pb-4"><Book className="text-red-800" size={32}/> {selectedStory.title}</h2>
        <div className="text-gray-700 leading-loose whitespace-pre-wrap text-lg font-serif">{selectedStory.content}</div>
      </div>
      <div className="w-full lg:w-[400px] flex-shrink-0">
        <div className="bg-white p-8 rounded-2xl shadow-xl border-t-8 border-red-800 sticky top-4">
          <div className="flex justify-between mb-6 text-gray-500 font-bold border-b pb-2"><span>Q{currentQIndex + 1} / {selectedStory.questions.length}</span><span className="text-red-600">得分: {score}</span></div>
          {selectedOption && <div className={`mb-6 p-4 rounded-xl text-center font-bold text-lg animate-bounce-in shadow-inner ${isCorrect ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>{isCorrect ? <span className="flex items-center justify-center gap-2"><CheckCircle/> 答對了！</span> : <div className="flex flex-col items-center"><span className="flex items-center gap-2 mb-1"><XCircle/> 答錯了</span><span className="text-sm font-normal text-gray-600">答案：{currentQ.answer}</span></div>}</div>}
          <div className="font-bold text-gray-800 mb-8 text-xl">{currentQ.question}</div>
          <div className="space-y-4">{currentQ.options.map((opt, i) => {
               let btnClass = "w-full p-4 rounded-xl text-left border-2 transition-all duration-200 font-medium";
               if (selectedOption) {
                 if (opt === currentQ.answer) btnClass = "bg-green-50 border-green-500 text-green-800 shadow-md ring-1 ring-green-500";
                 else if (opt === selectedOption) btnClass = "bg-red-50 border-red-500 text-red-800 opacity-60";
                 else btnClass = "border-gray-100 text-gray-300 opacity-30";
               } else {
                 btnClass += " border-gray-100 hover:border-red-300 hover:bg-red-50 text-gray-700 hover:shadow-sm";
               }
               return <button key={i} onClick={() => handleAnswer(opt)} disabled={!!selectedOption} className={btnClass}>{opt}</button>
            })}</div>
        </div>
      </div>
    </div>
  );
};

const QuizMode = ({ user, idioms, refreshStats }) => {
  const [playing, setPlaying] = useState(false);
  const [q, setQ] = useState(null);
  const [score, setScore] = useState(0);
  const [count, setCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  if (!idioms || idioms.length < 4) return <div className="p-10 text-center text-gray-500">題庫不足，請管理員新增題目。</div>;

  const start = () => { setPlaying(true); setScore(0); setCount(1); setFinished(false); setSelectedOption(null); setIsCorrect(null); generateQ(); };
  const generateQ = () => { setQ(idioms[Math.floor(Math.random() * idioms.length)]); };

  const handleAnswer = (opt) => {
    if (selectedOption) return;
    setSelectedOption(opt);
    const correct = opt === q.word;
    setIsCorrect(correct);
    let currentScore = score;
    if (correct) { currentScore += 10; setScore(currentScore); }
    setTimeout(async () => {
        setSelectedOption(null); setIsCorrect(null);
        if (count < 5) { setCount(c => c + 1); generateQ(); } else { end(currentScore); }
    }, 2000);
  };

  const end = async (finalScore) => {
    setPlaying(false); setFinished(true);
    if (user) {
      await setDoc(doc(collection(db, 'artifacts', appId, 'users', user.uid, 'quiz_results')), { score: finalScore, ts: serverTimestamp() });
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_stats', user.uid), { totalScore: increment(finalScore), displayName: user.displayName }, { merge: true });
      refreshStats();
    }
  };

  if (finished) return <div className="max-w-md mx-auto my-10 bg-white p-8 rounded-xl shadow-lg text-center border-t-8 border-red-800 animate-fade-in"><Trophy className="w-20 h-20 mx-auto text-yellow-500 mb-4" /><h2 className="text-2xl font-bold text-gray-800">測驗結束</h2><p className="text-5xl font-bold text-red-700 my-6">{score} 分</p><button onClick={start} className="bg-red-800 text-white px-6 py-2 rounded hover:bg-red-900">再玩一次</button></div>;

  if (playing && q) return (
    <div className="max-w-3xl mx-auto my-16 px-4 animate-fade-in">
      <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-200 relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-800 to-red-600 rounded-t-2xl"></div>
        <div className="flex justify-between mb-8 text-gray-500 font-bold text-lg"><span>第 {count} / 5 題</span><span>得分: {score}</span></div>
        
        {selectedOption && <div className={`mb-8 p-4 rounded-xl text-center font-bold text-lg animate-bounce-in shadow-sm border ${isCorrect ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{isCorrect ? "🎉 答對了！" : <span>❌ 答錯了，答案是 <span className="underline">{q.word}</span></span>}</div>}
        
        <div className="bg-gray-50 p-8 rounded-xl mb-10 text-2xl text-gray-800 font-medium text-center shadow-inner border border-gray-100">"{q.meaning}"</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {q.options.map((opt, i) => {
              let btnClass = "bg-white border-2 border-gray-100 text-gray-600 font-medium p-6 rounded-xl hover:border-red-300 hover:bg-red-50 hover:text-red-900 hover:shadow-md transition-all duration-200 text-lg";
              if (selectedOption) {
                  if (opt === q.word) btnClass = "bg-green-100 border-green-500 text-green-800 font-bold ring-2 ring-green-200";
                  else if (opt === selectedOption && !isCorrect) btnClass = "bg-red-100 border-red-500 text-red-800 opacity-60";
                  else btnClass = "bg-gray-50 border-gray-100 text-gray-300 opacity-30";
              }
              return <button key={i} onClick={() => handleAnswer(opt)} disabled={!!selectedOption} className={btnClass}>{opt}</button>
          })}
        </div>
      </div>
    </div>
  );

  return <div className="max-w-2xl mx-auto my-16 text-center animate-fade-in"><div className="bg-white p-12 rounded-3xl shadow-xl border border-gray-200"><Brain className="w-24 h-24 mx-auto text-red-800 mb-6" /><h2 className="text-4xl font-bold text-gray-800 mb-6">成語大挑戰</h2><p className="text-xl text-gray-500 mb-10">準備好測試你的成語實力了嗎？<br/>每局 5 題，挑戰最高分！</p><button onClick={start} className="bg-gradient-to-r from-red-800 to-red-700 text-white font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transform transition hover:-translate-y-1 text-lg">開始測驗</button></div></div>;
};

// 8. Admin Panel (Fixed layout scrolling issue)
const AdminPanel = ({ idioms, readingMaterials, refreshIdioms, refreshReading }) => {
  const [importType, setImportType] = useState('idiom'); 
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);

  const initIdioms = async () => { if(!confirm('匯入?')) return; setLoading(true); for (const i of INITIAL_IDIOMS) await addDoc(collection(db,'artifacts',appId,'public','data','idioms'), {...i, createdAt: serverTimestamp()}); setLoading(false); refreshIdioms(); };
  const initReading = async () => { if(!confirm('匯入?')) return; setLoading(true); for (const i of INITIAL_READING_DATA) await addDoc(collection(db,'artifacts',appId,'public','data','reading_materials'), {...i, createdAt: serverTimestamp()}); setLoading(false); refreshReading(); };
  const importJson = async () => { try { const data = JSON.parse(jsonInput); if (!Array.isArray(data)) throw new Error("Format error"); setLoading(true); let count = 0; if (importType === 'idiom') { for (const item of data) { if (!item.word) continue; let opts = item.options; if (!opts && item.distractors) opts = [item.word, ...item.distractors].sort(()=>Math.random()-0.5); if (!opts || opts.length<4) continue; await addDoc(collection(db,'artifacts',appId,'public','data','idioms'), {...item, options: opts, createdAt: serverTimestamp()}); count++; } refreshIdioms(); } else { for (const item of data) { if (!item.title) continue; await addDoc(collection(db,'artifacts',appId,'public','data','reading_materials'), {...item, createdAt: serverTimestamp()}); count++; } refreshReading(); } alert(`成功 ${count}`); setJsonInput(''); } catch(e) { alert('Error'); } finally { setLoading(false); } };
  const delIdiom = async (id) => { if(confirm('刪除?')) { await deleteDoc(doc(db,'artifacts',appId,'public','data','idioms',id)); refreshIdioms(); }};
  const delReading = async (id) => { if(confirm('刪除?')) { await deleteDoc(doc(db,'artifacts',appId,'public','data','reading_materials',id)); refreshReading(); }};

  return (
    <div className="max-w-6xl mx-auto my-10 bg-white p-8 rounded-2xl shadow-lg animate-fade-in min-h-[600px]">
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <h2 className="font-bold text-2xl text-gray-800 flex items-center gap-2"><Settings className="text-gray-600"/> 後台管理系統</h2>
        <div className="flex gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
             <button onClick={() => setImportType('idiom')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${importType==='idiom' ? 'bg-white text-gray-800 shadow' : 'text-gray-500'}`}>成語</button>
             <button onClick={() => setImportType('reading')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${importType==='reading' ? 'bg-white text-gray-800 shadow' : 'text-gray-500'}`}>閱讀</button>
          </div>
          <button onClick={() => setJsonMode(!jsonMode)} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-900 transition flex items-center gap-2">{jsonMode ? <List size={16}/> : <FileJson size={16}/>} 切換視圖</button>
        </div>
      </div>
      
      {jsonMode ? (
        <div className="animate-fade-in">
          <div className="mb-4 bg-blue-50 text-blue-700 p-4 rounded-lg text-sm border border-blue-100">
            <strong>正在匯入：{importType === 'idiom' ? '成語資料' : '閱讀測驗'}</strong>
            <p className="mt-1 opacity-80">請貼上符合格式的 JSON 陣列資料。</p>
          </div>
          <textarea className="w-full border border-gray-300 p-4 h-96 text-sm font-mono rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={jsonInput} onChange={e=>setJsonInput(e.target.value)} placeholder={importType === 'idiom' ? '[{"word":"...", ...}]' : '[{"title":"...", ...}]'} />
          <div className="flex justify-end gap-3 mt-4">
             {importType === 'idiom' && idioms.length === 0 && <button onClick={initIdioms} disabled={loading} className="text-green-600 font-bold px-4 py-2 text-sm hover:underline">匯入預設成語</button>}
             {importType === 'reading' && readingMaterials?.length === 0 && <button onClick={initReading} disabled={loading} className="text-purple-600 font-bold px-4 py-2 text-sm hover:underline">匯入預設閱讀</button>}
             <button onClick={importJson} disabled={loading} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-md">{loading?'處理中...':'確認匯入'}</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm h-full">
            <h3 className="font-bold text-gray-700 bg-gray-50 p-4 border-b flex justify-between items-center">
              <span>成語庫 ({idioms.length})</span>
              <span className="text-xs bg-white border px-2 py-1 rounded text-gray-500">word</span>
            </h3>
            <div className="p-2 bg-white grid grid-cols-2 gap-2">
              {idioms.map(i => (
                <div key={i.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg group border border-transparent hover:border-gray-100 transition bg-gray-50/50">
                  <span className="font-medium text-gray-800 text-sm">{i.word}</span>
                  <button onClick={()=>delIdiom(i.id)} className="text-gray-300 hover:text-red-500 transition p-1 flex-shrink-0"><Trash2 size={14}/></button>
                </div>
              ))}
              {idioms.length === 0 && <div className="p-4 col-span-2 flex items-center justify-center text-gray-400 text-sm">無資料</div>}
            </div>
          </div>
          <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm h-full">
            <h3 className="font-bold text-gray-700 bg-gray-50 p-4 border-b flex justify-between items-center">
              <span>閱讀測驗庫 ({readingMaterials?.length || 0})</span>
              <span className="text-xs bg-white border px-2 py-1 rounded text-gray-500">title</span>
            </h3>
            <div className="p-2 bg-white grid grid-cols-2 gap-2">
              {readingMaterials?.map(i => (
                <div key={i.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg group border border-transparent hover:border-gray-100 transition bg-gray-50/50">
                  <span className="font-medium text-gray-800 truncate text-sm" title={i.title}>{i.title}</span>
                  <button onClick={()=>delReading(i.id)} className="text-gray-300 hover:text-red-500 transition p-1 flex-shrink-0"><Trash2 size={14}/></button>
                </div>
              ))}
              {(!readingMaterials || readingMaterials.length === 0) && <div className="p-4 col-span-2 flex items-center justify-center text-gray-400 text-sm">無資料</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [loading, setLoading] = useState(true);
  const [idioms, setIdioms] = useState([]);
  const [readingMaterials, setReadingMaterials] = useState([]);
  const [userStats, setUserStats] = useState({});

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try { await signInWithCustomToken(auth, __initial_auth_token); } catch(e) {}
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u); setLoading(false);
      if (u) fetchStats(u.uid);
    });
    fetchIdioms();
    fetchReadingMaterials();
    return () => unsub();
  }, []);

  const fetchStats = async (uid) => {
    const s = await getDoc(doc(db,'artifacts',appId,'public','data','user_stats',uid));
    if (s.exists()) setUserStats(s.data());
  };

  const fetchIdioms = async () => {
    const q = query(collection(db,'artifacts',appId,'public','data','idioms'), orderBy('createdAt'));
    const snap = await getDocs(q);
    const res = []; snap.forEach(d => res.push({id:d.id, ...d.data()}));
    setIdioms(res);
  };

  const fetchReadingMaterials = async () => {
    try {
      const q = query(collection(db,'artifacts',appId,'public','data','reading_materials'), orderBy('createdAt'));
      const snap = await getDocs(q);
      const res = []; snap.forEach(d => res.push({id:d.id, ...d.data()}));
      setReadingMaterials(res);
    } catch(e) { console.error(e); }
  };

  const navigateTo = (target) => {
    if ((target === 'learn' || target === 'quiz' || target === 'dashboard' || target === 'reading') && !user) {
      setView('login');
    } else {
      setView(target);
    }
  };

  const handleLoginSuccess = () => { setView('dashboard'); };
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  if (loading) return <div className="h-screen flex items-center justify-center text-gray-500">載入中...</div>;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <header className="bg-red-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
            <div className="bg-white text-red-800 p-2 rounded-lg shadow-inner"><BookOpen size={24} /></div>
            <div><h1 className="text-2xl font-bold tracking-widest">成語狀元榜</h1><p className="text-xs text-red-200 tracking-wider">Idiom Learning Platform</p></div>
          </div>
          <nav className="flex flex-wrap justify-center items-center gap-2 md:gap-4 text-sm font-medium">
            <button onClick={() => setView('home')} className={`px-3 py-2 rounded hover:bg-red-700 transition ${view === 'home' ? 'bg-red-900' : ''}`}>首頁</button>
            <a href="https://script.google.com/a/macros/gses.hcc.edu.tw/s/AKfycbwKwUAkUoFyRIjIFLFQFXRVBqUrB8bUv3AXnHe_hStwhZ45sh6LHcmswnA0RGC_7CwT/exec" target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded hover:bg-red-700 transition flex items-center gap-1"><ExternalLink size={14}/>成語大挑戰</a>
            <a href="https://script.google.com/a/macros/gses.hcc.edu.tw/s/AKfycbxxpsX1KfYmYFL3bx9SVDd4r5qGM77eVYK-Hj6SkT03x86JBEaZm92GdXyTzUyUkt0vOQ/exec" target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded hover:bg-red-700 transition flex items-center gap-1"><ExternalLink size={14}/>看故事學成語</a>
            <a href="https://script.google.com/a/macros/gses.hcc.edu.tw/s/AKfycbyfpCIJgE8oh26lxX7KxgCp0IohoHbFkYfPPKcamdsJWICQaI1VoJP7HFW-hIVMHAzPvQ/exec" target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded hover:bg-red-700 transition flex items-center gap-1"><ExternalLink size={14}/>成語小遊戲</a>
            {user && <button onClick={() => setView('dashboard')} className={`px-3 py-2 rounded hover:bg-red-700 transition flex items-center gap-1 ${view === 'dashboard' ? 'bg-red-900' : ''}`}><LayoutDashboard size={16}/> 儀表板</button>}
            <button onClick={() => navigateTo('learn')} className={`px-3 py-2 rounded hover:bg-red-700 transition ${view === 'learn' ? 'bg-red-900' : ''}`}>學習區</button>
            <button onClick={() => navigateTo('quiz')} className={`px-3 py-2 rounded hover:bg-red-700 transition ${view === 'quiz' ? 'bg-red-900' : ''}`}>測驗區</button>
            <button onClick={() => navigateTo('reading')} className={`px-3 py-2 rounded hover:bg-red-700 transition ${view === 'reading' ? 'bg-red-900' : ''}`}>閱讀測驗</button>
            {user ? (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-red-700">
                <div className="text-right hidden md:block"><p className="text-xs text-red-200">歡迎回來</p><p className="font-bold">{user.displayName}</p></div>
                <button onClick={() => { signOut(auth); setView('home'); }} className="bg-red-900 hover:bg-red-950 p-2 rounded text-xs">登出</button>
              </div>
            ) : (
              <button onClick={() => setView('login')} className="ml-2 bg-white text-red-800 px-4 py-2 rounded font-bold hover:bg-gray-100 transition">登入 / 註冊</button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {view === 'home' && <HomePage navigateTo={navigateTo} user={user} />}
        {view === 'login' && <AuthPage onLoginSuccess={handleLoginSuccess} />}
        {view === 'dashboard' && <Dashboard user={user} userStats={userStats} idioms={idioms} readingMaterials={readingMaterials} navigateTo={navigateTo} />}
        {view === 'learn' && <LearningMode user={user} idioms={idioms} refreshStats={() => fetchStats(user.uid)} />}
        {view === 'quiz' && <QuizMode user={user} idioms={idioms} refreshStats={() => fetchStats(user.uid)} />}
        {view === 'reading' && <ReadingMode user={user} readingMaterials={readingMaterials} refreshStats={() => fetchStats(user.uid)} />}
        {view === 'admin' && isAdmin && <AdminPanel idioms={idioms} readingMaterials={readingMaterials} refreshIdioms={fetchIdioms} refreshReading={fetchReadingMaterials} />}
      </main>

      <footer className="bg-gray-800 text-gray-400 py-8 text-center text-sm">
        <div className="max-w-6xl mx-auto px-4"><p className="mb-2">© 2026 成語狀元榜學習網. All rights reserved.</p><div className="flex justify-center gap-4"><span className="hover:text-white cursor-pointer">隱私權政策</span><span>|</span><span className="hover:text-white cursor-pointer">使用條款</span>{isAdmin && <><span>|</span><span onClick={() => setView('admin')} className="text-gray-600 hover:text-white cursor-pointer">管理員後台</span></>}</div></div>
      </footer>
    </div>
  );
}
