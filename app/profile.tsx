import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  doc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  collection,
} from 'firebase/firestore';
import { auth, db } from '../src/firebase/firebaseConfig';
import { ThemeContext } from '../src/theme/ThemeContext';
import { uploadAvatar } from '../src/firebase/storage';

export default function Profile() {
  const theme = useContext(ThemeContext)!;
  const router = useRouter();
  const user = auth.currentUser;

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ---------- LOAD PROFILE ---------- */
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (!snap.exists()) return;

      const data = snap.data();
      setUsername(data.username ?? '');
      setBio(data.bio ?? '');
      setAvatar(data.avatar ?? null);
      setFriendsCount(data.friends?.length ?? 0);
    };

    loadProfile();
  }, []);

  /* ---------- USERNAME CHECK ---------- */
  const isUsernameAvailable = async (name: string) => {
    const q = query(
      collection(db, 'users'),
      where('username', '==', name)
    );
    const snap = await getDocs(q);
    return snap.empty || snap.docs[0].id === user?.uid;
  };

  /* ---------- SAVE PROFILE ---------- */
  const saveProfile = async () => {
    if (!user) return;

    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    setSaving(true);
    const available = await isUsernameAvailable(username.trim());

    if (!available) {
      setSaving(false);
      Alert.alert('Username taken', 'Choose another username');
      return;
    }

    await updateDoc(doc(db, 'users', user.uid), {
      username: username.trim(),
      bio: bio.trim(),
    });

    setEditing(false);
    setSaving(false);
    Alert.alert('Saved', 'Profile updated successfully');
  };

  /* ---------- PICK & UPLOAD AVATAR ---------- */
const pickImage = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission required', 'Gallery access needed');
    return;
  }

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.3,      // 🔥 IMPORTANT: keep small
    base64: true,      // 🔥 REQUIRED
  });

  if (res.canceled || !user) return;

  try {
    const base64 = `data:image/jpeg;base64,${res.assets[0].base64}`;

    // update firestore directly
    await updateDoc(doc(db, 'users', user.uid), {
      avatar: base64,
    });

    setAvatar(base64);
  } catch (e) {
    console.log(e);
    Alert.alert('Error', 'Failed to update avatar');
  }
};



  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* HEADER */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginLeft: 12, flex: 1 }}>
          Profile
        </Text>

        {editing && (
          <TouchableOpacity onPress={saveProfile} disabled={saving}>
            <Text style={{ color: theme.primary, fontWeight: '600' }}>Save</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* PROFILE */}
      <View style={{ alignItems: 'center', paddingVertical: 24 }}>
        <TouchableOpacity onPress={pickImage}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={{ width: 110, height: 110, borderRadius: 55 }} />
          ) : (
            <View
              style={{
                width: 110,
                height: 110,
                borderRadius: 55,
                backgroundColor: theme.inputBg,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="camera-outline" size={30} color={theme.subText} />
            </View>
          )}
        </TouchableOpacity>

        {editing ? (
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="Username"
            placeholderTextColor={theme.subText}
            style={{
              marginTop: 12,
              backgroundColor: theme.inputBg,
              padding: 10,
              borderRadius: 10,
              color: theme.text,
              width: '70%',
              textAlign: 'center',
              fontWeight: '700',
            }}
          />
        ) : (
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: theme.text,
              marginTop: 12,
            }}
          >
            @{username}
          </Text>
        )}


        {editing ? (
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Add bio"
            placeholderTextColor={theme.subText}
            multiline
            style={{
              marginTop: 10,
              backgroundColor: theme.inputBg,
              padding: 10,
              borderRadius: 10,
              color: theme.text,
              width: '80%',
              textAlign: 'center',
            }}
          />
        ) : (
          <Text
            style={{
              fontSize: 14,
              color: theme.subText,
              marginTop: 6,
              textAlign: 'center',
            }}
          >
            {bio || 'No bio added yet'}
          </Text>
        )}

      </View>

      {!editing && (
        <View style={{ paddingHorizontal: 24 }}>
          <TouchableOpacity
            onPress={() => setEditing(true)}
            style={{
              backgroundColor: theme.primary,
              padding: 14,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: theme.background, textAlign: 'center', fontWeight: '600' }}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
