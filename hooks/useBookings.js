'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from './useUser'

/**
 * Hook untuk fetch bookings user
 * @param {Object} options - Options
 * @param {string} options.status - Filter berdasarkan status (opsional)
 * @param {boolean} options.subscribe - Subscribe ke realtime changes (default: true)
 * @returns {Object} { bookings, loading, error, refetch }
 */
export function useBookings(options = {}) {
  const { status = null, subscribe = true } = options
  const { user } = useUser()
  const supabase = createClient()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBookings = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (id, full_name, phone),
          cat_reports (id, health_status, photo_url, notes, report_date)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error: err } = await query

      if (err) throw err
      setBookings(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()

    if (!subscribe || !user) return

    // Subscribe ke realtime changes dengan unique channel ID
    const channelUniqueId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`bookings-${user.id}-${channelUniqueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBookings((prev) => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setBookings((prev) =>
              prev.map((b) => (b.id === payload.new.id ? payload.new : b))
            )
          } else if (payload.eventType === 'DELETE') {
            setBookings((prev) => prev.filter((b) => b.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel);
    }
  }, [user, subscribe])

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
  }
}
