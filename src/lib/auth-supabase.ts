import { supabase } from '@/integrations/supabase/client'
import { getUserProfile, upsertUserProfile, type Profile } from './supabase'
import { toast } from '@/hooks/use-toast'

interface User {
  id: string;
  email: string;
  name: string;
  category: string;
  plan: 'free' | 'pro' | 'enterprise';
  messagesUsed: number;
  messageLimit: number;
  registrationDate?: string;
}

// Auth state management
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Get profile data
    const profile = await getUserProfile(user.id)
    if (!profile) {
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      name: profile.name,
      category: profile.category,
      plan: profile.plan,
      messagesUsed: profile.messages_used,
      messageLimit: profile.message_limit,
      registrationDate: profile.created_at
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Sign up new user
export const signUpUser = async (
  email: string,
  password: string,
  name: string,
  category: string
): Promise<{ user: User | null; error: string | null }> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          name,
          category
        }
      }
    })

    if (error) {
      return { user: null, error: error.message }
    }

    if (!data.user) {
      return { user: null, error: 'שגיאה ביצירת המשתמש' }
    }

    // Wait for profile to be created by trigger, then fetch it
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const profile = await getUserProfile(data.user.id)
    if (!profile) {
      // Create profile manually if trigger didn't work
      const newProfile = await upsertUserProfile(data.user.id, {
        name,
        category,
        plan: 'free',
        messages_used: 0,
        message_limit: 50
      })
      
      if (!newProfile) {
        return { user: null, error: 'שגיאה ביצירת פרופיל המשתמש' }
      }
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email || email,
      name,
      category,
      plan: 'free',
      messagesUsed: 0,
      messageLimit: 50,
      registrationDate: new Date().toISOString()
    }

    return { user, error: null }
  } catch (error) {
    console.error('Sign up error:', error)
    return { user: null, error: 'שגיאה ברישום' }
  }
}

// Sign in existing user
export const signInUser = async (
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { user: null, error: error.message }
    }

    if (!data.user) {
      return { user: null, error: 'שגיאה בהתחברות' }
    }

    const profile = await getUserProfile(data.user.id)
    if (!profile) {
      return { user: null, error: 'לא נמצא פרופיל המשתמש' }
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email || email,
      name: profile.name,
      category: profile.category,
      plan: profile.plan,
      messagesUsed: profile.messages_used,
      messageLimit: profile.message_limit,
      registrationDate: profile.created_at
    }

    return { user, error: null }
  } catch (error) {
    console.error('Sign in error:', error)
    return { user: null, error: 'שגיאה בהתחברות' }
  }
}

// Sign out user
export const signOutUser = async (): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return { error: error.message }
    }

    // Clear localStorage
    localStorage.removeItem('lovable_user')
    localStorage.removeItem('lovable_chat_history')

    return { error: null }
  } catch (error) {
    console.error('Sign out error:', error)
    return { error: 'שגיאה ביציאה' }
  }
}

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Profile>
): Promise<{ profile: Profile | null; error: string | null }> => {
  try {
    const profile = await upsertUserProfile(userId, updates)
    
    if (!profile) {
      return { profile: null, error: 'שגיאה בעדכון הפרופיל' }
    }

    return { profile, error: null }
  } catch (error) {
    console.error('Update profile error:', error)
    return { profile: null, error: 'שגיאה בעדכון הפרופיל' }
  }
}

// Increment message usage
export const incrementMessageUsage = async (userId: string): Promise<boolean> => {
  try {
    const profile = await getUserProfile(userId)
    if (!profile) return false

    const updatedProfile = await upsertUserProfile(userId, {
      messages_used: profile.messages_used + 1
    })

    return !!updatedProfile
  } catch (error) {
    console.error('Error incrementing message usage:', error)
    return false
  }
}