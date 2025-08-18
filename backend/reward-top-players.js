// backend/reward-top-players.js


require('dotenv').config();
const { Score, User, sequelize } = require('./DataBase/models');
const { rewardUser } = require('./ontonApi');
const logger = require('./logger');
const { sendWinnerMessage, sendConsolationMessage } = require('./bot');

const TOP_N_PLAYERS = 1;

async function findAndRewardTopPlayers(eventId) {
    if (!eventId) {
        logger.error('CRITICAL: No eventId provided to the reward script. Aborting.');
        return;
    }

    logger.info(`--- Starting Reward Process for Event: ${eventId} ---`);

    try {
        // Step 1: Get ALL unique participants and their highest score for this event
        const allScoresSorted = await Score.findAll({
            where: { eventId: eventId },
            order: [
                ['score', 'DESC'],
                ['createdAt', 'ASC'] // This is the tie-breaker!
            ],
            raw: true,
        });

        if (allScoresSorted.length === 0) {
            logger.info(`No scores found for event ${eventId}. Ending process.`);
            return;
        }

         // حالا که رکوردها مرتب هستند، برنده اولین رکورد در لیست است که کاربر تکراری نداشته باشد.
        const winners = [];
        const uniqueParticipants = [];
        const seenUserIds = new Set();

        for (const scoreRecord of allScoresSorted) {
            const currentUserId = scoreRecord.userTelegramId;
            
            // اولین باری که هر کاربر را می‌بینیم، بالاترین امتیازش است (چون لیست مرتب است)
            if (!seenUserIds.has(currentUserId)) {
                uniqueParticipants.push({
                    userTelegramId: currentUserId,
                    max_score: scoreRecord.score // This is their highest score
                });

                // اگر هنوز به تعداد برنده مورد نظر نرسیده‌ایم، این کاربر را به عنوان برنده اضافه می‌کنیم
                if (winners.length < TOP_N_PLAYERS) {
                    winners.push({
                        userTelegramId: currentUserId,
                        max_score: scoreRecord.score
                    });
                }
                
                seenUserIds.add(currentUserId);
            }
        }
        
        const winnerIds = new Set(winners.map(w => w.userTelegramId));

        if (uniqueParticipants.length === 0) {
            logger.info(`No participants found for event ${eventId}. Ending process.`);
            return;
        }

        // Fetch user details for all participants to get their names
        const allUserIds = uniqueParticipants.map(p => p.userTelegramId);
        const allUsers = await User.findAll({ where: { telegramId: allUserIds }, raw: true });
        const userMap = allUsers.reduce((map, user) => {
            map[user.telegramId] = user;
            return map;
        }, {});

        logger.info(`Found ${uniqueParticipants.length} total participants. Winners: ${winners.length}.`);

        // Step 3: Process rewards for winners
        for (const winner of winners) {
            const userId = winner.userTelegramId;
            const user = userMap[userId];
            const userName = user?.firstName || `Player ${userId}`;
            
            logger.info(`Processing WINNER: User ${userId} (${userName}) with score ${winner.max_score}`);
            try {
                process.env.ONTON_EVENT_UUID = eventId; // Set env for the API call
                const ontonResponse = await rewardUser(userId);
                const rewardLink = ontonResponse?.data?.reward_link;

                if (rewardLink) {
                    // await sendWinnerMessage(userId, userName, winner.max_score, rewardLink);
                } else {
                    logger.error(`Could not get reward link for winner ${userId}.`);
                }
            } catch (error) {
                logger.error(`FAILED to process ONTON reward for winner ${userId}. Reason: ${error.message}`);
            }
        }
        
        // Step 4: Send consolation messages to everyone else
        for (const participant of uniqueParticipants) {
            const userId = participant.userTelegramId;
            // Check if this user is NOT in the winners set
            if (!winnerIds.has(userId)) {
                const user = userMap[userId];
                const userName = user?.firstName || `Player ${userId}`;
                
                logger.info(`Processing NON-WINNER: User ${userId} (${userName}) with score ${participant.max_score}`);
                // await sendConsolationMessage(userId, userName, participant.max_score);
            }
        }

        logger.info(`--- Reward Process Finished for Event: ${eventId} ---`);

    } catch (error) {
        logger.error(`A critical error occurred during the reward process: ${error.message}`, { stack: error.stack });
    }
}

// Allow script to be run from the command line
if (require.main === module) {
    const eventIdFromArgs = process.argv[2];
    if (!eventIdFromArgs) {
        console.log("Usage: node reward-top-players.js <event-id>");
        process.exit(1);
    }
    findAndRewardTopPlayers(eventIdFromArgs);
}

module.exports = { findAndRewardTopPlayers };