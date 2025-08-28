// components/medical/LabTestsList.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { LabTest, LabTestConfig } from '../../types/LabTest';

interface LabTestsListProps {
  patientId: string;
  onAddTest?: () => void;
}

const LabTestsList: React.FC<LabTestsListProps> = ({ patientId, onAddTest }) => {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;

    const testsRef = collection(db, 'labTests');
    const q = query(
      testsRef, 
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const testsData: LabTest[] = [];
      snapshot.forEach((doc) => {
        testsData.push({ id: doc.id, ...doc.data() } as LabTest);
      });
      setLabTests(testsData);
    });

    return unsubscribe;
  }, [patientId]);

  const toggleExpand = (testId: string) => {
    setExpandedTestId(expandedTestId === testId ? null : testId);
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'positive': return '#E74C3C';
      case 'negative': return '#27AE60';
      case 'inconclusive': return '#F39C12';
      case 'pending': return '#7F8C8D';
      default: return '#7F8C8D';
    }
  };

  const renderTestItem = ({ item }: { item: LabTest }) => {
    const isExpanded = expandedTestId === item.id;
    const testConfig = LabTestConfig[item.testType];

    return (
      <TouchableOpacity 
        style={[styles.testItem, isExpanded && styles.testItemExpanded]}
        onPress={() => toggleExpand(item.id!)}
      >
        <View style={styles.testHeader}>
          <View style={styles.testTitleContainer}>
            <Ionicons name="flask" size={16} color="#8E44AD" />
            <Text style={styles.testTitle} numberOfLines={1}>
              {testConfig.name}
            </Text>
          </View>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color="#7F8C8D" 
          />
        </View>

        <View style={styles.testMeta}>
          <Text style={[styles.testResult, { color: getResultColor(item.result) }]}>
            {item.result.toUpperCase()}
          </Text>
          <Text style={styles.testDate}>{formatDate(item.createdAt)}</Text>
        </View>

        {isExpanded && (
          <View style={styles.testContent}>
            <Text style={styles.testTechnician}>
              By: {item.technicianName}
            </Text>
            
            {Object.entries(item.values).length > 0 && (
              <View style={styles.testValues}>
                <Text style={styles.valuesTitle}>Test Values:</Text>
                {Object.entries(item.values).map(([key, value]) => (
                  <View key={key} style={styles.valueItem}>
                    <Text style={styles.valueLabel}>
                      {key}: 
                    </Text>
                    <Text style={styles.value}>
                      {value}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {item.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesTitle}>Notes:</Text>
                <Text style={styles.notesText}>{item.notes}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {onAddTest && (
        <View style={styles.header}>
          <Text style={styles.title}>Lab Tests</Text>
          <TouchableOpacity style={styles.addButton} onPress={onAddTest}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Add Test</Text>
          </TouchableOpacity>
        </View>
      )}

      {labTests.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="flask-outline" size={48} color="#D5D8DC" />
          <Text style={styles.emptyStateText}>No lab tests yet</Text>
          <Text style={styles.emptyStateSubtext}>
            {onAddTest ? 'Add the first lab test for this patient' : 'Lab tests will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={labTests}
          renderItem={renderTestItem}
          keyExtractor={item => item.id!}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'Poppins-Bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8E44AD',
    padding: 8,
    borderRadius: 6,
    gap: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  listContainer: {
    padding: 15,
  },
  testItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  testItemExpanded: {
    marginBottom: 15,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  testTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: 'Poppins-SemiBold',
    flex: 1,
  },
  testMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  testResult: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  testDate: {
    fontSize: 12,
    color: '#7F8C8D',
    fontFamily: 'Poppins-Regular',
  },
  testContent: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  testTechnician: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 10,
    fontFamily: 'Poppins-Regular',
  },
  testValues: {
    marginBottom: 10,
  },
  valuesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  valueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingLeft: 10,
  },
  valueLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    fontFamily: 'Poppins-Regular',
  },
  value: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  notesContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 5,
    fontFamily: 'Poppins-SemiBold',
  },
  notesText: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    flex: 1,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 10,
    fontFamily: 'Poppins-Medium',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#BDC3C7',
    marginTop: 5,
    fontFamily: 'Poppins-Regular',
  },
});

export default LabTestsList;