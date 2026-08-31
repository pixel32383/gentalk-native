import { StyleSheet } from 'react-native';

export const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  sheet: { width: '100%', maxWidth: 500, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#FBF5E9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E1D5C4', paddingHorizontal: 24, paddingVertical: 20 },
  title: { color: '#231A0E', fontSize: 22, fontWeight: '900' },
  closeButton: { height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#E9D8C5' },
  body: { paddingHorizontal: 24, paddingVertical: 22 },
  label: { color: '#6B5843', fontSize: 14, fontWeight: '700' },
  description: { marginTop: 8, color: '#8A7D6D', fontSize: 13, lineHeight: 20 },
  input: { marginTop: 18, minHeight: 62, borderWidth: 1, borderColor: '#DED0BA', borderRadius: 16, backgroundColor: '#F3E8D4', color: '#231A0E', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  footer: { borderTopWidth: 1, borderTopColor: '#E1D5C4', padding: 16 },
  saveButton: { alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#914523', paddingVertical: 16 },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
