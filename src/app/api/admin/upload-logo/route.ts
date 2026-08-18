import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkIsSuperAdmin } from '@/lib/auth/admin-guard';

export async function POST(req: Request) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم اختيار أي ملف للرفع' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const filename = `logos/logo-${Date.now()}.${ext}`;
    const contentType = file.type || `image/${ext}`;

    const supabase = createServiceClient();

    // 1. Try uploading to Supabase Storage 'avatars' public bucket
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filename, buffer, {
        contentType,
        upsert: true,
      });

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filename);

      if (publicUrlData?.publicUrl) {
        return NextResponse.json({
          success: true,
          url: publicUrlData.publicUrl,
        });
      }
    }

    // 2. Fallback: Base64 Data URL if storage bucket is unavailable
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
    });
  } catch (err) {
    console.error('[UploadLogoAPI] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'فشل رفع ملف الشعار' },
      { status: 500 }
    );
  }
}
