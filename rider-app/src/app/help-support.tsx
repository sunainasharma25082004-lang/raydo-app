import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  TextInput,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { HELP_FAQS } from '@/constants/legal';
import { ChevronDown, ChevronUp, Mail, MessageCircle, Phone } from 'lucide-react-native';

export default function HelpSupportScreen() {
  const [openId, setOpenId] = useState<number | null>(0);
  const [message, setMessage] = useState('');

  const sendMessage = () => {
    if (!message.trim()) {
      Alert.alert('Write a message', 'Tell us how we can help.');
      return;
    }
    Alert.alert('Message sent', 'Our team will reply within a few hours (demo).', [
      { text: 'OK', onPress: () => setMessage('') },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Help & Support" subtitle="FAQs and contact options" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Quick contact</Text>
        <View style={styles.contactRow}>
          <ContactChip
            icon={<Phone color={Colors.primary} size={18} />}
            label="Call"
            onPress={() => Linking.openURL('tel:+918000000000').catch(() =>
              Alert.alert('Call support', '+91 80000 00000'),
            )}
          />
          <ContactChip
            icon={<Mail color={Colors.primary} size={18} />}
            label="Email"
            onPress={() =>
              Linking.openURL('mailto:support@raydo.app?subject=Rider%20Support').catch(() =>
                Alert.alert('Email', 'support@raydo.app'),
              )
            }
          />
          <ContactChip
            icon={<MessageCircle color={Colors.primary} size={18} />}
            label="Chat"
            onPress={() => Alert.alert('Live chat', 'Chat agents available 8 AM – 10 PM IST.')}
          />
        </View>

        <Text style={styles.section}>FAQs</Text>
        <View style={styles.card}>
          {HELP_FAQS.map((item, idx) => {
            const open = openId === idx;
            return (
              <View key={item.q}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => setOpenId(open ? null : idx)}
                >
                  <Text style={styles.faqQ}>{item.q}</Text>
                  {open ? (
                    <ChevronUp color={Colors.textLight} size={18} />
                  ) : (
                    <ChevronDown color={Colors.textLight} size={18} />
                  )}
                </TouchableOpacity>
                {open ? <Text style={styles.faqA}>{item.a}</Text> : null}
                {idx < HELP_FAQS.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            );
          })}
        </View>

        <Text style={styles.section}>Send us a message</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Describe your issue or feedback…"
            placeholderTextColor={Colors.textLight}
            multiline
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function ContactChip({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.chip} onPress={onPress}>
      {icon}
      <Text style={styles.chipLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingBottom: 40 },
  section: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 10,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  chip: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#EDEAE3',
  },
  chipLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 12,
  },
  faqQ: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  faqA: { fontSize: 14, color: Colors.textLight, lineHeight: 20, paddingBottom: 10 },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  input: {
    minHeight: 100,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 12,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
