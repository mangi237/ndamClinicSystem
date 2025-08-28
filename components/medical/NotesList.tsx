// components/medical/NotesList.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Note } from '../../types/Notes';
import type { IconProps } from '@expo/vector-icons/build/createIconSet';
interface NotesListProps {
  patientId: string;
  onAddNote: () => void;
}

const NotesList: React.FC<NotesListProps> = ({ patientId, onAddNote }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;

    const notesRef = collection(db, 'notes');
    const q = query(
      notesRef, 
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData: Note[] = [];
      snapshot.forEach((doc) => {
        notesData.push({ id: doc.id, ...doc.data() } as Note);
      });
      setNotes(notesData);
    });

    return unsubscribe;
  }, [patientId]);

  const toggleExpand = (noteId: string) => {
    setExpandedNoteId(expandedNoteId === noteId ? null : noteId);
  };



  const getPriorityIcon = (priority: string): { name: keyof typeof Ionicons.glyphMap, color: string } => {
    switch (priority) {
      case 'high': return { name: 'alert-circle', color: '#E74C3C' };
      case 'medium': return { name: 'information-circle', color: '#F39C12' };
      case 'low': return { name: 'checkmark-circle', color: '#27AE60' };
      default: return { name: 'help-circle', color: '#7F8C8D' };
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const renderNoteItem = ({ item }: { item: Note }) => {
    const isExpanded = expandedNoteId === item.id;
    const priorityIcon = getPriorityIcon(item.priority);

    return (
      <TouchableOpacity 
        style={[styles.noteItem, isExpanded && styles.noteItemExpanded]}
        onPress={() => toggleExpand(item.id!)}
      >
        <View style={styles.noteHeader}>
          <View style={styles.noteTitleContainer}>
            <Ionicons name={priorityIcon.name} size={16} color={priorityIcon.color} />
            <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
          </View>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color="#7F8C8D" 
          />
        </View>

        <View style={styles.noteMeta}>
          <Text style={styles.noteCategory}>{item.category}</Text>
          <Text style={styles.noteDoctor}>By: {item.doctorName}</Text>
          <Text style={styles.noteDate}>{formatDate(item.createdAt)}</Text>
        </View>

        {isExpanded && (
          <View style={styles.noteContent}>
            <Text style={styles.noteText}>{item.content}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patient Notes</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddNote}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Note</Text>
        </TouchableOpacity>
      </View>

      {notes.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text" size={48} color="#D5D8DC" />
          <Text style={styles.emptyStateText}>No notes yet</Text>
          <Text style={styles.emptyStateSubtext}>Add the first note for this patient</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNoteItem}
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
    backgroundColor: '#27AE60',
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
  noteItem: {
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
  noteItemExpanded: {
    marginBottom: 15,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  noteTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: 'Poppins-SemiBold',
    flex: 1,
  },
  noteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  noteCategory: {
    fontSize: 12,
    color: '#2E86C1',
    backgroundColor: '#EBF5FB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontFamily: 'Poppins-Medium',
  },
  noteDoctor: {
    fontSize: 12,
    color: '#7F8C8D',
    fontFamily: 'Poppins-Regular',
  },
  noteDate: {
    fontSize: 12,
    color: '#7F8C8D',
    fontFamily: 'Poppins-Regular',
  },
  noteContent: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  noteText: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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

export default NotesList;