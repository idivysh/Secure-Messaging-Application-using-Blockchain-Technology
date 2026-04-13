import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/theme/useTheme';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from '@/src/firebase/firebaseConfig';

type NotificationItem = {
  id: string;
  from: string;
  type: 'request_accepted' | 'friend_request';
  read: boolean;
  username?: string;
};

export default function Notifications() {
  const theme = useTheme();
  const router = useRouter();
  const user = auth.currentUser;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  /* ---------- LOAD NOTIFICATIONS (REALTIME) ---------- */
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('to', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, async (snap) => {
      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          const uSnap = await getDoc(doc(db, 'users', data.from));

          return {
            id: d.id,
            from: data.from,
            type: data.type,
            read: data.read,
            username: uSnap.exists() ? uSnap.data().username : 'User',
          };
        })
      );

      setNotifications(list);
    });

    return unsub;
  }, []);

  /* ---------- MARK READ ---------- */
  const openNotification = async (item: NotificationItem) => {
    await updateDoc(doc(db, 'notifications', item.id), {
      read: true,
    });

    if (item.type === 'request_accepted') {
      router.push(`/user/${item.from}`);
    }

    if (item.type === 'friend_request') {
      router.push('/requests');
    }
  };

  /* ---------- UI ---------- */
  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      onPress={() => openNotification(item)}
      style={{
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: item.read
          ? 'transparent'
          : theme.inputBg,
        borderRadius: 12,
        marginBottom: 8,
      }}
    >
      <Text style={{ color: theme.text, fontWeight: '600' }}>
        {item.type === 'request_accepted'
          ? `${item.username} accepted your request`
          : `${item.username} sent you a friend request`}
      </Text>

      {!item.read && (
        <Text
          style={{
            fontSize: 12,
            color: theme.primary,
            marginTop: 4,
          }}
        >
          New
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* HEADER */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
        }}
      >
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
          Notifications
        </Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text
            style={{
              textAlign: 'center',
              marginTop: 40,
              color: theme.subText,
            }}
          >
            No notifications yet
          </Text>
        }
      />
    </View>
  );
}
