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
  Library, Edit3, TrendingUp, Home, LayoutDashboard
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- 🔒 管理員設定 ---
const ADMIN_EMAILS = [
  "teacher@example.com", 
  "admin@idiom-master.com",
  "your_email@example.com" 
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

// --- Sub-Components ---

// 1. Leaderboard List Item
const LeaderboardItem = ({ rank, name, score, unit = '分', highlight = false }) => (
  <div className={`flex items-center p-3 rounded-lg mb-2 ${highlight ? 'bg-orange-50 border border-orange-200' : 'bg-white border border-gray-100'}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 text-white
      ${rank === 1 ? 'bg-yellow-400' : rank === 2 ? 'bg-gray-400' : 'bg-orange-400'}
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

// 2. Dashboard Component (NEW)
const Dashboard = ({ user, userStats, idioms, navigateTo }) => {
  const totalIdioms = idioms.length || 1;
  const learnedCount = userStats.learnedCount || 0;
  const learnedPct = Math.min(100, Math.round((learnedCount / totalIdioms) * 100));

  const totalScore = userStats.totalScore || 0;
  // 設定一個虛擬目標分數 (例如 1000 分) 來顯示進度條，讓畫面更豐富
  const scoreGoal = 1000;
  const scorePct = Math.min(100, Math.round((totalScore / scoreGoal) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-red-800 pl-4">個人學習儀表板</h2>
      
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Learning Progress Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-red-800 font-bold mb-6 text-center text-lg">學習進度</h3>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
            <div 
              className="bg-red-600 h-4 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${learnedPct}%` }}
            ></div>
          </div>
          <p className="text-center text-gray-600 font-bold text-xl">{learnedPct}%</p>
        </div>

        {/* Quiz Progress Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-red-800 font-bold mb-6 text-center text-lg">文意測驗進度 (目標: {scoreGoal}分)</h3>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
            <div 
              className="bg-red-600 h-4 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${scorePct}%` }}
            ></div>
          </div>
          <p className="text-center text-gray-600 font-bold text-xl">{scorePct}%</p>
        </div>

        {/* Reading Progress Card (Placeholder) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-red-800 font-bold mb-6 text-center text-lg">閱讀測驗進度</h3>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
            <div className="bg-gray-400 h-4 rounded-full" style={{ width: `0%` }}></div>
          </div>
          <p className="text-center text-gray-600 font-bold text-xl">0%</p>
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
          <h4 className="text-red-800 font-bold mb-3 text-lg">您的學習進度</h4>
          <div className="flex-grow text-gray-600 text-sm mb-4 leading-relaxed">
            {learnedCount === 0 
              ? "您還沒有開始任何學習，立即前往學習區開始吧！" 
              : `您已經學習了 ${learnedCount} 個成語，總題庫共 ${totalIdioms} 個。繼續保持！`}
          </div>
          <button 
            onClick={() => navigateTo('learn')}
            className="text-red-600 font-bold text-sm hover:underline self-start mt-auto"
          >
            立即前往學習區開始吧 !
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
          <h4 className="text-red-800 font-bold mb-3 text-lg">您的測驗成績</h4>
          <div className="flex-grow text-gray-600 text-sm mb-4 leading-relaxed">
             {totalScore === 0 
              ? "您還沒有參加任何測驗，立即前往文意測驗區開始吧！" 
              : `您目前累積積分為 ${totalScore} 分。挑戰更高分，登上排行榜！`}
          </div>
          <button 
            onClick={() => navigateTo('quiz')}
            className="text-red-600 font-bold text-sm hover:underline self-start mt-auto"
          >
            立即前往文意測驗區開始吧 !
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
          <h4 className="text-red-800 font-bold mb-3 text-lg">您的閱讀測驗進度</h4>
          <div className="flex-grow text-gray-600 text-sm mb-4 leading-relaxed">
            您還沒有完成任何閱讀測驗，立即前往閱讀測驗區開始吧！(此功能即將推出)
          </div>
          <button 
            className="text-gray-400 font-bold text-sm cursor-not-allowed self-start mt-auto"
          >
            即將開放
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Home Page Component
const HomePage = ({ navigateTo, user }) => {
  const [scoreLeaders, setScoreLeaders] = useState([]);
  const [learnLeaders, setLearnLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'user_stats'));
        const users = [];
        querySnapshot.forEach((doc) => users.push(doc.data()));
        
        const byScore = [...users].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0)).slice(0, 3);
        setScoreLeaders(byScore);

        const byLearned = [...users].sort((a, b) => (b.learnedCount || 0) - (a.learnedCount || 0)).slice(0, 3);
        setLearnLeaders(byLearned);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="w-full animate-fade-in">
      <div className="bg-gray-600 text-white py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-wide">探索中華文化寶藏，成語學習一手掌握</h1>
        <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
          透過我們的平台，輕鬆學習成語典故，增進語文能力，挑戰自我極限。
        </p>
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => navigateTo(user ? 'dashboard' : 'login')}
            className="bg-red-800 hover:bg-red-900 text-white font-bold py-3 px-8 rounded shadow-lg transition transform hover:scale-105"
          >
            {user ? '進入儀表板' : '開始學習'}
          </button>
          {!user && (
            <button 
              onClick={() => navigateTo('login')}
              className="bg-transparent border-2 border-white hover:bg-white hover:text-gray-800 text-white font-bold py-3 px-8 rounded transition"
            >
              立即註冊
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#F0FDF4] py-12 px-4">
        <div className="max-w-5xl mx-auto bg-white/50 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-green-100">
          <h2 className="text-2xl font-bold text-center text-red-800 mb-8 tracking-wider">— 學習排行榜 · 前三名 —</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-center font-bold text-red-700 mb-4">文意測驗排行榜 (總分)</h3>
              {loading ? <div className="text-center text-gray-400">載入中...</div> : (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 min-h-[200px]">
                  {scoreLeaders.map((u, i) => (
                    <LeaderboardItem key={i} rank={i+1} name={u.displayName} score={u.totalScore || 0} unit="分" highlight={user && u.uid === user.uid} />
                  ))}
                  {scoreLeaders.length === 0 && <p className="text-center text-gray-400 mt-10">尚無資料</p>}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-center font-bold text-red-700 mb-4">勤學進度排行榜 (數量)</h3>
              {loading ? <div className="text-center text-gray-400">載入中...</div> : (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 min-h-[200px]">
                  {learnLeaders.map((u, i) => (
                    <LeaderboardItem key={i} rank={i+1} name={u.displayName} score={u.learnedCount || 0} unit="詞" highlight={user && u.uid === user.uid} />
                  ))}
                  {learnLeaders.length === 0 && <p className="text-center text-gray-400 mt-10">尚無資料</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-md text-center border-t-4 border-blue-500 hover:shadow-xl transition">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Library className="text-blue-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">豐富成語庫</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              收錄數百條精選成語，包含拼音、釋義、典故和例句，讓您全方位掌握成語精髓。
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md text-center border-t-4 border-orange-500 hover:shadow-xl transition">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Edit3 className="text-orange-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">互動測驗</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              透過有趣的測驗鞏固學習成果，即時回饋，檢驗您的掌握程度，讓學習不枯燥。
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md text-center border-t-4 border-green-500 hover:shadow-xl transition">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="text-green-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">進度追蹤</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              個人學習儀表板，清晰記錄學習進度和測驗成績，讓您的每一分努力都看得見。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Auth Page (Redirects to dashboard on login)
const AuthPage = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: username });
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_stats', cred.user.uid), {
          uid: cred.user.uid, displayName: username, totalScore: 0, learnedCount: 0, lastActive: serverTimestamp()
        }, { merge: true });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess();
    } catch (err) {
      console.error(err);
      setError(err.code === 'auth/wrong-password' ? '密碼錯誤' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-200">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
            <Lock className="h-6 w-6 text-red-800" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isRegister ? '註冊新帳號' : '登入您的帳號'}
          </h2>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>}
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="rounded-md shadow-sm -space-y-px">
            {isRegister && (
              <input type="text" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm" placeholder="暱稱" value={username} onChange={e => setUsername(e.target.value)} />
            )}
            <input type="email" required className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${!isRegister ? 'rounded-t-md' : ''} focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm" placeholder="密碼" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-800 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            {loading ? '處理中...' : (isRegister ? '註冊' : '登入')}
          </button>
        </form>
        <div className="text-center">
          <button onClick={() => setIsRegister(!isRegister)} className="font-medium text-red-800 hover:text-red-700">
            {isRegister ? '已有帳號？登入' : '還沒有帳號？註冊'}
          </button>
        </div>
      </div>
    </div>
  );
};

// 5. Existing Components (LearningMode, QuizMode, AdminPanel)
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
        <div className="bg-red-800 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2"><BookOpen/> 成語學習卡</h2>
          <span className="bg-red-900 px-3 py-1 rounded text-sm">進度: {learnedIds.size} / {idioms.length}</span>
        </div>
        <div className="p-8 text-center bg-gray-50">
          {isLearned && <div className="text-green-600 text-sm font-bold mb-2 flex justify-center items-center gap-1"><CheckCircle size={16}/> 已收藏</div>}
          <h1 className="text-5xl font-bold text-gray-800 mb-2">{current.word}</h1>
          <p className="text-xl text-gray-500 font-serif mb-6">{current.pinyin}</p>
          <div className="text-left space-y-4 max-w-xl mx-auto">
            <div className="bg-white p-4 rounded border-l-4 border-amber-400 shadow-sm">
              <span className="font-bold text-amber-600 block mb-1">釋義</span>
              <p className="text-gray-700">{current.meaning}</p>
            </div>
            <div className="bg-white p-4 rounded border-l-4 border-blue-400 shadow-sm">
              <span className="font-bold text-blue-600 block mb-1">例句</span>
              <p className="text-gray-700">{current.example || "暫無例句"}</p>
            </div>
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

const QuizMode = ({ user, idioms, refreshStats }) => {
  const [playing, setPlaying] = useState(false);
  const [q, setQ] = useState(null);
  const [score, setScore] = useState(0);
  const [count, setCount] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!idioms || idioms.length < 4) return <div className="p-10 text-center text-gray-500">題庫不足，請管理員新增題目。</div>;

  const start = () => { setPlaying(true); setScore(0); setCount(0); setFinished(false); nextQ(); };
  const nextQ = () => { 
    if (count >= 5) { end(); return; }
    setQ(idioms[Math.floor(Math.random() * idioms.length)]); 
    setCount(c => c + 1); 
  };
  const ans = (opt) => {
    if (opt === q.word) setScore(s => s + 10);
    if (count < 5) nextQ(); else end(opt === q.word ? score + 10 : score);
  };
  const end = async (finalS) => {
    setPlaying(false); setFinished(true);
    const final = finalS !== undefined ? finalS : score;
    if (user) {
      await setDoc(doc(collection(db, 'artifacts', appId, 'users', user.uid, 'quiz_results')), { score: final, ts: serverTimestamp() });
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_stats', user.uid), { totalScore: increment(final), displayName: user.displayName }, { merge: true });
      refreshStats();
    }
  };

  if (finished) return (
    <div className="max-w-md mx-auto my-10 bg-white p-8 rounded-xl shadow-lg text-center border-t-8 border-red-800 animate-fade-in">
      <Trophy className="w-20 h-20 mx-auto text-yellow-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-800">測驗結束</h2>
      <p className="text-5xl font-bold text-red-700 my-6">{score} 分</p>
      <button onClick={start} className="bg-red-800 text-white px-6 py-2 rounded hover:bg-red-900">再玩一次</button>
    </div>
  );

  if (playing && q) return (
    <div className="max-w-2xl mx-auto my-10 bg-white p-6 rounded-xl shadow-lg border border-gray-200 animate-fade-in">
      <div className="flex justify-between mb-4 text-gray-500 font-bold"><span>第 {count} / 5 題</span><span>得分: {score}</span></div>
      <div className="bg-gray-100 p-6 rounded-lg mb-6 text-lg text-gray-800 font-medium">"{q.meaning}"</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => ans(opt)} className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 text-left transition">{opt}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto my-16 text-center animate-fade-in">
      <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-200">
        <Brain className="w-20 h-20 mx-auto text-red-800 mb-6" />
        <h2 className="text-3xl font-bold text-gray-800 mb-4">成語大挑戰</h2>
        <p className="text-gray-600 mb-8">準備好測試你的成語實力了嗎？每局 5 題，挑戰最高分！</p>
        <button onClick={start} className="bg-red-800 text-white font-bold py-3 px-10 rounded-full shadow-lg hover:bg-red-900 transform transition hover:scale-105">開始測驗</button>
      </div>
    </div>
  );
};

// 6. Admin Panel (Same as before)
const AdminPanel = ({ idioms, refreshIdioms }) => {
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);

  const init = async () => {
    if(!confirm('匯入預設?')) return;
    setLoading(true);
    for (const i of INITIAL_IDIOMS) await addDoc(collection(db,'artifacts',appId,'public','data','idioms'), {...i, createdAt: serverTimestamp()});
    setLoading(false); refreshIdioms();
  };

  const importJson = async () => {
    try {
      const data = JSON.parse(jsonInput);
      setLoading(true);
      let count = 0;
      for (const item of data) {
        if (!item.word) continue;
        let opts = item.options;
        if (!opts && item.distractors) opts = [item.word, ...item.distractors].sort(()=>Math.random()-0.5);
        if (!opts || opts.length<4) continue;
        await addDoc(collection(db,'artifacts',appId,'public','data','idioms'), {...item, options: opts, createdAt: serverTimestamp()});
        count++;
      }
      alert(`匯入 ${count} 筆`); refreshIdioms();
    } catch(e) { alert('錯誤'); } finally { setLoading(false); }
  };

  const del = async (id) => {
    if(!confirm('刪除?')) return;
    await deleteDoc(doc(db,'artifacts',appId,'public','data','idioms',id)); refreshIdioms();
  };

  return (
    <div className="max-w-4xl mx-auto my-10 bg-white p-6 rounded shadow animate-fade-in">
      <div className="flex justify-between mb-4">
        <h2 className="font-bold text-xl">後台管理</h2>
        <div>
          {idioms.length === 0 && <button onClick={init} className="bg-green-600 text-white px-3 py-1 rounded text-sm mr-2">預設匯入</button>}
          <button onClick={() => setJsonMode(!jsonMode)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">切換模式</button>
        </div>
      </div>
      
      {jsonMode ? (
        <div>
          <textarea className="w-full border p-2 h-40 text-xs" value={jsonInput} onChange={e=>setJsonInput(e.target.value)} placeholder='[{"word":"...", "meaning":"...", "distractors":[...]}]' />
          <button onClick={importJson} disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded mt-2">{loading?'...':'匯入JSON'}</button>
        </div>
      ) : (
        <div className="h-96 overflow-y-auto border rounded p-2 bg-gray-50">
          {idioms.map(i => (
            <div key={i.id} className="flex justify-between items-center p-2 border-b bg-white">
              <span>{i.word}</span>
              <button onClick={()=>del(i.id)} className="text-red-500"><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); // home, dashboard, learn, quiz, login, admin
  const [loading, setLoading] = useState(true);
  const [idioms, setIdioms] = useState([]);
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
      if (u) {
        fetchStats(u.uid);
      }
    });
    fetchIdioms();
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

  const navigateTo = (target) => {
    if ((target === 'learn' || target === 'quiz' || target === 'dashboard') && !user) {
      setView('login');
    } else {
      setView(target);
    }
  };

  const handleLoginSuccess = () => {
    // 登入成功後，直接跳轉到儀表板
    setView('dashboard');
  };

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  if (loading) return <div className="h-screen flex items-center justify-center text-gray-500">載入中...</div>;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      {/* 1. Official Header */}
      <header className="bg-red-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo Section */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
            <div className="bg-white text-red-800 p-2 rounded-lg shadow-inner">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-widest">成語狀元榜</h1>
              <p className="text-xs text-red-200 tracking-wider">Idiom Learning Platform</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 md:gap-6 text-sm font-medium">
            <button onClick={() => setView('home')} className={`px-3 py-2 rounded hover:bg-red-700 transition ${view === 'home' ? 'bg-red-900' : ''}`}>首頁</button>
            {user && (
              <button onClick={() => setView('dashboard')} className={`px-3 py-2 rounded hover:bg-red-700 transition flex items-center gap-1 ${view === 'dashboard' ? 'bg-red-900' : ''}`}>
                <LayoutDashboard size={16}/> 個人儀表板
              </button>
            )}
            <button onClick={() => navigateTo('learn')} className={`px-3 py-2 rounded hover:bg-red-700 transition ${view === 'learn' ? 'bg-red-900' : ''}`}>成語學習區</button>
            <button onClick={() => navigateTo('quiz')} className={`px-3 py-2 rounded hover:bg-red-700 transition ${view === 'quiz' ? 'bg-red-900' : ''}`}>互動測驗</button>
            
            {user ? (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-red-700">
                <div className="text-right hidden md:block">
                  <p className="text-xs text-red-200">歡迎回來</p>
                  <p className="font-bold">{user.displayName}</p>
                </div>
                <button onClick={() => { signOut(auth); setView('home'); }} className="bg-red-900 hover:bg-red-950 p-2 rounded text-xs">登出</button>
              </div>
            ) : (
              <button onClick={() => setView('login')} className="ml-2 bg-white text-red-800 px-4 py-2 rounded font-bold hover:bg-gray-100 transition">
                登入 / 註冊
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-grow">
        {view === 'home' && <HomePage navigateTo={navigateTo} user={user} />}
        {view === 'login' && <AuthPage onLoginSuccess={handleLoginSuccess} />}
        {view === 'dashboard' && <Dashboard user={user} userStats={userStats} idioms={idioms} navigateTo={navigateTo} />}
        {view === 'learn' && <LearningMode user={user} idioms={idioms} refreshStats={() => fetchStats(user.uid)} />}
        {view === 'quiz' && <QuizMode user={user} idioms={idioms} refreshStats={() => fetchStats(user.uid)} />}
        {view === 'admin' && isAdmin && <AdminPanel idioms={idioms} refreshIdioms={fetchIdioms} />}
      </main>

      {/* 3. Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8 text-center text-sm">
        <div className="max-w-6xl mx-auto px-4">
          <p className="mb-2">© 2026 成語狀元榜學習網. All rights reserved.</p>
          <div className="flex justify-center gap-4">
            <span className="hover:text-white cursor-pointer">隱私權政策</span>
            <span>|</span>
            <span className="hover:text-white cursor-pointer">使用條款</span>
            {isAdmin && (
              <>
                <span>|</span>
                <span onClick={() => setView('admin')} className="text-gray-600 hover:text-white cursor-pointer">管理員後台</span>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
