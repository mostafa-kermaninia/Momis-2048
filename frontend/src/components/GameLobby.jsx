import React, { useState, useEffect } from "react";
import DefaultAvatar from "../assets/default-avatar.png";

// آیکون برای دکمه لیدربورد
const LeaderboardIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
    >
        <path
            fillRule="evenodd"
            d="M10 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zM4 10a1 1 0 011-1h2a1 1 0 110 2H5a1 1 0 01-1-1zm12 0a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1zM13 6a1 1 0 100 2h2a1 1 0 100-2h-2z"
            clipRule="evenodd"
        />
    </svg>
);

const GameLobby = ({
    onGameStart,
    onShowLeaderboard,
    userData,
    onLogout,
    onImageError,
}) => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("/api/events", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "jwtToken"
                        )}`,
                    },
                }).then((res) => res.json());
                if (response.status === "success") {
                    setEvents(response.events);
                }
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    if (isLoading) {
        return (
            <div className="text-white text-lg animate-pulse">
                Loading Game Modes...
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 text-white animate-fade-in border border-slate-700">
            {userData && (
                <div className="flex items-center gap-4 bg-black/20 p-3 rounded-xl mb-8">
                    <img
                        src={
                            userData.photo_url
                                ? `/api/avatar?url=${encodeURIComponent(
                                      userData.photo_url
                                  )}`
                                : DefaultAvatar
                        }
                        alt="Profile"
                        className="w-14 h-14 rounded-full border-2 border-indigo-400"
                        onError={onImageError}
                    />
                    <div className="flex-grow">
                        <h2 className="font-bold text-xl leading-tight text-white">
                            {userData.first_name} {userData.last_name}
                        </h2>
                        <p className="text-sm opacity-70">
                            @{userData.username}
                        </p>
                    </div>
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className="ml-auto text-xs bg-red-600/70 px-3 py-1.5 rounded-md hover:bg-red-600/90 transition-colors"
                            title="Logout"
                        >
                            Logout
                        </button>
                    )}
                </div>
            )}

            <h1 className="text-3xl font-bold mb-6 text-center text-white">
                Select Mode
            </h1>

            {/* کارت بازی آزاد */}
            <div className="bg-black/20 rounded-xl p-5 my-4 border border-slate-700 transition-all transform hover:scale-[1.02] hover:border-blue-500">
                <h2 className="text-xl font-bold text-blue-400">Free Play</h2>
                <p className="text-sm text-slate-300 mt-1 mb-4">
                    Practice and play just for fun.
                </p>
                <div className="flex items-center gap-3">
                    <button
                        className="flex-grow bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg"
                        onClick={() => onGameStart(null)}
                    >
                        Play
                    </button>
                    <button
                        className="p-3 bg-slate-700/80 hover:bg-slate-600 rounded-lg transition-colors"
                        onClick={() => onShowLeaderboard(null)}
                        title="View Leaderboard"
                    >
                        <LeaderboardIcon />
                    </button>
                </div>
            </div>

            {/* کارت‌های ایونت‌ها */}
            {events.map((event) => (
                <div
                    key={event.id}
                    className="bg-black/20 rounded-xl p-5 my-4 border border-slate-700 transition-all transform hover:scale-[1.02] hover:border-green-500"
                >
                    <h2 className="text-xl font-bold text-green-400">
                        {event.name}
                    </h2>
                    <p className="text-sm text-slate-300 mt-1 mb-4">
                        {event.description}
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            className="flex-grow bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg"
                            onClick={() => onGameStart(event.id)}
                        >
                            Join Event
                        </button>
                        <button
                            className="p-3 bg-slate-700/80 hover:bg-slate-600 rounded-lg transition-colors"
                            onClick={() => onShowLeaderboard(event.id)}
                            title="View Leaderboard"
                        >
                            <LeaderboardIcon />
                        </button>
                    </div>
                </div>
            ))}
            {events.length === 0 && !isLoading && (
                <div className="bg-black/20 rounded-xl p-5 my-4 border border-slate-700 cursor-not-allowed opacity-60">
                    <h2 className="text-xl font-bold text-slate-500">
                        No Active Tournaments
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Check back later for new events!
                    </p>
                </div>
            )}
        </div>
    );
};

export default GameLobby;
