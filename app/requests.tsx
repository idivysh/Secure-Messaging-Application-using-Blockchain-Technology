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
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  addDoc,
} from 'firebase/firestore';
import { auth, db } from '@/src/firebase/firebaseConfig';

type RequestUser = {
  id: string;        // request document id
  uid: string;       // other user uid
  username: string;
  avatar: string | null;
};

export default function Requests() {
  const theme = useTheme();
  const router = useRouter();
  const user = auth.currentUser;

  const [tab, setTab] = useState<'incoming' | 'sent'>('incoming');
  const [incoming, setIncoming] = useState<RequestUser[]>([]);
  const [sent, setSent] = useState<RequestUser[]>([]);

  /* ---------- LOAD REQUESTS (REALTIME) ---------- */
  useEffect(() => {
    if (!user) return;

    const incomingQ = query(
      collection(db, 'friend_requests'),
      where('to', '==', user.uid)
    );

    const sentQ = query(
      collection(db, 'friend_requests'),
      where('from', '==', user.uid)
    );

    const unsubIncoming = onSnapshot(incomingQ, async (snap) => {
      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const fromUid = d.data().from;
          const uSnap = await getDoc(doc(db, 'users', fromUid));
          if (!uSnap.exists()) return null;

          return {
            id: d.id,
            uid: fromUid,
            username: uSnap.data().username,
            avatar: uSnap.data().avatar ?? null,
          };
        })
      );

      setIncoming(list.filter(Boolean) as RequestUser[]);
    });

    const unsubSent = onSnapshot(sentQ, async (snap) => {
      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const toUid = d.data().to;
          const uSnap = await getDoc(doc(db, 'users', toUid));
          if (!uSnap.exists()) return null;

          return {
            id: d.id,
            uid: toUid,
            username: uSnap.data().username,
            avatar: uSnap.data().avatar ?? null,
          };
        })
      );

      setSent(list.filter(Boolean) as RequestUser[]);
    });

    return () => {
      unsubIncoming();
      unsubSent();
    };
  }, []);

  /* ---------- ACCEPT REQUEST (IMPORTANT) ---------- */
  const acceptRequest = async (req: RequestUser) => {
    if (!user) return;

    // 1️⃣ Add each other as friends
    await updateDoc(doc(db, 'users', user.uid), {
      friends: arrayUnion(req.uid),
    });

    await updateDoc(doc(db, 'users', req.uid), {
      friends: arrayUnion(user.uid),
    });

    // 2️⃣ Create chat (once)
    await addDoc(collection(db, 'chats'), {
      members: [user.uid, req.uid],
      createdAt: new Date(),
      lastMessage: null,
    });

    // 3️⃣ Create notification for sender
    await addDoc(collection(db, 'notifications'), {
      to: req.uid,
      from: user.uid,
      type: 'request_accepted',
      createdAt: new Date(),
      read: false,
    });

    // 4️⃣ Delete friend request
    await deleteDoc(doc(db, 'friend_requests', req.id));
  };

  /* ---------- REJECT REQUEST ---------- */
  const rejectRequest = async (id: string) => {
    await deleteDoc(doc(db, 'friend_requests', id));
  };

  /* ---------- UI ITEM ---------- */
  const renderItem = ({ item }: { item: RequestUser }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
      }}
    >
      <TouchableOpacity
        onPress={() => router.push(`/user/${item.uid}`)}
        style={{ flex: 1 }}
      >
        <Text style={{ color: theme.text, fontWeight: '600', fontSize: 15 }}>
          {item.username}
        </Text>
      </TouchableOpacity>

      {tab === 'incoming' ? (
        <>
          <TouchableOpacity
            onPress={() => acceptRequest(item)}
            style={{
              backgroundColor: theme.primary,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 8,
              marginRight: 8,
            }}
          >
            <Text style={{ color: theme.background, fontWeight: '600' }}>
              Accept
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => rejectRequest(item.id)}>
            <Ionicons
              name="close-circle-outline"
              size={24}
              color={theme.subText}
            />
          </TouchableOpacity>
        </>
      ) : (
        <Text style={{ color: theme.subText, fontSize: 12 }}>
          Pending
        </Text>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* HEADER */}
      <View style={{ flexDirection: 'row', padding: 16, alignItems: 'center' }}>
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
          Requests
        </Text>
      </View>

      {/* TABS */}
      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: 16,
          backgroundColor: theme.inputBg,
          borderRadius: 12,
        }}
      >
        {(['incoming', 'sent'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: tab === t ? theme.primary : 'transparent',
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                fontWeight: '600',
                color: tab === t ? theme.background : theme.text,
              }}
            >
              {t === 'incoming' ? 'Incoming' : 'Sent'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LIST */}
      <FlatList
        data={tab === 'incoming' ? incoming : sent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text
            style={{
              textAlign: 'center',
              marginTop: 40,
              color: theme.subText,
            }}
          >
            No requests
          </Text>
        }
      />
    </View>
  );
}
