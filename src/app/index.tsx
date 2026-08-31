import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  BackHandler,
  Linking,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BookOpen,
  Globe,
  Phone,
  User,
} from 'lucide-react-native';
import { COLORS } from '@/data/constants';
import { SCENARIOS } from '@/data/scenarios';
import { DISPLAY_LANGUAGE_CODES } from '@/data/languages';
import { setDisplayLanguage, translateText } from '@/data/translations';
import { generateVocabulary } from '@/services/learning-api';
import { cancelDailySentenceNotifications, requestNotificationPermissionOnFirstLogin, scheduleDailySentenceNotifications } from '@/services/notifications';
import { loadDailySentenceSettings, saveDailySentenceSettings } from '@/services/daily-sentence-settings';
import { loadVoiceSettings, saveSpeechRate, saveSpeechVoiceMode, type SpeechVoiceMode } from '@/services/voice-settings';
import { getSpeechPermissionGranted, requestSpeechPermissionOnFirstLogin } from '@/services/speech-permissions';
import { deleteLearningRecord, getLearningUserId, loadLearningRecords, saveLearningRecord } from '@/firebase/learning-records';
import { deleteInProgressLearning, loadInProgressLearning, saveInProgressLearning } from '@/firebase/in-progress-learning';
import { loadUserProfile, saveUserProfile, type UserProfile } from '@/firebase/user-profile';
import { deleteDailySentence, loadDailySentences, saveDailySentence } from '@/firebase/daily-sentences';
import { submitFeedback } from '@/firebase/feedback';
import { deleteCurrentGoogleAccount, reauthenticateCurrentGoogleAccount, signInWithGoogle, signOutFromGoogle } from '@/firebase/auth';
import { deleteUserData } from '@/firebase/account';
import { uploadProfileImage } from '@/firebase/profile-images';
import { auth } from '@/firebase/firebase';
import { AppText } from '@/components/gentalk/AppText';
import { OperationErrorNotice } from '@/components/gentalk/OperationErrorNotice';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { ReviewScreen } from '@/screens/ReviewScreen';
import { DetailScreen } from '@/screens/DetailScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { WordCountModal } from '@/components/modals/WordCountModal';
import { SentenceTimeModal } from '@/components/modals/SentenceTimeModal';
import { LanguageSettingsModal } from '@/components/modals/LanguageSettingsModal';
import { ProfileEditModal } from '@/components/modals/ProfileEditModal';
import { LegalNoticeModal, type LegalNoticeKind } from '@/components/modals/LegalNoticeModal';
import { FeedbackModal } from '@/components/modals/FeedbackModal';
import { PermissionSettingsModal } from '@/components/modals/PermissionSettingsModal';
import { DataManagementModal } from '@/components/modals/DataManagementModal';
import { AppInfoModal } from '@/components/modals/AppInfoModal';
import { DailySentenceScreen } from '@/screens/DailySentenceScreen';
import { LearningFlowScreen } from '@/learning/LearningFlowScreen';
import type { DisplayLanguage } from '@/types/language';
import type { DailySentence, LearningProgress, PhraseItem, Scenario, VocabItem } from '@/types/learning';


type Screen =
  | 'home'
  | 'review'
  | 'detail'
  | 'saved'
  | 'profile'
  | 'learning-flow'
  | 'onboarding'
  | 'welcome';
















export default function GentalkApp() {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [onboardingStatus, setOnboardingStatus] = useState<'loading' | 'required' | 'done'>('loading');
  const [startupScreen, setStartupScreen] = useState<Screen>('welcome');
  const [hasResolvedStartupAuth, setHasResolvedStartupAuth] = useState(false);
  const [hasFinishedOnboarding, setHasFinishedOnboarding] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [learningReturnScreen, setLearningReturnScreen] = useState<'home' | 'review'>('home');
  const [learningStartStage, setLearningStartStage] = useState(0);
  const [wordGameOnly, setWordGameOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>(['en-cafe', 'en-hotel']);
  const [recentScenarios, setRecentScenarios] = useState<Scenario[]>([]);
  const [inProgressLearning, setInProgressLearning] = useState<LearningProgress[]>([]);
  const [dailySentences, setDailySentences] = useState<DailySentence[]>([]);
  const [activeProgress, setActiveProgress] = useState<LearningProgress | null>(null);
  const [showLangSettings, setShowLangSettings] = useState(false);
  const [showWordCount, setShowWordCount] = useState(false);
  const [showSentenceTime, setShowSentenceTime] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showAppInfo, setShowAppInfo] = useState(false);
  const [showPermissionSettings, setShowPermissionSettings] = useState(false);
  const [legalNotice, setLegalNotice] = useState<LegalNoticeKind | null>(null);
  const [userLang, setUserLang] = useState('ko');
  const [learningLang, setLearningLang] = useState('en');
  const [wordCount, setWordCount] = useState(20);
  const [sentenceTime, setSentenceTime] = useState('09:00');
  const [sentenceEnabled, setSentenceEnabled] = useState(false);
  const [sentenceCount, setSentenceCount] = useState(1);
  const [speechRate, setSpeechRate] = useState(1);
  const [speechVoiceMode, setSpeechVoiceMode] = useState<SpeechVoiceMode>('default');
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);
  const [microphonePermissionGranted, setMicrophonePermissionGranted] = useState(false);
  const [profileName, setProfileName] = useState('Gentalk Learner');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('learner@gmail.com');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [isStartingLearning, setIsStartingLearning] = useState(false);
  const [hasGenerationError, setHasGenerationError] = useState(false);
  const [syncError, setSyncError] = useState<{ message: string; retry: () => void } | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [lastLearningRequest, setLastLearningRequest] = useState<{ situation: string; template?: Scenario } | null>(null);
  const generationControllerRef = useRef<AbortController | null>(null);
  const progressWriteQueueRef = useRef<Promise<void>>(Promise.resolve());
  const shouldOpenDailySentencesRef = useRef(false);
  const displayLanguage: DisplayLanguage = DISPLAY_LANGUAGE_CODES.includes(userLang as DisplayLanguage)
    ? (userLang as DisplayLanguage)
    : 'ko';

  useEffect(() => {
    void AsyncStorage.getItem('@gentalk/onboarding-completed')
      .then((value) => setOnboardingStatus(value === 'true' ? 'done' : 'required'))
      .catch(() => setOnboardingStatus('required'));
  }, []);

  useEffect(() => {
    if (hasFinishedOnboarding || !hasResolvedStartupAuth || onboardingStatus === 'loading') return;
    setScreen(onboardingStatus === 'required' ? 'onboarding' : startupScreen);
  }, [hasFinishedOnboarding, hasResolvedStartupAuth, onboardingStatus, startupScreen]);

  useEffect(() => {
    if (process.env.EXPO_OS !== 'android' || screen === 'learning-flow') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'home') {
        setShowExitConfirm(true);
        return true;
      }

      if (screen === 'review' || screen === 'saved' || screen === 'profile' || screen === 'detail') {
        setScreen(screen === 'detail' ? learningReturnScreen : 'home');
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [screen]);

  useEffect(() => {
    function openDailySentences(notification: Notifications.Notification) {
      if (notification.request.content.data?.kind !== 'daily-sentence') return;
      shouldOpenDailySentencesRef.current = true;
      if (auth.currentUser) setScreen('saved');
    }

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse?.notification) openDailySentences(lastResponse.notification);
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openDailySentences(response.notification);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        await auth.authStateReady();
        const user = auth.currentUser;

        if (!user) {
          if (active) {
            setIsGuestMode(false);
            setRecentScenarios([]);
            setStartupScreen('welcome');
            setHasResolvedStartupAuth(true);
          }
          return;
        }

        const [records, progress, savedProfile, savedDailySentences, dailySentenceSettings, savedVoiceSettings, notificationPermissions, microphoneGranted] = await Promise.all([loadLearningRecords(user.uid), loadInProgressLearning(user.uid), loadUserProfile(user.uid), loadDailySentences(user.uid), loadDailySentenceSettings(user.uid), loadVoiceSettings(user.uid), Notifications.getPermissionsAsync(), getSpeechPermissionGranted()]);
        if (active) {
          setIsGuestMode(user.isAnonymous);
          setRecentScenarios(records);
          setInProgressLearning(progress);
          setDailySentences(savedDailySentences);
          setSentenceTime(dailySentenceSettings.time);
          setSentenceCount(dailySentenceSettings.count);
          setSentenceEnabled(dailySentenceSettings.enabled);
          setSpeechRate(savedVoiceSettings.rate);
          setSpeechVoiceMode(savedVoiceSettings.voiceMode);
          setNotificationPermissionGranted(notificationPermissions.granted);
          setMicrophonePermissionGranted(microphoneGranted);
          if (!user.isAnonymous) {
            setProfileName(savedProfile?.name ?? user.displayName ?? 'Gentalk Learner');
            setProfilePhone(savedProfile?.phone ?? '');
            setProfileEmail(user.email ?? savedProfile?.email ?? 'learner@gmail.com');
            setProfileImageUri(savedProfile?.imageUri ?? user.photoURL);
          }
          setStartupScreen(shouldOpenDailySentencesRef.current ? 'saved' : 'home');
          setHasResolvedStartupAuth(true);

          if (dailySentenceSettings.enabled && savedDailySentences.length > 0) {
            void scheduleDailySentenceNotifications(
              dailySentenceSettings.time,
              dailySentenceSettings.count,
              savedDailySentences.map((sentence) => ({ text: sentence.phrase, translation: sentence.translation })),
            ).then(async (scheduled) => {
              if (!active) return;
              setSentenceEnabled(scheduled);
              await saveDailySentenceSettings(user.uid, { ...dailySentenceSettings, enabled: scheduled });
            }).catch((error) => console.warn('오늘의 문장 알림을 갱신하지 못했습니다.', error));
          }
        }
      } catch (error) {
        // Firebase 설정 또는 네트워크 문제 시 기존 앱 기능은 로컬 상태로 계속 동작합니다.
        console.warn('학습 기록을 불러오지 못했습니다.', error);
        if (active) {
          setStartupScreen('welcome');
          setHasResolvedStartupAuth(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function completeLearning(scenario: Scenario) {
    setRecentScenarios((current) => [scenario, ...current.filter((item) => item.id !== scenario.id)]);
    setInProgressLearning((current) => current.filter((item) => item.id !== scenario.id));
    setActiveProgress(null);
    try {
      const userId = await getLearningUserId();
      await saveLearningRecord(userId, scenario);
      await deleteInProgressLearning(userId, scenario.id);
    } catch (error) {
      console.warn('학습 기록을 저장하지 못했습니다.', error);
      setSyncError({
        message: '학습 기록을 서버에 저장하지 못했습니다. 기기에 임시 저장되어 있으며, 네트워크 연결 후 다시 저장할 수 있습니다.',
        retry: () => void completeLearning(scenario),
      });
    }
  }

  function persistInProgressLearning(progress: LearningProgress) {
    const savedProgress = { ...progress, updatedAt: new Date().toISOString() };
    setInProgressLearning((current) => [savedProgress, ...current.filter((item) => item.id !== savedProgress.id)]);
    progressWriteQueueRef.current = progressWriteQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const userId = await getLearningUserId();
        await saveInProgressLearning(userId, savedProgress);
      })
      .catch((error) => console.warn('진행 중인 학습을 저장하지 못했습니다.', error));
  }

  function saveProgressAndExit(progress: LearningProgress) {
    persistInProgressLearning(progress);
    setActiveProgress(null);
    setScreen(learningReturnScreen);
  }

  async function discardProgressAndExit() {
    const progressId = activeProgress?.id;
    if (progressId) {
      setInProgressLearning((current) => current.filter((item) => item.id !== progressId));
      try {
        const userId = await getLearningUserId();
        await deleteInProgressLearning(userId, progressId);
      } catch (error) {
        console.warn('진행 중인 학습을 삭제하지 못했습니다.', error);
      }
    }
    setActiveProgress(null);
    setScreen(learningReturnScreen);
  }

  function resumeProgress(progress: LearningProgress) {
    setCurrentScenario(progress.scenario);
    setLearningReturnScreen('home');
    setActiveProgress(progress);
    setLearningStartStage(progress.stage);
    setWordGameOnly(false);
    setScreen('learning-flow');
  }

  async function removeInProgressLearning(progressId: string) {
    setInProgressLearning((current) => current.filter((item) => item.id !== progressId));
    try {
      const userId = await getLearningUserId();
      await deleteInProgressLearning(userId, progressId);
    } catch (error) {
      console.warn('진행 중인 학습을 삭제하지 못했습니다.', error);
    }
  }

  async function removeLearningRecord(scenarioId: string) {
    setRecentScenarios((current) => current.filter((scenario) => scenario.id !== scenarioId));
    try {
      const userId = await getLearningUserId();
      await deleteLearningRecord(userId, scenarioId);
    } catch (error) {
      console.warn('학습 기록을 삭제하지 못했습니다.', error);
    }
  }

  async function removeAllLearningRecords() {
    const recordIds = recentScenarios.map((scenario) => scenario.id);
    setRecentScenarios([]);
    try {
      const userId = await getLearningUserId();
      await Promise.all(recordIds.map((recordId) => deleteLearningRecord(userId, recordId)));
    } catch (error) {
      console.warn('학습 기록 전체를 삭제하지 못했습니다.', error);
    }
  }

  async function removeAllLearningData() {
    const progressIds = inProgressLearning.map((progress) => progress.id);
    setInProgressLearning([]);
    setActiveProgress(null);
    await removeAllLearningRecords();
    try {
      const userId = await getLearningUserId();
      await Promise.all(progressIds.map((progressId) => deleteInProgressLearning(userId, progressId)));
    } catch (error) {
      console.warn('이어서 학습할 내용을 삭제하지 못했습니다.', error);
    }
  }

  async function removeAllDailySentences() {
    const sentenceIds = dailySentences.map((sentence) => sentence.id);
    setDailySentences([]);
    setSentenceEnabled(false);
    try {
      await cancelDailySentenceNotifications();
      const userId = await getLearningUserId();
      await Promise.all(sentenceIds.map((sentenceId) => deleteDailySentence(userId, sentenceId)));
      await saveDailySentenceSettings(userId, { enabled: false, time: sentenceTime, count: sentenceCount });
    } catch (error) {
      console.warn('오늘의 문장 전체를 삭제하지 못했습니다.', error);
    }
  }

  async function updateSpeechRate(rate: number) {
    setSpeechRate(rate);
    try {
      const userId = await getLearningUserId();
      await saveSpeechRate(userId, rate);
    } catch (error) {
      console.warn('음성 설정을 저장하지 못했습니다.', error);
    }
  }

  async function updateSpeechVoiceMode(mode: SpeechVoiceMode) {
    setSpeechVoiceMode(mode);
    try {
      const userId = await getLearningUserId();
      await saveSpeechVoiceMode(userId, mode);
    } catch (error) {
      console.warn('목소리 설정을 저장하지 못했습니다.', error);
    }
  }

  async function markFeedbackReviewed(scenario: Scenario) {
    if (scenario.feedbackReviewed || !scenario.learningFeedback) return;
    const reviewedScenario = { ...scenario, feedbackReviewed: true };
    setCurrentScenario((current) => current?.id === scenario.id ? reviewedScenario : current);
    setRecentScenarios((current) => current.map((item) => item.id === scenario.id ? reviewedScenario : item));
    try {
      const userId = await getLearningUserId();
      await saveLearningRecord(userId, reviewedScenario);
    } catch (error) {
      console.warn('피드백 확인 상태를 저장하지 못했습니다.', error);
    }
  }

  async function continueWithGoogle() {
    try {
      const profile = await signInWithGoogle();
      if (!profile) return;
      const user = auth.currentUser;
      if (!user) throw new Error('로그인 정보를 확인하지 못했습니다.');
      setIsGuestMode(user.isAnonymous);

      const [records, progress, savedProfile, savedDailySentences, dailySentenceSettings, savedVoiceSettings, notificationPermissions, microphoneGranted] = await Promise.all([
        loadLearningRecords(user.uid),
        loadInProgressLearning(user.uid),
        loadUserProfile(user.uid),
        loadDailySentences(user.uid),
        loadDailySentenceSettings(user.uid),
        loadVoiceSettings(user.uid),
        Notifications.getPermissionsAsync(),
        getSpeechPermissionGranted(),
      ]);

      setRecentScenarios(records);
      setInProgressLearning(progress);
      setDailySentences(savedDailySentences);
      setSentenceTime(dailySentenceSettings.time);
      setSentenceCount(dailySentenceSettings.count);
      setSentenceEnabled(dailySentenceSettings.enabled);
      setSpeechRate(savedVoiceSettings.rate);
      setSpeechVoiceMode(savedVoiceSettings.voiceMode);
      setNotificationPermissionGranted(notificationPermissions.granted);
      setMicrophonePermissionGranted(microphoneGranted);

      if (savedProfile) {
        setProfileName(savedProfile.name);
        setProfilePhone(savedProfile.phone);
        setProfileEmail(user.email ?? savedProfile.email);
        setProfileImageUri(savedProfile.imageUri ?? profile.imageUri);
      } else {
        setProfileName(profile.name);
        setProfilePhone('');
        setProfileEmail(profile.email);
        setProfileImageUri(profile.imageUri);
        await saveUserProfile(user.uid, { ...profile, phone: '' });
      }
      setScreen('home');
      if (dailySentenceSettings.enabled && savedDailySentences.length > 0) {
        void scheduleDailySentenceNotifications(
          dailySentenceSettings.time,
          dailySentenceSettings.count,
          savedDailySentences.map((sentence) => ({ text: sentence.phrase, translation: sentence.translation })),
        ).then((scheduled) => setSentenceEnabled(scheduled));
      }
      void requestFirstLoginPermissions();
    } catch (error) {
      Alert.alert(
        'Google 로그인에 실패했습니다',
        error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.',
      );
    }
  }

  async function logout() {
    await cancelDailySentenceNotifications();
    await signOutFromGoogle();
    setCurrentScenario(null);
    setActiveProgress(null);
    setRecentScenarios([]);
    setInProgressLearning([]);
    setDailySentences([]);
    setSavedIds([]);
    setSentenceTime('09:00');
    setSentenceCount(1);
    setSentenceEnabled(false);
    setSpeechRate(1);
    setSpeechVoiceMode('default');
    setNotificationPermissionGranted(false);
    setMicrophonePermissionGranted(false);
    setProfileName('Gentalk Learner');
    setProfilePhone('');
    setProfileEmail('learner@gmail.com');
    setProfileImageUri(null);
    shouldOpenDailySentencesRef.current = false;
    setShowLangSettings(false);
    setShowWordCount(false);
    setShowSentenceTime(false);
    setShowProfileEdit(false);
    setShowFeedback(false);
    setShowPermissionSettings(false);
    setIsGuestMode(false);
    setScreen('welcome');
  }

  function confirmDeleteAccount() {
    Alert.alert(
      '정말 탈퇴하시겠어요?',
      '프로필, 학습 기록, 오늘의 문장, 진행 중인 학습이 모두 삭제되며 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '탈퇴하기', style: 'destructive', onPress: () => void deleteAccount() },
      ],
    );
  }

  async function deleteAccount() {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return;

    setIsDeletingAccount(true);
    try {
      await reauthenticateCurrentGoogleAccount();
      await deleteUserData(user.uid);
      await deleteCurrentGoogleAccount();
      await logout();
      Alert.alert('탈퇴가 완료되었습니다', '계정과 저장된 학습 데이터가 삭제되었습니다.');
    } catch (error) {
      console.warn('계정을 삭제하지 못했습니다.', error);
      Alert.alert(
        '탈퇴를 완료하지 못했습니다',
        error instanceof Error && error.message === 'Google 계정 확인이 취소되었습니다.'
          ? 'Google 계정 확인을 완료한 뒤 다시 시도해주세요.'
          : '네트워크 상태를 확인한 뒤 다시 시도해주세요.',
      );
    } finally {
      setIsDeletingAccount(false);
    }
  }

  function continueAsGuest() {
    setIsGuestMode(true);
    setScreen('home');
    void requestFirstLoginPermissions();
  }

  async function requestFirstLoginPermissions() {
    const microphoneGranted = await requestSpeechPermissionOnFirstLogin();
    setMicrophonePermissionGranted(microphoneGranted);

    const notificationsGranted = await requestNotificationPermissionOnFirstLogin();
    setNotificationPermissionGranted(notificationsGranted);
  }

  async function updateUserProfile(profile: UserProfile) {
    setProfileName(profile.name);
    setProfilePhone(profile.phone);
    setProfileEmail(profile.email);
    setProfileImageUri(profile.imageUri);
    try {
      const userId = await getLearningUserId();
      const uploadedImageUri = await uploadProfileImage(userId, profile.imageUri);
      const syncedProfile = { ...profile, imageUri: uploadedImageUri };
      await saveUserProfile(userId, syncedProfile);
      setProfileImageUri(uploadedImageUri);
    } catch (error) {
      console.warn('프로필을 저장하지 못했습니다.', error);
      setSyncError({
        message: '프로필 사진을 서버에 저장하지 못했습니다. 네트워크와 사진 저장 설정을 확인한 뒤 다시 시도해주세요.',
        retry: () => void updateUserProfile(profile),
      });
    }
  }

  function openScenario(scenario: Scenario, returnScreen: 'home' | 'review' = 'home') {
    setCurrentScenario(scenario);
    setLearningReturnScreen(returnScreen);
    setLearningStartStage(0);
    setWordGameOnly(false);
    setScreen(scenario.id === 'en-hotel' ? 'learning-flow' : 'detail');
  }

  function restartWordGame(scenario: Scenario) {
    setCurrentScenario(scenario);
    setLearningStartStage(0);
    setWordGameOnly(true);
    setScreen('learning-flow');
  }

  async function startSituationLearning(situation: string, template?: Scenario) {
    if (isStartingLearning) return;
    const hotel = SCENARIOS.find((scenario) => scenario.id === 'en-hotel') ?? SCENARIOS[0];
    const requestedSituation = situation.trim() || '호텔 체크인';
    const knownScenario = template ?? SCENARIOS.find((scenario) => scenario.situation === requestedSituation);
    const canReuseTemplateLanguage = knownScenario?.langCode === learningLang;
    const knownOpeningStaffMessage = canReuseTemplateLanguage
      ? knownScenario?.id === 'en-cafe'
        ? 'Hi! What can I get for you today?'
        : knownScenario?.dialogue.find((line) => line.speaker === 'B')?.text
      : undefined;
    const openLearningFlow = (vocabulary: VocabItem[], title = requestedSituation, openingStaffMessage?: string, openingTranslation?: string, openingExampleReply?: string, openingExamplePronunciation?: string, culturalTips?: string[]) => {
      const culturalNote = culturalTips?.[Math.floor(Math.random() * culturalTips.length)] ?? hotel.culturalNote;
      setCurrentScenario({
        ...hotel,
        id: `custom-${Date.now()}`,
        langCode: learningLang,
        situation: requestedSituation,
        title,
        openingStaffMessage,
        openingTranslation,
        openingExampleReply,
        openingExamplePronunciation,
        culturalNote,
        culturalNotes: culturalTips,
        vocabulary,
      });
      setLearningStartStage(0);
      setActiveProgress(null);
      setWordGameOnly(false);
      setScreen('learning-flow');
    };
    const controller = new AbortController();
    generationControllerRef.current = controller;
    setLastLearningRequest({ situation, template });
    setHasGenerationError(false);
    setIsStartingLearning(true);
    try {
      const data = await generateVocabulary({ situation: requestedSituation, learningLanguage: learningLang, nativeLanguage: userLang, count: wordCount, signal: controller.signal });
      if (controller.signal.aborted) return;
      openLearningFlow(
        data.vocabulary,
        canReuseTemplateLanguage ? knownScenario?.title ?? data.conversationTitle : data.conversationTitle,
        knownOpeningStaffMessage ?? data.openingStaffMessage,
        data.openingTranslation,
        data.openingExampleReply,
        data.openingExamplePronunciation,
        data.culturalTips,
      );
    } catch (error) {
      if (!controller.signal.aborted) setHasGenerationError(true);
    } finally {
      if (generationControllerRef.current === controller) {
        generationControllerRef.current = null;
        setIsStartingLearning(false);
      }
    }
  }

  function cancelSituationGeneration() {
    generationControllerRef.current?.abort();
    generationControllerRef.current = null;
    setIsStartingLearning(false);
    setHasGenerationError(false);
  }

  function toggleSave(id: string) {
    setSavedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function getDailyPracticeSentences() {
    return dailySentences.map((sentence) => ({ text: sentence.phrase, translation: sentence.translation }));
  }

  async function refreshDailySentenceNotifications(sentences: DailySentence[]) {
    if (!sentenceEnabled) return;
    try {
      const scheduled = await scheduleDailySentenceNotifications(sentenceTime, sentenceCount, sentences.map((sentence) => ({ text: sentence.phrase, translation: sentence.translation })));
      setSentenceEnabled(scheduled);
      const userId = await getLearningUserId();
      await saveDailySentenceSettings(userId, { enabled: scheduled, time: sentenceTime, count: sentenceCount });
    } catch {
      setSentenceEnabled(false);
    }
  }

  async function toggleDailySentence(scenario: Scenario, phrase: PhraseItem, index: number) {
    const id = `${scenario.id}-${index}`;
    const existing = dailySentences.find((item) => item.id === id);
    if (existing) {
      const nextSentences = dailySentences.filter((item) => item.id !== id);
      setDailySentences(nextSentences);
      void refreshDailySentenceNotifications(nextSentences);
      try {
        const userId = await getLearningUserId();
        await deleteDailySentence(userId, id);
      } catch (error) {
        console.warn('오늘의 문장을 삭제하지 못했습니다.', error);
      }
      return;
    }
    const sentence: DailySentence = { id, phrase: phrase.phrase, translation: phrase.translation, rom: phrase.rom, languageCode: scenario.langCode, situation: scenario.situation, savedAt: new Date().toISOString() };
    const nextSentences = [sentence, ...dailySentences];
    setDailySentences(nextSentences);
    void refreshDailySentenceNotifications(nextSentences);
    try {
      const userId = await getLearningUserId();
      await saveDailySentence(userId, sentence);
    } catch (error) {
      console.warn('오늘의 문장을 저장하지 못했습니다.', error);
    }
  }

  async function removeDailySentence(sentenceId: string) {
    const nextSentences = dailySentences.filter((item) => item.id !== sentenceId);
    setDailySentences(nextSentences);
    void refreshDailySentenceNotifications(nextSentences);

    try {
      const userId = await getLearningUserId();
      await deleteDailySentence(userId, sentenceId);
    } catch (error) {
      console.warn('오늘의 문장을 삭제하지 못했습니다.', error);
    }
  }

  async function updateSentenceNotifications(
    enabled: boolean,
    time = sentenceTime,
    count = sentenceCount,
  ) {
    try {
      if (!enabled) {
        await cancelDailySentenceNotifications();
        setSentenceEnabled(false);
        const userId = await getLearningUserId();
        await saveDailySentenceSettings(userId, { enabled: false, time, count });
        return;
      }

      const scheduled = await scheduleDailySentenceNotifications(time, count, getDailyPracticeSentences());
      setSentenceEnabled(scheduled);
      setNotificationPermissionGranted(scheduled);
      const userId = await getLearningUserId();
      await saveDailySentenceSettings(userId, { enabled: scheduled, time, count });
    } catch {
      setSentenceEnabled(false);
      Alert.alert('알림 설정에 실패했습니다', '잠시 후 다시 시도해주세요.');
    }
  }

  async function updateSentenceTime(time: string) {
    setSentenceTime(time);
    if (sentenceEnabled) {
      await updateSentenceNotifications(true, time, sentenceCount);
    } else {
      const userId = await getLearningUserId();
      await saveDailySentenceSettings(userId, { enabled: false, time, count: sentenceCount });
    }
  }

  async function updateSentenceCount(count: number) {
    setSentenceCount(count);
    if (sentenceEnabled) {
      await updateSentenceNotifications(true, sentenceTime, count);
    } else {
      const userId = await getLearningUserId();
      await saveDailySentenceSettings(userId, { enabled: false, time: sentenceTime, count });
    }
  }

  const nav = [
    { id: 'home' as Screen, icon: Globe, label: '홈' },
    { id: 'review' as Screen, icon: BookOpen, label: '복습' },
    { id: 'saved' as Screen, icon: Phone, label: '오늘의 문장' },
    { id: 'profile' as Screen, icon: User, label: '프로필' },
  ];
  // 오늘의 문장 탭의 미리보기와 같은 순서로 홈에도 첫 문장을 표시합니다.
  const todaySentence = dailySentences[0];
  const isStartupLoading = !hasResolvedStartupAuth || onboardingStatus === 'loading';
  const isTabScreen = screen === 'home' || screen === 'review' || screen === 'saved' || screen === 'profile';

  async function finishOnboarding() {
    try {
      await AsyncStorage.setItem('@gentalk/onboarding-completed', 'true');
    } catch (error) {
      console.warn('온보딩 완료 상태를 저장하지 못했습니다.', error);
    } finally {
      setHasFinishedOnboarding(true);
      setOnboardingStatus('done');
      setScreen('welcome');
    }
  }

  return (
    <SafeAreaView
      className="bg-[#FBF8F1]"
      edges={
        screen === 'detail' || screen === 'learning-flow' || screen === 'onboarding' || screen === 'welcome'
          ? ['top', 'bottom', 'left', 'right']
          : ['top', 'left', 'right']
      }
      style={styles.appRoot}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.appContent}>
        {isStartupLoading ? <View className="flex-1 bg-[#FBF8F1]" /> : null}
        {!isStartupLoading && screen === 'onboarding' && <OnboardingScreen onFinish={finishOnboarding} />}
        {!isStartupLoading && isTabScreen ? (
          <>
            <View style={{ flex: 1, display: screen === 'home' ? 'flex' : 'none' }}>
              <HomeScreen
            key={`home-${displayLanguage}`}
            savedIds={savedIds}
            learningLang={learningLang}
            wordCount={wordCount}
            todaySentence={todaySentence}
            inProgressLearning={inProgressLearning}
            profileName={profileName}
            profileImageUri={profileImageUri}
            onScenario={(scenario) => openScenario(scenario, 'home')}
            onToggleSave={toggleSave}
            onOpenLangSettings={() => setShowLangSettings(true)}
            onOpenWordCount={() => setShowWordCount(true)}
            onOpenTodaySentence={() => setScreen('saved')}
            onOpenProfile={() => setScreen('profile')}
            onStartLearning={startSituationLearning}
            isStartingLearning={isStartingLearning}
            hasGenerationError={hasGenerationError}
            onCancelGeneration={cancelSituationGeneration}
            onRetryGeneration={() => {
              if (lastLearningRequest) void startSituationLearning(lastLearningRequest.situation, lastLearningRequest.template);
            }}
            onDismissGenerationError={() => setHasGenerationError(false)}
            onResumeLearning={resumeProgress}
            onRemoveInProgressLearning={(id) => void removeInProgressLearning(id)}
              />
            </View>
            <View style={{ flex: 1, display: screen === 'review' ? 'flex' : 'none' }}>
              <ReviewScreen
            recentScenarios={recentScenarios}
            onScenario={(scenario) => openScenario(scenario, 'review')}
            onRemoveRecentScenario={(id) => void removeLearningRecord(id)}
            onRemoveAllRecentScenarios={() => void removeAllLearningRecords()}
              />
            </View>
            <View style={{ flex: 1, display: screen === 'saved' ? 'flex' : 'none' }}>
              <DailySentenceScreen
                sentenceTime={sentenceTime}
                sentenceEnabled={sentenceEnabled}
                sentenceCount={sentenceCount}
                dailySentences={dailySentences}
                onOpenSchedule={() => setShowSentenceTime(true)}
                onToggleSentence={updateSentenceNotifications}
                onChangeSentenceCount={updateSentenceCount}
                onRemoveSentence={(id) => void removeDailySentence(id)}
              />
            </View>
            <View style={{ flex: 1, display: screen === 'profile' ? 'flex' : 'none' }}>
              <ProfileScreen
                name={profileName}
                email={profileEmail}
                imageUri={profileImageUri}
                onEditProfile={() => setShowProfileEdit(true)}
                onOpenLanguageSettings={() => setShowLangSettings(true)}
                onOpenFeedback={() => setShowFeedback(true)}
                onOpenPermissionSettings={() => {
                  setShowPermissionSettings(true);
                  void Promise.all([Notifications.getPermissionsAsync(), getSpeechPermissionGranted()]).then(([notificationPermissions, microphoneGranted]) => {
                    setNotificationPermissionGranted(notificationPermissions.granted);
                    setMicrophonePermissionGranted(microphoneGranted);
                  });
                }}
                onOpenDataManagement={() => setShowDataManagement(true)}
                onOpenAppInfo={() => setShowAppInfo(true)}
                onLogout={() => void logout()}
                onLogin={() => setScreen('welcome')}
                isGuest={isGuestMode}
              />
            </View>
          </>
        ) : null}
        {!isStartupLoading && screen === 'detail' && currentScenario && (
          <DetailScreen
            scenario={currentScenario}
            onBack={() => setScreen(learningReturnScreen)}
            onPlayWordGame={() => restartWordGame(currentScenario)}
            onFeedbackViewed={() => void markFeedbackReviewed(currentScenario)}
            dailySentenceIds={dailySentences.map((item) => item.id)}
            onToggleDailySentence={(phrase, index) => void toggleDailySentence(currentScenario, phrase, index)}
          />
        )}
        {!isStartupLoading && screen === 'learning-flow' && currentScenario && (
          <LearningFlowScreen
            scenario={currentScenario}
            onBack={() => setScreen(learningReturnScreen)}
            onHome={() => setScreen(learningReturnScreen)}
            onComplete={(scenario) => void completeLearning(scenario)}
            onSaveAndExit={(progress) => void saveProgressAndExit(progress)}
            onDiscardAndExit={() => void discardProgressAndExit()}
            onAutoSave={persistInProgressLearning}
            savedProgress={activeProgress}
            initialStage={learningStartStage}
            wordGameOnly={wordGameOnly}
            nativeLanguage={displayLanguage}
          />
        )}
        {!isStartupLoading && screen === 'welcome' && (
          <WelcomeScreen
            onGoogleContinue={() => void continueWithGoogle()}
            onGuestContinue={continueAsGuest}
            onOpenTerms={() => setLegalNotice('terms')}
            onOpenPrivacy={() => setLegalNotice('privacy')}
          />
        )}
      </View>

      {syncError && screen !== 'welcome' ? (
        <View className="mx-5 mb-3">
          <OperationErrorNotice
            message={syncError.message}
            onRetry={() => {
              setSyncError(null);
              syncError.retry();
            }}
            onLater={() => setSyncError(null)}
          />
        </View>
      ) : null}

      {screen !== 'detail' && screen !== 'learning-flow' && screen !== 'onboarding' && screen !== 'welcome' && (
        <View
          className="flex-row border-t border-[#E9DDCE] px-2 pt-2"
          style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {nav.map(({ id, icon: Icon, label }) => {
            const active = screen === id;
            return (
              <Pressable
                key={id}
                onPress={() => setScreen(id)}
                className={`flex-1 items-center gap-1 rounded-xl py-2 active:opacity-80 ${
                  active ? 'bg-[#E7F2EF]' : ''
                }`}>
                <Icon size={21} color={active ? COLORS.primary : COLORS.muted} strokeWidth={active ? 2.3 : 1.8} />
                <AppText className={`font-mono text-[10px] ${active ? 'font-black text-[#255F5A]' : 'text-[#8A7D6D]'}`}>
                  {translateText(label)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      )}

      <Modal visible={showExitConfirm} transparent animationType="fade" onRequestClose={() => setShowExitConfirm(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="종료 확인 창 닫기"
          onPress={() => setShowExitConfirm(false)}
          className="flex-1 items-center justify-center bg-black/40 px-6">
          <Pressable
            accessibilityRole="none"
            onPress={(event) => event.stopPropagation()}
            className="w-full max-w-[420px] rounded-[28px] border border-[#E9DDCE] bg-[#FBF8F1] px-6 py-7">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-[#F2E6D4]">
              <AppText className="text-xl">👋</AppText>
            </View>
            <AppText className="mt-5 text-[23px] font-black text-[#231A0E]">오늘 학습은 여기까지인가요?</AppText>
            <AppText className="mt-2 text-sm leading-6 text-[#8A7D6D]">언제든 다시 돌아와 이어서 학습할 수 있어요.</AppText>
            <View className="mt-6 flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowExitConfirm(false)}
                className="flex-1 items-center rounded-2xl border border-[#DCCDB9] bg-white py-4 active:opacity-70">
                <AppText className="font-black text-[#6F5A44]">계속 학습</AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => BackHandler.exitApp()}
                className="flex-1 items-center rounded-2xl bg-[#914523] py-4 active:opacity-70">
                <AppText className="font-black text-white">종료하기</AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <DataManagementModal
        visible={showDataManagement}
        onClose={() => setShowDataManagement(false)}
        onDeleteLearning={() => void removeAllLearningData()}
        onDeleteDaily={() => void removeAllDailySentences()}
      />
      <AppInfoModal visible={showAppInfo} onClose={() => setShowAppInfo(false)} />

      <LanguageSettingsModal
        visible={showLangSettings}
        userLang={userLang}
        learningLang={learningLang}
        speechRate={speechRate}
        speechVoiceMode={speechVoiceMode}
        onClose={() => setShowLangSettings(false)}
        onUpdateLangs={(nextUserLang, nextLearningLang) => {
          const nextDisplayLanguage = DISPLAY_LANGUAGE_CODES.includes(nextUserLang as DisplayLanguage)
            ? (nextUserLang as DisplayLanguage)
            : 'ko';
          setDisplayLanguage(nextDisplayLanguage);
          setUserLang(nextUserLang);
          setLearningLang(nextLearningLang);
        }}
        onUpdateSpeechRate={(rate) => void updateSpeechRate(rate)}
        onUpdateSpeechVoiceMode={(mode) => void updateSpeechVoiceMode(mode)}
      />
      <WordCountModal
        visible={showWordCount}
        currentCount={wordCount}
        onClose={() => setShowWordCount(false)}
        onUpdateCount={setWordCount}
      />
      <SentenceTimeModal
        visible={showSentenceTime}
        currentTime={sentenceTime}
        onClose={() => setShowSentenceTime(false)}
        onSave={updateSentenceTime}
      />
      <ProfileEditModal
        visible={showProfileEdit}
        name={profileName}
        phone={profilePhone}
        email={profileEmail}
        imageUri={profileImageUri}
        isGuest={isGuestMode}
        isDeletingAccount={isDeletingAccount}
        onClose={() => setShowProfileEdit(false)}
        onSave={(profile) => void updateUserProfile(profile)}
        onDeleteAccount={confirmDeleteAccount}
      />
      <LegalNoticeModal visible={legalNotice !== null} kind={legalNotice} onClose={() => setLegalNotice(null)} />
      <FeedbackModal
        visible={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmit={(content) =>
          submitFeedback({
            content,
            device: Platform.OS === 'android' ? 'Android 기기' : 'iOS 기기',
            os: `${Platform.OS} ${Platform.Version}`,
            screen: '프로필',
          })
        }
      />
      <PermissionSettingsModal
        visible={showPermissionSettings}
        microphonePermissionGranted={microphonePermissionGranted}
        notificationPermissionGranted={notificationPermissionGranted}
        onClose={() => setShowPermissionSettings(false)}
        onOpenMicrophoneSettings={() => {
          setShowPermissionSettings(false);
          void requestSpeechPermissionOnFirstLogin(true).then((granted) => setMicrophonePermissionGranted(granted));
        }}
        onOpenNotificationSettings={() => {
          setShowPermissionSettings(false);
          void Linking.openSettings();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  appContent: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabScrollContent: {
    paddingBottom: 136,
  },
  detailScrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  welcomeScrollContent: {
    flexGrow: 1,
    paddingTop: 61,
    paddingHorizontal: 39,
    paddingBottom: 42,
    backgroundColor: '#FBF5E9',
  },
  welcomeScreen: {
    flex: 1,
    backgroundColor: '#FBF5E9',
  },
  welcomePressed: {
    opacity: 0.68,
  },
  welcomeMain: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    alignItems: 'center',
    paddingTop: 215,
  },
  welcomeGlobe: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E9D8C5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeHeading: {
    alignItems: 'center',
    marginTop: 31,
    gap: 4,
  },
  welcomeTitle: {
    color: '#20170D',
    textAlign: 'center',
    fontSize: 27,
    lineHeight: 39,
    fontWeight: '900',
  },
  welcomeSubtitle: {
    color: '#9A735B',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 24,
  },
  googleButton: {
    width: '100%',
    height: 60,
    marginTop: 39,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#DED2C0',
    backgroundColor: '#F3E8D4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleButtonText: {
    color: '#20170D',
    fontSize: 15,
    fontWeight: '800',
  },
  welcomeDivider: {
    width: 166,
    marginTop: 37,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  welcomeDividerLine: {
    height: 1,
    flex: 1,
    backgroundColor: '#D8CBB8',
  },
  welcomeDividerText: {
    color: '#A08269',
    fontSize: 14,
  },
  guestButton: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  guestButtonText: {
    color: '#914523',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
  },
  welcomeLegal: {
    color: '#9A735B',
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 20,
    marginTop: 'auto',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    maxWidth: 440,
  },
  modalCardNarrow: {
    maxWidth: 420,
  },
  wordCountOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  wordCountBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  wordCountSheet: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    overflow: 'hidden',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderCurve: 'continuous',
    backgroundColor: '#FBF5E9',
  },
  wordCountHeader: {
    minHeight: 84,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2D7C7',
  },
  wordCountTitle: {
    color: '#231A0E',
    fontSize: 23,
    lineHeight: 31,
    fontWeight: '900',
  },
  wordCountCloseButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7D6B8',
  },
  wordCountBody: {
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 30,
  },
  wordCountLabel: {
    color: '#79644F',
    fontSize: 14,
    fontWeight: '600',
  },
  wordCountDescription: {
    color: '#9A8068',
    fontSize: 14,
    lineHeight: 22,
  },
  wordCountInput: {
    height: 70,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D8CAB5',
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: '#F2E7D3',
    color: '#231A0E',
    textAlign: 'center',
    fontSize: 25,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  wordCountFooter: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: '#E2D7C7',
  },
  wordCountSaveButton: {
    height: 54,
    borderRadius: 15,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#91411F',
  },
  wordCountSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  profileEditSheet: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '88%',
    alignSelf: 'center',
    overflow: 'hidden',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderCurve: 'continuous',
    backgroundColor: '#FBF5E9',
  },
  profileEditBody: {
    gap: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
  },
  profileImageSection: {
    alignItems: 'center',
    gap: 12,
  },
  profileEditImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  profileEditImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#255F5A',
  },
  profileEditInitial: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
  },
  profileImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: '#D8CAB5',
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: '#F3E8D4',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  profileImageButtonText: {
    color: '#914523',
    fontSize: 13,
    fontWeight: '800',
  },
  profileField: {
    gap: 8,
  },
  profileFieldLabel: {
    color: '#6B5843',
    fontSize: 14,
    fontWeight: '800',
  },
  profileInputRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#D8CAB5',
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
  },
  profileInput: {
    minWidth: 0,
    flex: 1,
    color: '#231A0E',
    fontSize: 15,
  },
  profileInputRowDisabled: {
    backgroundColor: '#E8E5E0',
    borderColor: '#D3CEC6',
  },
  profileInputDisabled: {
    color: '#807A72',
  },
  profileFieldHelp: {
    color: '#9A8068',
    fontSize: 11,
    lineHeight: 17,
  },
  dialogueBubble: {
    maxWidth: '88%',
  },
  bottomNav: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    elevation: 12,
  },
});
