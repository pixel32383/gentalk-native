import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Globe } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText } from '@/components/gentalk/AppText';
const styles = StyleSheet.create({ welcomeScrollContent:{flexGrow:1,paddingTop:61,paddingHorizontal:39,paddingBottom:42,backgroundColor:'#FBF5E9'}, welcomeScreen:{flex:1,backgroundColor:'#FBF5E9'}, welcomePressed:{opacity:0.68}, welcomeMain:{width:'100%',maxWidth:440,alignSelf:'center',alignItems:'center',paddingTop:215}, welcomeGlobe:{width:96,height:96,borderRadius:48,backgroundColor:'#E9D8C5',alignItems:'center',justifyContent:'center'}, welcomeHeading:{alignItems:'center',marginTop:31,gap:4}, welcomeTitle:{color:'#20170D',textAlign:'center',fontSize:27,lineHeight:39,fontWeight:'900'}, welcomeSubtitle:{color:'#9A735B',textAlign:'center',fontSize:15,lineHeight:24}, googleButton:{width:'100%',height:60,marginTop:39,borderRadius:16,borderWidth:1,borderColor:'#DED2C0',backgroundColor:'#F3E8D4',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12}, googleButtonText:{color:'#20170D',fontSize:15,fontWeight:'800'}, welcomeDivider:{width:166,marginTop:37,flexDirection:'row',alignItems:'center',gap:15}, welcomeDividerLine:{height:1,flex:1,backgroundColor:'#D8CBB8'}, welcomeDividerText:{color:'#A08269',fontSize:14}, guestButton:{marginTop:14,paddingHorizontal:20,paddingVertical:8}, guestButtonText:{color:'#914523',textAlign:'center',fontSize:16,fontWeight:'800'}, welcomeLegal:{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',marginTop:'auto'}, welcomeLegalText:{color:'#9A735B',textAlign:'center',fontSize:11,lineHeight:20}, welcomeLegalLink:{color:'#914523',fontSize:11,lineHeight:20,fontWeight:'800',textDecorationLine:'underline'} });

export function WelcomeScreen({
  onGoogleContinue,
  onGuestContinue,
  onOpenTerms,
  onOpenPrivacy,
}: {
  onGoogleContinue: () => void;
  onGuestContinue: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}) {
  return (
    <ScrollView
      style={styles.welcomeScreen}
      contentContainerStyle={styles.welcomeScrollContent}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}>
      <View style={styles.welcomeMain}>
        <View style={styles.welcomeGlobe}>
          <Globe size={44} color="#914523" strokeWidth={1.8} />
        </View>

        <View style={styles.welcomeHeading}>
          <AppText style={styles.welcomeTitle}>
            언어 학습을 시작하세요
          </AppText>
          <AppText style={styles.welcomeSubtitle}>
            실생활 상황으로 배우는 새로운 언어 학습 경험
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onGoogleContinue}
          style={({ pressed }) => [styles.googleButton, pressed && styles.welcomePressed]}>
          <Svg width={23} height={23} viewBox="0 0 24 24" accessibilityLabel="Google">
            <Path
              fill="#4285F4"
              d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.87h5.39a4.63 4.63 0 0 1-2 2.95v2.5h3.24c1.9-1.74 2.97-4.32 2.97-7.25Z"
            />
            <Path
              fill="#34A853"
              d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.5c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.05v2.58A10 10 0 0 0 12 22Z"
            />
            <Path
              fill="#FBBC05"
              d="M6.39 13.9A6.02 6.02 0 0 1 6.07 12c0-.66.12-1.3.32-1.9V7.52H3.05A10 10 0 0 0 2 12c0 1.61.38 3.14 1.05 4.48l3.34-2.58Z"
            />
            <Path
              fill="#EA4335"
              d="M12 5.97c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.95 5.52l3.34 2.58C7.18 7.73 9.39 5.97 12 5.97Z"
            />
          </Svg>
          <AppText style={styles.googleButtonText}>Google로 계속하기</AppText>
        </Pressable>

        <View style={styles.welcomeDivider}>
          <View style={styles.welcomeDividerLine} />
          <AppText style={styles.welcomeDividerText}>또는</AppText>
          <View style={styles.welcomeDividerLine} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onGuestContinue}
          style={({ pressed }) => [styles.guestButton, pressed && styles.welcomePressed]}>
          <AppText style={styles.guestButtonText}>
            게스트로 둘러보기
          </AppText>
        </Pressable>
      </View>

      <View style={styles.welcomeLegal}>
        <AppText style={styles.welcomeLegalText}>계속 진행하면 </AppText>
        <Pressable accessibilityRole="link" onPress={onOpenTerms}><AppText style={styles.welcomeLegalLink}>서비스 이용약관</AppText></Pressable>
        <AppText style={styles.welcomeLegalText}> 및 </AppText>
        <Pressable accessibilityRole="link" onPress={onOpenPrivacy}><AppText style={styles.welcomeLegalLink}>개인정보처리방침</AppText></Pressable>
        <AppText style={styles.welcomeLegalText}>에 동의하게 됩니다.</AppText>
      </View>
    </ScrollView>
  );
}
