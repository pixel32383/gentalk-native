/** AI·기존 저장 데이터의 품사 값을 앱에서 항상 한국어로 표시합니다. */
export function formatPartOfSpeech(partOfSpeech: string | undefined) {
  const value = partOfSpeech?.trim().toLowerCase() ?? '';
  const labels: Record<string, string> = {
    noun: '명사',
    'proper noun': '고유명사',
    verb: '동사',
    'phrasal verb': '구동사',
    adjective: '형용사',
    adverb: '부사',
    pronoun: '대명사',
    preposition: '전치사',
    conjunction: '접속사',
    interjection: '감탄사',
    article: '관사',
    determiner: '한정사',
    phrase: '표현',
    pharse: '표현',
    expression: '표현',
    idiom: '숙어',
    sentence: '문장',
    clause: '절',
  };

  return labels[value] ?? (partOfSpeech?.trim() || '표현');
}
