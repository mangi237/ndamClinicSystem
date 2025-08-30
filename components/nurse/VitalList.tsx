import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Vital } from '../../types/Vitals';

const VitalsList = ({ patientId }: { patientId: string }) => {
  const [vitals, setVitals] = useState<Vital[]>([]);
  useEffect(() => {
    const q = query(
      collection(db, 'vitals'),
      where('patientId', '==', patientId),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVitals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vital)));
    });
    return () => unsubscribe();
  }, [patientId]);

  return (
    <FlatList
      data={vitals}
      renderItem={({ item }) => (
        <View>
          <Text>Date: {item.date}</Text>
          <Text>Temp: {item.temperature}°C, BP: {item.bloodPressure}, HR: {item.heartRate}</Text>
          {/* Add more vitals fields as needed */}
        </View>
      )}
      keyExtractor={item => item.id}
    />
  );
};

export default VitalsList;