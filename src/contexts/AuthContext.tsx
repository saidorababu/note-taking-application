import React, { createContext, useContext, useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000';

interface AuthContextType {
  user: any;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  updatePassword: (newPassword: string) => Promise<void>;
  updateProfileImage: (formData: FormData) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Signup failed');
  };

  const signIn = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    
    setUser({id:data.userId,token:data.token, email: data.email});
    if (!response.ok) throw new Error(data.error || 'Signin failed');
    // localStorage.setItem('user', JSON.stringify(data));
    // setUser(data);
  };

  const signOut = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // 📌 Function to update profile image
  const updateProfileImage = async (formData: FormData) => {
    try {
      const response = await fetch(`${API_URL}/upload/${user.id}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();

      if (data.imageUrl) {
        setUser((prevUser:any) => ({ ...prevUser, profileImage: data.imageUrl }));
      }

      return data.imageUrl;
    } catch (error) {
      console.error("Error updating profile image:", error);
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) throw new Error('Not authenticated');
    const response = await fetch(`${API_URL}/update-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, newPassword }),
    });
    if (!response.ok) throw new Error('Password update failed');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, updatePassword, updateProfileImage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
