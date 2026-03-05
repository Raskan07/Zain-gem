import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface ActivityLog {
    title: string;
    timestamp: any;
    date: string; // Formatting for display
}

export const logActivity = async (title: string) => {
    try {
        const activityLogsCollection = collection(db, 'activity_logs');
        await addDoc(activityLogsCollection, {
            title,
            timestamp: serverTimestamp(),
            date: new Date().toLocaleString(),
        });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};
