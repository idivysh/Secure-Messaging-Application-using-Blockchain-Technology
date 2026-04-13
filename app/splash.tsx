import { View, Text, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/useTheme';

export default function Splash() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      {/* 🔹 CENTER BRAND */}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Image
          source={require('../assets/logo.png')}
          style={{
            width: 96,
            height: 96,
            resizeMode: 'contain',
            marginBottom: 14,
            borderRadius: 20, // soft premium touch
          }}
        />

        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            letterSpacing: 1,
            color: theme.text,
          }}
        >
          SMAUBCT
        </Text>

        <Text
          style={{
            marginTop: 6,
            fontSize: 13,
            color: theme.subText,
            letterSpacing: 0.5,
          }}
        >
          Secure • Private • Modern
        </Text>
      </View>

      {/* 🔹 FOOTER CREDIT */}
      <View
        style={{
          alignItems: 'center',
          paddingBottom: 20,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: theme.subText,
            opacity: 0.8,
          }}
        >
          Developed by
        </Text>

        <Text
          style={{
            marginTop: 2,
            fontSize: 13,
            fontWeight: '600',
            color: theme.text,
            letterSpacing: 0.4,
          }}
        >
          Vengala Divyamsh Sai
        </Text>
      </View>
    </View>
  );
}
