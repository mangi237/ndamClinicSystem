// components/common/AnimatedHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useAuth } from '../../context/authContext';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedHeaderProps {
  scrollY?: Animated.Value;
}

const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({ scrollY }) => {
  const { user } = useAuth();
  
  const headerHeight = scrollY?.interpolate({
    inputRange: [0, 100],
    outputRange: [120, 80],
    extrapolate: 'clamp',
  });

  const opacity = scrollY?.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.header, { height: headerHeight, opacity }]}>
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#388E3C']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Hello {user?.role}, {user?.name} </Text>
        
            <Text style={styles.tagline}>Continue saving lives</Text>
          </View>
          
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/logo.png')} // Replace with your logo
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    overflow: 'hidden',
        fontFamily: 'Poppins-Regular',
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  userInfo: {
        fontFamily: 'Poppins-Regular',
    flex: 1,
  },
  greeting: {
    color: 'white',
    fontSize: 16,
        fontFamily: 'Poppins-Regular',
    fontWeight: '500',
    
  },
  userName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  logoContainer: {
    marginLeft: 20,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
});

export default AnimatedHeader;