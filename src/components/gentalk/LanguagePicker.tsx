import { Pressable, View } from 'react-native';
import { LANGUAGES } from '@/data/languages';
import type { Lang } from '@/types/language';
import { AppText } from './AppText';

export function LanguagePicker({ selected, onSelect, languages = LANGUAGES }: { selected: string; onSelect: (code: string) => void; languages?: Lang[] }) {
  return <View className="flex-row flex-wrap gap-2">{languages.map((language) => <Pressable key={language.code} onPress={() => onSelect(language.code)} className={`flex-row items-center gap-2 rounded-xl border px-3 py-2 ${selected === language.code ? 'border-[#255F5A] bg-[#E7F2EF]' : 'border-[#E9DDCE] bg-[#F8F1E8]'}`}><AppText>{language.flag}</AppText><AppText className={`text-xs font-bold ${selected === language.code ? 'text-[#255F5A]' : 'text-[#8A7D6D]'}`}>{language.label}</AppText></Pressable>)}</View>;
}
