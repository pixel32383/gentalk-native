import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { COLORS } from '@/data/constants';
import { LANGUAGES } from '@/data/languages';
import { AppHeader } from '@/components/gentalk/AppHeader';
import { AppText } from '@/components/gentalk/AppText';
import { MiniScenarioRow } from '@/components/gentalk/MiniScenarioRow';
import { RoundButton } from '@/components/gentalk/RoundButton';
import { translateTemplate, translateText, useDisplayLanguage } from '@/data/translations';
import type { Scenario } from '@/types/learning';

type LanguageFilter = 'all' | 'needs-correction' | string;

function hasCorrection(scenario: Scenario) {
  return Boolean(
    scenario.learningFeedback
      && ((scenario.learningFeedback.messageCorrections?.length ?? 0) > 0 || scenario.learningFeedback.improvements.length > 0),
  );
}

export function ReviewScreen({ recentScenarios, onScenario, onRemoveRecentScenario, onRemoveAllRecentScenarios }: { recentScenarios: Scenario[]; onScenario: (scenario: Scenario) => void; onRemoveRecentScenario: (id: string) => void; onRemoveAllRecentScenarios: () => void }) {
  useDisplayLanguage();
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>('all');
  const [isEditing, setIsEditing] = useState(false);
  const availableLanguages = useMemo(
    () => LANGUAGES.filter((language) => recentScenarios.some((scenario) => scenario.langCode === language.code)),
    [recentScenarios],
  );
  const filteredScenarios = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();
    return recentScenarios.filter((scenario) => {
      const matchesLanguage = languageFilter === 'all'
        || (languageFilter === 'needs-correction' ? hasCorrection(scenario) : scenario.langCode === languageFilter);
      const searchableText = [scenario.situation, scenario.title, scenario.context].join(' ').toLocaleLowerCase();
      return matchesLanguage && (!keyword || searchableText.includes(keyword));
    });
  }, [languageFilter, recentScenarios, search]);

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 136 }}>
      <AppHeader title="복습" subtitle="익숙해질 때까지 다시 보기" />
      <View className="mx-5 mt-2 rounded-xl border border-[#DED0BA] bg-[#FBF6EC] px-3 py-2.5">
        <View className="flex-row items-center gap-2">
          <Search size={16} color={COLORS.muted} />
          <TextInput value={search} onChangeText={setSearch} placeholder={translateText('상황 검색')} placeholderTextColor="#8A7D6D" className="min-h-7 flex-1 text-sm text-[#231A0E]" returnKeyType="search" />
          {search ? <Pressable onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="검색 지우기" className="h-7 w-7 items-center justify-center rounded-full active:opacity-70"><X size={15} color={COLORS.muted} /></Pressable> : null}
        </View>
      </View>

      {availableLanguages.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3" contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          <Pressable onPress={() => setLanguageFilter('all')} className={`rounded-full border px-3 py-2 ${languageFilter === 'all' ? 'border-[#255F5A] bg-[#255F5A]' : 'border-[#DED0BA] bg-white'}`}><AppText className={`text-xs font-black ${languageFilter === 'all' ? 'text-white' : 'text-[#6B5843]'}`}>전체</AppText></Pressable>
          <Pressable onPress={() => setLanguageFilter('needs-correction')} className={`rounded-full border px-3 py-2 ${languageFilter === 'needs-correction' ? 'border-red-500 bg-red-500' : 'border-red-200 bg-red-50'}`}><AppText className={`text-xs font-black ${languageFilter === 'needs-correction' ? 'text-white' : 'text-red-600'}`}>교정 있음</AppText></Pressable>
          {availableLanguages.map((language) => {
            const selected = languageFilter === language.code;
            return <Pressable key={language.code} onPress={() => setLanguageFilter(language.code)} className={`flex-row items-center gap-1 rounded-full border px-3 py-2 ${selected ? 'border-[#255F5A] bg-[#255F5A]' : 'border-[#DED0BA] bg-white'}`}><AppText className="text-xs">{language.flag}</AppText><AppText className={`text-xs font-black ${selected ? 'text-white' : 'text-[#6B5843]'}`}>{language.label}</AppText></Pressable>;
          })}
        </ScrollView>
      ) : null}

      <View className="mx-5 mb-3 mt-5 flex-row items-center justify-between"><AppText className="font-mono text-[11px] font-bold uppercase tracking-[2px] text-[#8A7D6D]">최근 본 상황</AppText>{recentScenarios.length > 0 ? <View className="flex-row gap-2">{isEditing ? <Pressable onPress={() => Alert.alert(translateText('학습 기록 전체 삭제'), translateText('완료한 모든 학습 기록을 삭제할까요?'), [{ text: translateText('취소'), style: 'cancel' }, { text: translateText('전체 삭제'), style: 'destructive', onPress: () => { onRemoveAllRecentScenarios(); setIsEditing(false); } }])} className="rounded-lg bg-red-50 px-3 py-2 active:opacity-70"><AppText className="text-xs font-black text-red-600">전체 삭제</AppText></Pressable> : null}<Pressable onPress={() => setIsEditing((current) => !current)} className="rounded-lg bg-[#F3EBDD] px-3 py-2 active:opacity-70"><AppText className="text-xs font-black text-[#914523]">{isEditing ? '완료' : '편집'}</AppText></Pressable></View> : null}</View>
      <View className="mx-5 gap-2">
        {filteredScenarios.map((scenario) => <View key={scenario.id} className="flex-row items-center gap-2"><MiniScenarioRow scenario={scenario} onPress={() => onScenario(scenario)} />{isEditing ? <RoundButton onPress={() => Alert.alert(translateText('학습 기록 삭제'), translateTemplate('{situation} 학습 기록을 삭제할까요?', { situation: scenario.situation }), [{ text: translateText('취소'), style: 'cancel' }, { text: translateText('삭제'), style: 'destructive', onPress: () => onRemoveRecentScenario(scenario.id) }])}><X size={17} color={COLORS.muted} /></RoundButton> : null}</View>)}
        {recentScenarios.length === 0 ? <View className="rounded-xl border border-dashed border-[#E9DDCE] bg-[#F8F1E8] px-4 py-5"><AppText className="text-center text-sm text-[#8A7D6D]">최근 본 상황이 없습니다.</AppText></View> : null}
        {recentScenarios.length > 0 && filteredScenarios.length === 0 ? <View className="rounded-xl border border-dashed border-[#E9DDCE] bg-[#F8F1E8] px-4 py-5"><AppText className="text-center text-sm text-[#8A7D6D]">검색 결과가 없습니다.</AppText></View> : null}
      </View>
    </ScrollView>
  );
}
