import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  onAuthStateChanged,
  updateProfile,
  signOut,
  AuthErrorCodes
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  serverTimestamp,
  increment,
  query
} from 'firebase/firestore';
import { 
  BookOpen, 
  Trophy, 
  User, 
  LogOut, 
  CheckCircle, 
  Brain, 
  ChevronRight, 
  Award,
  BarChart3,
  History,
  Mail,
  Lock,
  Loader2
} from 'lucide-react';

// --- Firebase Configuration ---
// 部署時請將此處替換為您的真實 Firebase 設定
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

// --- Idiom Database (Mock Data for this demo) ---
const IDIOM_DATA = [
  { id: '1', word: '半途而廢', pinyin: 'bàn tú ér fèi', meaning: '事情沒有做完就停止。比喻做事有始無終。', example: '學習任何技能都不能半途而廢，否則永遠無法精通。', options: ['堅持到底', '半途而廢', '持之以恆', '廢寢忘食'] },
  { id: '2', word: '一石二鳥', pinyin: 'yī shí èr niǎo', meaning: '比喻做一件事獲得兩種效果。', example: '這次出差既處理了公務，又順道拜訪了老友，真是一石二鳥。', options: ['一石二鳥', '畫蛇添足', '緣木求魚', '顧此失彼'] },
  { id: '3', word: '畫蛇添足', pinyin: 'huà shé tiān zú', meaning: '比喻多此一舉，不但無益，反而有害。', example: '這篇文章的結尾已經很完美了，你再加這一段簡直是畫蛇添足。', options: ['錦上添花', '雪中送炭', '畫蛇添足', '畫龍點睛'] },
  { id: '4', word: '因材施教', pinyin: 'yīn cái shī jiào', meaning: '依據受教者不同的資質，給予不同的教導。', example: '老師懂得因材施教，讓每個學生都能發揮特長。', options: ['有教無類', '因材施教', '揠苗助長', '循循善誘'] },
  { id: '5', word: '緣木求魚', pinyin: 'yuán mù qiú yú', meaning: '爬到樹上去找魚。比喻用錯誤的方法，不可能達到目的。', example: '想不努力就獲得成功，無異於緣木求魚。', options: ['緣木求魚', '按圖索驥', '刻舟求劍', '水中撈月'] },
  { id: '6', word: '錦上添花', pinyin: 'jǐn shàng tiān huā', meaning: '在美麗的錦緞上再繡上花朵。比喻美上加美，喜上加喜。', example: '他的到來為這場晚會錦上添花，氣氛更加熱烈。', options: ['雪中送炭', '落井下石', '錦上添花', '推波助瀾'] },
  { id: '7', word: '臥薪嘗膽', pinyin: 'wò xīn cháng dǎn', meaning: '比喻刻苦自勵，發憤圖強。', example: '這家公司經過十年的臥薪嘗膽，終於成為行業龍頭。', options: ['臥薪嘗膽', '忍氣吞聲', '苟且偷生', '韜光養晦'] },
  { id: '8', word: '破釜沉舟', pinyin: 'pò fǔ chén zhōu', meaning: '比喻下定決心，不顧一切地幹到底。', example: '面對強大的對手，我們必須有破釜沉舟的決心才能獲勝。', options: ['背水一戰', '破釜沉舟', '臨陣脫逃', '優柔寡斷'] },
];

// --- Components ---

// 1. Authentication Component (Email/Password)
const AuthScreen = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // Only for registration
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userCredential;
      if (isRegister) {
        // Register
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update Profile Name
        await updateProfile(user, { displayName: username });
        
        // Initialize Stats
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_stats', user.uid), {
          uid: user.uid,
          displayName: username,
          totalScore: 0,
          learnedCount: 0,
          lastActive: serverTimestamp()
        }, { merge: true });

      } else {
        // Login
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      // onLogin will be triggered by onAuthStateChanged in App component
    } catch (err) {
      console.error("Auth error:", err);
      let msg = "發生錯誤，請稍後再試。";
      if (err.code === 'auth/email-already-in-use') msg = "此 Email 已經被註冊過了。";
      else if (err.code === 'auth/wrong-password') msg = "密碼錯誤。";
      else if (err.code === 'auth/user-not-found') msg = "找不到此帳號，請先註冊。";
      else if (err.code === 'auth/weak-password') msg = "密碼強度不足（至少需要 6 個字元）。";
      else if (err.code === 'auth/invalid-email') msg = "Email 格式不正確。";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 max-w-md mx-auto mt-10">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-100 p-4 rounded-full">
            <BookOpen className="w-10 h-10 text-indigo-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">成語狀元榜</h2>
        <p className="text-gray-500 mb-8 text-center">
          {isRegister ? "建立您的學習帳號" : "登入以繼續學習"}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">
            {error}
          </div>
        )}
        
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">暱稱</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 shadow-sm border border-gray-200 rounded-lg w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="例如：成語小博士"
                  required={isRegister}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 shadow-sm border border-gray-200 rounded-lg w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">密碼</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 shadow-sm border border-gray-200 rounded-lg w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="至少 6 個字元"
                required
                minLength={6}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 flex justify-center items-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isRegister ? '註冊帳號' : '登入')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">
            {isRegister ? "已經有帳號了嗎？" : "還沒有帳號嗎？"}
          </span>
          <button 
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="ml-2 text-indigo-600 hover:text-indigo-800 font-bold"
          >
            {isRegister ? "直接登入" : "立即註冊"}
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. Learning Mode Component
const LearningMode = ({ user, userStats, refreshStats }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [learnedIds, setLearnedIds] = useState(new Set());
  const currentIdiom = IDIOM_DATA[currentIndex];

  useEffect(() => {
    // Fetch learned idioms
    if (!user) return;
    const fetchLearned = async () => {
      // NOTE: Using specific path format as per instructions
      const q = collection(db, 'artifacts', appId, 'users', user.uid, 'learned_idioms');
      const querySnapshot = await getDocs(q);
      const ids = new Set();
      querySnapshot.forEach((doc) => ids.add(doc.data().idiomId));
      setLearnedIds(ids);
    };
    fetchLearned();
  }, [user]);

  const markAsLearned = async () => {
    if (!user || learnedIds.has(currentIdiom.id)) return;

    try {
      // 1. Add to private collection
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'learned_idioms', currentIdiom.id), {
        idiomId: currentIdiom.id,
        idiomWord: currentIdiom.word,
        learnedAt: serverTimestamp()
      });

      // 2. Update public stats for leaderboard
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_stats', user.uid), {
        learnedCount: increment(1),
        displayName: user.displayName // ensure name is synced
      }, { merge: true });

      setLearnedIds(prev => new Set(prev).add(currentIdiom.id));
      refreshStats(); // Trigger parent to update local stats view
    } catch (err) {
      console.error("Error marking learned:", err);
    }
  };

  const nextIdiom = () => {
    setCurrentIndex((prev) => (prev + 1) % IDIOM_DATA.length);
  };
  
  const prevIdiom = () => {
    setCurrentIndex((prev) => (prev - 1 + IDIOM_DATA.length) % IDIOM_DATA.length);
  };

  const isLearned = learnedIds.has(currentIdiom.id);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="text-indigo-500" /> 每日成語
        </h3>
        <span className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
          進度: {learnedIds.size} / {IDIOM_DATA.length}
        </span>
      </div>

      <div className="text-center py-8 bg-slate-50 rounded-xl mb-6 relative overflow-hidden">
        {isLearned && (
          <div className="absolute top-2 right-2 text-green-500 flex items-center gap-1 bg-green-50 px-2 py-1 rounded text-xs font-bold">
            <CheckCircle size={14} /> 已學習
          </div>
        )}
        <h1 className="text-5xl font-extrabold text-gray-800 mb-2 tracking-widest">{currentIdiom.word}</h1>
        <p className="text-gray-500 font-mono text-lg">{currentIdiom.pinyin}</p>
      </div>

      <div className="space-y-4 mb-8">
        <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
          <h4 className="font-bold text-amber-800 mb-1">釋義：</h4>
          <p className="text-gray-700">{currentIdiom.meaning}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
          <h4 className="font-bold text-blue-800 mb-1">例句：</h4>
          <p className="text-gray-700">{currentIdiom.example}</p>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button onClick={prevIdiom} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">上一則</button>
        <button 
          onClick={markAsLearned}
          disabled={isLearned}
          className={`flex-1 max-w-xs py-3 px-6 rounded-lg font-bold text-white transition-all transform active:scale-95 flex items-center justify-center gap-2
            ${isLearned 
              ? 'bg-gray-400 cursor-default' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
        >
          {isLearned ? '已加入收藏' : '標記為已學'}
        </button>
        <button onClick={nextIdiom} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">下一則</button>
      </div>
    </div>
  );
};

// 3. Quiz Mode Component
const QuizMode = ({ user, refreshStats }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  const startQuiz = () => {
    setScore(0);
    setQuestionCount(0);
    setIsPlaying(true);
    setShowResult(false);
    generateQuestion();
  };

  const generateQuestion = () => {
    setSelectedOption(null);
    setIsCorrect(null);
    const randomIdiom = IDIOM_DATA[Math.floor(Math.random() * IDIOM_DATA.length)];
    // Shuffle options logic could go here, for now using static options from data
    setCurrentQuestion(randomIdiom);
  };

  const handleAnswer = async (option) => {
    if (selectedOption) return; // Prevent double click
    
    setSelectedOption(option);
    const correct = option === currentQuestion.word;
    setIsCorrect(correct);
    
    let newScore = score;
    if (correct) {
      newScore = score + 10;
      setScore(newScore);
    }

    // Wait a moment then show next or finish
    setTimeout(async () => {
      if (questionCount + 1 >= 5) {
        // Finish Quiz
        await finishQuiz(newScore);
      } else {
        setQuestionCount(prev => prev + 1);
        generateQuestion();
      }
    }, 1500);
  };

  const finishQuiz = async (finalScore) => {
    setIsPlaying(false);
    setShowResult(true);

    if (!user) return;

    try {
      // 1. Save specific quiz result to private history
      await setDoc(doc(collection(db, 'artifacts', appId, 'users', user.uid, 'quiz_results')), {
        score: finalScore,
        totalQuestions: 5,
        timestamp: serverTimestamp()
      });

      // 2. Accumulate total score in public stats
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_stats', user.uid), {
        totalScore: increment(finalScore),
        displayName: user.displayName
      }, { merge: true });

      refreshStats();
    } catch (e) {
      console.error("Error saving score:", e);
    }
  };

  if (showResult) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg mx-auto">
        <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-800 mb-2">測驗完成！</h2>
        <p className="text-gray-500 mb-6">本次測驗共 5 題</p>
        
        <div className="bg-indigo-50 p-6 rounded-xl mb-8">
          <p className="text-sm text-indigo-600 font-bold uppercase tracking-wider">獲得積分</p>
          <p className="text-5xl font-extrabold text-indigo-600">{score}</p>
        </div>

        <button 
          onClick={startQuiz}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition"
        >
          再挑戰一次
        </button>
      </div>
    );
  }

  if (isPlaying && currentQuestion) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <span className="font-bold text-gray-500">第 {questionCount + 1} / 5 題</span>
          <span className="font-bold text-indigo-600">得分: {score}</span>
        </div>

        <div className="mb-8">
          <h3 className="text-lg text-gray-800 mb-2 font-bold">請選出符合解釋的成語：</h3>
          <div className="bg-gray-100 p-4 rounded-lg text-lg text-gray-700">
            "{currentQuestion.meaning}"
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((option, idx) => {
            let btnClass = "bg-white border-2 border-gray-200 hover:border-indigo-400 text-gray-700";
            if (selectedOption === option) {
              if (option === currentQuestion.word) btnClass = "bg-green-100 border-green-500 text-green-800 font-bold";
              else btnClass = "bg-red-100 border-red-500 text-red-800";
            } else if (selectedOption && option === currentQuestion.word) {
               btnClass = "bg-green-100 border-green-500 text-green-800 font-bold";
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                disabled={!!selectedOption}
                className={`p-4 rounded-xl text-left transition-all duration-200 ${btnClass}`}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-lg mx-auto">
      <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">成語隨堂考</h2>
      <p className="text-gray-600 mb-8">測試你的成語實力，每題答對可得 10 分！</p>
      <button 
        onClick={startQuiz}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105"
      >
        開始測驗
      </button>
    </div>
  );
};

// 4. Leaderboard Component
const Leaderboard = ({ user }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all user stats from public collection
    // Note: Due to system rules avoiding complex queries like orderBy, 
    // we fetch the collection and sort in memory.
    const fetchLeaders = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'user_stats'));
        const users = [];
        querySnapshot.forEach((doc) => {
          users.push(doc.data());
        });
        
        // Sort by totalScore descending
        users.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
        
        // Take top 5
        setLeaders(users.slice(0, 5));
      } catch (err) {
        console.error("Error fetching leaderboard", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
    // Set up a simple interval to refresh leaderboard every minute if needed, 
    // or just rely on mount.
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-6 border-b pb-4">
        <Trophy className="text-yellow-500" />
        <h3 className="text-xl font-bold text-gray-800">狀元排行榜</h3>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">讀取中...</div>
      ) : (
        <div className="space-y-4">
          {leaders.map((leader, index) => (
            <div 
              key={index} 
              className={`flex items-center p-3 rounded-lg ${leader.uid === user?.uid ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50'}`}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3
                ${index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                  index === 1 ? 'bg-gray-300 text-gray-800' :
                  index === 2 ? 'bg-orange-300 text-orange-900' : 'bg-gray-200 text-gray-600'}
              `}>
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">{leader.displayName || '無名氏'}</p>
                <p className="text-xs text-gray-500">已學 {leader.learnedCount || 0} 個成語</p>
              </div>
              <div className="font-mono font-bold text-indigo-600">
                {leader.totalScore || 0} 分
              </div>
            </div>
          ))}
          {leaders.length === 0 && (
            <p className="text-center text-gray-500 py-4">目前還沒有人參加測驗，快來當第一名！</p>
          )}
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('learn'); // learn, quiz, leaderboard
  const [initLoading, setInitLoading] = useState(true);
  const [userStats, setUserStats] = useState({ learnedCount: 0, totalScore: 0 });

  // 1. Auth Initialization
  useEffect(() => {
    const initAuth = async () => {
      // Handle environment specific auth tokens if present, else anonymous
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try {
            await signInWithCustomToken(auth, __initial_auth_token);
        } catch(e) { console.error("Token Auth Error", e); }
      }
      // REMOVED anonymous login fallback to support Email Auth exclusively
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setInitLoading(false);
      if (currentUser) {
        fetchUserStats(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserStats = async (uid) => {
    try {
      const docSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_stats', uid));
      if (docSnap.exists()) {
        setUserStats(docSnap.data());
      }
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (initLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">載入中...</div>;
  }

  // Show Registration/Login Screen if no display name
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 font-sans">
        <AuthScreen onLogin={(u) => {
          // setUser({...u}); // Trigger re-render handled by onAuthStateChanged
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <BookOpen size={20} />
            </div>
            <h1 className="font-bold text-xl text-gray-800">成語狀元榜</h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-xs text-gray-500">歡迎回來</span>
                <span className="font-bold text-sm text-indigo-900">{user.displayName || user.email?.split('@')[0]}</span>
             </div>
             <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
               積分: {userStats.totalScore || 0}
             </div>
             <button 
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition ml-1"
                title="登出"
             >
               <LogOut size={18} />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'learn' && (
          <div className="animate-fade-in">
            <LearningMode user={user} userStats={userStats} refreshStats={() => fetchUserStats(user.uid)} />
          </div>
        )}
        
        {activeTab === 'quiz' && (
          <div className="animate-fade-in">
            <QuizMode user={user} refreshStats={() => fetchUserStats(user.uid)} />
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <Leaderboard user={user} />
            <div className="bg-white p-6 rounded-2xl shadow-lg h-fit">
               <div className="flex items-center gap-2 mb-4 border-b pb-4">
                 <User className="text-indigo-500" />
                 <h3 className="text-xl font-bold text-gray-800">個人戰績</h3>
               </div>
               <div className="space-y-4">
                 <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                   <span className="text-gray-600 flex items-center gap-2"><BookOpen size={16}/> 已學成語</span>
                   <span className="font-bold text-2xl text-gray-800">{userStats.learnedCount || 0}</span>
                 </div>
                 <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                   <span className="text-gray-600 flex items-center gap-2"><Trophy size={16}/> 累積積分</span>
                   <span className="font-bold text-2xl text-indigo-600">{userStats.totalScore || 0}</span>
                 </div>
                 <div className="text-xs text-gray-400 mt-4 text-center">
                   ID: {user.uid.slice(0, 8)}...
                 </div>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
        <div className="max-w-md mx-auto flex justify-around p-2">
          <button 
            onClick={() => setActiveTab('learn')}
            className={`flex flex-col items-center p-2 rounded-lg w-20 transition ${activeTab === 'learn' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <BookOpen size={24} className={activeTab === 'learn' ? 'fill-current opacity-20' : ''} />
            <span className="text-xs font-bold mt-1">學習</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('quiz')}
            className={`flex flex-col items-center p-2 rounded-lg w-20 transition ${activeTab === 'quiz' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Brain size={24} className={activeTab === 'quiz' ? 'fill-current opacity-20' : ''} />
            <span className="text-xs font-bold mt-1">測驗</span>
          </button>

          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`flex flex-col items-center p-2 rounded-lg w-20 transition ${activeTab === 'leaderboard' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <BarChart3 size={24} className={activeTab === 'leaderboard' ? 'fill-current opacity-20' : ''} />
            <span className="text-xs font-bold mt-1">榜單</span>
          </button>
        </div>
      </nav>
    </div>
  );
}