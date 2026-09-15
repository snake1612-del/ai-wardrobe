-- Controlled, language-neutral reference vocabulary only. No user data or fixtures.
insert into public.categories (code, label_ru, sort_order)
values
  ('top', 'Верх', 10),
  ('bottom', 'Низ', 20),
  ('one_piece', 'Цельная вещь', 30),
  ('outerwear', 'Верхняя одежда', 40),
  ('shoes', 'Обувь', 50),
  ('accessory', 'Аксессуар', 60)
on conflict (code) do nothing;

insert into public.colors (code, label_ru, hex_hint)
values
  ('black', 'Чёрный', '#151617'),
  ('white', 'Белый', '#FFFFFF'),
  ('gray', 'Серый', '#85817A'),
  ('blue', 'Синий', '#3568A8'),
  ('brown', 'Коричневый', '#795548'),
  ('green', 'Зелёный', '#4F7755'),
  ('red', 'Красный', '#A94040'),
  ('multicolor', 'Многоцветный', null)
on conflict (code) do nothing;

insert into public.seasons (code, label_ru, sort_order)
values
  ('spring', 'Весна', 10),
  ('summer', 'Лето', 20),
  ('autumn', 'Осень', 30),
  ('winter', 'Зима', 40),
  ('all_season', 'Всесезонно', 50)
on conflict (code) do nothing;
