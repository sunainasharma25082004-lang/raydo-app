import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Bell, MapPin, Search, Clock, Home, Briefcase, Menu } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const RECENT_PLACES = [
  { id: '1', name: 'Phoenix Marketcity', address: 'Whitefield Main Rd', time: '2h ago' },
  { id: '2', name: 'Kempegowda Int. Airport', address: 'Devanahalli', time: 'Yesterday' },
];

export default function RiderHomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Mock Map Background */}
      <View style={styles.mapContainer}>
        {/* Desaturated map placeholder */}
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&sat=-100&bri=20' }} 
          style={styles.mapImage}
        />
        <View style={styles.mapOverlay} />
        
        {/* Current Location Pin */}
        <View style={styles.centerPin}>
          <View style={styles.pinDot} />
          <View style={styles.pinRing} />
        </View>
      </View>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton}>
          <Menu color={Colors.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.logoText}>Raydo</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Bell color={Colors.primary} size={24} />
          <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet UI */}
      <View style={styles.bottomSheet}>
        {/* Search Card */}
        <TouchableOpacity 
          style={styles.searchCard} 
          activeOpacity={0.9}
          onPress={() => router.push('/rider/search')}
        >
          <Search color={Colors.primary} size={24} style={styles.searchIcon} />
          <Text style={styles.searchText}>Where to?</Text>
        </TouchableOpacity>

        {/* Quick Pills */}
        <View style={styles.pillsContainer}>
          <TouchableOpacity style={styles.pill}>
            <Home color={Colors.text} size={16} />
            <Text style={styles.pillText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill}>
            <Briefcase color={Colors.text} size={16} />
            <Text style={styles.pillText}>Work</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Destinations */}
        <ScrollView style={styles.recentList} showsVerticalScrollIndicator={false}>
          {RECENT_PLACES.map((place) => (
            <TouchableOpacity key={place.id} style={styles.recentRow} onPress={() => router.push('/rider/vehicle')}>
              <View style={styles.recentIconBg}>
                <Clock color={Colors.textLight} size={20} />
              </View>
              <View style={styles.recentTextContainer}>
                <Text style={styles.recentName}>{place.name}</Text>
                <Text style={styles.recentAddress}>{place.address}</Text>
              </View>
              <Text style={styles.recentTime}>{place.time}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapContainer: {
    height: height * 0.65,
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  mapImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.8,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FAF8F4',
    opacity: 0.2,
  },
  centerPin: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    marginLeft: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    borderWidth: 4,
    borderColor: Colors.white,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  pinRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accent,
    opacity: 0.15,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: height * 0.45,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 16,
  },
  searchText: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '500',
  },
  pillsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  pillText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  recentList: {
    flex: 1,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  recentIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  recentTextContainer: {
    flex: 1,
  },
  recentName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  recentAddress: {
    fontSize: 13,
    color: Colors.textLight,
  },
  recentTime: {
    fontSize: 12,
    color: Colors.textLight,
  }
});
