import { Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { BookOpen, ChevronRight, Database, Info, Languages, LogIn, LogOut, ShieldCheck, User } from 'lucide-react-native';
import { COLORS } from '@/data/constants';
import { AppText } from '@/components/gentalk/AppText';

export function ProfileScreen({
  name,
  email,
  imageUri,
  onEditProfile,
  onOpenLanguageSettings,
  onOpenFeedback,
  onOpenPermissionSettings,
  onOpenDataManagement,
  onOpenAppInfo,
  onLogout,
  onLogin,
  isGuest,
}: {
  name: string;
  email: string;
  imageUri: string | null;
  onEditProfile: () => void;
  onOpenLanguageSettings: () => void;
  onOpenFeedback: () => void;
  onOpenPermissionSettings: () => void;
  onOpenDataManagement: () => void;
  onOpenAppInfo: () => void;
  onLogout: () => void;
  onLogin: () => void;
  isGuest: boolean;
}) {
  const rows = [
    { icon: User, label: '프로필 설정', action: onEditProfile },
    { icon: Languages, label: '언어·음성 설정', action: onOpenLanguageSettings },
    { icon: ShieldCheck, label: '권한 설정', action: onOpenPermissionSettings },
    { icon: Database, label: '데이터 관리', action: onOpenDataManagement },
    { icon: BookOpen, label: '피드백 보내기', action: onOpenFeedback },
    { icon: Info, label: '앱 정보', detail: 'GENTALK 1.0.0', action: onOpenAppInfo },
    isGuest
      ? { icon: LogIn, label: '로그인', action: onLogin }
      : { icon: LogOut, label: '로그아웃', action: onLogout },
  ];

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 136 }}>
      <View className="items-center border-b border-[#E9DDCE] px-5 pb-6 pt-8">
        {imageUri ? (
          <Image source={{ uri: imageUri }} contentFit="cover" style={{ width: 64, height: 64, borderRadius: 32 }} />
        ) : (
          <View className="h-16 w-16 items-center justify-center rounded-full bg-[#255F5A]">
            <AppText className="text-2xl font-black text-white">{name.trim().charAt(0).toUpperCase() || 'G'}</AppText>
          </View>
        )}
        <AppText className="mt-3 text-lg font-black text-[#231A0E]">{name}</AppText>
        <AppText className="mt-0.5 font-mono text-xs text-[#8A7D6D]">{email}</AppText>
        {isGuest ? (
          <View className="mt-2 rounded-full bg-[#F3EBDD] px-3 py-1.5">
            <AppText className="text-xs font-black text-[#914523]">게스트 모드 · 로그인하면 학습 기록을 동기화할 수 있어요</AppText>
          </View>
        ) : null}
      </View>

      <View className="mx-5 mt-5 gap-2">
        {rows.map(({ icon: Icon, label, detail, action }) => (
          <Pressable key={label} onPress={action} className="flex-row items-center gap-3 rounded-xl border border-[#E9DDCE] bg-white px-4 py-4 active:bg-[#F8F1E8]">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#F2E8D9]">
              <Icon size={18} color={COLORS.foreground} />
            </View>
            <View className="min-w-0 flex-1"><AppText className="text-sm font-bold text-[#231A0E]">{label}</AppText>{detail ? <AppText className="mt-0.5 text-xs text-[#8A7D6D]">{detail}</AppText> : null}</View>
            <ChevronRight size={16} color={COLORS.muted} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
