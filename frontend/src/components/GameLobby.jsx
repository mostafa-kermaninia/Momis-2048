import React, { useState, useEffect } from "react";
import DefaultAvatar from "../assets/default-avatar.png";
import MyLeaderboardIcon_B from "../assets/LI-B.png"; // <-- این خط را اضافه کنید
import MyLeaderboardIcon_G from "../assets/LI-G.png"; // <-- این خط را اضافه کنید
import { ClipboardIcon } from "@heroicons/react/24/outline";


const GameLobby = ({
    onGameStart,
    onShowLeaderboard,
    userData,
    onLogout,
    onImageError,
}) => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [invitedNum, setInvitedNum] = useState(0);

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
                    setInvitedNum(response.invitedNum);
                }
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const handleCopyLink = async () => {
        const inviteLink = `https://t.me/${userData.bot_username || 'Momis_2048_bot'}?start=invite_${userData.id}`;
        try {
        const textarea = document.createElement('textarea');
        textarea.value = inviteLink;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        } catch (err) {
        console.error('Failed to copy text: ', err);
        }
    };

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
                <div className="relative flex items-center gap-4 bg-black/20 p-1 rounded-xl mb-8">
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
                    <div className="flex flex-grow justify-between items-center">
                        <div>
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
                                className="text-xs sm:text-sm bg-red-500/60 hover:bg-red-500/90 text-white font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors shadow-md"
                                title="Logout"
                            >
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* بخش جدید: نمایش تعداد دوستان دعوت‌شده و دکمه Invite Friends */}
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4 my-3 transition-transform transform hover:scale-105 text-center">
                <h2 className="text-lg font-bold text-white mb-2">
                Total Invited Friends: {invitedNum}
                </h2>
                <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-lg transition-colors"
                >
                Invite Friends
                </button>
            </div>

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
                        className="p-2 bg-slate-700/80 hover:bg-slate-600 rounded-lg transition-colors"
                        onClick={() => onShowLeaderboard(null)}
                        title="View Leaderboard"
                    >
                        <img
                            src={MyLeaderboardIcon_B}
                            alt="Leaderboard"
                            className="h-8 w-8" // <-- اندازه بزرگ‌تر
                        />
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
                            className="p-2 bg-slate-700/80 hover:bg-slate-600 rounded-lg transition-colors"
                            onClick={() => onShowLeaderboard(event.id)}
                            title="View Leaderboard"
                        >
                            <img
                                src={MyLeaderboardIcon_G}
                                alt="Leaderboard"
                                className="h-8 w-8" // <-- اندازه بزرگ‌تر
                            />
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

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-gray-800 bg-opacity-90 rounded-xl p-6 w-full max-w-sm">
                    <h2 className="text-2xl font-bold text-white mb-4 text-center">
                    Invite a Friend
                    </h2>
                    <h3 className="text-gray-300 font-semibold mb-2">How it works:</h3>
                    <ol className="list-decimal list-inside text-gray-400 mb-4 space-y-2">
                    <li>Copy your personal invite link below.</li>
                    <li>Send it to your friends.</li>
                    <li>When they join and play, you will get some rewards!</li>
                    </ol>
                    <div className="bg-gray-700 rounded-lg p-3 break-all mb-4 text-sm text-gray-300">
                    {`https://t.me/${userData.bot_username || 'Momis_2048_bot'}?start=invite_${userData.id}`}
                    </div>
                    <div className="flex space-x-4">
                    <button
                        onClick={handleCopyLink}
                        className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-bold transition-colors ${
                        copied
                            ? "bg-green-500 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                    >
                        <ClipboardIcon className="h-5 w-5" />
                        <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                    </div>
                    <button
                    onClick={() => setIsModalOpen(false)}
                    className="mt-4 w-full text-center text-gray-400 hover:text-white transition-colors"
                    >
                    Close
                    </button>
                </div>
               </div>
            )}
        </div>
    );
};

export default GameLobby;
