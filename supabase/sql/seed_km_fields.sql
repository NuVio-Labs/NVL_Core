-- km-Zusatzfelder für Preislisten (PKW, Transporter, LKW)
-- Anhänger-Listen bekommen keine km-Felder

DO $$
DECLARE
  cid uuid := '4cf746a5-3397-4b9f-9b11-39aa16070929';

  -- Privatkunden Listen
  pl_pkw_priv uuid;
  pl_trans_priv uuid;

  -- Gewerblich Listen
  pl_pkw_gew uuid;
  pl_trans_gew uuid;
  pl_lkw_gew uuid;

  -- sort_order Basis (nach bestehenden Tarif-Feldern)
  base_sort int := 100;

  -- Hilfsvariable für Item-IDs
  item_id uuid;
BEGIN

  -- IDs der relevanten Preislisten ermitteln
  SELECT id INTO pl_pkw_priv   FROM public.price_lists WHERE company_id = cid AND name ILIKE '%pkw%privat%' OR (company_id = cid AND name ILIKE '%privat%pkw%') LIMIT 1;
  SELECT id INTO pl_pkw_priv   FROM public.price_lists WHERE company_id = cid AND name ILIKE '%9-sitzer%privat%' OR (company_id = cid AND name ILIKE '%privat%9%') LIMIT 1;
  SELECT id INTO pl_trans_priv FROM public.price_lists WHERE company_id = cid AND (name ILIKE '%transporter%privat%' OR name ILIKE '%privat%transporter%' OR name ILIKE '%lkw%privat%' OR name ILIKE '%privat%lkw%') LIMIT 1;
  SELECT id INTO pl_pkw_gew    FROM public.price_lists WHERE company_id = cid AND (name ILIKE '%pkw%gewerbe%' OR name ILIKE '%gewerbe%pkw%' OR name ILIKE '%9-sitzer%gewerbe%' OR name ILIKE '%gewerbe%9%') LIMIT 1;
  SELECT id INTO pl_trans_gew  FROM public.price_lists WHERE company_id = cid AND (name ILIKE '%transporter%gewerbe%' OR name ILIKE '%gewerbe%transporter%' OR name ILIKE '%lkw%gewerbe%' OR name ILIKE '%gewerbe%lkw%') LIMIT 1;
  SELECT id INTO pl_lkw_gew    FROM public.price_lists WHERE company_id = cid AND (name ILIKE '%lkw%gewerbe%' OR name ILIKE '%gewerbe%lkw%') LIMIT 1;

  RAISE NOTICE 'PKW Privat: %', pl_pkw_priv;
  RAISE NOTICE 'Transporter Privat: %', pl_trans_priv;
  RAISE NOTICE 'PKW Gewerbe: %', pl_pkw_gew;
  RAISE NOTICE 'Transporter Gewerbe: %', pl_trans_gew;

END $$;

-- Erst alle Preislisten anzeigen zur Kontrolle:
SELECT id, name FROM public.price_lists WHERE company_id = '4cf746a5-3397-4b9f-9b11-39aa16070929' ORDER BY name;
