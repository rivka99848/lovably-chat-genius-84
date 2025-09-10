// Re-export the main Supabase client
export { supabase } from '@/integrations/supabase/client'
import { supabase } from '@/integrations/supabase/client'

import type { Database } from '@/integrations/supabase/types'

// Chat Session interface
export interface ChatSession {
  id: string
  user_id: string
  session_id: string
  title: string
  last_message_at: string
  created_at: string
  updated_at: string
}

// Profile interface
export interface Profile {
  id: string
  user_id: string
  name: string
  category: string
  plan: 'free' | 'pro' | 'enterprise'
  messages_used: number
  message_limit: number
  created_at: string
  updated_at: string
}

// Get user profile
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data as Profile
}

// Create or update user profile
export const upsertUserProfile = async (userId: string, profileData: Partial<Omit<Profile, 'user_id'>>): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      name: 'משתמש חדש', // default name if not provided
      ...profileData,
    })
    .select()
    .single()

  if (error) {
    console.error('Error upserting user profile:', error)
    return null
  }

  return data as Profile
}

// Create a new chat session
export const createChatSession = async (userId: string, sessionId: string, title: string): Promise<ChatSession | null> => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      session_id: sessionId,
      title,
      last_message_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating chat session:', error)
    return null
  }

  return data as ChatSession
}

// Get all chat sessions for a user
export const getChatSessions = async (userId: string): Promise<ChatSession[]> => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false })

  if (error) {
    console.error('Error fetching chat sessions:', error)
    return []
  }

  return data as ChatSession[]
}

// Update chat session last message time
export const updateChatSessionLastMessage = async (sessionId: string): Promise<void> => {
  const { error } = await supabase
    .from('chat_sessions')
    .update({ 
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('session_id', sessionId)

  if (error) {
    console.error('Error updating chat session:', error)
  }
}

// Delete a chat session
export const deleteChatSession = async (sessionId: string): Promise<void> => {
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('session_id', sessionId)

  if (error) {
    console.error('Error deleting chat session:', error)
  }
}