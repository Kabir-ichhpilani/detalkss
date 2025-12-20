import * as SecureStore from 'expo-secure-store';

const getKeys = (userId: string) => ({
    STREAK_KEY: `detalks_streak_${userId}`,
    LAST_DATE_KEY: `detalks_last_call_date_${userId}`
});

export const getStreak = async (userId: string) => {
    if (!userId) return 0;
    const { STREAK_KEY } = getKeys(userId);
    try {
        const streak = await SecureStore.getItemAsync(STREAK_KEY);
        return streak ? parseInt(streak, 10) : 0;
    } catch (error) {
        console.error('Error getting streak:', error);
        return 0;
    }
};

export const updateStreak = async (userId: string) => {
    if (!userId) return 0;
    const { STREAK_KEY, LAST_DATE_KEY } = getKeys(userId);

    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        const lastDate = await SecureStore.getItemAsync(LAST_DATE_KEY);
        let currentStreak = await getStreak(userId);

        if (lastDate === today) {
            // Already updated today
            return currentStreak;
        }

        if (lastDate) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastDate === yesterdayStr) {
                currentStreak += 1;
            } else {
                // Missed a day
                currentStreak = 1;
            }
        } else {
            // First time
            currentStreak = 1;
        }

        await SecureStore.setItemAsync(LAST_DATE_KEY, today);
        await SecureStore.setItemAsync(STREAK_KEY, currentStreak.toString());

        return currentStreak;
    } catch (error) {
        console.error('Error updating streak:', error);
        return 0;
    }
};
