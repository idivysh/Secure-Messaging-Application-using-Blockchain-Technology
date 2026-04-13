import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/useTheme';
import { requireBiometric } from '../src/security/biometric';
import { saveSession } from '../src/security/session';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../src/firebase/firebaseConfig';
import { Image } from 'react-native';

export default function Login() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginError = (err: any) => {
    switch (err.code) {
      case 'auth/user-not-found':
        Alert.alert('Login Failed', 'User does not exist');
        break;

      case 'auth/wrong-password':
        Alert.alert('Login Failed', 'Entered password is wrong');
        break;

      case 'auth/invalid-email':
        Alert.alert('Login Failed', 'Invalid email or username');
        break;

      default:
        Alert.alert('Login Failed', err.message);
    }
  };


  const onLogin = async () => {
    try {
      if (!identifier || !password) {
        Alert.alert('Error', 'Enter credentials');
        return;
      }

      let emailToUse = identifier;

      // 🟡 If identifier is NOT email → treat as username
      if (!identifier.includes('@')) {
        const q = query(
          collection(db, 'users'),
          where('username', '==', identifier.toLowerCase())
        );

        const snap = await getDocs(q);

        if (snap.empty) {
          Alert.alert('Login Failed', 'Username not found');
          return;
        }

        emailToUse = snap.docs[0].data().email;
      }

      // 🔐 Firebase Auth
      await signInWithEmailAndPassword(auth, emailToUse, password);

      // 🔒 Biometric
      const biometricOk = await requireBiometric();
      if (!biometricOk) {
        Alert.alert('Access Denied', 'Biometric verification failed');
        return;
      }

      await saveSession();
      router.replace('/(tabs)/chatlist');
    } catch (err: any) {
      handleLoginError(err);
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ backgroundColor: theme.background }}
          contentContainerStyle={{
            padding: 24,
            minHeight: '100%',
            justifyContent: 'center',
          }}
        >

          <Image
            source={require('../assets/logo.png')}
            style={{
              width: 80,
              height: 80,
              marginBottom: 20,
              borderRadius: 16,
              alignSelf: 'center',
            }}
          />

          
          <Text style={{ fontSize: 30, fontWeight: '700', color: theme.text, alignSelf: 'center' }}>
            SMAUBCT Login
          </Text>

          <TextInput
            placeholder="Email or Username"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            placeholderTextColor={theme.subText}
            style={{
              backgroundColor: theme.inputBg,
              padding: 14,
              borderRadius: 12,
              marginTop: 20,
              color: theme.text,
            }}
          />

          {/* PASSWORD */}
          <View style={{ position: 'relative', marginTop: 14 }}>
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              keyboardType="ascii-capable"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              contextMenuHidden
              placeholderTextColor={theme.subText}
              style={{
                backgroundColor: theme.inputBg,
                padding: 14,
                borderRadius: 12,
                paddingRight: 44,
                color: theme.text,
              }}
            />

            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color={theme.subText}
              style={{ position: 'absolute', right: 14, top: 14 }}
              onPress={() => setShowPassword(!showPassword)}
            />
          </View>

          <TouchableOpacity
            onPress={onLogin}
            style={{
              backgroundColor: theme.primary,
              padding: 16,
              borderRadius: 12,
              marginTop: 22,
            }}
          >
            <Text style={{ color: theme.background, textAlign: 'center', fontWeight: '600' }}>
              Verify & Enter
            </Text>
          </TouchableOpacity>

          <Text
            onPress={() => router.push('/register')}
            style={{ marginTop: 20, textAlign: 'center', color: theme.subText }}
          >
            New user? Create a SMAUBCT account
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 🔥 Bottom home indicator color fix */}
      <View
        style={{
          height: insets.bottom,
          backgroundColor: theme.background,
        }}
      />
    </SafeAreaView>
  );
}
