import type { ReactNode } from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';

export function SettingLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return <View className="mt-4 mb-2 flex-row items-center gap-2">{icon}<AppText className="font-mono text-[11px] font-black uppercase tracking-[2px] text-[#C77932]">{label}</AppText></View>;
}
