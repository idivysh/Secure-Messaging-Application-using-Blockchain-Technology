import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { ThemeContext } from '../../src/theme/ThemeContext';
import { clearSession } from '../../src/security/session';
import { auth } from '../../src/firebase/firebaseConfig';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Settings() {
  const theme = useContext(ThemeContext)!;
  const router = useRouter();

  const Option = ({
    label,
    value,
  }: {
    label: string;
    value: 'system' | 'light' | 'dark';
  }) => (
    <TouchableOpacity
      onPress={() => theme.setPreference(value)}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
      }}
    >
      <Text style={{ color: theme.text, fontSize: 16 }}>
        {label}
      </Text>

      {theme.preference === value && (
        <Ionicons name="checkmark" size={20} color={theme.primary} />
      )}
    </TouchableOpacity>
  );

  const logout = async () => {
    await clearSession();
    await auth.signOut();
    router.replace('/');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ padding: 24 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '700',
            color: theme.text,
            marginBottom: 24,
          }}
        >
          Settings
        </Text>

        {/* THEME SECTION */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: theme.subText,
            marginBottom: 10,
          }}
        >
          Theme
        </Text>

        <View
          style={{
            backgroundColor: theme.inputBg,
            borderRadius: 14,
            paddingHorizontal: 16,
          }}
        >
          <Option label="Automatic" value="system" />
          <Option label="Dark" value="dark" />
          <Option label="Light" value="light" />
        </View>

        {/* LOGOUT */}
        <View style={{ marginTop: 40 }}>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Logout', 'Are you sure you want to logout?', [
                { text: 'Cancel' },
                {
                  text: 'Logout',
                  style: 'destructive',
                  onPress: logout,
                },
              ])
            }
            style={{
              borderWidth: 1,
              borderColor: theme.border,
              padding: 14,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                color: theme.text,
                textAlign: 'center',
                fontWeight: '600',
              }}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
