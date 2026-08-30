import { describe, it, expect } from 'vitest';
import { parseGeneration } from '@/lib/ai/generate';

describe('Appointments AI JSON Block Extraction', () => {
  it('extracts appointment block when appointmentMode is true', () => {
    const raw =
      'تم تحديد موعدك يوم السبت الساعة 10:00 صباحاً. هل تؤكد الموعد؟\n' +
      '|||{"appointment": {"customer_name": "أحمد", "service_name": "استشارة", "date_time": "2026-09-01 10:00", "confirmed": false}}|||';

    const res = parseGeneration(raw, null, false, true);

    expect(res.text).toBe('تم تحديد موعدك يوم السبت الساعة 10:00 صباحاً. هل تؤكد الموعد؟');
    expect(res.handoff).toBe(false);
    expect(res.appointmentData).toEqual({
      customer_name: 'أحمد',
      service_name: 'استشارة',
      date_time: '2026-09-01 10:00',
      confirmed: false,
      cancel_appointment: false,
    });
  });

  it('extracts confirmed appointment correctly', () => {
    const raw =
      'تم تأكيد موعدك بنجاح! نحن بانتظارك.\n' +
      '|||{"appointment": {"customer_name": "سارة", "service_name": "كشف عام", "date_time": "2026-09-05 14:00", "confirmed": true}}|||';

    const res = parseGeneration(raw, null, false, true);

    expect(res.text).toBe('تم تأكيد موعدك بنجاح! نحن بانتظارك.');
    expect(res.appointmentData?.confirmed).toBe(true);
    expect(res.appointmentData?.date_time).toBe('2026-09-05 14:00');
  });

  it('keeps order collection and appointments completely independent', () => {
    // When only order mode is active
    const orderRaw = 'طلبك قيد الجمع\n|||{"extracted": {"name": "علي"}, "confirmed": false, "new_order": false}|||';
    const orderRes = parseGeneration(orderRaw, null, true, false);

    expect(orderRes.extracted?.extracted).toEqual({ name: 'علي' });
    expect(orderRes.appointmentData).toBeUndefined();

    // When only appointment mode is active
    const apptRaw = 'موعدك محدد\n|||{"appointment": {"date_time": "2026-09-02 11:00", "confirmed": false}}|||';
    const apptRes = parseGeneration(apptRaw, null, false, true);

    expect(apptRes.extracted).toBeNull();
    expect(apptRes.appointmentData?.date_time).toBe('2026-09-02 11:00');
  });
});
