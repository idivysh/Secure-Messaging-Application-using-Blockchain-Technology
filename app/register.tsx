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
import { useTheme } from '@/src/theme/useTheme';
import { requireBiometric } from '../src/security/biometric';
import { Image } from 'react-native';

import {
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDocs,
  query,
  where,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../src/firebase/firebaseConfig';

/* ---------- VALIDATION HELPERS ---------- */

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? ''
    : 'Enter a valid email address';

const validatePhone = (phone: string) =>
  /^[0-9]{10}$/.test(phone)
    ? ''
    : 'Phone number must be 10 digits';

const validateUsername = (username: string) =>
  /^[a-z][a-z0-9_]{2,14}$/.test(username)
    ? ''
    : '3–15 chars, lowercase, start with letter';

const validatePassword = (password: string): string[] => {
  const errors: string[] = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('One number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    errors.push('One special character');
  if (/\s/.test(password)) errors.push('No spaces allowed');
  if (!/^[\x00-\x7F]*$/.test(password)) errors.push('No emojis allowed');
  return errors;
};

/* ---------- COMPONENT ---------- */

export default function Register() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rePassword, setRePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [rePasswordError, setRePasswordError] = useState('');

  /* ---------- Username Check ---------- */
  const isUsernameAvailable = async (uname: string) => {
    const q = query(
      collection(db, 'users'),
      where('username', '==', uname)
    );
    const snap = await getDocs(q);
    return snap.empty;
  };

  /* ---------- REGISTER ---------- */
  const onRegister = async () => {
    try {
      if (
        emailError ||
        phoneError ||
        usernameError ||
        passwordErrors.length ||
        rePasswordError
      ) {
        Alert.alert('Error', 'Fix validation errors');
        return;
      }

      const available = await isUsernameAvailable(username);
      if (!available) {
        Alert.alert('Error', 'Username already exists');
        return;
      }

      const biometricOk = await requireBiometric();
      if (!biometricOk) {
        Alert.alert(
          'Security Required',
          'Biometric authentication is mandatory'
        );
        return;
      }

      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const uid = cred.user.uid;

      await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        phone,
        username,
        avatar: null,
        friends: [],
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Account created securely');
      router.replace('/'); // back to login
    } catch (err: any) {
      console.error(err);
      Alert.alert('Registration failed', err.message);
    }
  };

  /* ---------- UI ---------- */

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 24,
            minHeight: '100%',
            justifyContent: 'center',
            backgroundColor: theme.background,
          }}
        >
          <Image
            source={require('../assets/logo.png')}
            style={{
              width: 80,
              height: 80,
              marginBottom: 20,
              borderRadius: 16  ,
              alignSelf: 'center',
            }}
          />

          <Text style={{ fontSize: 28, fontWeight: '700', color: theme.text }}>
            Create SMAUBCT Account
          </Text>

          {/* EMAIL */}
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setEmailError(validateEmail(t));
            }}
            keyboardType="email-address"
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
          {emailError ? <Text style={{ color: 'red' }}>{emailError}</Text> : null}

          {/* PHONE */}
          <TextInput
            placeholder="Phone Number"
            value={phone}
            onChangeText={(t) => {
              const v = t.replace(/[^0-9]/g, '');
              setPhone(v);
              setPhoneError(validatePhone(v));
            }}
            keyboardType="number-pad"
            placeholderTextColor={theme.subText}
            style={{
              backgroundColor: theme.inputBg,
              padding: 14,
              borderRadius: 12,
              marginTop: 12,
              color: theme.text,
            }}
          />
          {phoneError ? <Text style={{ color: 'red' }}>{phoneError}</Text> : null}

          {/* USERNAME */}
          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={(t) => {
              const v = t.toLowerCase();
              setUsername(v);
              setUsernameError(validateUsername(v));
            }}
            autoCapitalize="none"
            placeholderTextColor={theme.subText}
            style={{
              backgroundColor: theme.inputBg,
              padding: 14,
              borderRadius: 12,
              marginTop: 12,
              color: theme.text,
            }}
          />
          {usernameError ? <Text style={{ color: 'red' }}>{usernameError}</Text> : null}

          {/* PASSWORD */}
          <View style={{ position: 'relative', marginTop: 12 }}>
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setPasswordErrors(validatePassword(t));
              }}
              secureTextEntry={!showPassword}
              keyboardType="ascii-capable"
              autoCapitalize="none"
              autoCorrect={false}
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

          {passwordErrors.map((e) => (
            <Text key={e} style={{ color: 'red', fontSize: 12 }}>
              • {e}
            </Text>
          ))}

          {/* RE-TYPE */}
          <View style={{ position: 'relative', marginTop: 12 }}>
            <TextInput
              placeholder="Re-type Password"
              value={rePassword}
              onChangeText={(t) => {
                setRePassword(t);
                setRePasswordError(
                  t !== password ? 'Passwords do not match' : ''
                );
              }}
              secureTextEntry={!showPassword}
              keyboardType="ascii-capable"
              autoCapitalize="none"
              autoCorrect={false}
              contextMenuHidden
              placeholderTextColor={theme.subText}
              style={{
                backgroundColor: theme.inputBg,
                padding: 14,
                borderRadius: 12,
                paddingRight: 44,
                color: theme.text,
                borderWidth: rePasswordError ? 1 : 0,
                borderColor: 'red',
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

          {rePasswordError ? (
            <Text style={{ color: 'red' }}>{rePasswordError}</Text>
          ) : null}

          <TouchableOpacity
            onPress={onRegister}
            style={{
              backgroundColor: theme.primary,
              padding: 16,
              borderRadius: 12,
              marginTop: 24,
            }}
          >
            <Text
              style={{
                color: theme.background,
                textAlign: 'center',
                fontWeight: '600',
              }}
            >
              Register Securely
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom safe-area color */}
      <View style={{ height: insets.bottom, backgroundColor: theme.background }} />
    </SafeAreaView>
  );
}
