import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { deleteUser, GoogleAuthProvider, linkWithCredential, reauthenticateWithCredential, signInWithCredential, signOut, type User } from 'firebase/auth';
import { auth } from './firebase';

const GOOGLE_WEB_CLIENT_ID = '513534244833-132rku5ihqh1qlrjdkcj8mmlqbqgci2t.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
});

export type SignedInProfile = {
  name: string;
  email: string;
  imageUri: string | null;
};

function toProfile(user: User): SignedInProfile {
  return {
    name: user.displayName ?? 'Gentalk Learner',
    email: user.email ?? '',
    imageUri: user.photoURL,
  };
}

/** 익명 계정이 있으면 Google 계정과 연결해 기존 학습 기록을 유지합니다. */
export async function signInWithGoogle(): Promise<SignedInProfile | null> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return null;

  const idToken = response.data.idToken;
  if (!idToken) throw new Error('Google 인증 토큰을 가져오지 못했습니다.');

  const credential = GoogleAuthProvider.credential(idToken);
  const currentUser = auth.currentUser;
  const result = currentUser?.isAnonymous
    ? await linkWithCredential(currentUser, credential)
    : await signInWithCredential(auth, credential);

  return toProfile(result.user);
}

export async function signOutFromGoogle(): Promise<void> {
  await Promise.allSettled([GoogleSignin.signOut(), signOut(auth)]);
}

async function getGoogleCredential() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) throw new Error('Google 계정 확인이 취소되었습니다.');

  const idToken = response.data.idToken;
  if (!idToken) throw new Error('Google 인증 토큰을 가져오지 못했습니다.');
  return GoogleAuthProvider.credential(idToken);
}

/** Re-confirms the signed-in Google account before a security-sensitive action. */
export async function reauthenticateCurrentGoogleAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) throw new Error('Google 로그인 계정을 찾을 수 없습니다.');

  const credential = await getGoogleCredential();
  await reauthenticateWithCredential(user, credential);
}

/** Permanently removes the already re-confirmed Firebase account. */
export async function deleteCurrentGoogleAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) throw new Error('Google 로그인 계정을 찾을 수 없습니다.');

  await deleteUser(user);
  await GoogleSignin.signOut().catch(() => undefined);
}
