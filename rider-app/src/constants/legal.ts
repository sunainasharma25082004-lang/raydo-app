export const ABOUT_US = {
  title: 'About Raydo',
  tagline: 'Premium local rides, built for Indian cities.',
  body: [
    'Raydo is a ride-hailing platform connecting riders with trusted auto, bike, cab and e-rickshaw partners across Bengaluru and expanding cities.',
    'We focus on fair fares, reliable pickup times, and a calm premium experience — from booking to drop.',
    'Our mission is simple: every trip should feel safe, transparent, and on time.',
  ],
  highlights: [
    { label: 'Cities', value: 'Bengaluru first' },
    { label: 'Vehicles', value: 'Auto · Bike · Cab · E-Rickshaw' },
    { label: 'Support', value: '24×7 in-app help' },
  ],
  company: 'Raydo Mobility Pvt. Ltd.',
  email: 'hello@raydo.app',
  version: '1.0.0',
  developers: [
    { name: 'Sunaina Sharma', role: 'Developer' },
    { name: 'Divyanshu Chauhan', role: 'Developer' },
  ],
};

export const PRIVACY_SECTIONS = [
  {
    heading: '1. Information we collect',
    paragraphs: [
      'Account details such as name, phone number, and email when you register.',
      'Location data while you use the app to match rides, show maps, and improve ETAs.',
      'Trip history, payment method type (not full card numbers in demo), and device information for security.',
    ],
  },
  {
    heading: '2. How we use your information',
    paragraphs: [
      'To provide and improve ride booking, tracking, and support.',
      'To communicate trip updates, receipts, and important service notices.',
      'To detect fraud, keep the platform safe, and comply with law.',
    ],
  },
  {
    heading: '3. Sharing of data',
    paragraphs: [
      'Drivers see limited trip details needed to complete your ride (pickup, drop, name/phone as needed).',
      'Payment partners process payments; we do not sell your personal data.',
      'Authorities may receive data only when required by applicable law.',
    ],
  },
  {
    heading: '4. Location & permissions',
    paragraphs: [
      'Location is used while the app is in use for booking and live tracking.',
      'You can change location permissions anytime in your phone settings; some features may stop working.',
    ],
  },
  {
    heading: '5. Data retention & security',
    paragraphs: [
      'We keep trip and account data only as long as needed for service, legal, and safety reasons.',
      'We use industry-standard safeguards to protect your information.',
    ],
  },
  {
    heading: '6. Your rights',
    paragraphs: [
      'You may request access, correction, or deletion of your account data via Help & Support or privacy@raydo.app.',
      'You can opt out of non-essential notifications in Settings.',
    ],
  },
  {
    heading: '7. Contact',
    paragraphs: [
      'Questions about this policy: privacy@raydo.app',
      'Last updated: July 2026',
    ],
  },
];

export const HELP_FAQS = [
  {
    q: 'How do I book a ride?',
    a: 'Open Home, set pickup and drop, choose a vehicle, and confirm. Tracking starts once a driver accepts.',
  },
  {
    q: 'How is my fare calculated?',
    a: 'Fare includes base charge, distance, and time. The estimate is shown before you confirm the trip.',
  },
  {
    q: 'Can I cancel a trip?',
    a: 'Yes, from the tracking screen before the trip ends. Cancellation fees may apply after driver acceptance (demo: no fee).',
  },
  {
    q: 'Payment failed — what now?',
    a: 'Try another method (UPI / Cash / Card) under Payment Methods, or contact support with your trip ID.',
  },
  {
    q: 'How do I report a safety issue?',
    a: 'Use Help & Support → Contact us, or call our emergency support line listed in the app during an active trip.',
  },
];
