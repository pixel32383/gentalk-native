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

export type GoogleSignInResult = {
  profile: SignedInProfile;
  /** True when an existing Google account was used instead of linking the anonymous account. */
  switchedFromAnonymousAccount: boolean;
};

function toProfile(user: User): SignedInProfile {
  return {
    name: user.displayName ?? 'Gentalk Learner',
    email: user.email ?? '',
    imageUri: user.photoURL,
  };
}

/**
 * 익명 계정이면 먼저 Google 계정 연결을 시도합니다.
 * 이미 다른 Firebase 계정에 연결된 Google 계정인 경우에는 그 계정으로 로그인하고,
 * 호출한 화면이 게스트 기록을 어떻게 처리할지 선택할 수 있도록 상태를 돌려줍니다.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult | null> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return null;

  const idToken = response.data.idToken;
  if (!idToken) throw new Error('Google 인증 토큰을 가져오지 못했습니다.');

  const credential = GoogleAuthProvider.credential(idToken);
  const currentUser = auth.currentUser;
  const isAnonymousAccount = currentUser?.isAnonymous === true;

  try {
    const result = isAnonymousAccount
      ? await linkWithCredential(currentUser!, credential)
      : await signInWithCredential(auth, credential);

    return {
      profile: toProfile(result.user),
      switchedFromAnonymousAccount: false,
    };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (!isAnonymousAccount || code !== 'auth/credential-already-in-use') throw error;

    // The Google account already exists in Firebase. Sign in normally so the app can
    // let the user decide whether to keep or replace its previous learning records.
    const result = await signInWithCredential(auth, credential);
    return {
      profile: toProfile(result.user),
      switchedFromAnonymousAccount: true,
    };
  }
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
