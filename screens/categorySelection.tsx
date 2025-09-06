import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated } from 'react-native';
import * as Animatable from 'react-native-animatable';

const CategorySelection = ({ navigation }) => {
  const categories = [
    { id: 1, title: 'Receptionist', icon: 'medical', color: '#1B9A84', route: 'LoginScreen', role: 'medical' ,describtion: 'Handles Patient Registration adn result Distribution' },
    { id: 2, title: 'Administrator', icon: 'person-circle', color: '#3A86FF', route: 'LoginScreen', role: 'admin',describtion: 'Manages And Oversees all activities going on in the lab'  },
        { id: 2, title: 'Analyzer', icon: 'person-circle', color: 'black', route: 'LoginScreen', role: 'analyzer' ,describtion: 'Colects Patient Samples Ready For Test' },
    { id: 3, title: 'Laboratory Technician', icon: 'flask', color: '#FFBD00', route: 'LoginScreen', role: 'lab',describtion: 'Carries Out Patient Lab Test And issue results'  },
    { id: 4, title: 'Stock Manager', icon: 'medkit', color: '#D62828', route: 'LoginScreen', role: 'pharmacy' ,describtion: 'Manages and distributes stock adn inventories and reagents' },
     { id: 4, title: 'Cashier', icon: 'medkit', color: '#D62828', route: 'LoginScreen', role: 'cashier',describtion: 'Manages Payment validation and all financial activities'  },
  ];

  const handleCategorySelect = (role) => {
    navigation.navigate('LoginScreen', { role });
  };

  return (
    <View style={styles.container}>
        <Animated.View >
            <LinearGradient
              colors={['#1B5E20', '#2E7D32', '#388E3C']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.headerContent}>
                <View style={styles.userInfo}>
                  <Text style={styles.greeting}>Pilem Lab Center </Text>
              
                  <Text style={styles.tagline}>Select your Staff Role</Text>
                </View>
                
                <View style={styles.logoContainer}>
                  <Image
                    source={require('../assets/images/logo.png')} // Replace with your logo
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
      
      <ScrollView contentContainerStyle={styles.categoriesContainer} >
        {categories.map((category, index) => (
          <Animatable.View 
            key={category.id}
            animation="fadeInUp"
            duration={1000}
            delay={index * 200}
          >
            <TouchableOpacity 
              style={[styles.categoryCard, { backgroundColor: category.color }]}
              onPress={() => handleCategorySelect(category.role)}
            >
              <Ionicons name={category.icon as unknown as keyof typeof Ionicons.glyphMap} size={40} color="white" />
              <Text style={styles.categoryText}>{category.title}</Text>
                <Text style={styles.describtionText}>{category.describtion}</Text>
            </TouchableOpacity>
          </Animatable.View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8F7',
  },

  gradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    width: '100%',
height: '40%',
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
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subHeaderText: {
    fontSize: 16,
    color: '#E0F7FA',
    marginTop: 5,
  },
  categoriesContainer: {
    padding: 20,
    paddingTop: 40,
    display: 'flex',
    flexDirection: 'row',
    overflow: 'scroll',
    gap: 10,
    justifyContent: 'flex-start'
  },
  categoryCard: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignContent : 'space-around',
  elevation : 10,
  width: 200,
  padding: 10,
  height: 200,
  // backgroundColor: 'white',
  borderRadius: 15, 
  
  },
  categoryText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',

    fontFamily : 'Poppins-Regular',
    // fontWeight : 600,
  },
  describtionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '300',
    // marginLeft: 15,
    fontFamily : 'Poppins-Regular',
    // fontWeight : 600,
  },
});

export default CategorySelection;