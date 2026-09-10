interface StreakData {
    currentStreaks: { general: number; anime: number; manga: number };
    longestStreaks: { general: number; anime: number; manga: number };
    lastUpdateDate: string;
    lastTitle: string;
    history: Array<{ date: string; title: string; type: string }>;
}