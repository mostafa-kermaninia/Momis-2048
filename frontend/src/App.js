import React, { useState, useEffect, useCallback, useMemo } from "react";
import Leaderboard from "./components/Leaderboard";
import GameLobby from "./components/GameLobby";
import Game2048 from "./components/Game2048";
import DefaultAvatar from "./assets/default-avatar.png"; // مسیر را چک کنید
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "https://momis2048.momis.studio/api";
const tg = window.Telegram?.WebApp;

function App() {
    const [bestScore, setBestScore] = useState(0); // ✨ State جدید
    const [view, setView] = useState("auth");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(() => {
        const saved = localStorage.getItem("userData");
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState(
        () => localStorage.getItem("jwtToken") || null
    );
    const [leaderboardKey, setLeaderboardKey] = useState(Date.now());
    const [currentGameEventId, setCurrentGameEventId] = useState(null);
    const [finalScore, setFinalScore] = useState(null);
    const [isSoundOn, setIsSoundOn] = useState(true); // <-- این خط را اضافه کنید

    const handleShowLeaderboard = useCallback((eventId) => {
        setFinalScore(null); // <-- ✅ این خط، امتیاز بازی قبلی را پاک می‌کند
        setCurrentGameEventId(eventId); // ذخیره می‌کنیم کدام لیدربورد نمایش داده شود
        setView("board");
        setLeaderboardKey(Date.now()); // برای رفرش شدن کامپوننت
    }, []);

    // داخل فایل App.js

    const handleGameOver = useCallback(
        async (score, scenario) => {
            // scenario حالا شامل moves و newTiles است
            console.log(
                `[App.js] Game Over. Final Score: ${score}. Sending scenario with ${scenario.moves.length} moves.`
            );
            setFinalScore(score);

            if (token) {
                try {
                    // ✅ این بخش را اصلاح می‌کنیم
                    const body = {
                        // کل آبجکت scenario را تحت کلید gameScenario ارسال می‌کنیم
                        gameScenario: scenario,
                        eventId: currentGameEventId,
                    };

                    // هیچ تغییر دیگری در fetch لازم نیست
                    await fetch(`${API_BASE}/gameOver`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(body),
                    });
                } catch (err) {
                    console.error("Failed to save score:", err);
                    setError("Failed to save score");
                }
            }

            setTimeout(() => {
                setView("board");
                setLeaderboardKey(Date.now());
            }, 2000);
        },
        [token, currentGameEventId]
    );

    const fetchBestScore = useCallback(
        async (eventId, currentToken) => {
            const eventParam = eventId || "freeplay";
            const tokenToUse = currentToken || token;

            if (!tokenToUse) return;

            try {
                const response = await fetch(
                    `${API_BASE}/best-score/${eventParam}`,
                    {
                        headers: {
                            Authorization: `Bearer ${tokenToUse}`,
                        },
                    }
                );
                if (response.ok) {
                    const data = await response.json();
                    setBestScore(data.bestScore);
                } else {
                    setBestScore(0); // در صورت خطا، بهترین امتیاز صفر است
                }
            } catch (error) {
                console.error("Failed to fetch best score:", error);
                setBestScore(0);
            }
        },
        [token]
    );

    const startGame = useCallback(
        (eventId) => {
            console.log(`[App.js] Starting Game for event: ${eventId}`);
            setCurrentGameEventId(eventId);
            fetchBestScore(eventId, token);

            if (!isAuthenticated || !token) {
                setError("Please authenticate first");
                setView("auth");
                return;
            }

            setFinalScore(null);
            setView("game");
        },
        [isAuthenticated, token, fetchBestScore]
    );

    const authenticateUser = useCallback(async () => {
        setAuthLoading(true);
        setError(null);
        try {
            // ✨ دیگر مستقیماً چک نمی‌کنیم، چون این تابع فقط وقتی تلگرام آماده باشد صدا زده می‌شود
            const initData = tg.initData;

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

    // ✨ useEffect اصلی با منطق کاملاً بازنویسی شده و بهینه
    useEffect(() => {
        const initApp = async () => {
            // اولویت اول: آیا توکن و داده معتبر در حافظه وجود دارد؟
            const storedToken = localStorage.getItem("jwtToken");
            const storedUserData = localStorage.getItem("userData");

            if (storedToken && storedUserData) {
                console.log("Authentication from localStorage.");
                setToken(storedToken);
                setUserData(JSON.parse(storedUserData));
                setIsAuthenticated(true);
                setView("lobby");
                setAuthLoading(false);
                return; // <-- پایان فرآیند
            }

            // اولویت دوم: آیا در محیط تلگرام هستیم و داده برای احراز هویت داریم؟
            if (tg && tg.initData) {
                console.log("Authenticating with Telegram data...");
                // تابع authenticateUser فقط همین یک بار فراخوانی می‌شود
                await authenticateUser();
                return; // <-- پایان فرآیند
            }

            // حالت بازگشتی: برای محیط تست خارج از تلگرام
            console.warn("Running in non-Telegram development mode.");
            setIsAuthenticated(true);
            setView("lobby");
            setAuthLoading(false);
        };

        if (tg) {
            tg.ready();
            tg.expand();
        }

        initApp();
    }, [authenticateUser]); // فقط به authenticateUser وابسته است
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

    const handleGoHome = useCallback(() => {
        setView("lobby");
    }, []);
    const toggleSound = useCallback(() => {
        setIsSoundOn((prev) => !prev);
    }, []);
    const authContent = useMemo(
        () =>
            view === "auth" && (
                <div className="flex flex-col items-center justify-center text-center h-screen px-4">
                    <motion.h1
                        className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        MOMIS 2048
                    </motion.h1>
                    <motion.p
                        className="text-lg text-gray-300 mb-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Ready to challenge your mind?
                    </motion.p>

                    {authLoading ? (
                        <p className="text-lg text-gray-400 animate-pulse">
                            Connecting...
                        </p>
                    ) : (
                        <motion.button
                            onClick={authenticateUser}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl text-xl font-bold shadow-lg hover:bg-blue-700 transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Login with Telegram
                        </motion.button>
                    )}

                    {error && <p className="text-red-400 mt-4">{error}</p>}
                </div>
            ),
        [view, authLoading, error, authenticateUser]
    );

    const lobbyContent = useMemo(
        () =>
            view === "lobby" && (
                <GameLobby
                    onGameStart={startGame}
                    onShowLeaderboard={handleShowLeaderboard}
                    userData={userData}
                    onLogout={handleLogout}
                    onImageError={handleImageError}
                />
            ),
        [
            view,
            startGame,
            userData,
            handleLogout,
            handleImageError,
            handleShowLeaderboard,
        ]
    );

    const gameContent = useMemo(
        () =>
            view === "game" && (
                <div className="flex flex-col items-center gap-6 w-full max-w-md text-center">
                    {/* ✨ پاس دادن هر دو تابع */}
                    <Game2048
                        onGameOver={handleGameOver}
                        onGoHome={handleGoHome}
                        eventId={currentGameEventId}
                        // ✨ بهترین امتیاز را به عنوان prop به کامپوننت بازی پاس می‌دهیم
                        initialBestScore={bestScore}
                        isSoundOn={isSoundOn} // <-- prop جدید
                        toggleSound={toggleSound} // <-- prop جدید
                    />
                </div>
            ),
        [
            view,
            handleGameOver,
            handleGoHome,
            bestScore,
            currentGameEventId,
            isSoundOn,
            toggleSound,
        ]
    );

    const leaderboardContent = useMemo(
        () =>
            view === "board" && (
                <Leaderboard
                    key={leaderboardKey}
                    API_BASE={API_BASE}
                    finalScore={finalScore}
                    onReplay={startGame}
                    onHome={() => setView("lobby")}
                    userData={userData}
                    eventId={currentGameEventId}
                />
            ),
        [
            view,
            leaderboardKey,
            finalScore,
            startGame,
            userData,
            currentGameEventId,
        ]
    );

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-momis-blue to-momis-purple text-white p-4 font-[Vazirmatn]">
            {error && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-md shadow-lg z-50">
                    {error}
                </div>
            )}
            <AnimatePresence mode="wait">
                <motion.div
                    key={view} // کلید انیمیشن، نام view فعلی است
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

            <img
                src={`${process.env.PUBLIC_URL}/teamlogo.png`}
                alt="Team Logo"
                className="absolute bottom-4 right-4 w-20 opacity-50 pointer-events-none"
            />
        </div>
    );
}

export default React.memo(App);
