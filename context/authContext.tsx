// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, db,  } from '../services/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { User } from '../types/User';
// import firebase from 'firebase/compat/app';
// import { db, auth } from '../services/firebase'; 

interface AuthContextType {
  user: User | null;
  login: (code: string) => Promise<{ success: boolean; role?: string; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

 const login = async (code: string) => {
  try {
    // 1. Create a reference to the users collection
    const usersRef = collection(db, 'users');
    
    // 2. Create a query to find users with the matching code
    const q = query(usersRef, where('code', '==', code));
    
    // 3. Execute the query
    const querySnapshot = await getDocs(q);
    
    // 4. Check if any documents were found
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      return { success: true, role: userData.role };
    }
    
    return { success: false, error: 'Invalid access code' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
};
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // If user is logged in via Firebase Auth, find their data in Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({
              id: userDoc.id,
              ...userDoc.data()
            } as User);
          }
        } catch (error) {
          console.error('Error fetching user data: ', error);
        }
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};