import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

/** Uploads a device-only photo and returns a permanent Firebase Storage URL. */
export async function uploadProfileImage(userId: string, imageUri: string | null): Promise<string | null> {
  if (!imageUri || imageUri.startsWith('http://') || imageUri.startsWith('https://')) return imageUri;

  const response = await fetch(imageUri);
  if (!response.ok) throw new Error('선택한 프로필 사진을 읽지 못했습니다.');

  const blob = await response.blob();
  const imageRef = ref(storage, `users/${userId}/profile/avatar`);
  await uploadBytes(imageRef, blob, { contentType: blob.type || 'image/jpeg' });
  return getDownloadURL(imageRef);
}

/** Removes the account-owned avatar when its user account is deleted. */
export async function deleteProfileImage(userId: string): Promise<void> {
  try {
    await deleteObject(ref(storage, `users/${userId}/profile/avatar`));
  } catch (error) {
    if ((error as { code?: string }).code !== 'storage/object-not-found') throw error;
  }
}
