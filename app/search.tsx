import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useContext } from 'react';
import { useRouter } from 'expo-router';
import { ThemeContext } from '../src/theme/ThemeContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../src/firebase/firebaseConfig';

type UserResult = {
  uid: string;
  username: string;
  bio?: string;
  avatar?: string | null;
};

export default function Search() {
  const theme = useContext(ThemeContext)!;
  const router = useRouter();

  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUser = async (text: string) => {
    setQueryText(text.trim().toLowerCase());

    // 🔹 empty search = empty list
    if (text.trim().length < 3) {
      setResults([]);
      return;
    }

    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return; // 🔒 auth not ready

    setLoading(true);

    const q = query(
      collection(db, 'users'),
      where('username', '==', text.trim().toLowerCase())
    );

    const snap = await getDocs(q);

    const users: UserResult[] = [];

    snap.forEach((doc) => {
      // 🔥 HARD BLOCK SELF USER
      if (doc.id !== currentUid) {
        users.push({
          uid: doc.id,
          ...(doc.data() as any),
        });
      }
    });

    setResults(users);
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* HEADER */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: theme.text,
            marginLeft: 12,
          }}
        >
          Search
        </Text>
      </View>

      {/* SEARCH BAR */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.inputBg,
          marginHorizontal: 16,
          borderRadius: 12,
          paddingHorizontal: 12,
        }}
      >
        <Ionicons name="search-outline" size={18} color={theme.subText} />
        <TextInput
          placeholder="Search username"
          value={queryText}
          onChangeText={searchUser}
          autoCapitalize="none"
          placeholderTextColor={theme.subText}
          style={{ flex: 1, padding: 10, color: theme.text }}
        />
      </View>

      {/* RESULTS */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          queryText.length >= 3 && !loading ? (
            <Text
              style={{
                color: theme.subText,
                textAlign: 'center',
                marginTop: 24,
              }}
            >
              No users found
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/user/${item.uid}`)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
            }}
          >
            {item.avatar ? (
              <Image
                source={{ uri: item.avatar }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  marginRight: 12,
                }}
              />
            ) : (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: theme.inputBg,
                  marginRight: 12,
                }}
              />
            )}

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: theme.text,
                }}
              >
                {item.username}
              </Text>

              {item.bio ? (
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 12, color: theme.subText }}
                >
                  {item.bio}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
