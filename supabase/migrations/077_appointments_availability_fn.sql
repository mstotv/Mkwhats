-- ============================================================
-- MIGRATION 077: Check Slot Availability SQL Function
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_slot_availability(
  p_account_id UUID,
  p_requested_utc TIMESTAMPTZ,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings RECORD;
  v_local_dt TIMESTAMP;
  v_day_of_week SMALLINT;
  v_local_time TIME;
  v_bh RECORD;
  v_conflict_count INTEGER;
  v_duration INT;
  v_tz TEXT;
  v_slot_end_utc TIMESTAMPTZ;
BEGIN
  -- 1. Load account appointment settings
  SELECT slot_duration_minutes, timezone
  INTO v_settings
  FROM public.appointment_settings
  WHERE account_id = p_account_id;

  IF NOT FOUND THEN
    -- Fallback default if not configured yet
    v_duration := 60;
    v_tz := 'Asia/Baghdad';
  ELSE
    v_duration := COALESCE(v_settings.slot_duration_minutes, 60);
    v_tz := COALESCE(v_settings.timezone, 'Asia/Baghdad');
  END IF;

  -- 2. Convert requested UTC timestamp to account local time
  BEGIN
    v_local_dt := p_requested_utc AT TIME ZONE v_tz;
  EXCEPTION WHEN OTHERS THEN
    -- In case of invalid timezone string fallback to UTC+3
    v_tz := 'Asia/Baghdad';
    v_local_dt := p_requested_utc AT TIME ZONE 'Asia/Baghdad';
  END;

  v_day_of_week := EXTRACT(DOW FROM v_local_dt)::SMALLINT;
  v_local_time  := v_local_dt::TIME;

  -- 3. Check Business Hours for that day
  SELECT *
  INTO v_bh
  FROM public.business_hours
  WHERE account_id = p_account_id
    AND day_of_week = v_day_of_week;

  -- If business hours are not configured at all, or the day is marked closed
  IF NOT FOUND THEN
    -- If no record exists at all for this account, allow 09:00 - 17:00 default or inform not configured
    -- Check if any business hours exist for this account
    IF NOT EXISTS (SELECT 1 FROM public.business_hours WHERE account_id = p_account_id) THEN
      -- Account hasn't set up business hours yet; allow default standard hours
      IF v_local_time < TIME '09:00:00' OR v_local_time >= TIME '18:00:00' THEN
        RETURN jsonb_build_object(
          'available', false,
          'reason', 'outside_hours',
          'message', 'الوقت المطلوب خارج ساعات العمل الافتراضية (09:00 ص - 06:00 م)',
          'open_time', '09:00:00',
          'close_time', '18:00:00',
          'timezone', v_tz
        );
      END IF;
    ELSE
      -- Business hours exist for other days, but this day is missing/closed
      RETURN jsonb_build_object(
        'available', false,
        'reason', 'day_off',
        'message', 'هذا اليوم يوم عطلة أو خارج أوقات العمل الرسمية',
        'timezone', v_tz
      );
    END IF;
  ELSE
    IF NOT v_bh.is_open THEN
      RETURN jsonb_build_object(
        'available', false,
        'reason', 'day_off',
        'message', 'هذا اليوم يوم عطلة رسمية',
        'timezone', v_tz
      );
    END IF;

    -- Check if requested time falls within open_time and close_time
    IF v_local_time < v_bh.open_time OR v_local_time >= v_bh.close_time THEN
      RETURN jsonb_build_object(
        'available', false,
        'reason', 'outside_hours',
        'message', 'الوقت المطلوب خارج ساعات العمل لهذا اليوم',
        'open_time', v_bh.open_time::TEXT,
        'close_time', v_bh.close_time::TEXT,
        'timezone', v_tz
      );
    END IF;

    -- Check if the appointment duration extends beyond closing time
    IF (v_local_time + (v_duration || ' minutes')::INTERVAL)::TIME > v_bh.close_time THEN
      RETURN jsonb_build_object(
        'available', false,
        'reason', 'slot_exceeds_hours',
        'message', 'مدة الموعد تتجاوز وقت نهاية دوام العمل',
        'open_time', v_bh.open_time::TEXT,
        'close_time', v_bh.close_time::TEXT,
        'timezone', v_tz
      );
    END IF;
  END IF;

  -- 4. Check for conflicts with existing appointments (excluding cancelled)
  v_slot_end_utc := p_requested_utc + (v_duration || ' minutes')::INTERVAL;

  SELECT COUNT(*) INTO v_conflict_count
  FROM public.appointments
  WHERE account_id = p_account_id
    AND status NOT IN ('cancelled')
    AND (p_exclude_id IS NULL OR id != p_exclude_id)
    AND tstzrange(scheduled_at, scheduled_at + (duration_minutes || ' minutes')::INTERVAL, '[)')
     && tstzrange(p_requested_utc, v_slot_end_utc, '[)');

  IF v_conflict_count > 0 THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'slot_taken',
      'message', 'هذا الموعد محجوز مسبقاً، يرجى اختيار وقت آخر',
      'timezone', v_tz
    );
  END IF;

  -- 5. Slot is fully available
  RETURN jsonb_build_object(
    'available', true,
    'reason', 'ok',
    'message', 'الموعد متاح للحجز',
    'slot_duration_minutes', v_duration,
    'scheduled_at_utc', p_requested_utc,
    'slot_end_utc', v_slot_end_utc,
    'timezone', v_tz
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_slot_availability(UUID, TIMESTAMPTZ, UUID) TO authenticated, service_role, anon;
