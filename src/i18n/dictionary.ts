export const supportedLocales = ["ru", "en"] as const;
export type Locale = (typeof supportedLocales)[number];

type Translation = Readonly<Record<Locale, string>>;

export const dictionary: Readonly<Record<string, Translation>> = {
  "AI Wardrobe": { ru: "AI Wardrobe", en: "AI Wardrobe" },
  Русский: { ru: "Русский", en: "Russian" },
  Английский: { ru: "Английский", en: "English" },
  "Язык интерфейса": { ru: "Язык интерфейса", en: "Interface language" },
  "Переключаем язык…": { ru: "Переключаем язык…", en: "Switching language…" },
  "Не удалось сохранить язык. Попробуйте ещё раз.": {
    ru: "Не удалось сохранить язык. Попробуйте ещё раз.",
    en: "Could not save the language. Try again.",
  },
  "Перейти к содержимому": { ru: "Перейти к содержимому", en: "Skip to content" },
  Загрузка: { ru: "Загрузка", en: "Loading" },
  "Страница не найдена": { ru: "Страница не найдена", en: "Page not found" },
  "Проверьте адрес или вернитесь на стартовую страницу.": {
    ru: "Проверьте адрес или вернитесь на стартовую страницу.",
    en: "Check the address or return to the home page.",
  },
  "На главную": { ru: "На главную", en: "Go home" },
  Повторить: { ru: "Повторить", en: "Try again" },
  "Не удалось загрузить страницу": {
    ru: "Не удалось загрузить страницу",
    en: "Could not load the page",
  },
  "Попробуйте ещё раз. Технические детали не показываются и не содержат пользовательские данные.": {
    ru: "Попробуйте ещё раз. Технические детали не показываются и не содержат пользовательские данные.",
    en: "Try again. Technical details are hidden and contain no user data.",
  },
  "Приватный гардероб": { ru: "Приватный гардероб", en: "Private wardrobe" },
  "Храните вещи, приватные изображения и подготовленные импорты в изолированном аккаунте.": {
    ru: "Храните вещи, приватные изображения и подготовленные импорты в изолированном аккаунте.",
    en: "Keep wardrobe items, private images, and prepared imports in an isolated account.",
  },
  "Войти или создать аккаунт": {
    ru: "Войти или создать аккаунт",
    en: "Sign in or create an account",
  },
  Возможности: { ru: "Возможности", en: "Available" },
  "Гардероб, приватные изображения и массовый импорт": {
    ru: "Гардероб, приватные изображения и массовый импорт",
    en: "Wardrobe, private images, and bulk import",
  },
  Данные: { ru: "Данные", en: "Data" },
  "Приватно для каждого аккаунта": {
    ru: "Приватно для каждого аккаунта",
    en: "Private to each account",
  },
  "Ваш приватный гардероб": { ru: "Ваш приватный гардероб", en: "Your private wardrobe" },
  "Войдите или создайте аккаунт. Данные каждого аккаунта изолированы.": {
    ru: "Войдите или создайте аккаунт. Данные каждого аккаунта изолированы.",
    en: "Sign in or create an account. Every account is isolated.",
  },
  Войти: { ru: "Войти", en: "Sign in" },
  "Входим…": { ru: "Входим…", en: "Signing in…" },
  "Создать аккаунт": { ru: "Создать аккаунт", en: "Create account" },
  "Создаём…": { ru: "Создаём…", en: "Creating…" },
  Пароль: { ru: "Пароль", en: "Password" },
  "Забыли пароль?": { ru: "Забыли пароль?", en: "Forgot your password?" },
  "Уже есть аккаунт? Войти": {
    ru: "Уже есть аккаунт? Войти",
    en: "Already have an account? Sign in",
  },
  "Подтвердите пароль": { ru: "Подтвердите пароль", en: "Confirm password" },
  "Подтвердите новый пароль": {
    ru: "Подтвердите новый пароль",
    en: "Confirm new password",
  },
  "От 8 до 128 символов и минимум одна латинская буква.": {
    ru: "От 8 до 128 символов и минимум одна латинская буква.",
    en: "8 to 128 characters with at least one Latin letter.",
  },
  "Пароль должен содержать от 8 до 128 символов.": {
    ru: "Пароль должен содержать от 8 до 128 символов.",
    en: "The password must contain 8 to 128 characters.",
  },
  "Пароль должен содержать минимум одну латинскую букву.": {
    ru: "Пароль должен содержать минимум одну латинскую букву.",
    en: "The password must contain at least one Latin letter.",
  },
  "Пароли не совпадают.": {
    ru: "Пароли не совпадают.",
    en: "The passwords do not match.",
  },
  "Восстановить доступ": { ru: "Восстановить доступ", en: "Recover access" },
  "Ответ одинаков для существующих и неизвестных адресов.": {
    ru: "Ответ одинаков для существующих и неизвестных адресов.",
    en: "The response is the same for known and unknown addresses.",
  },
  "Отправляем…": { ru: "Отправляем…", en: "Sending…" },
  "Отправить ссылку": { ru: "Отправить ссылку", en: "Send link" },
  "Вернуться ко входу": { ru: "Вернуться ко входу", en: "Back to sign in" },
  "Новый пароль": { ru: "Новый пароль", en: "New password" },
  "Обновите пароль для подтверждённой сессии восстановления.": {
    ru: "Обновите пароль для подтверждённой сессии восстановления.",
    en: "Update the password for the verified recovery session.",
  },
  "Сохраняем…": { ru: "Сохраняем…", en: "Saving…" },
  "Сохранить пароль": { ru: "Сохранить пароль", en: "Save password" },
  "Вы вышли из аккаунта.": { ru: "Вы вышли из аккаунта.", en: "You signed out." },
  "Ссылка для входа некорректна.": {
    ru: "Ссылка для входа некорректна.",
    en: "The sign-in link is invalid.",
  },
  "Ссылка устарела или уже использована.": {
    ru: "Ссылка устарела или уже использована.",
    en: "The link expired or was already used.",
  },
  "Не удалось подтвердить сессию.": {
    ru: "Не удалось подтвердить сессию.",
    en: "Could not verify the session.",
  },
  "Аккаунт временно недоступен.": {
    ru: "Аккаунт временно недоступен.",
    en: "The account is temporarily unavailable.",
  },
  "Не удалось подтвердить источник запроса.": {
    ru: "Не удалось подтвердить источник запроса.",
    en: "Could not verify the request origin.",
  },
  "Не удалось завершить сессию. Вернитесь в приложение и повторите попытку.": {
    ru: "Не удалось завершить сессию. Вернитесь в приложение и повторите попытку.",
    en: "Could not end the session. Return to the app and try again.",
  },
  "Защищённая сессия": { ru: "Защищённая сессия", en: "Protected session" },
  "Ваш приватный каталог готов к работе.": {
    ru: "Ваш приватный каталог готов к работе.",
    en: "Your private catalog is ready.",
  },
  "Email недоступен": { ru: "Email недоступен", en: "Email unavailable" },
  "Открыть гардероб": { ru: "Открыть гардероб", en: "Open wardrobe" },
  "Bulk Import": { ru: "Массовый импорт", en: "Bulk Import" },
  "Личный аккаунт": { ru: "Личный аккаунт", en: "Personal account" },
  Выйти: { ru: "Выйти", en: "Sign out" },
  "Выходим…": { ru: "Выходим…", en: "Signing out…" },
  "Подготавливаем приватную сессию…": {
    ru: "Подготавливаем приватную сессию…",
    en: "Preparing the private session…",
  },
  "Аккаунт временно недоступен": {
    ru: "Аккаунт временно недоступен",
    en: "Account temporarily unavailable",
  },
  "Повторите попытку позже. Приватные данные не загружались.": {
    ru: "Повторите попытку позже. Приватные данные не загружались.",
    en: "Try again later. No private data was loaded.",
  },
  "Не удалось загрузить профиль": {
    ru: "Не удалось загрузить профиль",
    en: "Could not load profile",
  },
  "Повторите попытку. Данные аккаунта не изменялись.": {
    ru: "Повторите попытку. Данные аккаунта не изменялись.",
    en: "Try again. Account data was not changed.",
  },
  "Профиль временно недоступен": {
    ru: "Профиль временно недоступен",
    en: "Profile temporarily unavailable",
  },
  "Повторите попытку позже. Данные аккаунта не изменялись.": {
    ru: "Повторите попытку позже. Данные аккаунта не изменялись.",
    en: "Try again later. Account data was not changed.",
  },
  "← Назад": { ru: "← Назад", en: "← Back" },
  "Управляйте именем, email и паролем текущего аккаунта.": {
    ru: "Управляйте именем, email и паролем текущего аккаунта.",
    en: "Manage the name, email, and password of the current account.",
  },
  Профиль: { ru: "Профиль", en: "Profile" },
  "Загружаем профиль…": { ru: "Загружаем профиль…", en: "Loading profile…" },
  "Отображаемое имя": { ru: "Отображаемое имя", en: "Display name" },
  "Сохранить имя": { ru: "Сохранить имя", en: "Save name" },
  "Текущий email:": { ru: "Текущий email:", en: "Current email:" },
  недоступен: { ru: "недоступен", en: "unavailable" },
  "Новый email": { ru: "Новый email", en: "New email" },
  "Адрес изменится только после подтверждения, если подтверждение включено в Auth.": {
    ru: "Адрес изменится только после подтверждения, если подтверждение включено в Auth.",
    en: "The address changes only after confirmation when Auth confirmation is enabled.",
  },
  "Изменить email": { ru: "Изменить email", en: "Change email" },
  "Текущий пароль": { ru: "Текущий пароль", en: "Current password" },
  "Повторите новый пароль": { ru: "Повторите новый пароль", en: "Repeat new password" },
  "Изменить пароль": { ru: "Изменить пароль", en: "Change password" },
  "Меняем…": { ru: "Меняем…", en: "Changing…" },
  "Отображаемое имя сохранено.": { ru: "Отображаемое имя сохранено.", en: "Display name saved." },
  "Профиль изменился в другой вкладке. Обновите страницу.": {
    ru: "Профиль изменился в другой вкладке. Обновите страницу.",
    en: "The profile changed in another tab. Reload the page.",
  },
  "Проверьте отображаемое имя.": {
    ru: "Проверьте отображаемое имя.",
    en: "Check the display name.",
  },
  "Не удалось сохранить профиль. Попробуйте ещё раз.": {
    ru: "Не удалось сохранить профиль. Попробуйте ещё раз.",
    en: "Could not save the profile. Try again.",
  },
  "Укажите новый email.": { ru: "Укажите новый email.", en: "Enter a new email address." },
  "Не удалось отправить подтверждение. Проверьте email и попробуйте ещё раз.": {
    ru: "Не удалось отправить подтверждение. Проверьте email и попробуйте ещё раз.",
    en: "Could not send confirmation. Check the email and try again.",
  },
  "Email изменён.": { ru: "Email изменён.", en: "Email changed." },
  "Запрос принят. Подтвердите новый адрес по письму; до подтверждения действует текущий email.": {
    ru: "Запрос принят. Подтвердите новый адрес по письму; до подтверждения действует текущий email.",
    en: "Request accepted. Confirm the new address by email; the current email remains active until then.",
  },
  "Текущий пароль указан неверно.": {
    ru: "Текущий пароль указан неверно.",
    en: "The current password is incorrect.",
  },
  "Не удалось сменить пароль. Проверьте текущий пароль и повторите попытку.": {
    ru: "Не удалось сменить пароль. Проверьте текущий пароль и повторите попытку.",
    en: "Could not change the password. Check the current password and try again.",
  },
  "Пароль изменён. Новый пароль будет использоваться при следующем входе.": {
    ru: "Пароль изменён. Новый пароль будет использоваться при следующем входе.",
    en: "Password changed. The new password will be used at the next sign-in.",
  },
  "Проверьте email и пароль и попробуйте ещё раз.": {
    ru: "Проверьте email и пароль и попробуйте ещё раз.",
    en: "Check the email and password and try again.",
  },
  "Сервис входа временно недоступен. Попробуйте ещё раз.": {
    ru: "Сервис входа временно недоступен. Попробуйте ещё раз.",
    en: "The sign-in service is temporarily unavailable. Try again.",
  },
  "Если адрес можно использовать, письмо для продолжения уже отправлено.": {
    ru: "Если адрес можно использовать, письмо для продолжения уже отправлено.",
    en: "If the address can be used, a continuation email has been sent.",
  },
  "Если аккаунт существует, письмо для восстановления уже отправлено.": {
    ru: "Если аккаунт существует, письмо для восстановления уже отправлено.",
    en: "If the account exists, a recovery email has been sent.",
  },
  "Введите корректный email.": { ru: "Введите корректный email.", en: "Enter a valid email." },
  "Пароль должен содержать от 10 до 128 символов.": {
    ru: "Пароль должен содержать от 10 до 128 символов.",
    en: "The password must contain 10 to 128 characters.",
  },
  "Сессия устарела.": { ru: "Сессия устарела.", en: "The session expired." },
  "Сессия устарела или запрос не прошёл проверку origin.": {
    ru: "Сессия устарела или запрос не прошёл проверку origin.",
    en: "The session expired or the request origin could not be verified.",
  },
  "Обновите страницу и повторите попытку.": {
    ru: "Обновите страницу и повторите попытку.",
    en: "Reload the page and try again.",
  },
  Гардероб: { ru: "Гардероб", en: "Wardrobe" },
  "Гардероб не загрузился": { ru: "Гардероб не загрузился", en: "Wardrobe could not load" },
  "Приватные данные не были показаны. Попробуйте запрос ещё раз.": {
    ru: "Приватные данные не были показаны. Попробуйте запрос ещё раз.",
    en: "Private data was not shown. Try the request again.",
  },
  "Загружаем приватный гардероб…": {
    ru: "Загружаем приватный гардероб…",
    en: "Loading private wardrobe…",
  },
  "← К гардеробу": { ru: "← К гардеробу", en: "← Back to wardrobe" },
  "← К карточке": { ru: "← К карточке", en: "← Back to item" },
  "← К результатам": { ru: "← К результатам", en: "← Back to results" },
  "Новая вещь": { ru: "Новая вещь", en: "New item" },
  "Редактировать вещь": { ru: "Редактировать вещь", en: "Edit item" },
  "Сначала сохраните минимум, остальное можно заполнить позже.": {
    ru: "Сначала сохраните минимум, остальное можно заполнить позже.",
    en: "Save the minimum first; you can add the rest later.",
  },
  "Версия {version}. При конфликте данные не будут перезаписаны.": {
    ru: "Версия {version}. При конфликте данные не будут перезаписаны.",
    en: "Version {version}. Conflicting data will not be overwritten.",
  },
  "Вещь сохранена.": { ru: "Вещь сохранена.", en: "Item saved." },
  "Изменение не применено. Обновите страницу.": {
    ru: "Изменение не применено. Обновите страницу.",
    en: "The change was not applied. Reload the page.",
  },
  "Изображение не добавлено": { ru: "Изображение не добавлено", en: "No image added" },
  Черновик: { ru: "Черновик", en: "Draft" },
  "В архиве": { ru: "В архиве", en: "Archived" },
  "Активная вещь": { ru: "Активная вещь", en: "Active item" },
  "Без названия": { ru: "Без названия", en: "Untitled" },
  "Без категории": { ru: "Без категории", en: "Uncategorized" },
  Редактировать: { ru: "Редактировать", en: "Edit" },
  Цвета: { ru: "Цвета", en: "Colors" },
  Сезоны: { ru: "Сезоны", en: "Seasons" },
  Материал: { ru: "Материал", en: "Material" },
  Размер: { ru: "Размер", en: "Size" },
  "Не указаны": { ru: "Не указаны", en: "Not specified" },
  "Не указан": { ru: "Не указан", en: "Not specified" },
  "Приватная заметка": { ru: "Приватная заметка", en: "Private note" },
  "Варианты внешнего вида": { ru: "Варианты внешнего вида", en: "Appearance variants" },
  " · основной": { ru: " · основной", en: " · primary" },
  Восстановить: { ru: "Восстановить", en: "Restore" },
  "Убрать из избранного": { ru: "Убрать из избранного", en: "Remove from favorites" },
  "Добавить в избранное": { ru: "Добавить в избранное", en: "Add to favorites" },
  Архивировать: { ru: "Архивировать", en: "Archive" },
  Категория: { ru: "Категория", en: "Category" },
  Цвет: { ru: "Цвет", en: "Color" },
  Сезон: { ru: "Сезон", en: "Season" },
  "Тег / назначение / стиль": { ru: "Тег / назначение / стиль", en: "Tag / purpose / style" },
  Статус: { ru: "Статус", en: "Status" },
  Все: { ru: "Все", en: "All" },
  Активные: { ru: "Активные", en: "Active" },
  Архив: { ru: "Архив", en: "Archive" },
  "Только избранное": { ru: "Только избранное", en: "Favorites only" },
  Применить: { ru: "Применить", en: "Apply" },
  "Сбросить фильтры": { ru: "Сбросить фильтры", en: "Reset filters" },
  "Приватный каталог": { ru: "Приватный каталог", en: "Private catalog" },
  "Показано: {count}": { ru: "Показано: {count}", en: "Shown: {count}" },
  " · есть ещё": { ru: " · есть ещё", en: " · more available" },
  " · конец списка": { ru: " · конец списка", en: " · end of list" },
  "+ Добавить вещь": { ru: "+ Добавить вещь", en: "+ Add item" },
  "Архивирование «{name}» выполнено.": {
    ru: "Архивирование «{name}» выполнено.",
    en: "“{name}” was archived.",
  },
  вещь: { ru: "вещь", en: "item" },
  "Отменить архивирование": { ru: "Отменить архивирование", en: "Undo archive" },
  "Изменение не применено: обновите страницу и повторите.": {
    ru: "Изменение не применено: обновите страницу и повторите.",
    en: "The change was not applied: reload the page and try again.",
  },
  "Поиск по гардеробу": { ru: "Поиск по гардеробу", en: "Search wardrobe" },
  "Поиск по названию, бренду, заметкам и тегам": {
    ru: "Поиск по названию, бренду, заметкам и тегам",
    en: "Search by name, brand, notes, and tags",
  },
  Найти: { ru: "Найти", en: "Search" },
  "Фильтры гардероба": { ru: "Фильтры гардероба", en: "Wardrobe filters" },
  "Вещи гардероба": { ru: "Вещи гардероба", en: "Wardrobe items" },
  "Ничего не найдено": { ru: "Ничего не найдено", en: "Nothing found" },
  "Гардероб пока пуст": { ru: "Гардероб пока пуст", en: "Wardrobe is empty" },
  "Измените запрос или сбросьте один из фильтров.": {
    ru: "Измените запрос или сбросьте один из фильтров.",
    en: "Change the query or reset a filter.",
  },
  "Добавьте первую физическую вещь — изображение можно подключить позже.": {
    ru: "Добавьте первую физическую вещь — изображение можно подключить позже.",
    en: "Add your first physical item; you can attach an image later.",
  },
  "Добавить вещь": { ru: "Добавить вещь", en: "Add item" },
  "Без изображения": { ru: "Без изображения", en: "No image" },
  "★ Избранное": { ru: "★ Избранное", en: "★ Favorite" },
  "Черновик без названия": { ru: "Черновик без названия", en: "Untitled draft" },
  "Теги не заданы": { ru: "Теги не заданы", en: "No tags" },
  "Убрать {name} из избранного": {
    ru: "Убрать {name} из избранного",
    en: "Remove {name} from favorites",
  },
  "Добавить {name} в избранное": {
    ru: "Добавить {name} в избранное",
    en: "Add {name} to favorites",
  },
  "★ В избранном": { ru: "★ В избранном", en: "★ Favorited" },
  "☆ В избранное": { ru: "☆ В избранное", en: "☆ Add to favorites" },
  "Показать ещё": { ru: "Показать ещё", en: "Show more" },
  "Достигнут безопасный предел выдачи. Уточните поиск или фильтры.": {
    ru: "Достигнут безопасный предел выдачи. Уточните поиск или фильтры.",
    en: "The safe result limit was reached. Refine the search or filters.",
  },
  Фильтры: { ru: "Фильтры", en: "Filters" },
  Закрыть: { ru: "Закрыть", en: "Close" },
  Основное: { ru: "Основное", en: "Basics" },
  "Название вещи": { ru: "Название вещи", en: "Item name" },
  "Категория / подкатегория": { ru: "Категория / подкатегория", en: "Category / subcategory" },
  Бренд: { ru: "Бренд", en: "Brand" },
  Артикул: { ru: "Артикул", en: "Reference code" },
  Узор: { ru: "Узор", en: "Pattern" },
  Описание: { ru: "Описание", en: "Description" },
  "Приватные заметки": { ru: "Приватные заметки", en: "Private notes" },
  Организация: { ru: "Организация", en: "Organization" },
  Назначение: { ru: "Назначение", en: "Purpose" },
  Стиль: { ru: "Стиль", en: "Style" },
  "Свои теги": { ru: "Свои теги", en: "Custom tags" },
  "Работа, спорт": { ru: "Работа, спорт", en: "Work, sport" },
  Повседневный: { ru: "Повседневный", en: "Casual" },
  "Любимое, отпуск": { ru: "Любимое, отпуск", en: "Favorite, vacation" },
  "Синяя сторона, узорная сторона": {
    ru: "Синяя сторона, узорная сторона",
    en: "Blue side, patterned side",
  },
  "Только реальные состояния одной физической вещи, через запятую.": {
    ru: "Только реальные состояния одной физической вещи, через запятую.",
    en: "Only real states of one physical item, separated by commas.",
  },
  "Сохранить вещь": { ru: "Сохранить вещь", en: "Save item" },
  "Сохранить черновик": { ru: "Сохранить черновик", en: "Save draft" },
  Изображения: { ru: "Изображения", en: "Images" },
  "Приватные оригиналы проверяются до публикации.": {
    ru: "Приватные оригиналы проверяются до публикации.",
    en: "Private originals are validated before publication.",
  },
  "Добавить изображение": { ru: "Добавить изображение", en: "Add image" },
  Ракурс: { ru: "Ракурс", en: "View" },
  unspecified: { ru: "Не указан", en: "Unspecified" },
  Спереди: { ru: "Спереди", en: "Front" },
  Сзади: { ru: "Сзади", en: "Back" },
  Сбоку: { ru: "Сбоку", en: "Side" },
  Деталь: { ru: "Деталь", en: "Detail" },
  "Внешний вид": { ru: "Внешний вид", en: "Appearance" },
  "Общий для вещи": { ru: "Общий для вещи", en: "Shared by the item" },
  Заменить: { ru: "Заменить", en: "Replace" },
  "Добавить новое": { ru: "Добавить новое", en: "Add new" },
  "Загрузка: {progress}%": { ru: "Загрузка: {progress}%", en: "Upload: {progress}%" },
  Отменить: { ru: "Отменить", en: "Cancel" },
  "Проверяем загруженный объект…": {
    ru: "Проверяем загруженный объект…",
    en: "Validating uploaded object…",
  },
  "Файл загружен. Обработка выполняется в приватной очереди.": {
    ru: "Файл загружен. Обработка выполняется в приватной очереди.",
    en: "File uploaded. Processing is running in a private queue.",
  },
  "Галерея вещи": { ru: "Галерея вещи", en: "Item gallery" },
  "Изображение вещи": { ru: "Изображение вещи", en: "Item image" },
  "Ракурс: {view}": { ru: "Ракурс: {view}", en: "View: {view}" },
  ", основное": { ru: ", основное", en: ", primary" },
  Раньше: { ru: "Раньше", en: "Earlier" },
  Позже: { ru: "Позже", en: "Later" },
  "Сделать основным": { ru: "Сделать основным", en: "Make primary" },
  Убрать: { ru: "Убрать", en: "Remove" },
  "Изображений пока нет.": { ru: "Изображений пока нет.", en: "No images yet." },
  "Операция не выполнена.": { ru: "Операция не выполнена.", en: "The operation failed." },
  "Поддерживаются только JPEG, PNG и WebP. HEIC/HEIF, SVG, GIF, AVIF и PDF отклоняются.": {
    ru: "Поддерживаются только JPEG, PNG и WebP. HEIC/HEIF, SVG, GIF, AVIF и PDF отклоняются.",
    en: "Only JPEG, PNG, and WebP are supported. HEIC/HEIF, SVG, GIF, AVIF, and PDF are rejected.",
  },
  "Файл должен быть не больше 16 МиБ.": {
    ru: "Файл должен быть не больше 16 МиБ.",
    en: "The file must not exceed 16 MiB.",
  },
  "Не удалось подготовить загрузку.": {
    ru: "Не удалось подготовить загрузку.",
    en: "Could not prepare the upload.",
  },
  "Сессия устарела. Войдите снова.": {
    ru: "Сессия устарела. Войдите снова.",
    en: "The session expired. Sign in again.",
  },
  "Загрузка не выполнена.": { ru: "Загрузка не выполнена.", en: "Upload failed." },
  "Конфликт галереи.": { ru: "Конфликт галереи.", en: "Gallery conflict." },
  "Удаление не выполнено.": { ru: "Удаление не выполнено.", en: "Removal failed." },
  "Повтор не выполнен.": { ru: "Повтор не выполнен.", en: "Retry failed." },
  "Ожидает загрузки": { ru: "Ожидает загрузки", en: "Waiting for upload" },
  Проверяется: { ru: "Проверяется", en: "Validating" },
  Обрабатывается: { ru: "Обрабатывается", en: "Processing" },
  Готово: { ru: "Готово", en: "Ready" },
  "Изолировано после проверки": {
    ru: "Изолировано после проверки",
    en: "Quarantined after validation",
  },
  "Обработка не выполнена": { ru: "Обработка не выполнена", en: "Processing failed" },
  "Приватный цифровой гардероб.": {
    ru: "Приватный цифровой гардероб.",
    en: "Private digital wardrobe.",
  },
  Импорт: { ru: "Импорт", en: "Import" },
  "Приватный импорт": { ru: "Приватный импорт", en: "Private import" },
  "Загрузите ZIP с JPEG/PNG. После безопасной обработки проверьте изображения и вручную выберите действие для каждой группы.":
    {
      ru: "Загрузите ZIP с JPEG/PNG. После безопасной обработки проверьте изображения и вручную выберите действие для каждой группы.",
      en: "Upload a ZIP with JPEG/PNG images. After safe processing, review the images and choose an action for each group.",
    },
  "Последние импорты": { ru: "Последние импорты", en: "Recent imports" },
  "Версия {version}": { ru: "Версия {version}", en: "Version {version}" },
  "Импортов пока нет.": { ru: "Импортов пока нет.", en: "No imports yet." },
  "Импорт не подготовлен.": { ru: "Импорт не подготовлен.", en: "Import was not prepared." },
  "Ответ загрузки неполный.": {
    ru: "Ответ загрузки неполный.",
    en: "The upload response is incomplete.",
  },
  "Не удалось передать архив. Повторите загрузку.": {
    ru: "Не удалось передать архив. Повторите загрузку.",
    en: "Could not upload the archive. Try the upload again.",
  },
  "Загрузка не подтверждена.": { ru: "Загрузка не подтверждена.", en: "Upload was not confirmed." },
  "Передача остановлена. Откройте импорт и повторите отмену.": {
    ru: "Передача остановлена. Откройте импорт и повторите отмену.",
    en: "Upload stopped. Open the import and try cancelling again.",
  },
  "Импорт отменён; staged data поставлены на cleanup.": {
    ru: "Импорт отменён; подготовленные данные поставлены на очистку.",
    en: "Import cancelled; staged data was queued for cleanup.",
  },
  "Выбор архива": { ru: "Выбор архива", en: "Choose archive" },
  "Выберите до четырёх ZIP с JPEG/PNG. До явного Confirm вещи не создаются.": {
    ru: "Выберите до четырёх ZIP с JPEG/PNG. До явного подтверждения вещи не создаются.",
    en: "Choose up to four ZIP files with JPEG/PNG images. No items are created before explicit confirmation.",
  },
  Архивы: { ru: "Архивы", en: "Archives" },
  "Выберите 1–4 ZIP общим размером не более 1 ГиБ.": {
    ru: "Выберите 1–4 ZIP общим размером не более 1 ГиБ.",
    en: "Choose 1–4 ZIP files with a combined size of no more than 1 GiB.",
  },
  "Выбрано архивов: {count}": { ru: "Выбрано архивов: {count}", en: "Archives selected: {count}" },
  "Архив {part}: {percent}%": { ru: "Архив {part}: {percent}%", en: "Archive {part}: {percent}%" },
  "Загружаем…": { ru: "Загружаем…", en: "Uploading…" },
  Загрузить: { ru: "Загрузить", en: "Upload" },
  Остановить: { ru: "Остановить", en: "Stop" },
  "Статус обработки временно недоступен.": {
    ru: "Статус обработки временно недоступен.",
    en: "Processing status is temporarily unavailable.",
  },
  "Не удалось проверить обработку. Проверьте соединение.": {
    ru: "Не удалось проверить обработку. Проверьте соединение.",
    en: "Could not check processing. Check your connection.",
  },
  "Сначала объедините группы, затем принимайте решения по изображениям.": {
    ru: "Сначала объедините группы, затем принимайте решения по изображениям.",
    en: "Group images first, then make image decisions.",
  },
  "Каждому изображению нужно явно выбрать действие.": {
    ru: "Каждому изображению нужно явно выбрать действие.",
    en: "Choose an action explicitly for every image.",
  },
  "Дождитесь готовности private previews для назначаемых изображений.": {
    ru: "Дождитесь готовности приватных превью для назначаемых изображений.",
    en: "Wait until private previews are ready for assigned images.",
  },
  "В одной группе изображения должны иметь одинаковое действие.": {
    ru: "В одной группе изображения должны иметь одинаковое действие.",
    en: "Images in one group must have the same action.",
  },
  "Решение для группы не завершено.": {
    ru: "Решение для группы не завершено.",
    en: "The group decision is incomplete.",
  },
  "Для каждого изображения выберите роль и ракурс.": {
    ru: "Для каждого изображения выберите роль и ракурс.",
    en: "Choose a role and view for every image.",
  },
  "Новая вещь требует название, категорию и явное состояние «Активна».": {
    ru: "Новая вещь требует название, категорию и явное состояние «Активна».",
    en: "A new item requires a name, category, and an explicit Active state.",
  },
  "Выберите доступную вещь текущего аккаунта.": {
    ru: "Выберите доступную вещь текущего аккаунта.",
    en: "Choose an available item from the current account.",
  },
  "Версия Resolve недоступна.": {
    ru: "Версия решения недоступна.",
    en: "The resolution version is unavailable.",
  },
  "Решения сохранены в staging. Sealed Preview ещё не построен.": {
    ru: "Решения сохранены. Подготовьте предпросмотр перед подтверждением.",
    en: "Decisions were saved. Prepare a preview before confirmation.",
  },
  "Resolve не выполнен.": { ru: "Решение не сохранено.", en: "Resolution failed." },
  "Preview запечатан. Confirm остаётся отдельным действием.": {
    ru: "Предпросмотр готов. Подтверждение остаётся отдельным действием.",
    en: "The preview is ready. Confirmation remains a separate action.",
  },
  "Предпросмотр не построен.": { ru: "Предпросмотр не построен.", en: "Preview was not built." },
  "Confirm принят. Production-записи создаются worker-ом с itemized результатом.": {
    ru: "Импорт подтверждён. Вещи создаются; результат будет показан для каждой записи.",
    en: "Import confirmed. Items are being created, with a result shown for each record.",
  },
  "Confirm не выполнен.": { ru: "Подтверждение не выполнено.", en: "Confirmation failed." },
  "Повтор поставлен в очередь; успешные записи не дублируются.": {
    ru: "Повтор поставлен в очередь; успешные записи не дублируются.",
    en: "Retry queued; successful records will not be duplicated.",
  },
  "Обработка повторно поставлена в очередь. Архив загружать заново не нужно.": {
    ru: "Обработка повторно поставлена в очередь. Архив загружать заново не нужно.",
    en: "Processing was queued again. The archive does not need to be uploaded again.",
  },
  "Повтор обработки недоступен.": {
    ru: "Повтор обработки недоступен.",
    en: "Processing retry is unavailable.",
  },
  "Изображение повторно поставлено на обработку.": {
    ru: "Изображение повторно поставлено на обработку.",
    en: "The image was queued for processing again.",
  },
  "Повтор изображения недоступен.": {
    ru: "Повтор изображения недоступен.",
    en: "Image retry is unavailable.",
  },
  "Импорт не отменён.": { ru: "Импорт не отменён.", en: "Import was not cancelled." },
  "Проверка → Решение → Предпросмотр → Подтверждение → Результаты": {
    ru: "Проверка → Решение → Предпросмотр → Подтверждение → Результаты",
    en: "Review → Decisions → Preview → Confirmation → Results",
  },
  "Файлы обозначены непрозрачными ссылками. Имя файла, порядок ZIP и hash не считаются identity вещи.":
    {
      ru: "Файлы обозначены непрозрачными ссылками. Имя файла, порядок ZIP и хеш не определяют личность вещи.",
      en: "Files use opaque references. File name, ZIP order, and hash do not define item identity.",
    },
  "Загрузка завершена. Ожидаем обработку ZIP…": {
    ru: "Загрузка завершена. Ожидаем обработку ZIP…",
    en: "Upload complete. Waiting for ZIP processing…",
  },
  "Проверяем ZIP и извлекаем изображения…": {
    ru: "Проверяем ZIP и извлекаем изображения…",
    en: "Validating the ZIP and extracting images…",
  },
  "Архивов принято: {uploaded}/{total}. Изображений найдено: {assets}.": {
    ru: "Архивов принято: {uploaded}/{total}. Изображений найдено: {assets}.",
    en: "Archives received: {uploaded}/{total}. Images found: {assets}.",
  },
  "Сервис обработки не отвечает. Архив сохранён; повтор после ошибки будет безопасным.": {
    ru: "Сервис обработки не отвечает. Архив сохранён; повтор после ошибки будет безопасным.",
    en: "The processing service is not responding. The archive is saved; retrying after failure will be safe.",
  },
  "Задание обработки не найдено. Архив сохранён; обратитесь к поддержке.": {
    ru: "Задание обработки не найдено. Архив сохранён; обратитесь к поддержке.",
    en: "The processing job was not found. The archive is saved; contact support.",
  },
  "Подготавливаем список изображений…": {
    ru: "Подготавливаем список изображений…",
    en: "Preparing the image list…",
  },
  "Не удалось подготовить {count} изображений. Повторите только допустимые failed assets.": {
    ru: "Не удалось подготовить изображений: {count}. Повторите только допустимые неудачные изображения.",
    en: "Could not prepare {count} images. Retry only eligible failed images.",
  },
  "Подготавливаем private thumbnails: {ready}/{total}.": {
    ru: "Подготавливаем приватные миниатюры: {ready}/{total}.",
    en: "Preparing private thumbnails: {ready}/{total}.",
  },
  "Подготавливаем private thumbnails…": {
    ru: "Подготавливаем приватные миниатюры…",
    en: "Preparing private thumbnails…",
  },
  "Изображения готовы к ручному разбору.": {
    ru: "Изображения готовы к ручному разбору.",
    en: "Images are ready for manual review.",
  },
  "Обработка ZIP остановилась. Архив сохранён. Код: {code}.": {
    ru: "Обработка ZIP остановилась. Архив сохранён. Код: {code}.",
    en: "ZIP processing stopped. The archive is saved. Code: {code}.",
  },
  "Повторить обработку без загрузки ZIP": {
    ru: "Повторить обработку без загрузки ZIP",
    en: "Retry processing without uploading ZIP",
  },
  "Безопасный повтор недоступен; обратитесь к поддержке.": {
    ru: "Безопасный повтор недоступен; обратитесь к поддержке.",
    en: "Safe retry is unavailable; contact support.",
  },
  "Отменить импорт": { ru: "Отменить импорт", en: "Cancel import" },
  Проблемы: { ru: "Проблемы", en: "Issues" },
  warning: { ru: "предупреждение", en: "warning" },
  error: { ru: "ошибка", en: "error" },
  info: { ru: "информация", en: "information" },
  "Ручное решение": { ru: "Ручное решение", en: "Manual resolution" },
  "Для каждого opaque asset выберите действие. Группируйте изображения только после подтверждения, что они относятся к одной физической вещи.":
    {
      ru: "Для каждого изображения выберите действие. Объединяйте изображения только после подтверждения, что они относятся к одной физической вещи.",
      en: "Choose an action for every image. Group images only after confirming that they belong to the same physical item.",
    },
  "Решений: {resolved}/{total}. Без manifest неизвестное число отсутствующих assets не равно нулю.":
    {
      ru: "Решений: {resolved}/{total}. Архив не содержит полного списка ожидаемых файлов, поэтому число отсутствующих изображений неизвестно.",
      en: "Decisions: {resolved}/{total}. The archive does not contain a complete expected-file list, so the number of missing images is unknown.",
    },
  "Объединить выбранные группы": { ru: "Объединить выбранные группы", en: "Merge selected groups" },
  "Группа {number}": { ru: "Группа {number}", en: "Group {number}" },
  "Приватное изображение для ручного Resolve": {
    ru: "Приватное изображение для ручного решения",
    en: "Private image for manual resolution",
  },
  "Превью недоступно": { ru: "Превью недоступно", en: "Preview unavailable" },
  "Ошибка подготовки изображения": {
    ru: "Ошибка подготовки изображения",
    en: "Image preparation failed",
  },
  "Изображение обрабатывается": { ru: "Изображение обрабатывается", en: "Image is processing" },
  "opaque asset": { ru: "изображение", en: "image" },
  "Повторить подготовку изображения": {
    ru: "Повторить подготовку изображения",
    en: "Retry image preparation",
  },
  "Изображение отклонено проверкой безопасности. Его можно только пропустить.": {
    ru: "Изображение отклонено проверкой безопасности. Его можно только пропустить.",
    en: "The image was rejected by security validation. It can only be skipped.",
  },
  "Действие для asset": { ru: "Действие для изображения", en: "Image action" },
  "Нужно решение владельца": { ru: "Нужно решение владельца", en: "Owner decision required" },
  "Добавить к существующей вещи": {
    ru: "Добавить к существующей вещи",
    en: "Add to an existing item",
  },
  "Создать новую вещь": { ru: "Создать новую вещь", en: "Create a new item" },
  Пропустить: { ru: "Пропустить", en: "Skip" },
  "Источник изображения": { ru: "Источник изображения", en: "Image role" },
  "Выберите явно": { ru: "Выберите явно", en: "Choose explicitly" },
  "Исходное подтверждение": { ru: "Исходное подтверждение", en: "Source evidence" },
  Каталог: { ru: "Каталог", en: "Catalog" },
  "Справочное изображение": { ru: "Справочное изображение", en: "Reference" },
  "Ракурс изображения": { ru: "Ракурс изображения", en: "Image view" },
  "Другой ракурс": { ru: "Другой ракурс", en: "Alternate" },
  "Другой ракурс сохраняется как ImageView unspecified, не как AppearanceVariant. Физический вариант задаётся отдельно.":
    {
      ru: "Другой ракурс относится к той же вещи. Отдельный физический вариант укажите ниже.",
      en: "An alternate view belongs to the same item. Specify a separate physical variant below.",
    },
  "Выбрать группу ({count} изображений)": {
    ru: "Выбрать группу ({count} изображений)",
    en: "Select group ({count} images)",
  },
  "Разделить группу": { ru: "Разделить группу", en: "Split group" },
  "В одной группе разные действия. Разделите группу или согласуйте решения.": {
    ru: "В одной группе разные действия. Разделите группу или согласуйте решения.",
    en: "A group has different actions. Split it or align the decisions.",
  },
  "Вещь текущего владельца": { ru: "Вещь текущего владельца", en: "Current owner's item" },
  "Название новой вещи": { ru: "Название новой вещи", en: "New item name" },
  "Допустимая категория": { ru: "Допустимая категория", en: "Allowed category" },
  "Состояние после Confirm": {
    ru: "Состояние новой вещи",
    en: "New item state",
  },
  "Сохранена / активна": { ru: "Сохранена / активна", en: "Committed / active" },
  "Import MVP создаёт только active вещи; archived и состояние качества не поддерживаются этим контрактом.":
    {
      ru: "Новые вещи создаются активными. Архивировать их можно позже в гардеробе.",
      en: "New items are created as active. You can archive them later in the wardrobe.",
    },
  "Это подтверждённый physical set: одна группа — одна ClothingItem": {
    ru: "Это подтверждённый физический набор: одна группа — одна вещь",
    en: "These images belong to one physical set",
  },
  "Физически выбираемый AppearanceVariant, если подтверждён": {
    ru: "Название физического варианта, если он действительно отличается",
    en: "Physical variant name, only if it is genuinely distinct",
  },
  "Необязательно; не используйте для front/back": {
    ru: "Необязательно; не используйте для ракурсов спереди и сзади",
    en: "Optional; do not use for front and back views",
  },
  "Сохранить Resolve без Preview": {
    ru: "Сохранить решения",
    en: "Save decisions",
  },
  "Построить Sealed Preview": {
    ru: "Подготовить предпросмотр",
    en: "Prepare preview",
  },
  "Запечатанное подтверждение": { ru: "Подтверждение импорта", en: "Import confirmation" },
  "Только после этой команды разрешены bounded production writes. Повтор той же команды идемпотентен.":
    {
      ru: "Только после подтверждения будут созданы или изменены вещи. Повторное подтверждение не создаёт дубликаты.",
      en: "Items are created or changed only after confirmation. Repeating the confirmation does not create duplicates.",
    },
  "Подтвердить импорт": { ru: "Подтвердить импорт", en: "Confirm import" },
  "Повторить только ошибки": { ru: "Повторить только ошибки", en: "Retry failures only" },
  Результаты: { ru: "Результаты", en: "Results" },
  "Запись {key}: {outcome}": { ru: "Запись {key}: {outcome}", en: "Record {key}: {outcome}" },
  Верх: { ru: "Верх", en: "Tops" },
  Низ: { ru: "Низ", en: "Bottoms" },
  "Цельная вещь": { ru: "Цельная вещь", en: "One-piece" },
  "Верхняя одежда": { ru: "Верхняя одежда", en: "Outerwear" },
  Обувь: { ru: "Обувь", en: "Shoes" },
  Аксессуар: { ru: "Аксессуар", en: "Accessory" },
  Чёрный: { ru: "Чёрный", en: "Black" },
  Белый: { ru: "Белый", en: "White" },
  Серый: { ru: "Серый", en: "Gray" },
  Синий: { ru: "Синий", en: "Blue" },
  Коричневый: { ru: "Коричневый", en: "Brown" },
  Зелёный: { ru: "Зелёный", en: "Green" },
  Красный: { ru: "Красный", en: "Red" },
  Многоцветный: { ru: "Многоцветный", en: "Multicolor" },
  Весна: { ru: "Весна", en: "Spring" },
  Лето: { ru: "Лето", en: "Summer" },
  Осень: { ru: "Осень", en: "Autumn" },
  Зима: { ru: "Зима", en: "Winter" },
  Всесезонно: { ru: "Всесезонно", en: "All-season" },
  "Загрузка завершена": { ru: "Загрузка завершена", en: "Upload complete" },
  Подготавливаем: { ru: "Подготавливаем", en: "Preparing" },
  "Нужно проверить": { ru: "Нужно проверить", en: "Review required" },
  "Предпросмотр запечатан": { ru: "Предпросмотр готов", en: "Preview ready" },
  "Подтверждаем импорт": { ru: "Подтверждаем импорт", en: "Confirming import" },
  "Импорт завершён": { ru: "Импорт завершён", en: "Import complete" },
  "Импорт завершён частично": { ru: "Импорт завершён частично", en: "Import partially complete" },
  "Требуется повтор": { ru: "Требуется повтор", en: "Retry required" },
  Отменён: { ru: "Отменён", en: "Cancelled" },
  "Удаляем временные данные": { ru: "Удаляем временные данные", en: "Removing temporary data" },
  "Проверяем файл": { ru: "Проверяем файл", en: "Validating file" },
  "Готовим изображение": { ru: "Готовим изображение", en: "Preparing image" },
  "Файл изолирован как небезопасный": {
    ru: "Файл изолирован как небезопасный",
    en: "File quarantined as unsafe",
  },
  "Формат не поддерживается": { ru: "Формат не поддерживается", en: "Format not supported" },
  "Изображение слишком большое": { ru: "Изображение слишком большое", en: "Image is too large" },
  "Обработка не удалась": { ru: "Обработка не удалась", en: "Processing failed" },
  "Ожидает безопасного удаления": {
    ru: "Ожидает безопасного удаления",
    en: "Waiting for safe removal",
  },
  "Введите название вещи перед сохранением.": {
    ru: "Введите название вещи перед сохранением.",
    en: "Enter an item name before saving.",
  },
  "Проверьте поля формы.": { ru: "Проверьте поля формы.", en: "Check the form fields." },
  "Вещь изменилась в другой вкладке. Обновите страницу.": {
    ru: "Вещь изменилась в другой вкладке. Обновите страницу.",
    en: "The item changed in another tab. Reload the page.",
  },
  "Проверьте категорию, справочные значения и уникальные поля.": {
    ru: "Проверьте категорию, справочные значения и уникальные поля.",
    en: "Check the category, reference values, and unique fields.",
  },
  "Не удалось сохранить вещь.": {
    ru: "Не удалось сохранить вещь.",
    en: "Could not save the item.",
  },
  "Вещь изменилась. Обновите страницу.": {
    ru: "Вещь изменилась. Обновите страницу.",
    en: "The item changed. Reload the page.",
  },
  "Не удалось изменить вещь.": {
    ru: "Не удалось изменить вещь.",
    en: "Could not change the item.",
  },
  "Отмена импорта недоступна.": {
    ru: "Отмена импорта недоступна.",
    en: "Import cancellation is unavailable.",
  },
  "Подтверждение не соответствует предпросмотру.": {
    ru: "Подтверждение не соответствует предпросмотру.",
    en: "The confirmation does not match the preview.",
  },
  "Некорректный импорт.": { ru: "Некорректный импорт.", en: "Invalid import." },
  "Предпросмотр недоступен.": { ru: "Предпросмотр недоступен.", en: "Preview is unavailable." },
  "Войдите в аккаунт.": { ru: "Войдите в аккаунт.", en: "Sign in to your account." },
  "Импорт недоступен.": { ru: "Импорт недоступен.", en: "Import is unavailable." },
  "Проверьте решения импорта.": {
    ru: "Проверьте решения импорта.",
    en: "Check the import decisions.",
  },
  "Повтор импорта недоступен.": {
    ru: "Повтор импорта недоступен.",
    en: "Import retry is unavailable.",
  },
  "Проверьте выбранные ZIP.": {
    ru: "Проверьте выбранные ZIP.",
    en: "Check the selected ZIP files.",
  },
  "Изображение недоступно.": { ru: "Изображение недоступно.", en: "Image is unavailable." },
  "Некорректное завершение загрузки.": {
    ru: "Некорректное завершение загрузки.",
    en: "Invalid upload completion.",
  },
  "Некорректный запрос повтора.": {
    ru: "Некорректный запрос повтора.",
    en: "Invalid retry request.",
  },
  "Некорректное удаление.": { ru: "Некорректное удаление.", en: "Invalid removal request." },
  "Вещь недоступна.": { ru: "Вещь недоступна.", en: "Item is unavailable." },
  "Некорректный порядок галереи.": {
    ru: "Некорректный порядок галереи.",
    en: "Invalid gallery order.",
  },
  "Проверьте выбранный файл.": { ru: "Проверьте выбранный файл.", en: "Check the selected file." },
  "Состояние импорта изменилось. Обновите страницу.": {
    ru: "Состояние импорта изменилось. Обновите страницу.",
    en: "The import state changed. Reload the page.",
  },
  "Проверьте архив и решения импорта.": {
    ru: "Проверьте архив и решения импорта.",
    en: "Check the archive and import decisions.",
  },
  "Импорт или выбранная вещь недоступны.": {
    ru: "Импорт или выбранная вещь недоступны.",
    en: "The import or selected item is unavailable.",
  },
  "Операция импорта не выполнена.": {
    ru: "Операция импорта не выполнена.",
    en: "The import operation failed.",
  },
  "Запрос не прошёл проверку origin.": {
    ru: "Запрос не прошёл проверку источника.",
    en: "The request origin could not be verified.",
  },
  "Статус обработки недоступен.": {
    ru: "Статус обработки недоступен.",
    en: "Processing status is unavailable.",
  },
  "Данные изменились. Обновите страницу и повторите.": {
    ru: "Данные изменились. Обновите страницу и повторите.",
    en: "The data changed. Reload the page and try again.",
  },
  "Файл или параметры изображения недопустимы.": {
    ru: "Файл или параметры изображения недопустимы.",
    en: "The file or image parameters are invalid.",
  },
  "Операция с изображением не выполнена.": {
    ru: "Операция с изображением не выполнена.",
    en: "The image operation failed.",
  },
  "Development only": { ru: "Только для разработки", en: "Development only" },
  "UI foundation": { ru: "Основа интерфейса", en: "UI foundation" },
  "Semantic primitives": { ru: "Семантические примитивы", en: "Semantic primitives" },
  "Требует внимания": { ru: "Требует внимания", en: "Needs attention" },
  Ошибка: { ru: "Ошибка", en: "Error" },
  Информация: { ru: "Информация", en: "Information" },
  "Введите отображаемое имя.": { ru: "Введите отображаемое имя.", en: "Enter a display name." },
  "Имя должно содержать не более 80 символов.": {
    ru: "Имя должно содержать не более 80 символов.",
    en: "The name must contain no more than 80 characters.",
  },
  "Email слишком длинный.": { ru: "Email слишком длинный.", en: "The email address is too long." },
  "Введите текущий пароль.": { ru: "Введите текущий пароль.", en: "Enter the current password." },
  "Новый пароль должен содержать от 10 до 128 символов.": {
    ru: "Новый пароль должен содержать от 10 до 128 символов.",
    en: "The new password must contain 10 to 128 characters.",
  },
  "Подтверждение нового пароля не совпадает.": {
    ru: "Подтверждение нового пароля не совпадает.",
    en: "The new password confirmation does not match.",
  },
  "Новый пароль должен отличаться от текущего.": {
    ru: "Новый пароль должен отличаться от текущего.",
    en: "The new password must differ from the current password.",
  },
  "Не удалось подготовить аккаунт.": {
    ru: "Не удалось подготовить аккаунт.",
    en: "Could not prepare the account.",
  },
  "Профиль временно недоступен.": {
    ru: "Профиль временно недоступен.",
    en: "The profile is temporarily unavailable.",
  },
  "Профиль недоступен.": { ru: "Профиль недоступен.", en: "The profile is unavailable." },
  "Проверьте email.": { ru: "Проверьте email.", en: "Check the email address." },
  "Проверьте поля пароля.": { ru: "Проверьте поля пароля.", en: "Check the password fields." },
  "Email текущей сессии недоступен.": {
    ru: "Email текущей сессии недоступен.",
    en: "The current session email is unavailable.",
  },
  "Суммарный размер архивов превышает лимит.": {
    ru: "Суммарный размер архивов превышает лимит.",
    en: "The combined archive size exceeds the limit.",
  },
  "Для создания или обновления требуется название.": {
    ru: "Для создания или обновления требуется название.",
    en: "A name is required to create or update an item.",
  },
  "Обновление требует явно выбранную вещь и её версию.": {
    ru: "Обновление требует явно выбранную вещь и её версию.",
    en: "An update requires an explicitly selected item and its version.",
  },
  "Ключи и названия AppearanceVariant должны быть уникальны.": {
    ru: "Ключи и названия AppearanceVariant должны быть уникальны.",
    en: "AppearanceVariant keys and names must be unique.",
  },
  "Для вещи разрешён только один default AppearanceVariant.": {
    ru: "Для вещи разрешён только один default AppearanceVariant.",
    en: "Only one default AppearanceVariant is allowed per item.",
  },
  "Пропущенная запись не может назначать изображения.": {
    ru: "Пропущенная запись не может назначать изображения.",
    en: "A skipped record cannot assign images.",
  },
  "Подтверждаемая запись должна содержать хотя бы одно изображение.": {
    ru: "Подтверждаемая запись должна содержать хотя бы одно изображение.",
    en: "A confirmed record must contain at least one image.",
  },
  "Изображение назначено более одного раза.": {
    ru: "Изображение назначено более одного раза.",
    en: "The image was assigned more than once.",
  },
  "Неизвестный AppearanceVariant.": {
    ru: "Неизвестный AppearanceVariant.",
    en: "Unknown AppearanceVariant.",
  },
  "Primary разрешён только для catalog image.": {
    ru: "Основным может быть только изображение каталога.",
    en: "Only a catalog image may be primary.",
  },
  "В каждой области разрешено только одно primary image.": {
    ru: "В каждой области разрешено только одно основное изображение.",
    en: "Only one primary image is allowed in each scope.",
  },
  "Не удалось выполнить действие. Попробуйте ещё раз.": {
    ru: "Не удалось выполнить действие. Попробуйте ещё раз.",
    en: "Could not complete the action. Try again.",
  },
  Настройки: { ru: "Настройки", en: "Settings" },
  "Навигация настроек": { ru: "Навигация настроек", en: "Settings navigation" },
  "Управляйте языком и региональными параметрами текущего аккаунта.": {
    ru: "Управляйте языком и региональными параметрами текущего аккаунта.",
    en: "Manage the language and regional preferences for the current account.",
  },
  "Язык применяется ко всему интерфейсу и сохраняется между входами.": {
    ru: "Язык применяется ко всему интерфейсу и сохраняется между входами.",
    en: "The language applies across the interface and is preserved between sign-ins.",
  },
  "Региональные настройки": { ru: "Региональные настройки", en: "Regional settings" },
  "Эти параметры сохраняются только для текущего аккаунта.": {
    ru: "Эти параметры сохраняются только для текущего аккаунта.",
    en: "These preferences are saved only for the current account.",
  },
  "Часовой пояс": { ru: "Часовой пояс", en: "Time zone" },
  "Используйте название IANA, например Europe/Moscow.": {
    ru: "Используйте название IANA, например Europe/Moscow.",
    en: "Use an IANA name, for example Europe/Moscow.",
  },
  "Система единиц": { ru: "Система единиц", en: "Units system" },
  Метрическая: { ru: "Метрическая", en: "Metric" },
  Имперская: { ru: "Имперская", en: "Imperial" },
  "Начало недели": { ru: "Начало недели", en: "Week starts on" },
  Понедельник: { ru: "Понедельник", en: "Monday" },
  Воскресенье: { ru: "Воскресенье", en: "Sunday" },
  "Сохранить региональные настройки": {
    ru: "Сохранить региональные настройки",
    en: "Save regional settings",
  },
  "Региональные настройки сохранены.": {
    ru: "Региональные настройки сохранены.",
    en: "Regional settings saved.",
  },
  "Аккаунт и приватность": { ru: "Аккаунт и приватность", en: "Account and privacy" },
  "Имя, email и пароль редактируются в профиле текущего аккаунта.": {
    ru: "Имя, email и пароль редактируются в профиле текущего аккаунта.",
    en: "Name, email, and password are managed in the current account profile.",
  },
  "Открыть профиль": { ru: "Открыть профиль", en: "Open profile" },
  "Откройте гардероб или подготовьте приватный массовый импорт.": {
    ru: "Откройте гардероб или подготовьте приватный массовый импорт.",
    en: "Open the wardrobe or prepare a private bulk import.",
  },
  "Открыть Bulk Import": { ru: "Открыть массовый импорт", en: "Open Bulk Import" },
  "Настройки временно недоступны": {
    ru: "Настройки временно недоступны",
    en: "Settings are temporarily unavailable",
  },
  "Повторите попытку позже. Настройки аккаунта не изменялись.": {
    ru: "Повторите попытку позже. Настройки аккаунта не изменялись.",
    en: "Try again later. Account settings were not changed.",
  },
  "Загружаем настройки…": { ru: "Загружаем настройки…", en: "Loading settings…" },
  "Не удалось загрузить настройки": {
    ru: "Не удалось загрузить настройки",
    en: "Could not load settings",
  },
  "Повторите попытку. Настройки аккаунта не изменялись.": {
    ru: "Повторите попытку. Настройки аккаунта не изменялись.",
    en: "Try again. Account settings were not changed.",
  },
  "Укажите часовой пояс.": { ru: "Укажите часовой пояс.", en: "Enter a time zone." },
  "Название часового пояса слишком длинное.": {
    ru: "Название часового пояса слишком длинное.",
    en: "The time zone name is too long.",
  },
  "Укажите корректный часовой пояс IANA.": {
    ru: "Укажите корректный часовой пояс IANA.",
    en: "Enter a valid IANA time zone.",
  },
  "Выберите систему единиц.": {
    ru: "Выберите систему единиц.",
    en: "Select a units system.",
  },
  "Выберите начало недели.": {
    ru: "Выберите начало недели.",
    en: "Select the first day of the week.",
  },
  "Проверьте региональные настройки.": {
    ru: "Проверьте региональные настройки.",
    en: "Check the regional settings.",
  },
  "Настройки изменились в другой вкладке. Обновите страницу.": {
    ru: "Настройки изменились в другой вкладке. Обновите страницу.",
    en: "The settings changed in another tab. Reload the page.",
  },
  "Не удалось сохранить настройки. Попробуйте ещё раз.": {
    ru: "Не удалось сохранить настройки. Попробуйте ещё раз.",
    en: "Could not save the settings. Try again.",
  },
  "Выбор языка": { ru: "Выбор языка", en: "Language selection" },
};

export function parseLocale(value: unknown): Locale | null {
  return typeof value === "string" && supportedLocales.includes(value as Locale)
    ? (value as Locale)
    : null;
}

export function translate(locale: Locale, key: string, values?: Record<string, string | number>) {
  const entry = dictionary[key];
  const template = entry?.[locale] ?? entry?.ru ?? key;
  return Object.entries(values ?? {}).reduce(
    (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
    template,
  );
}
