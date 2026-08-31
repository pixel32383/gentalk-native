import { StyleSheet } from 'react-native';

export const profileEditStyles = StyleSheet.create({
  keyboardAvoidingView: { width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  sheet: { width: '100%', maxWidth: 520, maxHeight: '90%', alignSelf: 'center', overflow: 'hidden', borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#FBF5E9' },
  scroll: { flexShrink: 1 },
  body: { gap: 24, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 },
  imageSection: { alignItems: 'center', gap: 12 }, image: { width: 96, height: 96, borderRadius: 48 }, imageFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#255F5A' }, initial: { color: '#FFFFFF', fontSize: 34, fontWeight: '900' },
  imageButton: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: '#D8CAB5', borderRadius: 12, backgroundColor: '#F3E8D4', paddingHorizontal: 14, paddingVertical: 10 }, imageButtonText: { color: '#914523', fontSize: 13, fontWeight: '800' },
  field: { gap: 8 }, fieldLabel: { color: '#6B5843', fontSize: 14, fontWeight: '800' }, inputRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#D8CAB5', borderRadius: 14, backgroundColor: '#FFFFFF', paddingHorizontal: 15 }, input: { minWidth: 0, flex: 1, color: '#231A0E', fontSize: 15 }, inputRowDisabled: { backgroundColor: '#E8E5E0', borderColor: '#D3CEC6' }, inputDisabled: { color: '#807A72' }, fieldHelp: { color: '#9A8068', fontSize: 11, lineHeight: 17 },
  deleteAccountButton: { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, backgroundColor: '#FEF2F2', paddingHorizontal: 14, paddingVertical: 11 }, deleteAccountText: { color: '#DC2626', fontSize: 13, fontWeight: '800' },
});
