import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// کامپوننت‌های اصلی برنامه
import Game from "./components/Game"; // <-- کامپوننت بازی 2048 جایگزین شده است
import GameLobby from "./components/GameLobby";
import Leaderboard from "./components/Leaderboard";
import DefaultAvatar from "./assets/default-avatar.png";

// آدرس API بک‌اند شما (دست‌نخورده)
const API_BASE = "https://momis2048.momis.studio/api";

function App() {
    // --- State های اصلی مدیریت برنامه (دست‌نخورده) ---
    const [view, setView] = useState("auth"); // auth, lobby, game, board
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(() => {
        const saved = localStorage.getItem("userData");
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem("jwtToken") || null);
    
    // --- State های مربوط به بازی و لیدربورد (منطق اصلی حفظ شده) ---
    const [leaderboardKey, setLeaderboardKey] = useState(Date.now());
    const [currentGameEventId, setCurrentGameEventId] = useState(null);
    const [finalScore, setFinalScore] = useState(null); // این state برای نمایش امتیاز در لیدربورد لازم است

    // --- منطق اصلی احراز هویت (کاملاً دست‌نخورده) ---
    const authenticateUser = useCallback(async () => {
        setAuthLoading(true);
        setError(null);
        try {
            const initData = window.Telegram?.WebApp?.initData;
            if (!initData) {
                console.warn("Running in non-Telegram environment.");
                // برای تست در محیط غیر تلگرام، می‌توانیم لاگین را شبیه‌سازی کنیم
                setIsAuthenticated(true);
                setView("lobby");
                setAuthLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE}/telegram-auth`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ initData }),
            });
            const data = await response.json();

            if (!response.ok || !data.valid) {
                throw new Error(data.message || "Authentication failed");
            }

            setToken(data.token);
            setUserData(data.user);
            localStorage.setItem("jwtToken", data.token);
            localStorage.setItem("userData", JSON.stringify(data.user));
            setIsAuthenticated(true);
            setView("lobby");
        } catch (error) {
            console.error("Authentication error:", error);
            setError(error.message);
            setIsAuthenticated(false);
            setView("auth");
        } finally {
            setAuthLoading(false);
        }
    }, []);
    
    // --- مدیریت شروع بازی (ساده‌سازی شده برای بازی 2048) ---
    const startGame = useCallback((eventId) => {
        console.log(`%c[startGame] Starting new 2048 game for event: ${eventId}`, "color: #00FF7F; font-weight: bold;");
        
        setCurrentGameEventId(eventId);
        setFinalScore(null); // ریست کردن امتیاز نهایی قبل از شروع بازی جدید
        
        if (!isAuthenticated) {
            setError("Please authenticate first");
            setView("auth");
            return;
        }
        
        setView("game"); // انتقال کاربر به صفحه بازی
    }, [isAuthenticated]);

    // --- مدیریت پایان بازی و ارسال امتیاز (منطق اصلی حفظ شده) ---
    const handleGameEnd = useCallback(async (score) => {
        console.log(`%c[handleGameEnd] 2048 Game Over. Final Score to send: ${score}`, "color: #DC143C;");
        
        setFinalScore(score); // ذخیره امتیاز برای نمایش در لیدربورد
        
        // منطق ارسال امتیاز به سرور کاملاً دست‌نخورده باقی مانده است
        if (score > 0 && token) {
            try {
                const response = await fetch(`${API_BASE}/gameOver`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        score: score,
                        eventId: currentGameEventId,
                    }),
                });
                const result = await response.json();
                console.log("Score submission result:", result);
                // بعد از ارسال موفق امتیاز، کلید لیدربورد را تغییر می‌دهیم تا رفرش شود
                setLeaderboardKey(Date.now());
            } catch (err) {
                console.error("Failed to save score:", err);
                setError("Error in saving the score");
            }
        }
        
        // بعد از یک تاخیر کوتاه، به صفحه لیدربورد منتقل شو
        setTimeout(() => {
            setView("board");
        }, 500);

    }, [token, currentGameEventId]);

    // --- توابع کمکی (دست‌نخورده) ---
    const handleLogout = useCallback(() => {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("userData");
        setToken(null);
        setUserData(null);
        setIsAuthenticated(false);
        setView("auth");
    }, []);

    const handleImageError = useCallback((e) => {
        if (e.target.src !== DefaultAvatar) {
            e.target.src = DefaultAvatar;
        }
    }, []);

    // --- Effect برای بررسی وضعیت لاگین کاربر (دست‌نخورده) ---
    useEffect(() => {
        if (token && userData) {
            setIsAuthenticated(true);
            setView("lobby");
            setAuthLoading(false);
        } else {
            authenticateUser();
        }
    }, [authenticateUser, token, userData]);


    // --- رندر کردن محتوای هر صفحه با استفاده از useMemo برای بهینه‌سازی ---
    const authContent = useMemo(() => view === "auth" && (
        <div className="flex flex-col items-center justify-center text-center h-screen px-4">
            <motion.h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                2048
            </motion.h1>
            <motion.p className="text-lg text-gray-300 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                Join the numbers and get to the 2048 tile!
            </motion.p>
            {authLoading ? (
                <p className="text-lg text-gray-400 animate-pulse">Connecting...</p>
            ) : (
                <motion.button onClick={authenticateUser} className="px-8 py-3 bg-orange-600 text-white rounded-xl text-xl font-bold shadow-lg hover:bg-orange-700 transition-all duration-300" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    Login with Telegram
                </motion.button>
            )}
            {error && <p className="text-red-400 mt-4">{error}</p>}
        </div>
    ), [view, authLoading, error, authenticateUser]);

    const lobbyContent = useMemo(() => view === "lobby" && (
        <GameLobby onGameStart={startGame} userData={userData} onLogout={handleLogout} onImageError={handleImageError} />
    ), [view, startGame, userData, handleLogout, handleImageError]);

    const gameContent = useMemo(() => view === "game" && (
        // کامپوننت بازی 2048 با پراپ‌های مورد نیاز رندر می‌شود
        <Game onGameOver={handleGameEnd} onExit={() => setView("lobby")} />
    ), [view, handleGameEnd]);

    const leaderboardContent = useMemo(() => view === "board" && (
        <Leaderboard key={leaderboardKey} API_BASE={API_BASE} finalScore={finalScore} onReplay={startGame} onHome={() => setView("lobby")} userData={userData} eventId={currentGameEventId} />
    ), [view, leaderboardKey, finalScore, startGame, userData, currentGameEventId]);

    // --- JSX نهایی برنامه ---
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-white p-4 font-[Vazirmatn]">
            {error && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-md shadow-lg z-50">
                    {error}
                </div>
            )}
            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full flex flex-col items-center justify-center"
                >
                    {view === "auth" && authContent}
                    {view === "lobby" && lobbyContent}
                    {view === "game" && gameContent}
                    {view === "board" && leaderboardContent}
                </motion.div>
            </AnimatePresence>
            <img src={`${process.env.PUBLIC_URL}/teamlogo.png`} alt="Team Logo" className="absolute bottom-4 right-4 w-24 opacity-70 pointer-events-none" />
        </div>
    );
}

export default React.memo(App);