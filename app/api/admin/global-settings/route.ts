import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';

export async function GET() {
  const adminResult = await requireAdmin();
  if (adminResult instanceof NextResponse) {
    return adminResult;
  }

  try {
    const { data: settings, error } = await supabaseAdmin
      .from('global_settings')
      .select('key, value, description');

    if (error) {
      console.error('Error fetching global settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    return NextResponse.json(settings || []);
  } catch (error) {
    console.error('Error in global settings GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const adminResult = await requireAdmin();
  if (adminResult instanceof NextResponse) {
    return adminResult;
  }

  try {
    const { settings } = await request.json();

    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Settings must be an array' },
        { status: 400 }
      );
    }

    // Update each setting
    for (const setting of settings) {
      if (!setting.key) continue;

      const { error } = await supabaseAdmin
        .from('global_settings')
        .upsert({
          key: setting.key,
          value: setting.value,
          description: setting.description,
          updated_at: new Date().toISOString(),
          updated_by: adminResult.id,
        });

      if (error) {
        console.error('Error updating setting:', setting.key, error);
        return NextResponse.json(
          { error: `Failed to update setting: ${setting.key}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in global settings PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
