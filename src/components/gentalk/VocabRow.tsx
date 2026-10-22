import { View } from 'react-native';
import type { VocabItem } from '@/types/learning';
import { formatPartOfSpeech } from '@/data/vocabulary';
import { AppText } from './AppText';

export function VocabRow({ item }: { item: VocabItem }) {
  return <View className="flex-row items-center gap-3 rounded-xl border border-[#E9DDCE] bg-white p-4"><View className="min-w-0 flex-1"><AppText className="text-base font-black text-[#231A0E]">{item.word}</AppText>{item.rom ? <AppText className="mt-1 font-mono text-xs text-[#8A7D6D]">{item.rom}</AppText> : null}<AppText className="mt-1 text-xs text-[#8A7D6D]">{item.translation}</AppText></View><AppText className="overflow-hidden rounded-full bg-[#E7F2EF] px-2.5 py-1 text-[11px] font-bold text-[#255F5A]">{formatPartOfSpeech(item.pos)}</AppText></View>;
}
