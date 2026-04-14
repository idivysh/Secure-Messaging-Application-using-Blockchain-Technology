import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ThemeContext } from '../../src/theme/ThemeContext';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { auth, db } from '../../src/firebase/firebaseConfig';

type Chat = {
  id: string;
  otherUid: string;
  lastMessage: string;
  userData?: any;
  unreadCount?: number;
  updatedAt?: any;
};

export default function ChatList() {
  const theme = useContext(ThemeContext)!;
  const router = useRouter();
  const user = auth.currentUser;

  const [chats, setChats] = useState<Chat[]>([]);

  const [usersMap, setUsersMap] = useState<any>({});

  /* ---------- LOAD CHATS ---------- */
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsub = onSnapshot(q, async (snap) => {
    const promises = snap.docs.map(async (docSnap) => {
    const data = docSnap.data();

    // 🔥 get messages
    const messagesSnap = await getDocs(
      collection(db, 'chats', docSnap.id, 'messages')
    );

    // 🔥 count unread
    let unreadCount = 0;

    messagesSnap.forEach((msg) => {
      const msgData = msg.data();

      if (
        msgData.sender !== user.uid && 
        !msgData.readBy?.includes(user.uid)
      ) {
        unreadCount++;
      }
    });

    if (!data.participants || data.participants.length < 2) return null;

    const otherUid = data.participants.find(
      (m: string) => m !== user.uid
    );

    if (!otherUid) return null;

    const userDoc = await getDoc(doc(db, 'users', otherUid));

    return {
      id: docSnap.id,
      otherUid,
      lastMessage: data.lastMessage ?? '',
      userData: userDoc.exists() ? userDoc.data() : null,
      unreadCount,
      updatedAt: data.updatedAt || null,
    };
  });

    const results = (await Promise.all(promises)).filter(
      (item) => item !== null
    ) as Chat[];

  setChats(results);
});

    return unsub;
  }, []);

  /* ---------- EMPTY STATE ---------- */
  const renderEmpty = () => (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
      }}
    >
      <Ionicons
        name="chatbubble-ellipses-outline"
        size={64}
        color={theme.subText}
      />

      <Text
        style={{
          marginTop: 16,
          fontSize: 18,
          fontWeight: '600',
          color: theme.text,
          textAlign: 'center',
        }}
      >
        No chats yet
      </Text>

      <Text
        style={{
          marginTop: 6,
          fontSize: 14,
          color: theme.subText,
          textAlign: 'center',
        }}
      >
        Search users and send a request to start chatting
      </Text>

      <TouchableOpacity
        onPress={() => router.push('/search')}
        style={{
          marginTop: 20,
          backgroundColor: theme.primary,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 10,
        }}
      >
        <Text
          style={{
            color: theme.background,
            fontWeight: '600',
          }}
        >
          Find People
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      
      {/* ---------- HEADER ---------- */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.border,
        }}
      >
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Ionicons
            name="person-circle-outline"
            size={32}
            color={theme.text}
          />
        </TouchableOpacity>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6, // 🔥 controls space (RN 0.71+)
          }}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={{
              width: 32,
              height: 32,
              resizeMode: 'contain',
              borderRadius: 8,
            }}
          />

          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: theme.text,
            }}
          >
            SMAUBCT
          </Text>
        </View>


        <TouchableOpacity onPress={() => router.push('/search')}>
          <Ionicons
            name="person-add-outline"
            size={26}
            color={theme.text}
          />
        </TouchableOpacity>
      </View>

      {/* ---------- CHAT LIST ---------- */}
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/chat/${item.id}`)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.border,
            }}
          >
            {item.userData?.avatar ? (
              <Image
                source={{ uri: item.userData.avatar }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  marginRight: 12,
                }}
              />
            ) : (
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: theme.inputBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="person-outline" size={24} color={theme.subText} />
              </View>
            )}
            <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.text,
              }}
            >
              {item.userData?.username || 'User'}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              {item.lastMessage ? (
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.subText,
                    marginTop: 4,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {item.lastMessage}
                </Text>
              ) : null}

              {item.updatedAt?.seconds && (
                <Text
                  style={{
                    fontSize: 10,
                    color: theme.subText,
                    marginLeft: 8,
                  }}
                >
                  {new Date(item.updatedAt.seconds * 1000).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}

              {/* 🔴 UNREAD BADGE */}
              {(item.unreadCount ?? 0) > 0 && (
                <View
                  style={{
                    backgroundColor: theme.primary,
                    borderRadius: 10,
                    paddingHorizontal: 6,
                    marginLeft: 8,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 10 }}>
                    {item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
