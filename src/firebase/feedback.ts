import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { getLearningUserId } from './learning-records';

export type FeedbackInput = {
  content: string;
  device: string;
  os: string;
  screen: string;
};

export async function submitFeedback(input: FeedbackInput): Promise<void> {
  const userId = await getLearningUserId();

  await addDoc(collection(db, 'feedback'), {
    ...input,
    userId,
    userEmail: auth.currentUser?.email ?? null,
    status: 'new',
    createdAt: serverTimestamp(),
  });
}
