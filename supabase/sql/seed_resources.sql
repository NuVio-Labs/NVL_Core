-- Ressourcen Import
-- company_id: 4cf746a5-3397-4b9f-9b11-39aa16070929
-- Bereits in DB: KLE-PL-977 (Nr. 1), KLE-CD-146 (Nr. 2)
-- standort = aktueller Standort ("Steht in"), homebase = Homebase

DO $$
DECLARE
  cid uuid := '4cf746a5-3397-4b9f-9b11-39aa16070929';
BEGIN

-- Nr. 3: 9-Sitzer Ford, KLE PL 917
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, '9-Sitzer Ford', 'Fahrzeug', true, jsonb_build_object(
  'ahk', true, 'sitze', 9, 'kennzeichen', 'KLE-PL-917',
  'hauptuntersuchung', '2022-08-01',
  'standort', 'Weeze', 'homebase', 'Kranenburg', 'preis_gruppe', 'E_PKW'
));

-- Nr. 4: 9-Sitzer Ford Vereinsmobil, KLE PL 927
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, '9-Sitzer Ford Vereinsmobil', 'Fahrzeug', true, jsonb_build_object(
  'ahk', true, 'sitze', 9, 'kennzeichen', 'KLE-PL-927',
  'hauptuntersuchung', '2023-05-01',
  'standort', 'Weeze', 'homebase', 'Weeze', 'preis_gruppe', 'E_PKW'
));

-- Nr. 5: 9-Sitzer Fiat Talento, GEL PL 907
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, '9-Sitzer Fiat Talento', 'Fahrzeug', true, jsonb_build_object(
  'ahk', false, 'sitze', 9, 'kennzeichen', 'GEL-PL-907',
  'hauptuntersuchung', '2022-12-01',
  'standort', 'Weeze', 'homebase', 'Weeze', 'preis_gruppe', 'D_PKW'
));

-- Nr. 6: 8-Sitzer Ford Tourneo, KLE PL 997
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, '8-Sitzer Ford Tourneo', 'Fahrzeug', true, jsonb_build_object(
  'ahk', true, 'sitze', 8, 'kennzeichen', 'KLE-PL-997',
  'hauptuntersuchung', '2023-07-01',
  'standort', 'Kalkar', 'homebase', 'Kalkar', 'preis_gruppe', 'E_PKW'
));

-- Nr. 7: Fiat Tipo, GEL PL 117
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Fiat Tipo', 'Fahrzeug', true, jsonb_build_object(
  'ahk', false, 'sitze', 5, 'kennzeichen', 'GEL-PL-117',
  'standort', 'Kranenburg', 'homebase', 'Goch', 'preis_gruppe', 'B_PKW'
));

-- Nr. 8: Fiat Tipo, KLE PL 107
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Fiat Tipo', 'Fahrzeug', true, jsonb_build_object(
  'ahk', false, 'sitze', 5, 'kennzeichen', 'KLE-PL-107',
  'hauptuntersuchung', '2022-02-01',
  'standort', 'Kevelaer', 'homebase', 'Weeze', 'preis_gruppe', 'B_PKW'
));

-- Nr. 9: Fiat Tipo, GEL PL 127
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Fiat Tipo', 'Fahrzeug', true, jsonb_build_object(
  'ahk', false, 'sitze', 5, 'kennzeichen', 'GEL-PL-127',
  'standort', 'Weeze', 'homebase', 'Kranenburg', 'preis_gruppe', 'B_PKW'
));

-- Nr. 10: Hyundai i30, KLE PL 137
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Hyundai i30', 'Fahrzeug', true, jsonb_build_object(
  'ahk', false, 'sitze', 5, 'kennzeichen', 'KLE-PL-137',
  'standort', 'Weeze', 'homebase', 'Weeze', 'preis_gruppe', 'B_PKW'
));

-- Nr. 11: Fiat Punto, KLE PL 147
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Fiat Punto', 'Fahrzeug', true, jsonb_build_object(
  'ahk', false, 'sitze', 5, 'kennzeichen', 'KLE-PL-147',
  'hauptuntersuchung', '2021-09-01',
  'standort', 'Weeze', 'homebase', 'Weeze', 'preis_gruppe', 'B_PKW'
));

-- Nr. 12: Fiat Tipo Kombi, GEL PL 157
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Fiat Tipo Kombi', 'Fahrzeug', true, jsonb_build_object(
  'ahk', false, 'sitze', 5, 'kennzeichen', 'GEL-PL-157',
  'hauptuntersuchung', '2022-10-01',
  'standort', 'Weeze', 'homebase', 'Weeze', 'preis_gruppe', 'B_PKW'
));

-- Nr. 13: Ford Focus, GEL PL 167
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Ford Focus', 'Fahrzeug', true, jsonb_build_object(
  'ahk', true, 'sitze', 5, 'kennzeichen', 'GEL-PL-167',
  'hauptuntersuchung', '2025-01-01',
  'standort', 'Weeze', 'homebase', 'Weeze', 'preis_gruppe', 'C_PKW'
));

-- Nr. 14: Citroen Jumper (Transporter), KLE PL 217
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Citroen Jumper', 'Fahrzeug', true, jsonb_build_object(
  'ahk', true, 'sitze', 3, 'kennzeichen', 'KLE-PL-217',
  'hauptuntersuchung', '2023-08-01',
  'standort', 'Alpen', 'homebase', 'Weeze', 'preis_gruppe', 'C_Transporter'
));

-- Nr. 15: Citroen Jumper (Transporter), GEL PL 17
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Citroen Jumper', 'Fahrzeug', true, jsonb_build_object(
  'ahk', true, 'sitze', 3, 'kennzeichen', 'GEL-PL-17',
  'standort', 'Goch', 'homebase', 'Goch', 'preis_gruppe', 'C_Transporter'
));

-- Nr. 16: Fiat Scudo, KLE PL 317
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Fiat Scudo', 'Fahrzeug', true, jsonb_build_object(
  'ahk', true, 'sitze', 3, 'kennzeichen', 'KLE-PL-317',
  'hauptuntersuchung', '2025-08-01',
  'standort', 'Weeze', 'homebase', 'Weeze', 'preis_gruppe', 'C_Transporter'
));

-- Nr. 17: Ford Transit, KLE PL 17
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Ford Transit', 'Fahrzeug', true, jsonb_build_object(
  'ahk', true, 'sitze', 3, 'kennzeichen', 'KLE-PL-17',
  'hauptuntersuchung', '2023-04-01',
  'standort', 'Weeze', 'homebase', 'Weeze', 'preis_gruppe', 'C_Transporter'
));

-- Nr. 18: Citroen Jumper, KLE PL 227
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Citroen Jumper', 'Fahrzeug', true, jsonb_build_object(
  'ahk', false, 'sitze', 3, 'kennzeichen', 'KLE-PL-227',
  'hauptuntersuchung', '2022-07-01',
  'standort', 'Kranenburg', 'homebase', 'Kranenburg', 'preis_gruppe', 'C_Transporter'
));

-- Nr. 19: Citroen Jumper, GEL PL 327
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Citroen Jumper', 'Fahrzeug', true, jsonb_build_object(
  'ahk', true, 'sitze', 3, 'kennzeichen', 'GEL-PL-327',
  'hauptuntersuchung', '2022-05-01',
  'standort', 'Kalkar', 'homebase', 'Kalkar', 'preis_gruppe', 'C_Transporter'
));

-- Nr. 20: Citroen Jumper (2-Sitzer), GEL PL 227
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Citroen Jumper', 'Fahrzeug', true, jsonb_build_object(
  'ahk', true, 'sitze', 2, 'kennzeichen', 'GEL-PL-227',
  'hauptuntersuchung', '2023-05-01',
  'standort', 'Kranenburg', 'homebase', 'Weeze', 'preis_gruppe', 'C_Transporter'
));

-- Nr. 21: Citroen Jumper, KLE PL 627
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Citroen Jumper', 'Fahrzeug', true, jsonb_build_object(
  'ahk', true, 'sitze', 3, 'kennzeichen', 'KLE-PL-627',
  'hauptuntersuchung', '2023-05-01',
  'standort', 'Alpen', 'homebase', 'Weeze', 'preis_gruppe', 'C_Transporter'
));

-- Nr. 22: Citroen Jumper, KLE PL 427
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Citroen Jumper', 'Fahrzeug', true, jsonb_build_object(
  'ahk', true, 'sitze', 3, 'kennzeichen', 'KLE-PL-427',
  'standort', 'Uedem', 'homebase', 'Uedem', 'preis_gruppe', 'C_Transporter'
));

-- Nr. 23: Fiat Ducato, KLE PL 547
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Fiat Ducato', 'Fahrzeug', true, jsonb_build_object(
  'ahk', false, 'sitze', 3, 'kennzeichen', 'KLE-PL-547',
  'hauptuntersuchung', '2021-12-01',
  'standort', 'Kalkar', 'homebase', 'Weeze', 'preis_gruppe', 'C_Transporter'
));

-- Nr. 24: Citroen Jumper, KLE PL 247
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Citroen Jumper', 'Fahrzeug', true, jsonb_build_object(
  'ahk', true, 'sitze', 3, 'kennzeichen', 'KLE-PL-247',
  'hauptuntersuchung', '2023-01-01',
  'standort', 'Goch', 'homebase', 'Goch', 'preis_gruppe', 'C_Transporter'
));

-- Nr. 25: Citroen Jumper, KLE PL 347
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Citroen Jumper', 'Fahrzeug', true, jsonb_build_object(
  'ahk', true, 'sitze', 3, 'kennzeichen', 'KLE-PL-347',
  'hauptuntersuchung', '2023-08-01',
  'standort', 'Weeze', 'homebase', 'Kevelaer', 'preis_gruppe', 'C_Transporter'
));

-- Nr. 26: Citroen Jumper LBW, KLE PL 407
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Citroen Jumper LBW', 'Fahrzeug mit Ladeboxwagen', true, jsonb_build_object(
  'ahk', true, 'sitze', 3, 'kennzeichen', 'KLE-PL-407',
  'hauptuntersuchung', '2024-09-01',
  'standort', 'Weeze', 'homebase', 'Weeze', 'preis_gruppe', 'C_Transporter'
));

-- Nr. 27: Transit LKW 3,5t, GEL PL 437
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Ford Transit LKW 3,5t', 'Fahrzeug', true, jsonb_build_object(
  'ahk', false, 'sitze', 3, 'kennzeichen', 'GEL-PL-437',
  'hauptuntersuchung', '2023-06-01',
  'standort', 'Weeze', 'homebase', 'Weeze', 'preis_gruppe', 'B_LKW'
));

-- Nr. 28: Transit LKW 3,5t, KLE PL 447
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Ford Transit LKW 3,5t', 'Fahrzeug', true, jsonb_build_object(
  'ahk', false, 'sitze', 3, 'kennzeichen', 'KLE-PL-447',
  'hauptuntersuchung', '2022-08-01',
  'standort', 'Kranenburg', 'homebase', 'Kranenburg', 'preis_gruppe', 'B_LKW'
));

-- Nr. 29: Iveco 7,5t, KLE PL 357
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Iveco 7,5t', 'Fahrzeug', true, jsonb_build_object(
  'ahk', false, 'sitze', 3, 'kennzeichen', 'KLE-PL-357',
  'hauptuntersuchung', '2022-06-01',
  'standort', 'Goch', 'homebase', 'Goch', 'preis_gruppe', 'A_LKW'
));

-- Nr. 30: MAN 7,5t, KLE PL 557
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'MAN 7,5t', 'Fahrzeug', true, jsonb_build_object(
  'ahk', 'Maul', 'sitze', 3, 'kennzeichen', 'KLE-PL-557',
  'standort', 'Kranenburg', 'homebase', 'Kranenburg', 'preis_gruppe', 'A_LKW'
));

-- Nr. 31: MAN 7,5t, KLE PL 457
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'MAN 7,5t', 'Fahrzeug', true, jsonb_build_object(
  'ahk', 'Maul', 'sitze', 3, 'kennzeichen', 'KLE-PL-457',
  'standort', 'Kalkar', 'homebase', 'Weeze', 'preis_gruppe', 'A_LKW'
));

-- Nr. 32: MAN 7,5t, KLE PL 657
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'MAN 7,5t', 'Fahrzeug', true, jsonb_build_object(
  'ahk', 'Beide', 'sitze', 3, 'kennzeichen', 'KLE-PL-657',
  'standort', 'Weeze', 'homebase', 'Weeze', 'preis_gruppe', 'A_LKW'
));

-- ===== ANHÄNGER (33-48) =====

-- Nr. 33: Kofferanhänger Weeze, KLE PL 527
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Kofferanhänger Weeze', 'Anhänger', true, jsonb_build_object(
  'kennzeichen', 'KLE-PL-527',
  'hauptuntersuchung', '2024-03-01',
  'standort', 'Weeze', 'homebase', 'Weeze', 'preis_gruppe', 'A_Anhaenger'
));

-- Nr. 34: Pferdeanhänger
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Pferdeanhänger', 'Anhänger', true, jsonb_build_object(
  'standort', 'Weeze', 'homebase', 'Weeze', 'preis_gruppe', 'A_Anhaenger'
));

-- Nr. 35: Planenanhänger Weeze, GEL PL 507
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Planenanhänger Weeze', 'Anhänger', true, jsonb_build_object(
  'kennzeichen', 'GEL-PL-507',
  'hauptuntersuchung', '2024-09-01',
  'standort', 'Weeze', 'homebase', 'Weeze', 'preis_gruppe', 'A_Anhaenger'
));

-- Nr. 36: Große Plane Alpen, GEL PL 527
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Große Plane Alpen', 'Anhänger', true, jsonb_build_object(
  'kennzeichen', 'GEL-PL-527',
  'standort', 'Alpen', 'homebase', 'Alpen', 'preis_gruppe', 'A_Anhaenger'
));

-- Nr. 37: Kofferanhänger Kevelaer, KLE PL 517
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Kofferanhänger Kevelaer', 'Anhänger', true, jsonb_build_object(
  'kennzeichen', 'KLE-PL-517',
  'hauptuntersuchung', '2021-12-01',
  'standort', 'Kevelaer', 'homebase', 'Kevelaer', 'preis_gruppe', 'A_Anhaenger'
));

-- Nr. 38: Planenanhänger Kevelaer, KLE PL 507
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Planenanhänger Kevelaer', 'Anhänger', true, jsonb_build_object(
  'kennzeichen', 'KLE-PL-507',
  'hauptuntersuchung', '2024-04-01',
  'standort', 'Kevelaer', 'homebase', 'Kevelaer', 'preis_gruppe', 'A_Anhaenger'
));

-- Nr. 39: Offene Pritsche, KLE PL 537
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Offene Pritsche', 'Anhänger', true, jsonb_build_object(
  'kennzeichen', 'KLE-PL-537',
  'hauptuntersuchung', '2023-03-01',
  'standort', 'Weeze', 'homebase', 'Weeze', 'preis_gruppe', 'A_Anhaenger'
));

-- Nr. 40: Plane Goch, KLE PL 508
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Plane Goch', 'Anhänger', true, jsonb_build_object(
  'kennzeichen', 'KLE-PL-508',
  'standort', 'Goch', 'homebase', 'Goch', 'preis_gruppe', 'A_Anhaenger'
));

-- Nr. 41: Kofferanhänger Kalkar, KLE PL 587
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Kofferanhänger Kalkar', 'Anhänger', true, jsonb_build_object(
  'kennzeichen', 'KLE-PL-587',
  'hauptuntersuchung', '2023-07-01',
  'standort', 'Kalkar', 'homebase', 'Goch', 'preis_gruppe', 'A_Anhaenger'
));

-- Nr. 42: Große Plane Goch, KLE PL 577
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Große Plane Goch', 'Anhänger', true, jsonb_build_object(
  'kennzeichen', 'KLE-PL-577',
  'hauptuntersuchung', '2022-09-01',
  'standort', 'Goch', 'homebase', 'Goch', 'preis_gruppe', 'A_Anhaenger'
));

-- Nr. 43: Planenanhänger Uedem, KLE PL 500
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Planenanhänger Uedem', 'Anhänger', true, jsonb_build_object(
  'kennzeichen', 'KLE-PL-500',
  'standort', 'Uedem', 'homebase', 'Uedem', 'preis_gruppe', 'A_Anhaenger'
));

-- Nr. 44: Planenanhänger Kranenburg, KLE PL 506
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Planenanhänger Kranenburg', 'Anhänger', true, jsonb_build_object(
  'kennzeichen', 'KLE-PL-506',
  'hauptuntersuchung', '2023-03-01',
  'standort', 'Kranenburg', 'homebase', 'Kranenburg', 'preis_gruppe', 'A_Anhaenger'
));

-- Nr. 45: Autotrailer Xanten, KLE PL 504
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Autotrailer Xanten', 'Anhänger', true, jsonb_build_object(
  'kennzeichen', 'KLE-PL-504',
  'hauptuntersuchung', '2022-10-01',
  'standort', 'Xanten', 'homebase', 'Xanten', 'preis_gruppe', 'A_Anhaenger'
));

-- Nr. 46: Autotrailer Hochlader, KLE PL 605
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Autotrailer Hochlader', 'Anhänger', true, jsonb_build_object(
  'kennzeichen', 'KLE-PL-605',
  'hauptuntersuchung', '2023-03-01',
  'standort', 'Goch', 'homebase', 'Goch', 'preis_gruppe', 'A_Anhaenger'
));

-- Nr. 47: Autotrailer, KLE PL 503
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Autotrailer Kranenburg', 'Anhänger', true, jsonb_build_object(
  'kennzeichen', 'KLE-PL-503',
  'standort', 'Kranenburg', 'homebase', 'Kranenburg', 'preis_gruppe', 'A_Anhaenger'
));

-- Nr. 48: Autotrailer, KLE PL 505
INSERT INTO public.resources (company_id, name, description, is_active, metadata)
VALUES (cid, 'Autotrailer Kevelaer', 'Anhänger', true, jsonb_build_object(
  'kennzeichen', 'KLE-PL-505',
  'standort', 'Kevelaer', 'homebase', 'Kevelaer', 'preis_gruppe', 'A_Anhaenger'
));

END $$;
