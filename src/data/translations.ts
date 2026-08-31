import { useSyncExternalStore } from 'react';
import type { DisplayLanguage } from '@/types/language';

export const UI_TRANSLATIONS: Record<Exclude<DisplayLanguage, 'ko'>, Record<string, string>> = {
  en: {
    '홈': 'Home', '복습': 'Review', '오늘의 문장': 'Daily Sentence', '프로필': 'Profile',
    '어떤 상황을 연습할까요?': 'What would you like to practice?',
    '바로 쓰는 표현을 상황별로 연습합니다': 'Practice useful expressions by situation.',
    '언어변경': 'Language', '상황 학습 시작': 'Start learning', '추천 상황': 'Recommended situations',
    '최근 본 상황': 'Recently viewed', '최근 본 상황이 없습니다.': 'No recently viewed situations.', '상황 검색': 'Search situations', '검색 결과가 없습니다.': 'No results found.', '전체': 'All', '편집': 'Edit', '삭제': 'Delete', '전체 삭제': 'Delete all', '학습 기록 삭제': 'Delete learning record', '{situation} 학습 기록을 삭제할까요?': 'Delete the learning record for {situation}?', '학습 기록 전체 삭제': 'Delete all learning records', '완료한 모든 학습 기록을 삭제할까요?': 'Delete all completed learning records?',
    '학습한 문장': 'Learned sentences', '상황별 학습한 문장들을 매일 한 문장씩 복습해봐요.': 'Review one learned sentence each day.', '이어서 학습하기': 'Continue learning', '계속하기': 'Continue', '단어 학습': 'Vocabulary', '학습을 저장하시겠습니까?': 'Save your learning progress?', '현재 단계와 대화 내용을 저장하면 홈에서 이어서 학습할 수 있어요.': 'Save your current step and conversation to continue from Home later.', '저장 후 나가기': 'Save and exit', '저장 안 함': 'Exit without saving',
    '배운 문장을 다시 말해보세요': 'Say the learned sentence again', '듣기': 'Listen', '말하기': 'Speak', '오늘의 문장 삭제': 'Delete daily sentence', '{sentence} 문장을 삭제할까요?': 'Delete the sentence “{sentence}”?',
    '이동': 'Go', '언어 설정': 'Language settings', '표시 언어와 학습 언어를 선택하세요.': 'Choose your display and learning languages.',
    '내 언어': 'My language', '배울 언어': 'Learning language', '취소': 'Cancel', '저장': 'Save',
    '학습 단어 수': 'Word count', '학습할 단어 개수': 'Words to learn', '한 번에 학습할 단어의 개수를 설정하세요 (1-100)': 'Set the number of words to learn at once (1–100).',
    '오늘의 문장 시간': 'Daily sentence time', '문장을 받을 시간': 'Delivery time', '오늘의 문장을 받을 시간을 24시간 형식으로 입력하세요.': 'Enter the delivery time in 24-hour format.',
    '프로필 설정': 'Profile settings', '언어·음성 설정': 'Language & voice settings', '마이크 권한 설정': 'Microphone permission', '알림 권한': 'Notification permission', '허용됨': 'Allowed', '현재 허용됨': 'Currently allowed', '설정 필요': 'Setup required', '데이터 관리': 'Data management', '앱 정보': 'App information', '듣기 속도': 'Listening speed', '목소리 음성': 'Voice', '목소리 1': 'Voice 1', '목소리 2': 'Voice 2', '느리게': 'Slow', '보통': 'Normal', '빠르게': 'Fast', '이미지 변경': 'Change photo', '이름': 'Name', '전화번호': 'Phone number', 'Google 계정': 'Google account',
    'Google 계정은 변경이 불가능합니다.': 'Google accounts cannot be changed.', '피드백 보내기': 'Send feedback', '로그아웃': 'Log out',
    '언어 학습을 시작하세요': 'Start learning a language', '실생활 상황으로 배우는 새로운 언어 학습 경험': 'A new language-learning experience for everyday situations.',
    'Google로 계속하기': 'Continue with Google', '또는': 'or', '게스트로 둘러보기': 'Continue as guest',
    '계속 진행하면 서비스 약관 및 개인정보 보호정책에 동의하게 됩니다.': 'By continuing, you agree to the Terms of Service and Privacy Policy.',
    '단어 복습': 'Vocabulary review', '표현 말하기': 'Speaking expressions', '대화 흐름': 'Conversation flow',
    '저장된 상황의 핵심 단어를 빠르게 확인합니다.': 'Quickly review key words from saved situations.',
    '바로 입 밖으로 꺼내기 좋은 문장을 반복합니다.': 'Repeat useful sentences until they come naturally.',
    '역할별 대화를 보며 응답 순서를 익힙니다.': 'Learn the response order through role-based dialogues.',
    '익숙해질 때까지 다시 보기': 'Review until it feels familiar', '문화 팁': 'Culture tip', '처음부터': 'Start over', '완료': 'Done', '다음': 'Next',
    '영어': 'English', '한국어': 'Korean', '일본어': 'Japanese', '개': '',
    '언어': 'Language', '프로필로 이동': 'Open profile', '예) 호텔 체크인하는 상황': 'e.g. Checking in at a hotel',
    '단어를 생성하고 있어요...': 'Creating vocabulary...', 'AI가 학습 내용을 만들고 있어요. 잠시만 기다려주세요.': 'AI is preparing your lesson. Please wait a moment.', '학습 내용을 만들지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.': 'We could not prepare the lesson. Check your connection and try again.', '학습한 문장이 아직 없습니다.': 'No learned sentences yet.',
    '상황 학습을 완료하면 오늘의 문장이 표시됩니다.': 'Complete a situation lesson to see a daily sentence.',
    '오늘의 문장으로 이동': 'Open daily sentences', '상황을 입력해주세요': 'Enter a situation',
    '학습하고 싶은 상황을 입력한 뒤 다시 시작해주세요.': 'Enter the situation you want to practice, then start again.', '확인': 'OK',
    '단어': 'Vocabulary', '표현': 'Phrases', '대화': 'Dialogue', '피드백': 'Feedback', '단어 게임': 'Word game',
    '대화 개선 제안': 'Conversation suggestions', '잘한 점': 'What you did well', '개선할 점': 'What to improve', '교정 있음': 'Needs correction',
    '저장된 피드백이 없습니다.': 'No saved feedback.', '이번 대화에서는 실제 대화 흐름과 관련해 별도의 개선 제안이 없습니다.': 'There are no additional conversation-flow suggestions for this dialogue.',
    '이번 대화에서는 별도로 고칠 만한 실제 대화 문제가 없었습니다.': 'There were no substantive conversation issues to correct in this dialogue.',
    '모르는 단어 없음': 'No unfamiliar words', '학습할 단어': 'Vocabulary to learn', '짝맞추기 게임': 'Matching game',
    'AI 회화 학습': 'AI conversation practice', '학습 피드백': 'Learning feedback', '대화 타임라인': 'Conversation timeline',
    '단어와 뜻을 연결해보세요.': 'Match the words with their meanings.', 'AI와 실제 대화를 연습하세요.': 'Practice a real conversation with AI.',
    '회화 학습 결과를 확인하세요.': 'Review your conversation results.', '학습한 대화 내용을 복습하세요.': 'Review the conversation you learned.',
    '아래에 모르거나 헷갈리는 단어를 선택해주세요.': 'Select the words you do not know or find confusing below.',
    '게임': 'Game', '선택 해제': 'Clear selection', '전체선택': 'Select all', '이전': 'Previous', '아직 대화가 남았습니다': 'Continue the conversation',
    '이번 대화에 사용할 단어': 'Words for this conversation', '전체 보기': 'Show all', '접기': 'Collapse',
    '답변을 작성하고 있어요': 'Writing a reply', '다시 듣기': 'Replay', '예시 답변': 'Example reply', '해석': 'Translation',
    '예시:': 'Example:', '발음:': 'Pronunciation:', '수정 문장': 'Corrected sentence', '현재 상황과 관련된 답변을 해보세요. 직원의 마지막 질문에 답하면 됩니다.': 'Reply in a way that fits the current situation. Answer the staff member’s last question.',
    '힌트 보기': 'Show hint', '예시 답변 보기': 'Show example reply', '힌트:': 'Hint:', '대화가 완료되었습니다. 다음 단계로 넘어가세요.': 'The conversation is complete. Move to the next step.',
    '메시지를 입력하세요...': 'Enter a message...', '듣는 중': 'Listening', '전송': 'Send', '대화 내용을 분석하고 있어요...': 'Analyzing your conversation...',
    '오늘의 문장 알림이 꺼져 있어요.': 'Daily sentence notifications are off.', '오늘 받을 문장': 'Today\'s sentences', '{time} 알림에서 문장 {count}개를 복습해보세요.': 'Review {count} sentence(s) in the {time} notification.', '문장 검색': 'Search sentences', '영어 또는 번역으로 검색하세요': 'Search by sentence or translation', '검색어 지우기': 'Clear search',
    '월 선택': 'Select month', '이전 달': 'Previous month', '다음 달': 'Next month', '이 달에 보낸 문장이 없습니다.': 'No sentences were sent this month.',
    '카페에서 커피 주문': 'Ordering coffee at a cafe', '호텔 체크인': 'Hotel check-in', '레스토랑 예약 확인': 'Checking a restaurant reservation',
    '바리스타에게 원하는 음료와 매장 이용 여부를 말하는 상황입니다.': 'Tell a barista what you would like and whether it is for here or to go.',
    '프런트 데스크에서 예약자 이름과 체크아웃 시간을 확인하는 상황입니다.': 'Confirm the reservation name and check-out time at the front desk.',
    '입구에서 예약 이름을 말하고 좌석을 안내받는 상황입니다.': 'Give the reservation name at the entrance and be shown to your table.',
    '미국 카페에서는 보통 Small, Medium, Large 같은 사이즈로 주문합니다.': 'In U.S. cafés, drink sizes are commonly ordered as Small, Medium, or Large.',
    '호텔 체크인 시 신분증과 결제 카드가 필요할 수 있습니다.': 'A photo ID and payment card may be required when checking in at a hotel.',
    '인기 있는 레스토랑은 예약 시간을 지나면 테이블이 취소될 수 있습니다.': 'At popular restaurants, tables may be released if you arrive after your reservation time.',
    '나': 'Me', 'STAFF': 'STAFF', 'YOU': 'YOU',
    '피드백 내용을 입력해주세요.': 'Enter your feedback.', '피드백을 보냈습니다': 'Feedback sent', '소중한 의견 감사합니다.': 'Thank you for your feedback.',
    '피드백 전송에 실패했습니다': 'Could not send feedback', '불편했던 점이나 개선 의견을 편하게 남겨주세요.': 'Share any inconvenience or ideas for improvement.',
    '피드백 내용': 'Feedback', '보내기': 'Send', '닫기': 'Close', '이름을 입력하세요': 'Enter your name',
    '프로필 이름': 'Profile name', 'Google 계정 이메일': 'Google account email', '예) 단어 게임에서 글자가 조금 더 크게 보이면 좋겠어요.': 'e.g. I would like the text in the word game to be a little larger.',
    '사진 접근 권한 필요': 'Photo permission required', '프로필 이미지를 선택하려면 사진 접근 권한이 필요합니다.': 'Photo access is required to choose a profile image.',
    '재생 중': 'Playing', '명사': 'Noun', '동사': 'Verb', '형용사': 'Adjective', '부사': 'Adverb', '대명사': 'Pronoun', '전치사': 'Preposition', '접속사': 'Conjunction', '감탄사': 'Interjection',
    '손님': 'Guest', '직원': 'Staff', '투숙객': 'Guest',
    '프랑스어': 'French', '스페인어': 'Spanish', '독일어': 'German', '중국어': 'Chinese', '러시아어': 'Russian', '아랍어': 'Arabic',
    '매일 {time}에 문장 {count}개를 보내드려요.': 'We will send {count} sentence(s) every day at {time}.', '총 {count}개의 단어를 학습합니다': 'You will learn {count} words.', '게임 {current} / {total}': 'Game {current} / {total}',
  },
  ja: {
    '홈': 'ホーム', '복습': '復習', '오늘의 문장': '今日のフレーズ', '프로필': 'プロフィール',
    '어떤 상황을 연습할까요?': 'どんな場面を練習しますか？', '바로 쓰는 표현을 상황별로 연습합니다': '場面別にすぐ使える表現を練習します。',
    '언어변경': '言語変更', '상황 학습 시작': '学習を始める', '추천 상황': 'おすすめの場面', '최근 본 상황': '最近見た場面',
    '최근 본 상황이 없습니다.': '最近見た場面はありません。', '상황 검색': '場面を検索', '검색 결과가 없습니다.': '検索結果はありません。', '전체': 'すべて', '편집': '編集', '삭제': '削除', '전체 삭제': 'すべて削除', '학습 기록 삭제': '学習記録を削除', '{situation} 학습 기록을 삭제할까요?': '{situation}の学習記録を削除しますか？', '학습 기록 전체 삭제': '学習記録をすべて削除', '완료한 모든 학습 기록을 삭제할까요?': '完了した学習記録をすべて削除しますか？', '학습한 문장': '学習した文', '상황별 학습한 문장들을 매일 한 문장씩 복습해봐요.': '場面別に学んだ文を毎日一つずつ復習しましょう。', '이어서 학습하기': '学習を再開', '계속하기': '続ける', '단어 학습': '単語学習', '학습을 저장하시겠습니까?': '学習の進捗を保存しますか？', '현재 단계와 대화 내용을 저장하면 홈에서 이어서 학습할 수 있어요.': '現在のステップと会話内容を保存すると、ホームから再開できます。', '저장 후 나가기': '保存して終了', '저장 안 함': '保存せずに終了',
    '배운 문장을 다시 말해보세요': '学んだ文をもう一度話してみましょう', '듣기': '聞く', '말하기': '話す', '오늘의 문장 삭제': '今日のフレーズを削除', '{sentence} 문장을 삭제할까요?': '「{sentence}」を削除しますか？', '이동': '移動',
    '언어 설정': '言語設定', '표시 언어와 학습 언어를 선택하세요.': '表示言語と学習言語を選択してください。', '내 언어': '表示言語', '배울 언어': '学習言語', '취소': 'キャンセル', '저장': '保存',
    '학습 단어 수': '学習単語数', '학습할 단어 개수': '学習する単語数', '한 번에 학습할 단어의 개수를 설정하세요 (1-100)': '一度に学習する単語数を設定してください（1〜100）。',
    '오늘의 문장 시간': '今日のフレーズの時間', '문장을 받을 시간': '受信時刻', '문장을 받을 시간을 24시간 형식으로 입력하세요.': '24時間形式で受信時刻を入力してください。',
    '프로필 설정': 'プロフィール設定', '언어·음성 설정': '言語・音声設定', '마이크 권한 설정': 'マイク権限設定', '알림 권한': '通知の許可', '허용됨': '許可済み', '현재 허용됨': '現在許可済み', '설정 필요': '設定が必要', '데이터 관리': 'データ管理', '앱 정보': 'アプリ情報', '듣기 속도': '聞く速さ', '목소리 음성': '声', '목소리 1': '音声 1', '목소리 2': '音声 2', '느리게': 'ゆっくり', '보통': '普通', '빠르게': '速く', '이미지 변경': '画像を変更', '이름': '名前', '전화번호': '電話番号', 'Google 계정': 'Google アカウント', 'Google 계정은 변경이 불가능합니다.': 'Google アカウントは変更できません。',
    '피드백 보내기': 'フィードバックを送る', '로그아웃': 'ログアウト', '언어 학습을 시작하세요': '言語学習を始めましょう', '실생활 상황으로 배우는 새로운 언어 학습 경험': '日常の場面で学ぶ新しい語学体験',
    'Google로 계속하기': 'Google で続ける', '또는': 'または', '게스트로 둘러보기': 'ゲストとして続ける', '계속 진행하면 서비스 약관 및 개인정보 보호정책에 동의하게 됩니다.': '続行すると、利用規約とプライバシーポリシーに同意したことになります。',
    '단어 복습': '単語の復習', '표현 말하기': '表現を話す', '대화 흐름': '会話の流れ', '저장된 상황의 핵심 단어를 빠르게 확인합니다.': '保存した場面の重要単語をすばやく確認します。', '바로 입 밖으로 꺼내기 좋은 문장을 반복합니다.': 'すぐ口に出せる文を繰り返します。', '역할별 대화를 보며 응答 순서를 익힙니다.': '役割別の会話で応答の順序を学びます。',
    '익숙해질 때까지 다시 보기': '慣れるまで繰り返す', '문화 팁': '文化のヒント', '처음부터': '最初から', '완료': '完了', '다음': '次へ', '영어': '英語', '한국어': '韓国語', '일본어': '日本語', '개': '件',
    '언어': '言語', '프로필로 이동': 'プロフィールを開く', '예) 호텔 체크인하는 상황': '例）ホテルでチェックインする場面',
    '단어를 생성하고 있어요...': '単語を作成しています…', 'AI가 학습 내용을 만들고 있어요. 잠시만 기다려주세요.': 'AIが学習内容を作成しています。少々お待ちください。', '학습 내용을 만들지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.': '学習内容を作成できませんでした。ネットワーク状態を確認してから、もう一度お試しください。', '학습한 문장이 아직 없습니다.': '学習した文はまだありません。',
    '상황 학습을 완료하면 오늘의 문장이 표시됩니다.': '場面学習を完了すると今日のフレーズが表示されます。',
    '오늘의 문장으로 이동': '今日のフレーズを開く', '상황을 입력해주세요': '場面を入力してください',
    '학습하고 싶은 상황을 입력한 뒤 다시 시작해주세요.': '練習したい場面を入力してから、もう一度始めてください。', '확인': '確認',
    '단어': '単語', '표현': '表現', '대화': '会話', '피드백': 'フィードバック', '단어 게임': '単語ゲーム',
    '대화 개선 제안': '会話の改善提案', '잘한 점': '良かった点', '개선할 점': '改善点', '교정 있음': '修正あり',
    '저장된 피드백이 없습니다.': '保存されたフィードバックはありません。', '이번 대화에서는 실제 대화 흐름과 관련해 별도의 개선 제안이 없습니다.': '今回の会話では、会話の流れに関する追加の改善提案はありません。',
    '이번 대화에서는 별도로 고칠 만한 실제 대화 문제가 없었습니다.': '今回の会話では、特に修正すべき会話上の問題はありませんでした。',
    '모르는 단어 없음': '知らない単語はない', '학습할 단어': '学習する単語', '짝맞추기 게임': 'マッチングゲーム',
    'AI 회화 학습': 'AI会話学習', '학습 피드백': '学習フィードバック', '대화 타임라인': '会話タイムライン',
    '단어와 뜻을 연결해보세요.': '単語と意味をつなげてみましょう。', 'AI와 실제 대화를 연습하세요.': 'AIと実際の会話を練習しましょう。',
    '회화 학습 결과를 확인하세요.': '会話学習の結果を確認しましょう。', '학습한 대화 내용을 복습하세요.': '学習した会話内容を復習しましょう。',
    '아래에 모르거나 헷갈리는 단어를 선택해주세요.': '知らない、または迷う単語を下から選んでください。',
    '게임': 'ゲーム', '선택 해제': '選択解除', '전체선택': 'すべて選択', '이전': '前へ', '아직 대화가 남았습니다': '会話を続ける',
    '이번 대화에 사용할 단어': '今回の会話で使う単語', '전체 보기': 'すべて見る', '접기': '閉じる',
    '답변을 작성하고 있어요': '返信を作成しています', '다시 듣기': 'もう一度聞く', '예시 답변': '回答例', '해석': '訳',
    '예시:': '例：', '발음:': '発音：', '수정 문장': '修正文', '현재 상황과 관련된 답변을 해보세요. 직원의 마지막 질문에 답하면 됩니다.': '現在の場面に合った返答をしましょう。スタッフの最後の質問に答えてください。',
    '힌트 보기': 'ヒントを見る', '예시 답변 보기': '回答例を見る', '힌트:': 'ヒント：', '대화가 완료되었습니다. 다음 단계로 넘어가세요.': '会話が完了しました。次のステップへ進みましょう。',
    '메시지를 입력하세요...': 'メッセージを入力してください…', '듣는 중': '聞き取り中', '전송': '送信', '대화 내용을 분석하고 있어요...': '会話内容を分析しています…',
    '오늘의 문장 알림이 꺼져 있어요.': '今日のフレーズ通知はオフです。', '오늘 받을 문장': '今日受け取る文', '{time} 알림에서 문장 {count}개를 복습해보세요.': '{time}の通知で{count}文を復習しましょう。', '문장 검색': '文を検索', '영어 또는 번역으로 검색하세요': '文または訳で検索', '검색어 지우기': '検索をクリア', '월 선택': '月を選択', '이전 달': '前の月', '다음 달': '次の月', '이 달에 보낸 문장이 없습니다.': '今月送った文はありません。',
    '카페에서 커피 주문': 'カフェでコーヒーを注文', '호텔 체크인': 'ホテルのチェックイン', '레스토랑 예약 확인': 'レストランの予約確認',
    '바리스타에게 원하는 음료와 매장 이용 여부를 말하는 상황입니다.': 'バリスタに希望の飲み物と店内利用か持ち帰りかを伝える場面です。',
    '프런트 데스크에서 예약자 이름과 체크아웃 시간을 확인하는 상황입니다.': 'フロントで予約名とチェックアウト時刻を確認する場面です。',
    '입구에서 예약 이름을 말하고 좌석을 안내받는 상황입니다.': '入口で予約名を伝え、席に案内してもらう場面です。',
    'Ordering coffee at a cafe': 'カフェでコーヒーを注文', 'Hotel check-in': 'ホテルのチェックイン', 'Checking a restaurant reservation': 'レストランの予約確認',
    '미국 카페에서는 보통 Small, Medium, Large 같은 사이즈로 주문합니다.': 'アメリカのカフェでは、通常Small、Medium、Largeなどのサイズで注文します。',
    '호텔 체크인 시 신분증과 결제 카드가 필요할 수 있습니다.': 'ホテルのチェックインでは、身分証明書と支払い用カードが必要になることがあります。',
    '인기 있는 레스토랑은 예약 시간을 지나면 테이블이 취소될 수 있습니다.': '人気のレストランでは、予約時刻を過ぎると席がキャンセルされることがあります。',
    '나': '私', 'STAFF': 'スタッフ', 'YOU': 'あなた',
    '피드백 내용을 입력해주세요.': 'フィードバック内容を入力してください。', '피드백을 보냈습니다': 'フィードバックを送信しました', '소중한 의견 감사합니다.': 'ご意見ありがとうございます。',
    '피드백 전송에 실패했습니다': 'フィードバックを送信できませんでした', '불편했던 점이나 개선 의견을 편하게 남겨주세요.': '不便だった点や改善案を気軽にお寄せください。',
    '피드백 내용': 'フィードバック内容', '보내기': '送信', '닫기': '閉じる', '사진 접근 권한 필요': '写真アクセス権限が必要です',
    '프로필 이름': 'プロフィール名', 'Google 계정 이메일': 'Google アカウントのメールアドレス', '예) 단어 게임에서 글자가 조금 더 크게 보이면 좋겠어요.': '例）単語ゲームの文字をもう少し大きくしてほしいです。',
    '프로필 이미지를 선택하려면 사진 접근 권한이 필요합니다.': 'プロフィール画像を選ぶには写真へのアクセス権限が必要です。',
    '재생 중': '再生中', '명사': '名詞', '동사': '動詞', '형용사': '形容詞', '부사': '副詞', '대명사': '代名詞', '전치사': '前置詞', '접속사': '接続詞', '감탄사': '感嘆詞',
    '손님': 'お客様', '직원': 'スタッフ', '투숙객': '宿泊客',
    '프랑스어': 'フランス語', '스페인어': 'スペイン語', '독일어': 'ドイツ語', '중국어': '中国語', '러시아어': 'ロシア語', '아랍어': 'アラビア語',
    '매일 {time}에 문장 {count}개를 보내드려요.': '毎日{time}に{count}件の文をお届けします。', '총 {count}개의 단어를 학습합니다': '合計{count}語を学習します', '게임 {current} / {total}': 'ゲーム {current} / {total}',
  },
};

let activeDisplayLanguage: DisplayLanguage = 'ko';
const languageListeners = new Set<() => void>();

export function setDisplayLanguage(language: DisplayLanguage) {
  if (activeDisplayLanguage === language) return;
  activeDisplayLanguage = language;
  languageListeners.forEach((listener) => listener());
}

function subscribeToDisplayLanguage(listener: () => void) {
  languageListeners.add(listener);
  return () => languageListeners.delete(listener);
}

function getDisplayLanguageSnapshot() {
  return activeDisplayLanguage;
}

export function useDisplayLanguage() {
  return useSyncExternalStore(
    subscribeToDisplayLanguage,
    getDisplayLanguageSnapshot,
    getDisplayLanguageSnapshot,
  );
}

export function getDisplayLocale() {
  return activeDisplayLanguage === 'ja' ? 'ja-JP' : activeDisplayLanguage === 'en' ? 'en-US' : 'ko-KR';
}

export function translateText(value: string) {
  return activeDisplayLanguage === 'ko' ? value : UI_TRANSLATIONS[activeDisplayLanguage][value] ?? value;
}

export function translateTemplate(value: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, replacement]) => result.replaceAll(`{${key}}`, String(replacement)),
    translateText(value),
  );
}

export function formatWordCount(count: number) {
  return activeDisplayLanguage === 'ja' ? `${count}語` : activeDisplayLanguage === 'en' ? `${count} words` : `${count}개`;
}

export function formatScenarioCount(count: number) {
  return activeDisplayLanguage === 'ja' ? `${count}件` : activeDisplayLanguage === 'en' ? `${count} scenarios` : `${count}개`;
}
