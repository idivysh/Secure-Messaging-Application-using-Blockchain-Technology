import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity,
  Keyboard, 
  TouchableWithoutFeedback,
  FlatList,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/src/theme/useTheme';
import { useEffect, useState, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  addDoc,
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
      <FlatList
        ref={flatListRef}  // 👈 ADD THIS
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 80, // 👈 space for input
        }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
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
