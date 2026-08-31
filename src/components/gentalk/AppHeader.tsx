import type { ReactNode } from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';

export function AppHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return <View className="flex-row items-center justify-between gap-4 px-5 pb-4 pt-6"><View className="min-w-0 flex-1"><AppText className="font-mono text-[11px] font-bold uppercase tracking-[2px] text-[#C77932]">{subtitle ?? 'Gentalk'}</AppText><AppText className="mt-1 text-[26px] font-black leading-8 text-[#231A0E]">{title}</AppText></View>{right}</View>;
}
