import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'

// This endpoint creates Supabase Auth users for existing users
// It should be called once during migration
// IMPORTANT: Remove or protect this endpoint after use!

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

const DEFAULT_PASSWORD = 'demo123'

export async function POST(request: NextRequest) {
  try {
    // Check for secret to prevent unauthorized access
    const body = await request.json().catch(() => ({}))
    const { secret } = body

    // Simple protection - you can change this secret
    if (secret !== 'setup-absenku-2025') {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid secret' },
        { status: 401 }
      )
    }

    // Get all users without authId
    const users = await db.user.findMany({
      where: {
        authId: null,
      },
      include: {
        organization: true,
      },
    })

    const results = []

    for (const user of users) {
      try {
        // Create Supabase Auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: DEFAULT_PASSWORD,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            name: user.name,
            role: user.role,
          },
        })

        if (authError) {
          // If user already exists in Supabase Auth, try to get them
          if (authError.message.includes('already been registered')) {
            const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
            
            if (listError) {
              results.push({
                email: user.email,
                status: 'error',
                message: 'User exists but could not fetch: ' + listError.message,
              })
              continue
            }

            const existingUser = existingUsers.users.find(u => u.email === user.email)
            if (existingUser) {
              // Link existing auth user
              await db.user.update({
                where: { id: user.id },
                data: { authId: existingUser.id },
              })
              results.push({
                email: user.email,
                status: 'linked',
                message: 'Linked existing Supabase Auth user',
              })
              continue
            }
          }

          results.push({
            email: user.email,
            status: 'error',
            message: authError.message,
          })
          continue
        }

        if (!authData.user) {
          results.push({
            email: user.email,
            status: 'error',
            message: 'No user returned from Supabase',
          })
          continue
        }

        // Update user with authId
        await db.user.update({
          where: { id: user.id },
          data: { authId: authData.user.id },
        })

        results.push({
          email: user.email,
          status: 'created',
          message: 'Created Supabase Auth user and linked',
          authId: authData.user.id,
        })
      } catch (error: any) {
        results.push({
          email: user.email,
          status: 'error',
          message: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase Auth users setup complete',
      totalUsers: users.length,
      results,
    })
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'This endpoint sets up Supabase Auth users for existing database users.',
    usage: 'POST with JSON body: { "secret": "setup-absenku-2025" }',
    defaultPassword: DEFAULT_PASSWORD,
    warning: 'Remove or protect this endpoint after initial setup!',
  })
}
