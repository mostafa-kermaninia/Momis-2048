import React, { useState, useEffect } from "react";
import DefaultAvatar from "../assets/default-avatar.png";
import MyLeaderboardIcon_B from "../assets/LI-B.png"; // <-- این خط را اضافه کنید
import MyLeaderboardIcon_G from "../assets/LI-G.png"; // <-- این خط را اضافه کنید
import { ClipboardIcon } from "@heroicons/react/24/outline";
import {
    ClipboardIcon,
    CubeTransparentIcon, // <-- این خط را اضافه کنید
    UserGroupIcon, // <-- این خط را اضافه کنید
} from "@heroicons/react/24/outline";

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
    const [activeTab, setActiveTab] = useState("play"); // <-- این خط را اضافه کنید

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
        const inviteLink = `https://t.me/${
            userData.bot_username || "Momis_2048_bot"
        }?start=invite_${userData.id}`;
        try {
            const textarea = document.createElement("textarea");
            textarea.value = inviteLink;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);

            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
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
        <div className="w-full max-w-md mx-auto bg-transparent text-white relative min-h-screen flex flex-col">
            {/* بخش اصلی محتوا که اسکرول می‌خورد */}
            <div className="flex-grow overflow-y-auto px-4 pt-6 pb-28">
                {/* بخش پروفایل کاربر */}
                {userData && (
                    <div className="relative flex items-center gap-4 bg-black/20 p-2 rounded-xl mb-6 ring-1 ring-slate-700">
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

                {/* محتوای متغیر تب‌ها با انیمیشن */}
                <div key={activeTab} className="animate-fade-in">
                    {/* تب بازی */}
                    {activeTab === "play" && (
                        <>
                            <h1 className="text-3xl font-bold mb-4 text-center text-white">
                                Select Mode
                            </h1>
                            {/* کارت بازی آزاد */}
                            <div className="bg-black/20 rounded-xl p-5 my-4 border border-slate-700 transition-all transform hover:scale-[1.02] hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/30">
                                <h2 className="text-xl font-bold text-cyan-400">
                                    Free Play
                                </h2>
                                <p className="text-sm text-slate-300 mt-1 mb-4">
                                    Practice and play just for fun.
                                </p>
                                <div className="flex items-center gap-3">
                                    <button
                                        className="flex-grow bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg"
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
                                            className="h-8 w-8"
                                        />
                                    </button>
                                </div>
                            </div>
                            {/* کارت‌های ایونت‌ها */}
                            {events.map((event) => (
                                <div
                                    key={event.id}
                                    className="bg-black/20 rounded-xl p-5 my-4 border border-slate-700 transition-all transform hover:scale-[1.02] hover:border-green-500 hover:shadow-lg hover:shadow-green-500/30"
                                >
                                    <h2 className="text-xl font-bold text-green-400">
                                        {event.name}
                                    </h2>
                                    <p className="text-sm text-slate-300 mt-1 mb-4">
                                        {event.description}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <button
                                            className="flex-grow bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg"
                                            onClick={() =>
                                                onGameStart(event.id)
                                            }
                                        >
                                            Join Event
                                        </button>
                                        <button
                                            className="p-2 bg-slate-700/80 hover:bg-slate-600 rounded-lg transition-colors"
                                            onClick={() =>
                                                onShowLeaderboard(event.id)
                                            }
                                            title="View Leaderboard"
                                        >
                                            <img
                                                src={MyLeaderboardIcon_G}
                                                alt="Leaderboard"
                                                className="h-8 w-8"
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
                        </>
                    )}

                    {/* تب دوستان */}
                    {activeTab === "friends" && (
                        <>
                            <h1 className="text-3xl font-bold mb-4 text-center text-white">
                                Invite Friends
                            </h1>
                            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 rounded-xl p-5 my-3 text-center border border-yellow-500/50">
                                <h2 className="text-lg font-bold text-white mb-2">
                                    Total Invited Friends: {invitedNum}
                                </h2>
                                <p className="text-sm text-yellow-200/80 mb-4">
                                    Invite friends and earn rewards together!
                                </p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-yellow-500/20"
                                >
                                    Get Invite Link
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* نوار ناوبری ثابت در پایین صفحه */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-black/30 backdrop-blur-lg border-t border-slate-700">
                <div className="flex justify-around items-center px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                    <button
                        onClick={() => setActiveTab("play")}
                        className={`flex flex-col items-center gap-1 w-full transition-colors duration-200 ${
                            activeTab === "play"
                                ? "text-cyan-400"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <CubeTransparentIcon className="h-7 w-7" />
                        <span className="text-xs font-bold">Play</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("friends")}
                        className={`flex flex-col items-center gap-1 w-full transition-colors duration-200 ${
                            activeTab === "friends"
                                ? "text-yellow-400"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <UserGroupIcon className="h-7 w-7" />
                        <span className="text-xs font-bold">Friends</span>
                    </button>
                </div>
            </div>

            {/* مودال دعوت دوستان (بدون تغییر) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fade-in">
                    {/* ... محتوای مودال بدون تغییر ... */}
                </div>
            )}
        </div>
    );
};

export default GameLobby;
