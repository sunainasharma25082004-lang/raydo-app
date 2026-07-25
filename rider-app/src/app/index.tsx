import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { ChevronRight, Route } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  type SharedValue,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { getRiderSession, markOnboardingDone } from '@/lib/session';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Your Calm Commute',
    subtitle: 'Experience reliability without the noise. Book a ride in seconds.',
    image:
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80',
  },
  {
    id: '2',
    title: 'Choose Your Comfort',
    subtitle:
      'From quick Bikes to spacious Autos and E-Rickshaws, tailored for your journey.',
    image:
      'https://images.unsplash.com/photo-1558227361-9c60e1d054d5?auto=format&fit=crop&q=80',
  },
  {
    id: '3',
    title: 'Safe & Secure',
    subtitle: 'Real-time tracking and verified drivers ensure you always arrive safely.',
    image:
      'https://images.unsplash.com/photo-1494587416117-f102a2ac0a8d?auto=format&fit=crop&q=80',
  },
];

function PaginationDot({
  index,
  scrollX,
}: {
  index: number;
  scrollX: SharedValue<number>;
}) {
  const animatedDotStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0.3, 1, 0.3],
      Extrapolation.CLAMP,
    );
    const widthAnim = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [8, 20, 8],
      Extrapolation.CLAMP,
    );
    return { opacity, width: widthAnim };
  });

  return <Animated.View style={[styles.dot, animatedDotStyle]} />;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [booting, setBooting] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const scrollRef = useRef<Animated.ScrollView>(null);

  // If user already logged in (or finished onboarding), skip slides.
  // This also fixes MIUI: location Allow restarts the app → restore session.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const session = await getRiderSession();
        if (!alive) return;
        if (session.loggedIn) {
          router.replace('/(tabs)/home');
          return;
        }
        if (session.onboardingDone) {
          router.replace('/rider/login');
          return;
        }
      } catch {
        /* show onboarding */
      } finally {
        if (alive) setBooting(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (currentIndex + 1), animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      await markOnboardingDone();
      router.replace('/rider/login');
    }
  };

  const handleMomentumScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(newIndex);
  };

  if (booting) {
    return (
      <View style={[styles.container, styles.boot]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.bootText}>Raydo</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.bgOverlay} />

      <View style={styles.header}>
        <Route color={Colors.accent} size={28} strokeWidth={1.5} style={{ marginRight: 8 }} />
        <Text style={styles.logoText}>Raydo</Text>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.scrollView}
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: slide.image }} style={styles.image} />
              <View style={styles.imageOverlay} />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </View>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <PaginationDot key={index} index={index} scrollX={scrollX} />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, currentIndex === SLIDES.length - 1 && styles.buttonSolid]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          {currentIndex === SLIDES.length - 1 ? (
            <Text style={styles.buttonTextSolid}>Get Started</Text>
          ) : (
            <>
              <Text style={styles.buttonText}>Next</Text>
              <ChevronRight color={Colors.accent} size={20} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  boot: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  bootText: {
    color: Colors.accent,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.primary,
    opacity: 0.95,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  logoText: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 2,
    color: Colors.accent,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: width * 0.85,
    height: height * 0.55,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.primary,
    opacity: 0.1,
  },
  textContainer: {
    width: '85%',
    marginTop: 40,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '400',
    color: Colors.background,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    lineHeight: 24,
    fontWeight: '300',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginRight: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  buttonSolid: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: '500',
    marginRight: 4,
  },
  buttonTextSolid: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
