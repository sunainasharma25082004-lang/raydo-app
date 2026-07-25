import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send } from 'lucide-react-native';
import { io, Socket } from 'socket.io-client';
import { Colors, Radius } from '@/constants/Colors';
import { useSession } from '@/context/SessionContext';
import { api, SOCKET_URL, type ChatMessage } from '@/lib/api';

export default function DriverChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, driver } = useSession();
  const params = useLocalSearchParams<{
    rideId?: string;
    riderName?: string;
  }>();
  const rideId = String(params.rideId || '');
  const riderName = String(params.riderName || 'Rider');
  const driverId = driver?.id || '';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    if (!rideId) return;
    try {
      const res = await api.getChat(rideId, token || undefined);
      setMessages(res.messages || []);
      setChatEnabled(!!res.chatEnabled);
    } catch (e: any) {
      setError(e.message || 'Could not load chat');
    } finally {
      setLoading(false);
    }
  }, [rideId, token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!rideId) return;
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('join_chat', rideId);
      if (driverId) {
        socket.emit('join_driver', { driverId, vehicleType: driver?.vehicle?.type });
      }
    });
    socket.on('receive_chat_message', (msg: ChatMessage) => {
      if (msg?.rideId && msg.rideId !== rideId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    socket.on('chat_closed', (payload: { rideId?: string }) => {
      if (!payload?.rideId || payload.rideId === rideId) setChatEnabled(false);
    });
    socket.on('chat_error', (payload: { message?: string }) => {
      setError(payload?.message || 'Chat error');
      setChatEnabled(false);
    });
    return () => {
      socket.disconnect();
    };
  }, [rideId, driverId, driver?.vehicle?.type]);

  const send = async () => {
    const body = text.trim();
    if (!body || !rideId || !chatEnabled || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await api.sendChat(rideId, {
        text: body,
        senderRole: 'driver',
        senderId: driverId,
        token: token || undefined,
      });
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.msg.id)) return prev;
        return [...prev, res.msg];
      });
      setText('');
      socketRef.current?.emit('send_chat_message', {
        rideId,
        text: body,
        senderRole: 'driver',
        senderId: driverId,
      });
    } catch (e: any) {
      setError(e.message || 'Send failed');
      if (String(e.message || '').toLowerCase().includes('closed')) {
        setChatEnabled(false);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.primary} size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Chat with {riderName}</Text>
          <Text style={styles.sub}>
            {chatEnabled ? 'Open until pickup' : 'Chat closed after pickup'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {chatEnabled
                ? 'Message the rider about pickup landmark / gate.'
                : 'Chat closed after pickup.'}
            </Text>
          }
          renderItem={({ item }) => {
            const mine = item.senderRole === 'driver';
            return (
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={[styles.bubbleText, mine && styles.mineText]}>{item.text}</Text>
                <Text style={[styles.time, mine && styles.mineTime]}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </Text>
              </View>
            );
          }}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!chatEnabled ? (
        <View style={[styles.closedBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Text style={styles.closedText}>
            Trip started — chat is closed. Focus on the route.
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={8}
        >
          <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Message rider…"
              placeholderTextColor={Colors.textLight}
              maxLength={1000}
              onSubmitEditing={send}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!text.trim() || sending) && styles.sendDisabled]}
              onPress={send}
              disabled={!text.trim() || sending}
            >
              <Send color={Colors.white} size={18} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 8, flexGrow: 1 },
  empty: {
    textAlign: 'center',
    color: Colors.textLight,
    marginTop: 40,
    fontWeight: '600',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  mineText: { color: Colors.white },
  time: { fontSize: 10, color: Colors.textLight, marginTop: 4, fontWeight: '600' },
  mineTime: { color: 'rgba(255,255,255,0.7)' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.45 },
  error: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  closedBar: {
    backgroundColor: Colors.errorSoft,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  closedText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
});
