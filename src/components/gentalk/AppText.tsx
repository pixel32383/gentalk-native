import type { ComponentProps } from 'react';
import { Text as NativeText } from 'react-native';
import { translateText, useDisplayLanguage } from '@/data/translations';

export function AppText({ children, ...props }: ComponentProps<typeof NativeText>) {
  useDisplayLanguage();
  return <NativeText {...props}>{typeof children === 'string' ? translateText(children) : children}</NativeText>;
}
