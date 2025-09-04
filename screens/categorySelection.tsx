import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const CategorySelection = ({ navigation }) => {
  const categories = [
    { id: 1, title: 'Receptionist', icon: 'medical', color: '#1B9A84', route: 'LoginScreen', role: 'medical' },
    { id: 2, title: 'Administrator', icon: 'person-circle', color: '#3A86FF', route: 'LoginScreen', role: 'admin' },
        { id: 2, title: 'Analyzer', icon: 'person-circle', color: 'black', route: 'LoginScreen', role: 'analyzer' },
    { id: 3, title: 'Laboratory Technician', icon: 'flask', color: '#FFBD00', route: 'LoginScreen', role: 'lab' },
    { id: 4, title: 'Stock Manager', icon: 'medkit', color: '#D62828', route: 'LoginScreen', role: 'pharmacy' },
     { id: 4, title: 'Cashier', icon: 'medkit', color: '#D62828', route: 'LoginScreen', role: 'cashier' },
  ];

  const handleCategorySelect = (role) => {
    navigation.navigate('LoginScreen', { role });
  };

  return (
    <View style={styles.container}>
      <Animatable.View animation="fadeInDown" duration={1000} style={styles.header}>
        <Image
          source={require('../assets/images/logo.png')} // Update this path to your clinic's logo
          style={styles.logo}
        />
        <Text style={styles.headerText}>NDAM Clinic</Text>
        <Text style={styles.subHeaderText}>Select Your Role</Text>
      </Animatable.View>
      
      <ScrollView contentContainerStyle={styles.categoriesContainer}>
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
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: '#1E96A9',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
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
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 15,
  },
});

export default CategorySelection;