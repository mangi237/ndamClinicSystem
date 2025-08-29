import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInWithEmailAndPassword, signOut, User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { User } from '../types/User';

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

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start with true for initial auth check

  const login = async (code: string) => {
    try {
      setLoading(true);
      
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
        
        // Store user data in state
        setUser({
          id: userDoc.id,
          ...userData
        } as User);
        
        return { success: true, role: userData.role };
      }
      
      return { success: false, error: 'Invalid access code' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out: ', error);
    } finally {
      setLoading(false);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
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
      setLoading(false);
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