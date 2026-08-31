import { View } from 'react-native';
import { MatchingCard } from '@/components/gentalk/MatchingCard';
import type { VocabItem } from '@/types/learning';

type MatchingGameStepProps = {
  words: VocabItem[];
  translations: VocabItem[];
  matchedWords: string[];
  selectedWord: string | null;
  selectedSide: 'word' | 'translation' | null;
  wrongPair: { word: string; translationWord: string } | null;
  onSelectWord: (word: string) => void;
  onSelectTranslation: (item: VocabItem) => void;
};

/** 선택한 단어의 영어·한글 짝을 맞추는 두 번째 학습 단계입니다. */
export function MatchingGameStep({
  words,
  translations,
  matchedWords,
  selectedWord,
  selectedSide,
  wrongPair,
  onSelectWord,
  onSelectTranslation,
}: MatchingGameStepProps) {
  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap gap-2">
        {words.map((item) => (
          <MatchingCard
            key={`word-${item.word}`}
            label={item.word}
            onPress={() => onSelectWord(item.word)}
            state={matchedWords.includes(item.word) ? 'matched' : wrongPair?.word === item.word ? 'wrong' : selectedSide === 'word' && selectedWord === item.word ? 'selected' : 'idle'}
          />
        ))}
      </View>
      <View className="h-px bg-[#D8CAB5]" />
      <View className="flex-row flex-wrap gap-2">
        {translations.map((item) => (
          <MatchingCard
            key={`translation-${item.word}`}
            label={item.translation}
            onPress={() => onSelectTranslation(item)}
            state={matchedWords.includes(item.word) ? 'matched' : wrongPair?.translationWord === item.word ? 'wrong' : selectedSide === 'translation' && selectedWord === item.word ? 'selected' : 'idle'}
          />
        ))}
      </View>
    </View>
  );
}
