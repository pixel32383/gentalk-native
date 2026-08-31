import { Pressable, View } from 'react-native';
import { AppText } from '@/components/gentalk/AppText';
import type { VocabItem } from '@/types/learning';

type VocabularyStepProps = {
  words: VocabItem[];
  selectedWords: string[];
  onToggleWord: (word: string) => void;
  onSkip: () => void;
};

function formatPartOfSpeech(pos: string) {
  const value = pos.toLowerCase();
  return value.includes('noun') ? '명사' : value.includes('verb') ? '동사' : value.includes('adjective') ? '형용사' : pos;
}

/** 모르는 단어를 고르거나, 단어 게임을 건너뛰는 첫 단계입니다. */
export function VocabularyStep({ words, selectedWords, onToggleWord, onSkip }: VocabularyStepProps) {
  return (
    <>
      {words.map((item) => (
        <Pressable
          key={item.word}
          onPress={() => onToggleWord(item.word)}
          className={`flex-row items-center justify-between rounded-2xl border px-4 py-4 ${selectedWords.includes(item.word) ? 'border-[#914523] bg-[#F3EBDD]' : 'border-[#E1D2BB] bg-white'}`}>
          <View>
            <AppText className="text-base font-black text-[#231A0E]">{item.word}</AppText>
            <AppText className="mt-1 text-sm text-[#914523]">{item.translation}</AppText>
          </View>
          <AppText className="text-xs text-[#8A7D6D]">{formatPartOfSpeech(item.pos)}</AppText>
        </Pressable>
      ))}
      <Pressable
        onPress={onSkip}
        className="items-center rounded-xl border border-[#D8CAB5] bg-[#F8F1E8] py-3 active:opacity-70">
        <AppText className="text-sm font-black text-[#6B5843]">모르는 단어 없음</AppText>
      </Pressable>
    </>
  );
}
