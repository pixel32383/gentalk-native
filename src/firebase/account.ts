import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { deleteProfileImage } from './profile-images';

const USER_SUBCOLLECTIONS = ['learningRecords', 'inProgressLearning', 'dailySentences'] as const;

async function deleteCollectionDocuments(path: readonly string[]) {
  const snapshot = await getDocs(collection(db, path.join('/')));
  const documents = snapshot.docs;

  for (let index = 0; index < documents.length; index += 400) {
    const batch = writeBatch(db);
    documents.slice(index, index + 400).forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
}

async function deleteFeedbackDocuments(userId: string) {
  const snapshot = await getDocs(query(collection(db, 'feedback'), where('userId', '==', userId)));
  const documents = snapshot.docs;

  for (let index = 0; index < documents.length; index += 400) {
    const batch = writeBatch(db);
    documents.slice(index, index + 400).forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
}

/** Removes every user-owned Firestore document and device cache before Auth is deleted. */
export async function deleteUserData(userId: string): Promise<void> {
  await Promise.all([
    ...USER_SUBCOLLECTIONS.map((name) => deleteCollectionDocuments(['users', userId, name])),
    deleteFeedbackDocuments(userId),
    deleteProfileImage(userId),
  ]);
  await deleteDoc(doc(db, 'users', userId));

  await AsyncStorage.multiRemove([
    `@gentalk/learning-records/${userId}`,
    `@gentalk/daily-sentences/${userId}`,
    `@gentalk/daily-sentence-settings/${userId}`,
    `@gentalk/voice-settings/${userId}`,
    `@gentalk/voice-mode/${userId}`,
  ]);
}
