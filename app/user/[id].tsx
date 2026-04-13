import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/src/theme/useTheme';
import { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db } from '@/src/firebase/firebaseConfig';

type Status = 'none' | 'sent' | 'incoming' | 'friends';

export default function ProfileView() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  

  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<Status>('none');
  const [loading, setLoading] = useState(true);
  const myUid = auth.currentUser?.uid;
  

  /* ---------- LOAD PROFILE + RELATION ---------- */
  useEffect(() => {
    const load = async () => {
      try {
        if (!id || !myUid || id === myUid) {
          setLoading(false);
          return;
        }

        // 🔹 Load user profile
        const userRef = doc(db, 'users', id);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          setLoading(false);
          return;
        }

        const data = snap.data();
        setUser(data);

        // 🔹 Friends
        if (data.friends?.includes(myUid)) {
          setStatus('friends');
          setLoading(false);
          return;
        }

        // 🔹 Sent request
        const sentQ = query(
          collection(db, 'friend_requests'),
          where('from', '==', myUid),
          where('to', '==', id)
        );
        if (!(await getDocs(sentQ)).empty) {
          setStatus('sent');
          setLoading(false);
          return;
        }

        // 🔹 Incoming request
        const incomingQ = query(
          collection(db, 'friend_requests'),
          where('from', '==', id),
          where('to', '==', myUid)
        );
        if (!(await getDocs(incomingQ)).empty) {
          setStatus('incoming');
          setLoading(false);
          return;
        }

        setStatus('none');
        setLoading(false);
      } catch (e) {
        console.log('Profile load error:', e);
        setLoading(false);
      }
    };

    load();
  }, [id, myUid]);

  /* ---------- ACTIONS ---------- */

  const sendRequest = async () => {
    if (!myUid || !id) return;

    await addDoc(collection(db, 'friend_requests'), {
      from: myUid,
      to: id,
      createdAt: new Date(),
    });

    setStatus('sent');
  };

  const acceptRequest = async () => {
  if (!myUid || !id) return;

  const chatId = [myUid, id].sort().join('_');

  try {
    // 1️⃣ Add friends (both sides)
    await updateDoc(doc(db, 'users', myUid), {
      friends: arrayUnion(id),
    });

    await updateDoc(doc(db, 'users', id), {
      friends: arrayUnion(myUid),
    });

    // 2️⃣ Delete friend request
    const q = query(
      collection(db, 'friend_requests'),
      where('from', '==', id),
      where('to', '==', myUid)
    );
    const snap = await getDocs(q);
    snap.forEach(async (d) => {
      await deleteDoc(d.ref);
    });

    // 3️⃣ Create chat
    await setDoc(
      doc(db, 'chats', chatId),
      {
        participants: [myUid, id],
        createdAt: new Date(),
        lastMessage: null,
      },
      { merge: true }
    );

    // 4️⃣ Create notification for sender
    await addDoc(collection(db, 'notifications'), {
      to: id,
      type: 'request_accepted',
      from: myUid,
      createdAt: new Date(),
      read: false,
    });

    // 5️⃣ Update UI
    setStatus('friends');
  } catch (e) {
    console.log('Accept request error:', e);
  }
  };


  /* ---------- BUTTON ---------- */
  const renderAction = () => {
    switch (status) {
      case 'friends':
        return (
          <TouchableOpacity
            onPress={() => {
              const currentUserId = auth.currentUser?.uid;
              const otherUserId = id;

              if (!currentUserId || !otherUserId) return;

              const chatId = [currentUserId, otherUserId].sort().join('_');

              router.push(`../chat/${chatId}`);
            }}
            style={{
              backgroundColor: theme.primary,
              padding: 14,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: theme.background, fontWeight: '600', textAlign: 'center' }}>
              Message
            </Text>
          </TouchableOpacity>
        );

      case 'sent':
        return (
          <View
            style={{
              padding: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text style={{ color: theme.subText, textAlign: 'center', fontWeight: '600' }}>
              Request Sent
            </Text>
          </View>
        );

      case 'incoming':
        return (
          <TouchableOpacity
            onPress={acceptRequest}
            style={{
              backgroundColor: theme.primary,
              padding: 14,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: theme.background, fontWeight: '600', textAlign: 'center' }}>
              Accept Request
            </Text>
          </TouchableOpacity>
        );

      default:
        return (
          <TouchableOpacity
            onPress={sendRequest}
            style={{
              backgroundColor: theme.primary,
              padding: 14,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: theme.background, fontWeight: '600', textAlign: 'center' }}>
              Send Friend Request
            </Text>
          </TouchableOpacity>
        );
    }
  };

  /* ---------- UI ---------- */

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center' }}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (!user) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* HEADER */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ marginLeft: 12, fontSize: 18, fontWeight: '700', color: theme.text }}>
          Profile
        </Text>
      </View>

      {/* PROFILE */}
      <View style={{ alignItems: 'center', paddingVertical: 24 }}>
        {user.avatar ? (
          <Image source={{ uri: user.avatar }} style={{ width: 110, height: 110, borderRadius: 55 }} />
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
            <Ionicons name="person-outline" size={40} color={theme.subText} />
          </View>
        )}

        <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text, marginTop: 12 }}>
          @{user.username}
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: theme.subText,
            marginTop: 6,
            textAlign: 'center',
            paddingHorizontal: 32,
          }}
        >
          {user.bio || 'No bio yet'}
        </Text>

        <Text style={{ marginTop: 16, fontWeight: '600', color: theme.text }}>
          {user.friends?.length ?? 0} Friends
        </Text>
      </View>

      {/* ACTION */}
      <View style={{ paddingHorizontal: 24 }}>{renderAction()}</View>
    </View>
  );
}
