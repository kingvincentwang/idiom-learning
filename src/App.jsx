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
  Library, Edit3, TrendingUp, Home, LayoutDashboard, XCircle, ExternalLink, Book, List
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
  <div className={`flex items-center p-3 rounded-lg mb-2 ${highlight ? 'bg-orange-50 border border-orange-200' : 'bg-white border border-gray-100'}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 text-white ${rank === 1 ? 'bg-yellow-400' : rank === 2 ? 'bg-gray-400' : 'bg-orange-400'}`}>{rank}</div>
    <div className="flex-1"><p className="font-bold text-gray-700 text-sm">{name || '無名氏'}</p></div>
    <div className="font-mono font-bold text-red-700">{score} <span className="text-xs text-gray-500 font-normal">{unit}</span></div>
  </div>
);

const Dashboard = ({ user, userStats, idioms, navigateTo }) => {
  const totalIdioms = idioms.length || 1;
  const learnedCount = userStats.learnedCount || 0;
  const learnedPct = Math.min(100, Math.round((learnedCount / totalIdioms) * 100));
  const totalScore = userStats.totalScore || 0;
  const scoreGoal = 1000;
  const scorePct = Math.min(100, Math.round((totalScore / scoreGoal) * 100));
  const readingScore = userStats.readingScore || 0;
  const readingGoal = 500;
  const readingPct = Math.min(100, Math.round((readingScore / readingGoal) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-red-800 pl-4">個人學習儀表板</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-red-800 font-bold mb-6 text-center text-lg">成語學習進度</h3>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden"><div className="bg-red-600 h-4 rounded-full transition-all duration-1000 ease-out" style={{ width: `${learnedPct}%` }}></div></div>
          <p className="text-center text-gray-600 font-bold text-xl">{learnedPct}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-red-800 font-bold mb-6 text-center text-lg">文意測驗進度 (目標: {scoreGoal})</h3>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden"><div className="bg-red-600 h-4 rounded-full transition-all duration-1000 ease-out" style={{ width: `${scorePct}%` }}></div></div>
          <p className="text-center text-gray-600 font-bold text-xl">{scorePct}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200 ring-2 ring-red-50">
          <h3 className="text-red-800 font-bold mb-6 text-center text-lg">閱讀測驗進度 (目標: {readingGoal})</h3>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden"><div className="bg-red-600 h-4 rounded-full transition-all duration-1000 ease-out" style={{ width: `${readingPct}%` }}></div></div>
          <p className="text-center text-gray-600 font-bold text-xl">{readingPct}%</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
          <h4 className="text-red-800 font-bold mb-3 text-lg">您的學習進度</h4>
          <div className="flex-grow text-gray-600 text-sm mb-4 leading-relaxed">{learnedCount === 0 ? "您還沒有開始任何學習，立即前往學習區開始吧！" : `您已經學習了 ${learnedCount} 個成語，總題庫共 ${totalIdioms} 個。`}</div>
          <button onClick={() => navigateTo('learn')} className="text-red-600 font-bold text-sm hover:underline self-start mt-auto">立即前往學習區</button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
          <h4 className="text-red-800 font-bold mb-3 text-lg">您的文意測驗</h4>
          <div className="flex-grow text-gray-600 text-sm mb-4 leading-relaxed">{totalScore === 0 ? "您還沒有參加任何測驗，立即前往文意測驗區開始吧！" : `文意測驗累積積分：${totalScore} 分。`}</div>
          <button onClick={() => navigateTo('quiz')} className="text-red-600 font-bold text-sm hover:underline self-start mt-auto">立即前往文意測驗</button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
          <h4 className="text-red-800 font-bold mb-3 text-lg">您的閱讀測驗</h4>
          <div className="flex-grow text-gray-600 text-sm mb-4 leading-relaxed">{readingScore === 0 ? "您還沒有完成任何閱讀測驗，立即前往挑戰！" : `閱讀測驗累積積分：${readingScore} 分。`}</div>
          <button onClick={() => navigateTo('reading')} className="text-red-600 font-bold text-sm hover:underline self-start mt-auto">立即前往閱讀測驗</button>
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
      <div className="bg-gray-600 text-white py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-wide">探索中華文化寶藏，成語學習一手掌握</h1>
        <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">透過我們的平台，輕鬆學習成語典故，增進語文能力，挑戰自我極限。</p>
        <div className="flex justify-center gap-4">
          <button onClick={() => navigateTo(user ? 'dashboard' : 'login')} className="bg-red-800 hover:bg-red-900 text-white font-bold py-3 px-8 rounded shadow-lg transition transform hover:scale-105">{user ? '進入儀表板' : '開始學習'}</button>
          {!user && <button onClick={() => navigateTo('login')} className="bg-transparent border-2 border-white hover:bg-white hover:text-gray-800 text-white font-bold py-3 px-8 rounded transition">立即註冊</button>}
        </div>
      </div>
      <div className="bg-[#F0FDF4] py-12 px-4">
        <div className="max-w-5xl mx-auto bg-white/50 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-green-100">
          <h2 className="text-2xl font-bold text-center text-red-800 mb-8 tracking-wider">— 學習排行榜 · 前三名 —</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-center font-bold text-red-700 mb-4">文意測驗排行榜 (總分)</h3>
              {loading ? <div className="text-center text-gray-400">載入中...</div> : <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 min-h-[200px]">{scoreLeaders.map((u, i) => <LeaderboardItem key={i} rank={i+1} name={u.displayName} score={u.totalScore || 0} unit="分" highlight={user && u.uid === user.uid} />)}{scoreLeaders.length === 0 && <p className="text-center text-gray-400 mt-10">尚無資料</p>}</div>}
            </div>
            <div>
              <h3 className="text-center font-bold text-red-700 mb-4">閱讀測驗排行榜 (總分)</h3>
              {loading ? <div className="text-center text-gray-400">載入中...</div> : <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 min-h-[200px]">{readingLeaders.map((u, i) => <LeaderboardItem key={i} rank={i+1} name={u.displayName} score={u.readingScore || 0} unit="分" highlight={user && u.uid === user.uid} />)}{readingLeaders.length === 0 && <p className="text-center text-gray-400 mt-10">尚無資料</p>}</div>}
            </div>
          </div>
        </div>
      </div>
      {/* Feature cards omitted for brevity, same as before */}
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
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-200">
        <div className="text-center"><div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center"><Lock className="h-6 w-6 text-red-800" /></div><h2 className="mt-6 text-3xl font-extrabold text-gray-900">{isRegister ? '註冊新帳號' : '登入您的帳號'}</h2></div>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>}
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="rounded-md shadow-sm -space-y-px">
            {isRegister && <input type="text" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm" placeholder="暱稱" value={username} onChange={e => setUsername(e.target.value)} />}
            <input type="email" required className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${!isRegister ? 'rounded-t-md' : ''} focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm" placeholder="密碼" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-800 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">{loading ? '處理中...' : (isRegister ? '註冊' : '登入')}</button>
        </form>
        <div className="text-center"><button onClick={() => setIsRegister(!isRegister)} className="font-medium text-red-800 hover:text-red-700">{isRegister ? '已有帳號？登入' : '還沒有帳號？註冊'}</button></div>
      </div>
    </div>
  );
};

const LearningMode = ({ user, idioms, refreshStats }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [learnedIds, setLearnedIds] = useState(new Set());
  
  useEffect(() => {
    if (!user) return;
    const fetchLearned = async () => {
      const q = collection(db, 'artifacts', appId, 'users', user.uid, 'learned_idioms');
      const snap = await getDocs(q);
      const ids = new Set();
      snap.forEach(d => ids.add(d.data().idiomId));
      setLearnedIds(ids);
    };
    fetchLearned();
  }, [user]);

  if (!idioms || idioms.length === 0) return <div className="p-10 text-center"><Loader2 className="animate-spin inline mr-2"/>題庫載入中...</div>;
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
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-red-800 text-white p-4 flex justify-between items-center"><h2 className="text-xl font-bold flex items-center gap-2"><BookOpen/> 成語學習卡</h2><span className="bg-red-900 px-3 py-1 rounded text-sm">進度: {learnedIds.size} / {idioms.length}</span></div>
        <div className="p-8 text-center bg-gray-50">
          {isLearned && <div className="text-green-600 text-sm font-bold mb-2 flex justify-center items-center gap-1"><CheckCircle size={16}/> 已收藏</div>}
          <h1 className="text-5xl font-bold text-gray-800 mb-2">{current.word}</h1>
          <p className="text-xl text-gray-500 font-serif mb-6">{current.pinyin}</p>
          <div className="text-left space-y-4 max-w-xl mx-auto">
            <div className="bg-white p-4 rounded border-l-4 border-amber-400 shadow-sm"><span className="font-bold text-amber-600 block mb-1">釋義</span><p className="text-gray-700">{current.meaning}</p></div>
            <div className="bg-white p-4 rounded border-l-4 border-blue-400 shadow-sm"><span className="font-bold text-blue-600 block mb-1">例句</span><p className="text-gray-700">{current.example || "暫無例句"}</p></div>
          </div>
        </div>
        <div className="bg-gray-100 p-4 flex justify-between">
          <button onClick={() => setCurrentIndex((currentIndex - 1 + idioms.length) % idioms.length)} className="text-gray-600 hover:text-gray-900 font-bold px-4">上一則</button>
          <button onClick={markLearned} disabled={isLearned} className={`px-6 py-2 rounded shadow font-bold text-white transition ${isLearned ? 'bg-gray-400' : 'bg-red-700 hover:bg-red-800'}`}>{isLearned ? '已學習' : '標記為已學'}</button>
          <button onClick={() => setCurrentIndex((currentIndex + 1) % idioms.length)} className="text-gray-600 hover:text-gray-900 font-bold px-4">下一則</button>
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

  if (!readingMaterials || readingMaterials.length === 0) return <div className="p-10 text-center"><Loader2 className="animate-spin inline mr-2"/>閱讀教材載入中... (請至後台匯入)</div>;

  if (!selectedStory) {
    return (
      <div className="max-w-4xl mx-auto my-10 px-4 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-red-800 pl-4">成語閱讀測驗列表</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {readingMaterials.map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition">
              <h3 className="text-xl font-bold text-red-800 mb-3">{item.title}</h3>
              <p className="text-gray-500 text-sm mb-4 line-clamp-3">{item.content}</p>
              <button onClick={() => { setSelectedStory(item); setCurrentQIndex(0); setScore(0); setFinished(false); setSelectedOption(null); setIsCorrect(null); }} className="w-full bg-red-800 text-white py-2 rounded font-bold hover:bg-red-900">閱讀並挑戰</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="max-w-lg mx-auto my-10 bg-white p-8 rounded-xl shadow-lg text-center border-t-8 border-red-800 animate-fade-in">
        <Trophy className="w-20 h-20 mx-auto text-yellow-500 mb-4" /><h2 className="text-2xl font-bold text-gray-800">閱讀測驗結束</h2>
        <p className="text-gray-500 mt-2">故事：{selectedStory.title}</p><p className="text-5xl font-bold text-red-700 my-6">{score} 分</p>
        <button onClick={() => setSelectedStory(null)} className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700">返回列表</button>
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
    <div className="max-w-4xl mx-auto my-8 px-4 flex flex-col md:flex-row gap-8 animate-fade-in">
      <div className="flex-1 bg-white p-8 rounded-xl shadow-md border border-gray-200 h-fit"><h2 className="text-2xl font-bold text-red-800 mb-4 flex items-center gap-2"><Book size={24}/> {selectedStory.title}</h2><div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">{selectedStory.content}</div></div>
      <div className="w-full md:w-96">
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-red-800 sticky top-24">
          <div className="flex justify-between mb-4 text-gray-500 font-bold"><span>第 {currentQIndex + 1} / {selectedStory.questions.length} 題</span><span>得分: {score}</span></div>
          {selectedOption && <div className={`mb-4 p-3 rounded text-center font-bold text-sm animate-bounce-in ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{isCorrect ? "答對了！" : `答錯了！答案是：${currentQ.answer}`}</div>}
          <div className="font-bold text-gray-800 mb-6 text-lg">{currentQ.question}</div>
          <div className="space-y-3">{currentQ.options.map((opt, i) => {
               let btnClass = "w-full p-3 rounded-lg text-left border border-gray-200 hover:bg-gray-50 transition";
               if (selectedOption) {
                 if (opt === currentQ.answer) btnClass = "w-full p-3 rounded-lg text-left bg-green-100 border-green-500 text-green-800 font-bold";
                 else if (opt === selectedOption) btnClass = "w-full p-3 rounded-lg text-left bg-red-100 border-red-500 text-red-800";
                 else btnClass = "w-full p-3 rounded-lg text-left border border-gray-100 text-gray-400";
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
    <div className="max-w-2xl mx-auto my-10 bg-white p-6 rounded-xl shadow-lg border border-gray-200 animate-fade-in">
      <div className="flex justify-between mb-4 text-gray-500 font-bold"><span>第 {count} / 5 題</span><span>得分: {score}</span></div>
      {selectedOption && <div className={`mb-6 p-4 rounded-lg text-center font-bold animate-bounce-in shadow-inner ${isCorrect ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>{isCorrect ? <span className="flex items-center justify-center gap-2 text-lg"><CheckCircle size={24}/> 答對了！太棒了！</span> : <div className="flex flex-col items-center"><span className="flex items-center gap-2 mb-2 text-lg"><XCircle size={24}/> 哎呀，答錯了！</span><span className="text-sm bg-white px-3 py-1 rounded-full border border-red-200 shadow-sm text-gray-600">正確答案是：<span className="text-green-600 font-bold text-base ml-1">{q.word}</span></span></div>}</div>}
      <div className="bg-gray-100 p-6 rounded-lg mb-6 text-lg text-gray-800 font-medium border-l-4 border-red-800 shadow-sm">"{q.meaning}"</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {q.options.map((opt, i) => {
            let btnClass = "bg-white border-2 border-gray-200 text-gray-700 hover:border-red-500 hover:bg-red-50";
            if (selectedOption) {
                if (opt === q.word) btnClass = "bg-green-100 border-green-500 text-green-800 font-bold shadow-md transform scale-105 ring-2 ring-green-200";
                else if (opt === selectedOption && !isCorrect) btnClass = "bg-red-100 border-red-500 text-red-800 opacity-90";
                else btnClass = "bg-gray-50 border-gray-100 text-gray-400 opacity-40";
            }
            return <button key={i} onClick={() => handleAnswer(opt)} disabled={!!selectedOption} className={`p-4 rounded-lg text-left transition-all duration-300 relative overflow-hidden ${btnClass}`}>{opt}</button>
        })}
      </div>
    </div>
  );

  return <div className="max-w-2xl mx-auto my-16 text-center animate-fade-in"><div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-200"><Brain className="w-20 h-20 mx-auto text-red-800 mb-6" /><h2 className="text-3xl font-bold text-gray-800 mb-4">成語大挑戰</h2><p className="text-gray-600 mb-8">準備好測試你的成語實力了嗎？每局 5 題，挑戰最高分！</p><button onClick={start} className="bg-red-800 text-white font-bold py-3 px-10 rounded-full shadow-lg hover:bg-red-900 transform transition hover:scale-105">開始測驗</button></div></div>;
};

// 8. Admin Panel (Updated with Dual Import)
const AdminPanel = ({ idioms, readingMaterials, refreshIdioms, refreshReading }) => {
  const [importType, setImportType] = useState('idiom'); // 'idiom' | 'reading'
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);

  const initIdioms = async () => {
    if(!confirm('匯入預設成語題庫?')) return;
    setLoading(true);
    for (const i of INITIAL_IDIOMS) await addDoc(collection(db,'artifacts',appId,'public','data','idioms'), {...i, createdAt: serverTimestamp()});
    setLoading(false); refreshIdioms();
  };

  const initReading = async () => {
    if(!confirm('匯入預設閱讀測驗?')) return;
    setLoading(true);
    for (const i of INITIAL_READING_DATA) await addDoc(collection(db,'artifacts',appId,'public','data','reading_materials'), {...i, createdAt: serverTimestamp()});
    setLoading(false); refreshReading();
  };

  const importJson = async () => {
    try {
      const data = JSON.parse(jsonInput);
      if (!Array.isArray(data)) throw new Error("JSON 必須是陣列格式");
      setLoading(true);
      let count = 0;

      if (importType === 'idiom') {
        for (const item of data) {
          if (!item.word) continue;
          let opts = item.options;
          if (!opts && item.distractors) opts = [item.word, ...item.distractors].sort(()=>Math.random()-0.5);
          if (!opts || opts.length<4) continue;
          await addDoc(collection(db,'artifacts',appId,'public','data','idioms'), {...item, options: opts, createdAt: serverTimestamp()});
          count++;
        }
        refreshIdioms();
      } else {
        for (const item of data) {
          if (!item.title || !item.content || !item.questions) continue;
          await addDoc(collection(db,'artifacts',appId,'public','data','reading_materials'), {...item, createdAt: serverTimestamp()});
          count++;
        }
        refreshReading();
      }
      alert(`成功匯入 ${count} 筆${importType==='idiom'?'成語':'閱讀測驗'}資料！`); setJsonInput('');
    } catch(e) { alert('匯入錯誤：' + e.message); } finally { setLoading(false); }
  };

  const delIdiom = async (id) => { if(confirm('刪除?')) { await deleteDoc(doc(db,'artifacts',appId,'public','data','idioms',id)); refreshIdioms(); }};
  const delReading = async (id) => { if(confirm('刪除?')) { await deleteDoc(doc(db,'artifacts',appId,'public','data','reading_materials',id)); refreshReading(); }};

  return (
    <div className="max-w-4xl mx-auto my-10 bg-white p-6 rounded shadow animate-fade-in">
      <div className="flex justify-between mb-4">
        <h2 className="font-bold text-xl">後台管理</h2>
        <div className="flex gap-2">
          {readingMaterials?.length === 0 && <button onClick={initReading} disabled={loading} className="bg-purple-600 text-white px-3 py-1 rounded text-sm">預設閱讀</button>}
          {idioms.length === 0 && <button onClick={initIdioms} disabled={loading} className="bg-green-600 text-white px-3 py-1 rounded text-sm">預設成語</button>}
          <button onClick={() => setJsonMode(!jsonMode)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">切換模式</button>
        </div>
      </div>
      
      {jsonMode ? (
        <div>
          <div className="flex gap-4 mb-4 bg-gray-100 p-3 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
              <input type="radio" checked={importType === 'idiom'} onChange={() => setImportType('idiom')} className="w-4 h-4 text-red-600" /> 成語資料庫
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
              <input type="radio" checked={importType === 'reading'} onChange={() => setImportType('reading')} className="w-4 h-4 text-red-600" /> 閱讀測驗題庫
            </label>
          </div>
          <textarea className="w-full border p-2 h-40 text-xs font-mono" value={jsonInput} onChange={e=>setJsonInput(e.target.value)} placeholder={importType === 'idiom' ? '[{"word":"..."},...]' : '[{"title":"...","content":"...","questions":[]},...]'} />
          <button onClick={importJson} disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded mt-2">{loading?'...':'開始匯入'}</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-96">
          <div className="border rounded p-2 bg-gray-50 flex flex-col">
            <h3 className="font-bold text-gray-700 mb-2 border-b pb-1">成語列表 ({idioms.length})</h3>
            <div className="overflow-y-auto flex-1">{idioms.map(i => <div key={i.id} className="flex justify-between items-center p-2 border-b bg-white text-sm"><span>{i.word}</span><button onClick={()=>delIdiom(i.id)} className="text-red-500"><Trash2 size={14}/></button></div>)}</div>
          </div>
          <div className="border rounded p-2 bg-gray-50 flex flex-col">
            <h3 className="font-bold text-gray-700 mb-2 border-b pb-1">閱讀測驗列表 ({readingMaterials?.length || 0})</h3>
            <div className="overflow-y-auto flex-1">{readingMaterials?.map(i => <div key={i.id} className="flex justify-between items-center p-2 border-b bg-white text-sm"><span className="truncate w-32">{i.title}</span><button onClick={()=>delReading(i.id)} className="text-red-500"><Trash2 size={14}/></button></div>)}</div>
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
