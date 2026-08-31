import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

export function RoundButton({ children, onPress, active = false }: { children: ReactNode; onPress: () => void; active?: boolean }) {
  return <Pressable onPress={onPress} className={`h-9 w-9 items-center justify-center rounded-full border active:opacity-70 ${active ? 'border-amber-300 bg-amber-50' : 'border-[#E9DDCE] bg-white'}`}>{children}</Pressable>;
}
