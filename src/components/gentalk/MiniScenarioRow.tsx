import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { COLORS } from '@/data/constants';
import { LANGUAGES } from '@/data/languages';
import type { Scenario } from '@/types/learning';
import { AppText } from './AppText';
import { getDisplayLocale } from '@/data/translations';

export function MiniScenarioRow({ scenario, onPress }: { scenario: Scenario; onPress: () => void }) {
  const language = LANGUAGES.find((item) => item.code === scenario.langCode);
  const completedDate = scenario.completedAt ? new Intl.DateTimeFormat(getDisplayLocale(), { month: 'numeric', day: 'numeric' }).format(new Date(scenario.completedAt)) : '';
  const hasFeedback = Boolean(scenario.learningFeedback && ((scenario.learningFeedback.messageCorrections?.length ?? 0) > 0 || scenario.learningFeedback.improvements.length > 0));
  return <Pressable onPress={onPress} className="min-h-[64px] flex-1 flex-row items-center gap-3 rounded-xl border border-[#E9DDCE] bg-white px-4 py-3 active:bg-[#F8F1E8]"><AppText className="text-2xl">{scenario.emoji}</AppText><View className="min-w-0 flex-1"><AppText numberOfLines={1} className="text-sm font-bold text-[#231A0E]">{scenario.situation}</AppText><AppText className="font-mono text-[11px] text-[#8A7D6D]">{language?.flag} {language?.label}{completedDate ? ` · ${completedDate}` : ''}</AppText></View>{hasFeedback ? <View className={`rounded-full px-2 py-1 ${scenario.feedbackReviewed ? 'bg-emerald-50' : 'bg-red-50'}`}><AppText className={`text-[10px] font-black ${scenario.feedbackReviewed ? 'text-emerald-700' : 'text-red-500'}`}>{scenario.feedbackReviewed ? '완료' : '교정 있음'}</AppText></View> : null}<ChevronRight size={16} color={COLORS.muted} /></Pressable>;
}
