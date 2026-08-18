import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(req: Request) {
  try {
    const supabaseUserClient = await createClient();
    const { data: { user } } = await supabaseUserClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح للوصول' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم اختيار أي ملف للرفع' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const filename = `receipts/receipt-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const contentType = file.type || `image/${ext}`;

    const supabase = createServiceClient();

    // Try uploading to Supabase Storage 'avatars' or 'receipts' public bucket
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

    // Fallback: Base64 Data URL if storage bucket is unavailable
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
    });
  } catch (err) {
    console.error('[UploadReceiptAPI] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'فشل رفع إثبات الدفع' },
      { status: 500 }
    );
  }
}
