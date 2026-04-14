import {
  View,
  Text,
  TextInput,
  Image,
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity,
  Keyboard, 
  TouchableWithoutFeedback,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/src/theme/useTheme';
import { useEffect, useState, useRef } from 'react';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/src/firebase/firebaseConfig';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const user = auth.currentUser;
  const flatListRef = useRef<FlatList>(null);

  const [text, setText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  const router = useRouter();

  const currentUserId = user?.uid;
  const chatId = id as string;

  const otherUserId = chatId
    ?.split('_')
    .find((uid) => uid !== currentUserId);

  const [otherUser, setOtherUser] = useState<any>(null);
  

  useEffect(() => {
  if (!id) return;

  const q = query(
    collection(db, 'chats', id as string, 'messages'),
    orderBy('createdAt', 'asc')
  );


  const unsub = onSnapshot(q, (snap) => {
    const list: any[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    setMessages(list);
  });

  return unsub;
}, [id]);

useEffect(() => {
  if (messages.length > 0) {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }
}, [messages]);

useEffect(() => {
  if (!messages.length || !user) return;

  messages.forEach(async (msg) => {
    if (!msg.readBy?.includes(user.uid)) {
      await updateDoc(
        doc(db, 'chats', id as string, 'messages', msg.id),
        {
          readBy: [...(msg.readBy || []), user.uid],
        }
      );
    }
  });
}, [messages]);

useEffect(() => {
  if (!otherUserId) return;

  const fetchUser = async () => {
    const userDoc = await getDoc(doc(db, 'users', otherUserId));
    if (userDoc.exists()) {
      setOtherUser(userDoc.data());
    }
  };

  fetchUser();
}, [otherUserId]);

  const send = async () => {
    if (!text.trim() || !user) return;

    // Ensure chat doc exists
    await setDoc(
      doc(db, 'chats', id as string),
      {
        participants: (id as string).split('_'), // we’ll improve later
      },
      { merge: true }
    );

    // Add message
    await addDoc(
      collection(db, 'chats', id as string, 'messages'),
      {
        text,
        sender: user.uid,
        createdAt: serverTimestamp(),
        readBy: [user.uid],
      }
    );

    await setDoc(
      doc(db, 'chats', id as string),
      {
        lastMessage: text,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setText('');

  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flex: 1 }}>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          borderBottomWidth: 0.5,
          borderColor: theme.border,
        }}
      >
        {/* BACK */}
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 18, color: theme.text }}>←</Text>
        </TouchableOpacity>

        {/* AVATAR */}
        {otherUser?.avatar ? (
          <Image
            source={{ uri: otherUser.avatar }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              marginLeft: 12,
            }}
          />
        ) : (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.inputBg,
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: 12,
            }}
          >
            <Text style={{ color: theme.subText }}>👤</Text>
          </View>
        )}

        {/* USERNAME */}
        <Text
          style={{
            marginLeft: 12,
            fontSize: 16,
            fontWeight: '600',
            color: theme.text,
          }}
        >
          {otherUser?.username || 'User'}
        </Text>
      </View>
      <FlatList
        ref={flatListRef}  // 👈 ADD THIS
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 80, // 👈 space for input
        }}
        
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf:
                item.sender === user?.uid ? 'flex-end' : 'flex-start',
              backgroundColor:
                item.sender === user?.uid
                  ? theme.primary
                  : theme.inputBg,
              padding: 10,
              borderRadius: 10,
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                color:
                  item.sender === user?.uid
                    ? theme.background
                    : theme.text,
              }}
            >
              {item.text}
            </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-end',
              marginTop: 4,
            }}
          >
            {/* ⏱️ TIME */}
            <Text
              style={{
                fontSize: 10,
                color: theme.subText,
                marginRight: 4,
              }}
            >
              {item.createdAt?.seconds
                ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
            </Text>

            {/* ✔✔ TICKS */}
            {item.sender === user?.uid && (
              <Text
                style={{
                  fontSize: 12,
                  color:
                    item.readBy?.length > 1
                      ? '#4FC3F7' // ✅ SEEN → blue
                      : theme.subText, // ⏳ SENT → grey
                }}
              >
                ✔✔
              </Text>
            )}
          </View>

            
          </View>
        )}
      />
      </View>

      {/* INPUT */}
      <View
        style={{
          flexDirection: 'row',
          padding: 12,
          borderTopWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.background,

          position: 'absolute',   // 👈 IMPORTANT
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message..."
          placeholderTextColor={theme.subText}
          style={{
            flex: 1,
            color: theme.text,
            padding: 10,
          }}
        />

        <TouchableOpacity onPress={send}>
          <Text style={{ color: theme.primary, fontWeight: '600' }}>
            Send
          </Text>
        </TouchableOpacity>
      </View>
    </View>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
