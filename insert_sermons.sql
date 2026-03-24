
      INSERT INTO public_sermons (org_id, title, speaker, youtube_url, series, date, status, is_featured)
      SELECT id, 'Where Do You Run When Life Breaks You/ 人生によって砕かれたとき、どこに逃げますか？with Pastor Marcel Jonte Gadsden', 'Pastor Marcel Jonte', 'https://www.youtube.com/watch?v=QkHySCxw8ts', 'Sunday Service', '2026-03-22', 'published', false
      FROM organizations LIMIT 1
      ON CONFLICT DO NOTHING;
    
      INSERT INTO public_sermons (org_id, title, speaker, youtube_url, series, date, status, is_featured)
      SELECT id, 'LET&quot;S TUNE IN! / チューニングを合わせよう| Yutaka Nakamura | Japan Kingdom Church', 'Pastor Marcel Jonte', 'https://www.youtube.com/watch?v=l3aOmvsaLRU', 'Sunday Service', '2026-03-15', 'published', false
      FROM organizations LIMIT 1
      ON CONFLICT DO NOTHING;
    
      INSERT INTO public_sermons (org_id, title, speaker, youtube_url, series, date, status, is_featured)
      SELECT id, 'Japan Kingdom Church Sunday Service // ジャパンキングダム教会日曜礼拝', 'Pastor Marcel Jonte', 'https://www.youtube.com/watch?v=S_qcTUO_EWI', 'Sunday Service', '2026-03-08', 'published', false
      FROM organizations LIMIT 1
      ON CONFLICT DO NOTHING;
    
      INSERT INTO public_sermons (org_id, title, speaker, youtube_url, series, date, status, is_featured)
      SELECT id, 'Prophesy anyway/ とにかく預言して！with Pastor Marcel Jonte Gadsden', 'Pastor Marcel Jonte', 'https://www.youtube.com/watch?v=IKLfDtcixy0', 'Sunday Service', '2026-03-01', 'published', false
      FROM organizations LIMIT 1
      ON CONFLICT DO NOTHING;
    
      INSERT INTO public_sermons (org_id, title, speaker, youtube_url, series, date, status, is_featured)
      SELECT id, 'Silent Seasons : From Signs To sons/ 沈黙の時期 : しるしから子達へwith Pastor Marcel Jonte Gadsden', 'Pastor Marcel Jonte', 'https://www.youtube.com/watch?v=gTVY1_bXFeI', 'Sunday Service', '2026-02-22', 'published', false
      FROM organizations LIMIT 1
      ON CONFLICT DO NOTHING;
    
      INSERT INTO public_sermons (org_id, title, speaker, youtube_url, series, date, status, is_featured)
      SELECT id, 'Returning To Your First Love// あなたの初めの愛に戻って with Pastor Marcel Jonte Gadsden', 'Pastor Marcel Jonte', 'https://www.youtube.com/watch?v=mbPsf9Say3c', 'Sunday Service', '2026-02-15', 'published', false
      FROM organizations LIMIT 1
      ON CONFLICT DO NOTHING;
    
      INSERT INTO public_sermons (org_id, title, speaker, youtube_url, series, date, status, is_featured)
      SELECT id, 'Prioritize The Kingdom// 御国を優先する with Pastor Marcel Jonte Gadsden', 'Pastor Marcel Jonte', 'https://www.youtube.com/watch?v=ZLYCSglX7oE', 'Sunday Service', '2026-02-08', 'published', false
      FROM organizations LIMIT 1
      ON CONFLICT DO NOTHING;
    
      INSERT INTO public_sermons (org_id, title, speaker, youtube_url, series, date, status, is_featured)
      SELECT id, 'Abide In The Word// 御言葉にとどまる with Elder Sanna Patterson', 'Pastor Marcel Jonte', 'https://www.youtube.com/watch?v=O9fNmJtdwPs', 'Sunday Service', '2026-02-01', 'published', false
      FROM organizations LIMIT 1
      ON CONFLICT DO NOTHING;
    
      INSERT INTO public_sermons (org_id, title, speaker, youtube_url, series, date, status, is_featured)
      SELECT id, 'When alignment is restored// 神との一致が回復したとき with Pastor Marcel Jonte Gadsden', 'Pastor Marcel Jonte', 'https://www.youtube.com/watch?v=XAqlszAfJvI', 'Sunday Service', '2026-01-25', 'published', false
      FROM organizations LIMIT 1
      ON CONFLICT DO NOTHING;
    
      INSERT INTO public_sermons (org_id, title, speaker, youtube_url, series, date, status, is_featured)
      SELECT id, 'Where Do We Belong?/ 私達のいるべきところは？| Yutaka Nakamura | Japan Kingdom Church', 'Pastor Marcel Jonte', 'https://www.youtube.com/watch?v=i8JdNGnv9rM', 'Sunday Service', '2026-01-18', 'published', false
      FROM organizations LIMIT 1
      ON CONFLICT DO NOTHING;
    
      INSERT INTO public_sermons (org_id, title, speaker, youtube_url, series, date, status, is_featured)
      SELECT id, 'Japan Kingdom Church Sunday Service // ジャパンキングダム教会日曜礼拝', 'Pastor Marcel Jonte', 'https://www.youtube.com/watch?v=NSANJ_QE4Nw', 'Sunday Service', '2026-01-11', 'published', false
      FROM organizations LIMIT 1
      ON CONFLICT DO NOTHING;
    
      INSERT INTO public_sermons (org_id, title, speaker, youtube_url, series, date, status, is_featured)
      SELECT id, 'Japan Kingdom Church Sunday Service // ジャパンキングダム教会日曜礼拝', 'Pastor Marcel Jonte', 'https://www.youtube.com/watch?v=UKPfaDYzg6w', 'Sunday Service', '2026-01-04', 'published', false
      FROM organizations LIMIT 1
      ON CONFLICT DO NOTHING;
    
      INSERT INTO public_sermons (org_id, title, speaker, youtube_url, series, date, status, is_featured)
      SELECT id, 'Japan Kingdom Church Sunday Service // ジャパンキングダム教会日曜礼拝', 'Pastor Marcel Jonte', 'https://www.youtube.com/watch?v=RDTS-llL9Nw', 'Sunday Service', '2025-12-21', 'published', false
      FROM organizations LIMIT 1
      ON CONFLICT DO NOTHING;
    
      INSERT INTO public_sermons (org_id, title, speaker, youtube_url, series, date, status, is_featured)
      SELECT id, 'Japan Kingdom Church Sunday Service // ジャパンキングダム教会日曜礼拝', 'Pastor Marcel Jonte', 'https://www.youtube.com/watch?v=Vj2Z3db2m2Q', 'Sunday Service', '2025-12-14', 'published', false
      FROM organizations LIMIT 1
      ON CONFLICT DO NOTHING;
    
      INSERT INTO public_sermons (org_id, title, speaker, youtube_url, series, date, status, is_featured)
      SELECT id, 'The King Is Promised// 王は約束された with Pastor Marcel Jonte Gadsden', 'Pastor Marcel Jonte', 'https://www.youtube.com/watch?v=WRqciM1F7rU', 'Sunday Service', '2025-12-07', 'published', false
      FROM organizations LIMIT 1
      ON CONFLICT DO NOTHING;
    
  UPDATE public_sermons SET is_featured = false;
  UPDATE public_sermons SET is_featured = true WHERE id IN (
    SELECT id FROM public_sermons ORDER BY date DESC LIMIT 1
  );

