import { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

export function MatchingCard({ label, state, onPress }: { label: string; state: 'idle' | 'selected' | 'matched' | 'wrong'; onPress: () => void }) {
  const offset = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
  useEffect(() => { if (state === 'wrong') offset.value = withSequence(withTiming(-8, { duration: 55 }), withTiming(8, { duration: 55 }), withTiming(-5, { duration: 55 }), withTiming(0, { duration: 55 })); }, [offset, state]);
  const color = state === 'matched' ? 'border-emerald-500 bg-emerald-50' : state === 'selected' ? 'border-[#914523] bg-[#E7D6C2]' : state === 'wrong' ? 'border-rose-500 bg-rose-50' : 'border-[#E1D2BB] bg-[#F3EBDD]';
  return <Animated.View style={animatedStyle} className="w-[31%]"><Pressable onPress={onPress} disabled={state === 'matched'} className={`min-h-24 items-center justify-center rounded-2xl border p-2 active:opacity-70 ${color}`}><Text className="text-center text-sm font-bold text-[#231A0E]">{label}</Text></Pressable></Animated.View>;
}
