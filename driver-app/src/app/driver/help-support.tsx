import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ChevronDown, ChevronUp, Mail, MessageCircle, Phone } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HELP_FAQS } from '@/constants/legal';
import { Colors, Radius } from '@/constants/Colors';

export default function HelpSupportScreen() {
  const [openId, setOpenId] = useState<number | null>(0);
  const [message, setMessage] = useState('');

  return (
    <Screen scroll contentStyle={styles.content}>
      <ScreenHeader title="Help & support" subtitle="Partner desk for drivers" />

      <View style={styles.contactRow}>
        <ContactBtn
          label="Call"
          icon={<Phone size={16} color={Colors.primary} />}
          onPress={() =>
            Linking.openURL('tel:+918000000001').catch(() =>
              Alert.alert('Partner support', '+91 80000 00001'),
            )
          }
        />
        <ContactBtn
          label="Email"
          icon={<Mail size={16} color={Colors.primary} />}
          onPress={() =>
            Linking.openURL('mailto:partners@raydo.app?subject=Driver%20Support').catch(() =>
              Alert.alert('Email', 'partners@raydo.app'),
            )
          }
        />
        <ContactBtn
          label="Chat"
          icon={<MessageCircle size={16} color={Colors.primary} />}
          onPress={() => Alert.alert('Chat', 'Partner chat: 7 AM – 11 PM IST.')}
        />
      </View>

      <Text style={styles.section}>FAQs</Text>
      <Card padded={false}>
        {HELP_FAQS.map((item, idx) => {
          const open = openId === idx;
          return (
            <View key={item.q} style={idx > 0 ? styles.borderTop : undefined}>
              <Pressable style={styles.faqHeader} onPress={() => setOpenId(open ? null : idx)}>
                <Text style={styles.faqQ}>{item.q}</Text>
                {open ? (
                  <ChevronUp size={18} color={Colors.textLight} />
                ) : (
                  <ChevronDown size={18} color={Colors.textLight} />
                )}
              </Pressable>
              {open ? <Text style={styles.faqA}>{item.a}</Text> : null}
            </View>
          );
        })}
      </Card>

      <Text style={styles.section}>Message support</Text>
      <Card>
        <TextInput
          style={styles.input}
          placeholder="Describe issue, trip ID, or payout question…"
          placeholderTextColor={Colors.textLight}
          multiline
          value={message}
          onChangeText={setMessage}
          textAlignVertical="top"
        />
        <Button
          title="Submit"
          fullWidth
          onPress={() => {
            if (!message.trim()) {
              Alert.alert('Write a message', 'Add a few details so we can help.');
              return;
            }
            Alert.alert('Sent', 'Partner support will reply shortly (demo).');
            setMessage('');
          }}
        />
      </Card>
    </Screen>
  );
}

function ContactBtn({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.contactBtn} onPress={onPress}>
      {icon}
      <Text style={styles.contactLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 12, paddingBottom: 28 },
  contactRow: { flexDirection: 'row', gap: 10 },
  contactBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  contactLabel: { fontSize: 12, fontWeight: '700', color: Colors.text },
  section: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  borderTop: { borderTopWidth: 1, borderTopColor: Colors.border },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text },
  faqA: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  input: {
    minHeight: 96,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
});
