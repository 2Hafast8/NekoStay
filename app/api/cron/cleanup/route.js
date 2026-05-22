import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // 1. Verify cron secret from headers
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`

    if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
      return new Response('Unauthorized', { status: 401 })
    }

    // 2. Initialize Supabase Admin Client using service role key to bypass RLS
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Cron Error] SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const now = new Date()

    // 2 hours ago for completed bookings
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
    
    // 1 day (24 hours) ago for cancelled bookings
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    // 3. Delete Completed bookings ('Selesai') older than 2 hours
    const { data: deletedCompleted, error: errorCompleted } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('status', 'Selesai')
      .lt('updated_at', twoHoursAgo)
      .select('id')

    if (errorCompleted) throw errorCompleted

    // 4. Delete Cancelled bookings ('Dibatalkan') older than 1 day
    const { data: deletedCancelled, error: errorCancelled } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('status', 'Dibatalkan')
      .lt('updated_at', oneDayAgo)
      .select('id')

    if (errorCancelled) throw errorCancelled

    const totalDeleted = (deletedCompleted?.length || 0) + (deletedCancelled?.length || 0)

    console.log(`[Cron Cleanup] Deleted ${deletedCompleted?.length || 0} completed and ${deletedCancelled?.length || 0} cancelled bookings.`)

    return NextResponse.json({
      success: true,
      message: 'Pembersihan data pesanan berhasil diselesaikan',
      deleted_completed: deletedCompleted?.length || 0,
      deleted_cancelled: deletedCancelled?.length || 0,
      total_deleted: totalDeleted
    })

  } catch (error) {
    console.error('[Cron Error] cleanup endpoint crash:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal memproses cron pembersihan data' },
      { status: 500 }
    )
  }
}
