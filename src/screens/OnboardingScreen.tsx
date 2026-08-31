import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';

const ONBOARDING_IMAGES = [
  require('../../assets/onboarding/1.png'),
  require('../../assets/onboarding/2.png'),
  require('../../assets/onboarding/3.png'),
];

export function OnboardingScreen({ onFinish }: { onFinish: () => void | Promise<void> }) {
  const [page, setPage] = useState(0);
  const isLastPage = page === ONBOARDING_IMAGES.length - 1;

  function moveForward() {
    if (isLastPage) {
      void onFinish();
      return;
    }

    setPage((current) => current + 1);
  }

  function moveBack() {
    setPage((current) => Math.max(0, current - 1));
  }

  return (
    <View className="flex-1 bg-[#FFF9F1]">
      <Image
        source={ONBOARDING_IMAGES[page]}
        contentFit="contain"
        style={{ width: '100%', height: '100%' }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isLastPage ? '시작하기' : '다음'}
        accessibilityHint={isLastPage ? '로그인 화면으로 이동합니다.' : '다음 안내 화면으로 이동합니다.'}
        onPress={moveForward}
        style={{
          position: 'absolute',
          bottom: '2%',
          left: '8%',
          right: '8%',
          height: '26%',
          zIndex: 10,
        }}
      />
      {page > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 안내"
          accessibilityHint="이전 온보딩 화면으로 이동합니다."
          onPress={moveBack}
          style={{
            position: 'absolute',
            top: '1%',
            left: '2%',
            width: '18%',
            height: '11%',
            zIndex: 11,
          }}
        />
      ) : null}
    </View>
  );
}
