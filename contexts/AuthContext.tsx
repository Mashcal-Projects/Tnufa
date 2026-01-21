
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface UserProfile {
  personalSheetId: string | null;
  role: string;
  email: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  login: async () => { },
  signup: async () => { },
  logout: async () => { },
  updateProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Subscribe to real-time profile updates
        const userDocRef = doc(db, 'users', currentUser.uid);
        console.log('Subscribing to profile for UID:', currentUser.uid);
        unsubscribeProfile = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              console.log('Profile found:', docSnap.data());
              setProfile(docSnap.data() as UserProfile);
            } else {
              console.log('No profile exists. Creating one...');
              // New user, create empty profile
              const newProfile: UserProfile = {
                personalSheetId: null,
                role: 'user',
                email: currentUser.email || '',
                updatedAt: new Date().toISOString()
              };
              setDoc(userDocRef, newProfile)
                .then(() => console.log('Successfully created profile in Firestore'))
                .catch(err => {
                  console.error('Error creating user profile:', err);
                });
              setProfile(newProfile);
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error listening to profile:', error);
            // Set a default profile on error
            setProfile({
              personalSheetId: null,
              role: 'user',
              email: currentUser?.email || '',
              updatedAt: new Date().toISOString()
            });
            setLoading(false);
          }
        );
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { ...profile, ...data, updatedAt: new Date().toISOString() }, { merge: true });
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
