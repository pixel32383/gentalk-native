import { Pressable, View } from 'react-native';
import { LANGUAGES } from '@/data/languages';
import type { Scenario } from '@/types/learning';
import { AppText } from './AppText';

export function ScenarioCard({ scenario, onPress }: { scenario: Scenario; onPress: () => void }) {
  const language = LANGUAGES.find((item) => item.code === scenario.langCode);
  return <Pressable onPress={onPress} className="rounded-2xl border border-[#E9DDCE] bg-white p-4 shadow-sm active:bg-[#F8F1E8] active:opacity-80"><View className="flex-row items-start gap-3"><View className="h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F2E8D9]"><AppText className="text-2xl">{scenario.emoji}</AppText></View><View className="min-w-0 flex-1"><View className="mb-1 flex-row items-center gap-2"><AppText className="font-mono text-[11px] font-semibold text-[#8A7D6D]">{language?.flag} {language?.label}</AppText></View><AppText className="text-base font-black leading-5 text-[#231A0E]">{scenario.situation}</AppText><AppText className="mt-1 text-xs leading-5 text-[#8A7D6D]">{scenario.context}</AppText></View></View></Pressable>;
}
