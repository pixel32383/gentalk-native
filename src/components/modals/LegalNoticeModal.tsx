import { Modal, Pressable, ScrollView, View } from 'react-native';
import { X } from 'lucide-react-native';
import { AppText } from '@/components/gentalk/AppText';
import { COLORS } from '@/data/constants';
import { RoundButton } from '@/components/gentalk/RoundButton';

export type LegalNoticeKind = 'terms' | 'privacy';

const TERMS = [
  ['운영자 및 목적', '운영자 pixel3238은 GENTALK을 통해 실생활 상황 기반 단어 학습, 짝맞추기 게임, AI 회화, 학습 피드백 및 복습 기능을 제공합니다.'],
  ['AI 생성 내용', 'AI가 생성하는 단어, 회화, 번역 및 피드백은 학습 보조 목적의 정보입니다. 생성 내용의 완전성·정확성·특정 목적 적합성이 보장되지는 않습니다.'],
  ['이용자의 책임', '이용자는 타인의 권리나 개인정보 또는 법령을 침해하는 내용을 입력하거나 전송해서는 안 되며, 서비스의 보안과 요청 제한을 우회하려 해서는 안 됩니다.'],
  ['서비스 변경 및 제한', '서비스 안정성, 보안, 기능 개선 또는 운영상 필요에 따라 기능과 AI 요청 횟수 제한은 변경되거나 일시적으로 제한될 수 있습니다.'],
  ['탈퇴 및 문의', '탈퇴는 프로필 설정에서 요청할 수 있으며, 서비스 관련 문의는 pixel32383@gmail.com으로 보내주세요.'],
];

const PRIVACY = [
  ['개인정보처리자', 'GENTALK의 개인정보처리자는 pixel3238이며, 개인정보 관련 문의는 pixel32383@gmail.com으로 보내주세요.'],
  ['수집하는 정보', 'Google 로그인 정보(이름, 이메일, 프로필 사진), 사용자가 입력한 이름·전화번호·프로필 사진, 학습 기록·AI 대화·피드백·오늘의 문장 및 AI 요청 횟수를 저장할 수 있습니다. 마이크는 말하기 연습과 음성 인식을 위해, 알림 권한은 오늘의 문장 알림을 위해 사용합니다.'],
  ['이용 목적', '계정 식별, 기기 간 학습 기록 동기화, AI 학습·회화·피드백 제공, 프로필 및 알림 관리, 부정 사용 방지와 서비스 안정성·비용 관리를 위해 사용합니다.'],
  ['보관 및 삭제', '계정 정보와 학습 정보는 탈퇴 전까지 보관합니다. 프로필 설정에서 탈퇴하면 계정, 학습 데이터와 프로필 사진 삭제를 요청할 수 있습니다.'],
  ['외부 서비스 및 국외 처리', '로그인과 데이터 저장에는 Google Firebase를 사용하며, AI 학습 응답을 위해 필요한 학습 상황과 대화 문맥이 OpenAI에 전달됩니다. 각 제공자의 인프라 위치에 따라 정보가 국외에서 처리될 수 있습니다.'],
  ['이용자 권리', '이용자는 앱에서 자신의 정보를 수정·삭제하거나, 위 문의처로 열람·수정·삭제 및 처리정지를 요청할 수 있습니다.'],
];

export function LegalNoticeModal({ visible, kind, onClose }: { visible: boolean; kind: LegalNoticeKind | null; onClose: () => void }) {
  const isPrivacy = kind === 'privacy';
  const sections = isPrivacy ? PRIVACY : TERMS;
  const title = isPrivacy ? '개인정보처리방침' : '서비스 이용약관';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[86%] rounded-t-3xl bg-[#FBF5E9] px-5 pb-8 pt-5">
          <View className="mb-4 flex-row items-center justify-between">
            <AppText className="text-xl font-black text-[#231A0E]">{title}</AppText>
            <RoundButton onPress={onClose}><X size={16} color={COLORS.muted} /></RoundButton>
          </View>
          <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
            <AppText className="mb-4 text-xs leading-5 text-[#8A7D6D]">시행일: 2026년 9월 1일</AppText>
            <View className="gap-5 pb-5">
              {sections.map(([heading, content]) => (
                <View key={heading}>
                  <AppText className="text-sm font-black text-[#231A0E]">{heading}</AppText>
                  <AppText className="mt-1.5 text-sm leading-6 text-[#6B5843]">{content}</AppText>
                </View>
              ))}
            </View>
          </ScrollView>
          <Pressable onPress={onClose} className="mt-2 items-center rounded-xl bg-[#255F5A] py-3 active:opacity-80"><AppText className="font-black text-white">확인</AppText></Pressable>
        </View>
      </View>
    </Modal>
  );
}
