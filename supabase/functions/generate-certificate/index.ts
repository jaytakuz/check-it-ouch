import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { eventId, userId, attendeeName } = await req.json();

    console.log('Generating certificate for:', { eventId, userId, attendeeName });

    if (!eventId) {
      throw new Error('Event ID is required');
    }

    if (!userId && !attendeeName) {
      throw new Error('Either userId or attendeeName is required');
    }

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      console.error('Event fetch error:', eventError);
      throw new Error('Event not found');
    }

    console.log('Event found:', event.name);

    let recipientName = attendeeName;
    let totalSessions = 0;
    let attendedSessions = 0;

    // Calculate attendance for registered users
    if (userId) {
      // Get user's check-ins for this event
      const { data: checkIns, error: checkInError } = await supabase
        .from('check_ins')
        .select('session_date')
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (checkInError) {
        console.error('Check-in fetch error:', checkInError);
        throw new Error('Failed to fetch check-in data');
      }

      attendedSessions = checkIns?.length || 0;

      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userId)
        .single();

      recipientName = profile?.full_name || 'Anonymous Attendee';

      // Calculate total sessions based on event type
      if (event.is_recurring && event.recurring_days) {
        // For recurring events, count sessions from start to now or end_repeat_date
        const startDate = new Date(event.created_at);
        const endDate = event.end_repeat_date ? new Date(event.end_repeat_date) : new Date();
        
        let count = 0;
        const current = new Date(startDate);
        while (current <= endDate) {
          if (event.recurring_days.includes(current.getDay())) {
            count++;
          }
          current.setDate(current.getDate() + 1);
        }
        totalSessions = count;
      } else {
        // For one-time events, there's only 1 session
        totalSessions = 1;
      }
    } else {
      // For guest check-ins, just use the provided name
      const { data: guestCheckIns } = await supabase
        .from('guest_check_ins')
        .select('session_date')
        .eq('event_id', eventId)
        .eq('guest_name', attendeeName);

      attendedSessions = guestCheckIns?.length || 0;
      totalSessions = attendedSessions > 0 ? attendedSessions : 1;
    }

    // Calculate attendance percentage
    const attendancePercentage = totalSessions > 0 
      ? Math.round((attendedSessions / totalSessions) * 100)
      : 0;

    console.log('Attendance:', { attendedSessions, totalSessions, attendancePercentage, threshold: event.certificate_threshold });

    // Check if user meets the threshold
    if (attendancePercentage < event.certificate_threshold) {
      return new Response(
        JSON.stringify({ 
          error: 'Attendance threshold not met',
          attendancePercentage,
          requiredPercentage: event.certificate_threshold,
          attendedSessions,
          totalSessions
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate certificate data (SVG-based for simplicity)
    const certificateDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const verificationCode = `CHK-${eventId.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    // Generate SVG certificate
    const svgCertificate = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f8fafc"/>
            <stop offset="100%" style="stop-color:#e2e8f0"/>
          </linearGradient>
          <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#d4af37"/>
            <stop offset="50%" style="stop-color:#f4d03f"/>
            <stop offset="100%" style="stop-color:#d4af37"/>
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="800" height="600" fill="url(#bg)"/>
        
        <!-- Border -->
        <rect x="20" y="20" width="760" height="560" fill="none" stroke="url(#gold)" stroke-width="4" rx="10"/>
        <rect x="30" y="30" width="740" height="540" fill="none" stroke="url(#gold)" stroke-width="1" rx="8"/>
        
        <!-- Header -->
        <text x="400" y="80" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="#64748b" letter-spacing="8">CERTIFICATE</text>
        <text x="400" y="110" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#94a3b8" letter-spacing="4">OF ATTENDANCE</text>
        
        <!-- Decorative line -->
        <line x1="200" y1="130" x2="600" y2="130" stroke="url(#gold)" stroke-width="2"/>
        
        <!-- Event Name -->
        <text x="400" y="180" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#1e293b" font-weight="bold">${escapeXml(event.name)}</text>
        
        <!-- Certify text -->
        <text x="400" y="240" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#64748b">This is to certify that</text>
        
        <!-- Recipient Name -->
        <text x="400" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="#1e293b" font-weight="bold">${escapeXml(recipientName)}</text>
        
        <!-- Underline for name -->
        <line x1="200" y1="320" x2="600" y2="320" stroke="#d4af37" stroke-width="1"/>
        
        <!-- Completion text -->
        <text x="400" y="370" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#64748b">has successfully completed the attendance requirements</text>
        <text x="400" y="395" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#64748b">with ${attendancePercentage}% attendance (${attendedSessions}/${totalSessions} sessions)</text>
        
        <!-- Date -->
        <text x="400" y="450" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#64748b">Issued on ${certificateDate}</text>
        
        <!-- Verification -->
        <text x="400" y="520" text-anchor="middle" font-family="monospace" font-size="12" fill="#94a3b8">Verification Code: ${verificationCode}</text>
        
        <!-- Award icon -->
        <circle cx="400" cy="490" r="20" fill="none" stroke="url(#gold)" stroke-width="2"/>
        <text x="400" y="496" text-anchor="middle" font-size="16">🏆</text>
      </svg>
    `;

    console.log('Certificate generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        certificate: svgCertificate,
        attendeeName: recipientName,
        eventName: event.name,
        attendancePercentage,
        attendedSessions,
        totalSessions,
        verificationCode,
        issuedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error generating certificate:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper function to escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
