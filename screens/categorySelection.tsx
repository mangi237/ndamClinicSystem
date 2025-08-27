// screens/CategorySelection.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const CategorySelection = ({ navigation }) => {
  const categories = [
    { id: 1, title: 'Doctor/Nurse', icon: 'medical' as const, color: '#2E86C1', route: 'LoginScreen', role: 'medical' },
    { id: 2, title: 'Administrator', icon: 'person' as const , color: '#27AE60', route: 'LoginScreen', role: 'admin' },
    { id: 3, title: 'Laboratory Technician', icon: 'flask' as const , color: '#8E44AD', route: 'LoginScreen', role: 'lab' },
    { id: 4, title: 'Pharmacist', icon: 'medical-bag' as const , color: '#E67E22', route: 'LoginScreen', role: 'pharmacy' },
  ];

  const handleCategorySelect = (role) => {
    navigation.navigate('LoginScreen', { role });
  };

  return (
    <View style={styles.container}>
      <Animatable.View animation="fadeInDown" duration={1000} style={styles.header}>
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
                      <Ionicons name={category.icon  as unknown as keyof typeof Ionicons.glyphMap} size={40} color="white" />
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'Poppins-Bold',
  },
  subHeaderText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 5,
    fontFamily: 'Poppins-Regular',
  },
  categoriesContainer: {
    padding: 20,
    paddingBottom: 40,
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
    fontFamily: 'Poppins-SemiBold',
  },
});

export default CategorySelection;