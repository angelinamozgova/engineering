  const TYPE_KEYWORDS = {
    habit: [
      "привычка", "привычку", "каждый день", "каждые", "раз в неделю", "ежедневно", "регулярно",
      "через день", "каждый второй день", "раз в два дня", "раз в месяц", "каждый месяц", "ежемесячно",
      "еженедельно", "раз в две недели", "каждые 2 недели", "каждую неделю", "каждую ночь",
      "по понедельникам", "по вторникам", "по средам", "по четвергам", "по пятницам", "по субботам", "по воскресеньям",
      "по будням", "по выходным",
      "каждое утро", "каждый вечер", "тренировка раз", "раза в неделю", "раз в день"
    ],
    shopping: [
      "в покупки", "в магазин", "купить", "список покупок", "добавь в покупки", "закупка", "продукты", "добавь в список"
    ],
    note: [
      "заметка", "заметку", "запиши", "запланируй", "идея", "на будущее",
      "запись", "набросок", "черновик", "сохрани мысль", "запомни", "мысль", "на потом", "фиксирую",
      "зафиксируй", "на память", "оставь заметку", "текстовая заметка", "запиши в заметки", "заметки"
    ],
    wishlist: [
      "желание", "хочу", "в желания", "вишлист", "мечта", "мечтаю", "планирую купить", "когда-нибудь", "подарок себе"
    ],
    tracker: [
      "трекер", "трек", "отслеживай", "создай трекер", "считай", "показатель", "цель по", "сколько съел", "сколько выпил", "отслеживание"
    ],
    task: [
      "задача", "задачу", "добавь задачу", "создай задачу", "сделать", "нужно", "надо",
      "дедлайн", "в календарь"
    ]
  };

  const WEEKDAY_NAMES = [
    ["понедельник", "пн", 0],
    ["вторник", "вт", 1],
    ["среда", "среду", "ср", 2],
    ["четверг", "чт", 3],
    ["пятница", "пт", 4],
    ["суббота", "сб", 5],
    ["воскресенье", "воскресенье", "вс", 6]
  ];

  const MONTH_NAME_RX = "(?:январ[ьяё]*|феврал[ьяё]*|март[аё]*|апрел[ьяё]*|ма[йяё]*|июн[ьяё]*|июл[ьяё]*|август[аё]*|сентябр[ьяё]*|октябр[ьяё]*|ноябр[ьяё]*|декабр[ьяё]*)";

  const UNIT_ALIASES = [
    ["грамм", "гр", "gram"],
    ["литр", "литра", "литров", "л"],
    ["штук", "шт", "штука"],
    ["таблеток", "таблетка", "таб", "таблеток"],
    ["порций", "порция"],
    ["стаканов", "стакан", "стакана"],
    ["часов", "час", "ч"],
    ["раз", "раза"],
    ["км", "километр", "километров"],
    ["калорий", "ккал", "кал"]
  ];

  // start: Голосовой ввод — глаголы-команды, которые убираем из названия и текста
  const ACTION_VERBS = [
    "добавь", "добавить", "создай", "создать", "запиши", "записать",
    "поставь", "поставить", "сделай", "сделать", "внеси", "внести",
    "напомни", "напомнить",
    "установи", "установить", "запланируй", "запланировать", "отметь", "отметить",
    "убери", "убрать", "сохрани", "сохранить", "зафиксируй", "зафиксировать",
    "перенеси", "перенести", "измени", "изменить", "новая", "новый", "новое",
    "начни", "начать", "включи", "включить", "выключи", "выключить",
    "планируй", "планировать", "оставь", "оставить", "напиши", "написать"
  ];

  const ENTITY_NOUNS = [
    "задачу", "задача", "задачи", "привычку", "привычка", "привычки",
    "заметку", "заметка", "заметки", "трекер", "трек", "желание", "желания",
    "покупки", "покупок", "список", "напоминание", "напоминания", "уведомление"
  ];

  const HOUR_WORDS = [
    ["полноч", 0], ["полден", 12],
    ["двенадц", 12], ["одиннадц", 11], ["десят", 10], ["девят", 9],
    ["восем", 8], ["сем", 7], ["шест", 6], ["пят", 5], ["четыр", 4],
    ["четыре", 4], ["трех", 3], ["трём", 3], ["трем", 3], ["три", 3],
    ["двух", 2], ["двум", 2], ["два", 2], ["две", 2], ["втор", 2],
    ["один", 1], ["одну", 1], ["одного", 1], ["одной", 1], ["перв", 1]
  ];
  function getTodayKey() {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
  }
  // end: Голосовой ввод — дата «сегодня»

  // start: Голосовой ввод — смещение даты на N дней
  function addDaysToKey(dateKey, delta) {
    const parts = String(dateKey).slice(0, 10).split("-").map(Number);
    const dt = new Date(parts[0], parts[1] - 1, parts[2]);
    dt.setDate(dt.getDate() + delta);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  }
  // end: Голосовой ввод — смещение даты

  // start: Голосовой ввод — ключ даты YYYY-MM-DD из компонентов календаря
  function formatDateKey(year, monthIndex, day) {
    return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  // end: Голосовой ввод — ключ даты

  // start: Голосовой ввод — ближайшая будущая дата по дню и месяцу (год опционален)
  function resolveFutureCalendarDate(day, monthIndex, yearExplicit, todayKey) {
    const todayParts = String(todayKey).slice(0, 10).split("-").map(Number);
    let year = Number.isFinite(yearExplicit) ? yearExplicit : todayParts[0];
    if (year < 100) year += 2000;
    const candidate = new Date(year, monthIndex, day);
    const today = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);
    today.setHours(0, 0, 0, 0);
    candidate.setHours(0, 0, 0, 0);
    if (candidate < today && !Number.isFinite(yearExplicit)) {
      return formatDateKey(year + 1, monthIndex, day);
    }
    return formatDateKey(year, monthIndex, day);
  }
  // end: Голосовой ввод — ближайшая будущая дата

  // start: Голосовой ввод — индекс месяца по русскому названию
  function findMonthIndex(text) {
    const lower = String(text || "").toLowerCase();
    const stems = [
      ["январ", 0], ["феврал", 1], ["март", 2], ["апрел", 3],
      ["мая", 4], ["мае", 4], ["май", 4], ["июн", 5], ["июл", 6],
      ["август", 7], ["сентябр", 8], ["октябр", 9], ["ноябр", 10], ["декабр", 11]
    ];
    for (const entry of stems) {
      if (lower.includes(entry[0])) return entry[1];
    }
    return null;
  }
  // end: Голосовой ввод — индекс месяца

  // start: Голосовой ввод — собрать объект Date из ключа даты и времени HH:MM
  function buildDueDate(dateKey, timeStr) {
    const parts = String(dateKey).slice(0, 10).split("-").map(Number);
    let hours = 0;
    let minutes = 0;
    if (timeStr) {
      const timeParts = String(timeStr).split(":");
      hours = Number(timeParts[0]);
      minutes = Number(timeParts[1] || 0);
    }
    return new Date(parts[0], parts[1] - 1, parts[2], hours, minutes, 0, 0);
  }
  // end: Голосовой ввод — объект Date для задачи

  // start: Голосовой ввод — следующий указанный день недели (пн=0 … вс=6)
  function nextWeekdayKey(weekdayIndex, todayKey) {
    const parts = String(todayKey).slice(0, 10).split("-").map(Number);
    const dt = new Date(parts[0], parts[1] - 1, parts[2]);
    const current = (dt.getDay() + 6) % 7;
    let delta = weekdayIndex - current;
    if (delta <= 0) delta += 7;
    dt.setDate(dt.getDate() + delta);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  }
  // end: Голосовой ввод — следующий день недели
  // start: Голосовой ввод — очистка текста от служебных слов
  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, "")
      .trim();
  }
  // end: Голосовой ввод — очистка текста

  // start: Голосовой ввод — убрать ключевое слово типа (без \\b — кириллица)
  function stripKeywordPhrase(text, phrase) {
    const escaped = String(phrase || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return String(text || "").replace(new RegExp(`(?:^|[\\s,.:;!])${escaped}[а-яё]*`, "gi"), " ");
  }
  // end: Голосовой ввод — убрать ключевое слово

  // start: Голосовой ввод — нормализация времени HH:MM
  function normalizeTime(hoursRaw, minutesRaw, context = "", prep = "", options = {}) {
    let hours = Number(hoursRaw);
    let minutes = Number(minutesRaw || 0);
    if (!Number.isFinite(hours)) return "";
    if (!Number.isFinite(minutes)) minutes = 0;
    const ctx = String(context).toLowerCase();
    const preposition = String(prep || "").toLowerCase();
    const explicitColon = Boolean(options.explicitColon);

    if (/ночи|ночью|ночь/i.test(ctx)) {
      if (hours === 12) hours = 0;
    } else if (/утра|утром|утро/i.test(ctx)) {
      if (hours === 12) hours = 0;
    } else if (/дня|днём|днем/i.test(ctx)) {
      if (hours >= 1 && hours <= 11) hours += 12;
    } else if (/вечера|вечером|вечер/i.test(ctx)) {
      if (hours >= 1 && hours <= 11) hours += 12;
    } else if (/вечер|ноч/i.test(ctx) && hours >= 1 && hours <= 11) {
      hours += 12;
    } else if (preposition === "в" && hours >= 1 && hours <= 11 && !explicitColon) {
      hours += 12;
    } else if ((preposition === "на" || preposition === "к") && hours === 12) {
      hours = 0;
    } else if (!preposition && hours >= 1 && hours <= 11 && !explicitColon) {
      hours += 12;
    }

    hours = Math.min(23, Math.max(0, hours));
    minutes = Math.min(59, Math.max(0, minutes));
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  // end: Голосовой ввод — нормализация времени

  // start: Голосовой ввод — число часа из цифры или слова («девять», «девяти»)
  function parseHourToken(raw) {
    const token = String(raw || "").toLowerCase().trim();
    if (/^\d{1,2}$/.test(token)) return Number(token);
    const sorted = [...HOUR_WORDS].sort((a, b) => b[0].length - a[0].length);
    for (const entry of sorted) {
      if (!token.startsWith(entry[0])) continue;
      if (token.length > entry[0].length + 4) continue;
      return Number(entry[1]);
    }
    return null;
  }

  function hourWordPattern() {
    return [...HOUR_WORDS]
      .sort((a, b) => b[0].length - a[0].length)
      .map((entry) => {
        const stem = entry[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return `${stem}[а-яё]*`;
      })
      .join("|");
  }

  const SPOKEN_TIME_PERIOD = "утра|утром|утро|дня|днём|днем|вечера|вечером|вечер|ночи|ночью|ночь";
  const HOUR_UNIT_SUFFIX = "ам|ов|у|а";
  const WEEKDAY_NAME_RX = "(?:понедельник[а-яё]*|вторник[а-яё]*|сред[а-яё]*|четверг[а-яё]*|пятниц[а-яё]*|суббот[а-яё]*|воскресен[а-яё]*)";

  const COUNT_WORDS = {
    один: 1, одна: 1, одно: 1, два: 2, две: 2, три: 3, четыре: 4, пять: 5, шесть: 6, семь: 7
  };
  const COUNT_TOKEN_RX = "(\\d+|один|одна|одно|два|две|три|четыре|пять|шесть|семь)";
  const CYR_TAIL = "[а-яё]*";
  // end: Голосовой ввод — число часа из слова

  // start: Голосовой ввод — убрать глаголы-команды и тип сущности из текста
  function stripActionVerbs(text) {
    let rest = String(text || "");
    for (let pass = 0; pass < 4; pass += 1) {
      ACTION_VERBS.forEach((verb) => {
        rest = stripKeywordPhrase(rest, verb);
      });
      ENTITY_NOUNS.forEach((noun) => {
        rest = stripKeywordPhrase(rest, noun);
      });
    }
    rest = rest.replace(/^[—–-]\s*/, "");
    return cleanText(rest);
  }

  function stripCommandPrefix(text) {
    return stripActionVerbs(text);
  }
  // end: Голосовой ввод — убрать команды из текста

  // start: Голосовой ввод — разделители нескольких сущностей в одной фразе
  const SEGMENT_SPLITTERS = [
    "и ещё", "и еще", "а также", "а ещё", "а еще", "вместе с тем", "к тому же",
    "сверх того", "помимо этого", "вдобавок", "дополнительно", "параллельно",
    "кстати", "потом", "затем", "дальше", "также", "заодно", "вместе с",
    "второе", "третье", "ну и", "ещё", "еще", "плюс"
  ];
  const ENTITY_AFTER_SPLIT = "(?:(?:созда(?:й|ть)|добав(?:ь|ить)|запиш\\w*|запис\\w*|внес\\w*|сделай|сделать|нов(?:ая|ый|ое)|отмет\\w*)\\s+)?(?:задач|привыч|замет|трек|желан|покуп|показат|отслеж)";
  // end: Голосовой ввод — разделители нескольких сущностей

  // start: Голосовой ввод — разбить фразу на несколько сущностей
  function splitIntoSegments(text) {
    const raw = cleanText(text);
    if (!raw) return [];
    const splitterAlt = SEGMENT_SPLITTERS
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    const splitRx = new RegExp(
      `\\s*(?:,\\s*|(?:${splitterAlt})\\s+|(?<=[\\s,—–-])и\\s+)(?=${ENTITY_AFTER_SPLIT})`,
      "i"
    );
    const parts = raw.split(splitRx);
    const cleaned = parts.map((part) => cleanText(part)).filter(Boolean);
    return cleaned.length ? cleaned : [raw];
  }
  // end: Голосовой ввод — разбить фразу

  // start: Голосовой ввод — есть ли в фразе дата или время (для задачи, не привычки)
  function hasScheduledDateOrTime(segment) {
    const lower = String(segment || "").toLowerCase();

    if (/(?:^|\s)(?:завтра|послезавтра|сегодня)(?:\s|$|[,.])/i.test(lower)) return true;
    if (/\b\d{1,2}\.\d{1,2}(?:\.\d{2,4})?\b/.test(lower)) return true;
    if (new RegExp(`\\b\\d{1,2}\\s+${MONTH_NAME_RX}`, "i").test(lower)) return true;

    const throughDaysRx = new RegExp(`(?:^|[\\s,—–-]+)через\\s+${COUNT_TOKEN_RX}\\s+дн${CYR_TAIL}`, "i");
    if (throughDaysRx.test(lower) && !/через\s+день/i.test(lower)) return true;

    if (!/по\s+(?:понед|втор|сред|четвер|пятниц|суббот|воскрес)/i.test(lower)) {
      if (new RegExp(`(?:^|[\\s,—–-]+)(?:в|на)\\s+${WEEKDAY_NAME_RX}`, "i").test(lower)) return true;
    }

    if (/\b(?:в|к|на)\s+\d{1,2}(?::\d{2})?\s*(?:утра|утром|утро|дня|днём|днем|вечера|вечером|вечер|ночи|ночью|ночь|часов)?/i.test(lower)) return true;
    if (/\bна\s+\d{1,2}(?::\d{2})?\s*(?:утра|утром|утро|дня|днём|днем|вечера|вечером|вечер|ночи|ночью|ночь|часов)?/i.test(lower)) return true;

    const hourAlt = hourWordPattern();
    if (new RegExp(`(?:^|[\\s,—–-]+)(?:на|к|в)\\s+(?:\\d{1,2}|${hourAlt})(?:\\s+час(?:${HOUR_UNIT_SUFFIX}|))?(?:\\s+(?:${SPOKEN_TIME_PERIOD}))?`, "i").test(lower)) {
      return true;
    }
    return false;
  }
  // end: Голосовой ввод — дата или время в фразе

  // start: Голосовой ввод — определить тип сущности (сущность важнее глагола «запиши»)
  function detectSegmentType(segment) {
    const lower = segment.toLowerCase();
    if (/задач/i.test(lower)) return "task";
    if (/привычк/i.test(lower)) return "habit";
    if (/(?:трекер|(?:^|\s)трек(?:\s|$)|отслеживай|показатель)/i.test(lower)) return "tracker";
    if (/(?:в\s+покуп|список\s+покупок|добавь\s+в\s+покупки|в\s+магазин|закупка|продукты)/i.test(lower)) return "shopping";
    if (/(?:желани|вишлист|мечта)/i.test(lower)) return "wishlist";
    if (/заметк/i.test(lower)) return "note";
    if (/(?:запись|набросок|черновик|сохрани\s+мысль|зафиксируй|на\s+память)/i.test(lower)) return "note";
    if (/(?:идея|на\s+будущее|запомни|мысль|на\s+потом|фиксирую)/i.test(lower)) return "note";
    if (hasScheduledDateOrTime(segment)) return "task";
    if (/запиш/i.test(lower)) return "note";
    return "note";
  }
  // end: Голосовой ввод — определить тип

  // start: Голосовой ввод — найти индекс дня недели в тексте
  function findWeekdayIndex(text) {
    const lower = text.toLowerCase();
    for (const entry of WEEKDAY_NAMES) {
      for (let i = 0; i < entry.length - 1; i += 1) {
        if (lower.includes(entry[i])) return entry[entry.length - 1];
      }
    }
    return null;
  }
  // end: Голосовой ввод — день недели

  // start: Голосовой ввод — извлечь дату из фразы
  function extractDate(segment, todayKey) {
    let rest = segment;
    let date = todayKey;
    let dateExplicit = false;

    if (/послезавтра/i.test(rest)) {
      date = addDaysToKey(todayKey, 2);
      dateExplicit = true;
      rest = rest.replace(/послезавтра/gi, " ");
    } else if (/завтра/i.test(rest)) {
      date = addDaysToKey(todayKey, 1);
      dateExplicit = true;
      rest = rest.replace(/завтра/gi, " ");
    } else if (/сегодня/i.test(rest)) {
      dateExplicit = true;
      rest = rest.replace(/сегодня/gi, " ");
    }

    const dmyMatch = rest.match(/\b(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?\b/);
    if (dmyMatch) {
      const day = Number(dmyMatch[1]);
      const monthIndex = Number(dmyMatch[2]) - 1;
      const yearRaw = dmyMatch[3] ? Number(dmyMatch[3]) : null;
      if (day >= 1 && day <= 31 && monthIndex >= 0 && monthIndex <= 11) {
        date = resolveFutureCalendarDate(day, monthIndex, yearRaw, todayKey);
        dateExplicit = true;
        rest = rest.replace(dmyMatch[0], " ");
      }
    }

    const dmMonthMatch = rest.match(new RegExp(`\\b(\\d{1,2})\\s+(${MONTH_NAME_RX})(?:\\s+(\\d{4}))?`, "i"));
    if (dmMonthMatch) {
      const day = Number(dmMonthMatch[1]);
      const monthIndex = findMonthIndex(dmMonthMatch[2]);
      const yearRaw = dmMonthMatch[3] ? Number(dmMonthMatch[3]) : null;
      if (day >= 1 && day <= 31 && monthIndex !== null) {
        date = resolveFutureCalendarDate(day, monthIndex, yearRaw, todayKey);
        dateExplicit = true;
        rest = rest.replace(dmMonthMatch[0], " ");
      }
    }

    const throughDaysMatch = rest.match(new RegExp(`(?:^|[\\s,—–-]+)через\\s+${COUNT_TOKEN_RX}\\s+дн${CYR_TAIL}`, "i"));
    if (throughDaysMatch && !/через\s+день/i.test(rest)) {
      const skipped = parseCountToken(throughDaysMatch[1]);
      if (skipped !== null) {
        date = addDaysToKey(todayKey, skipped);
        dateExplicit = true;
        rest = rest.replace(throughDaysMatch[0], " ");
      }
    }

    const weekday = findWeekdayIndex(rest);
    if (weekday !== null && /(?:в\s+|на\s+|кажд\w+\s+|по\s+)/i.test(rest)) {
      if (!(/^по\s+/i.test(rest) || /по\s+(?:понед|втор|сред|четвер|пятниц|суббот|воскрес)/i.test(rest))) {
        date = nextWeekdayKey(Number(weekday), todayKey);
        dateExplicit = true;
        rest = rest.replace(new RegExp(`(?:^|[\\s,—–-]+)(?:в|на)\\s+${WEEKDAY_NAME_RX}`, "gi"), " ");
        WEEKDAY_NAMES.forEach((entry) => {
          entry.slice(0, -1).forEach((name) => {
            if (name.length < 4) return;
            rest = rest.replace(new RegExp(`(?:^|[\\s,—–-]+)${name}[а-яё]*(?=[\\s,—–-]|$)`, "gi"), " ");
          });
        });
      }
    }
    rest = rest.replace(/\b(?:на\s+)?(?:завтра|сегодня|послезавтра)\b/gi, " ");
    return { date, rest: cleanText(rest), dateExplicit };
  }
  // end: Голосовой ввод — извлечь дату

  // start: Голосовой ввод — извлечь время «на девять», «к девяти», «в три часа дня»
  function tryMatchSpokenClock(text) {
    const hourAlt = hourWordPattern();
    const rx = new RegExp(
      `(?:^|[\\s,—–-]+)(на|к|в)\\s+(\\d{1,2}|${hourAlt})(?:\\s+час(?:${HOUR_UNIT_SUFFIX}|))?(?:\\s+(${SPOKEN_TIME_PERIOD}))?`,
      "i"
    );
    const match = String(text || "").match(rx);
    if (!match) return null;
    const prep = match[1].toLowerCase();
    const hours = parseHourToken(match[2]);
    if (hours === null) return null;
    const value = normalizeTime(hours, 0, match[3] || match[0], prep);
    if (!value) return null;
    return { value, raw: match[0] };
  }
  // end: Голосовой ввод — извлечь время словами

  // start: Голосовой ввод — извлечь время задачи и напоминание из фразы
  function extractTaskTimes(segment) {
    let rest = segment;
    let notifyTime = "";
    let time = "";
    const colonPrepRx = /(?:^|[\s,—–-]+)(?:в|к|на)\s+(\d{1,2}):(\d{2})\s*(?:часов|ч\.?)?/i;

    const reminderPatterns = [
      /(?:^|[\s,—–-]+)(?:с\s+)?(?:и\s+)?(?:сделай|сделать|поставь)?\s*(?:напоминанием|напоминание|напомни|уведомление)\s+(?:в|к|на)\s+(\d{1,2})(?::(\d{2}))?\s*(утра|утром|утро|дня|днём|днем|вечера|вечером|вечер|ночи|ночью|ночь|часов)?/i,
      /(?:^|[\s,—–-]+)с\s+напоминанием\s+(?:в|к|на)\s+(\d{1,2})(?::(\d{2}))?\s*(утра|утром|утро|дня|днём|днем|вечера|вечером|вечер|ночи|ночью|ночь|часов)?/i
    ];
    for (const rx of reminderPatterns) {
      const reminderMatch = rest.match(rx);
      if (!reminderMatch) continue;
      notifyTime = normalizeTime(reminderMatch[1], reminderMatch[2], reminderMatch[3] || reminderMatch[0]);
      rest = rest.replace(reminderMatch[0], " ");
      break;
    }

    const colonPrepMatch = rest.match(colonPrepRx);
    if (colonPrepMatch) {
      time = normalizeTime(colonPrepMatch[1], colonPrepMatch[2], "", colonPrepMatch[0].trim().split(/\s+/)[0], { explicitColon: true });
      rest = rest.replace(colonPrepMatch[0], " ");
    }

    const timeColonMatch = rest.match(/\s+на\s+(\d{1,2}):(\d{2})\s*(?:часов|ч\.?)?/i);
    if (timeColonMatch) {
      time = normalizeTime(timeColonMatch[1], timeColonMatch[2], "");
      rest = rest.replace(timeColonMatch[0], " ");
    }

    if (!time) {
      const spoken = tryMatchSpokenClock(rest);
      if (spoken) {
        time = spoken.value;
        rest = rest.replace(spoken.raw, " ");
      }
    }

    if (!time) {
      const timeVkMatch = rest.match(/(?:^|\s)(в|к)\s+(\d{1,2})(?::(\d{2}))?\s*(утра|утром|утро|дня|днём|днем|вечера|вечером|вечер|ночи|ночью|ночь|часов)?/i);
      if (timeVkMatch) {
        time = normalizeTime(
          timeVkMatch[2],
          timeVkMatch[3],
          timeVkMatch[4] || timeVkMatch[0],
          timeVkMatch[1],
          { explicitColon: timeVkMatch[3] !== undefined && timeVkMatch[3] !== "" }
        );
        rest = rest.replace(timeVkMatch[0], " ");
      }
    }

    if (!time) {
      const timeHoursMatch = rest.match(new RegExp(`\\s+на\\s+(\\d{1,2})\\s+час(?:${HOUR_UNIT_SUFFIX}|)\\s*(${SPOKEN_TIME_PERIOD})?`, "i"));
      if (timeHoursMatch) {
        time = normalizeTime(timeHoursMatch[1], 0, timeHoursMatch[2] || timeHoursMatch[0], "на");
        rest = rest.replace(timeHoursMatch[0], " ");
      }
    }

    if (!time) {
      const timeNaMatch = rest.match(/\s+на\s+(\d{1,2})(?::(\d{2}))?(?!\s*час)\s*(утра|утром|утро|дня|днём|днем|вечера|вечером|вечер|ночи|ночью|ночь|часов)?/i);
      if (timeNaMatch) {
        time = normalizeTime(timeNaMatch[1], timeNaMatch[2], timeNaMatch[3] || timeNaMatch[0], "на");
        rest = rest.replace(timeNaMatch[0], " ");
      }
    }

    rest = rest.replace(/(?:^|[\s,—–-]+)(?:с\s+)?(?:и\s+)?(?:сделай|сделать|поставь)?\s*(?:напоминанием|напоминание|напомни|уведомление)\s+(?:в|к|на)\s+\d{1,2}(?::\d{2})?\s*(?:утра|утром|утро|дня|днём|днем|вечера|вечером|вечер|ночи|ночью|ночь|часов)?/gi, " ");
    rest = rest.replace(/\s+с\s+напоминанием\s+(?:в|к|на)\s+\d{1,2}(?::\d{2})?\s*(?:утра|утром|утро|дня|днём|днем|вечера|вечером|вечер|ночи|ночью|ночь|часов)?/gi, " ");
    rest = rest.replace(colonPrepRx, " ");
    rest = rest.replace(new RegExp(`(?:^|[\\s,—–-]+)(?:на|к|в)\\s+(?:\\d{1,2}|${hourWordPattern()})(?:\\s+час(?:${HOUR_UNIT_SUFFIX}|))?(?:\\s+(?:${SPOKEN_TIME_PERIOD}))?`, "gi"), " ");
    rest = rest.replace(/\s+(?:в|к|на)\s+\d{1,2}(?::\d{2})?\s*(?:утра|утром|утро|дня|днём|днем|вечера|вечером|вечер|ночи|ночью|ночь|часов)?/gi, " ");
    rest = rest.replace(/\s+на\s+\d{1,2}(?::\d{2})?(?!\s*час)\s*(?:утра|утром|утро|дня|днём|днем|вечера|вечером|вечер|ночи|ночью|ночь|часов)?/gi, " ");
    rest = rest.replace(new RegExp(`\\s+на\\s+\\d{1,2}\\s+час(?:${HOUR_UNIT_SUFFIX}|)\\s*(?:${SPOKEN_TIME_PERIOD})?`, "gi"), " ");
    rest = rest.replace(/\s+на\s+\d{1,2}(?::\d{2})?\s*(?:часов|ч\.?)?/gi, " ");
    rest = rest.replace(/\s+и\s*$/i, " ");
    return { time, notifyTime, rest: cleanText(rest) };
  }
  // end: Голосовой ввод — извлечь время задачи и напоминание

  // start: Голосовой ввод — убрать триггер-слова типа из текста
  function stripTypeKeywords(text, type) {
    let rest = text;
    if (type === "note") {
      rest = rest.replace(/(?:^|[\s,.:;!])(?:сохрани\s+мысль|на\s+будущее|на\s+память|оставь\s+заметку|запиши\s+в\s+заметки|текстовая\s+заметка)/gi, " ");
    }
    (TYPE_KEYWORDS[type] || []).forEach((word) => {
      rest = stripKeywordPhrase(rest, word);
    });
    rest = stripCommandPrefix(rest);
    rest = rest.replace(/\s+[—–-]\s+/g, " ");
    return cleanText(rest);
  }
  // end: Голосовой ввод — убрать триггер-слова

  // start: Голосовой ввод — разбить список покупок
  function splitShoppingItems(text) {
    return cleanText(text)
      .split(/\s*,\s*|\s+и\s+|\s+а также\s+/i)
      .map((part) => cleanText(part))
      .filter(Boolean);
  }
  // end: Голосовой ввод — разбить список покупок

  // start: Голосовой ввод — распознать единицу измерения трекера
  function normalizeUnitToken(raw) {
    const token = String(raw || "").toLowerCase().trim();
    if (!token) return "";
    if (/^литр|^л$/.test(token)) return "литр";
    if (/^грамм|^гр$/.test(token)) return "грамм";
    if (/^шт|^штук/.test(token)) return "штук";
    if (/^таб/.test(token)) return "таблеток";
    if (/^порц/.test(token)) return "порций";
    if (/^стак/.test(token)) return "стаканов";
    if (/^час|^ч$/.test(token)) return "часов";
    if (/^раз/.test(token)) return "раз";
    if (/^км|^килом/.test(token)) return "км";
    if (/^ккал|^калор/.test(token)) return "ккал";
    return token.slice(0, 20);
  }

  function detectTrackerUnit(text, capturedUnit = "") {
    const fromCapture = normalizeUnitToken(capturedUnit);
    if (fromCapture) return fromCapture;
    const lower = String(text || "").toLowerCase();
    for (const group of UNIT_ALIASES) {
      for (const alias of group) {
        const rx = alias.length <= 2
          ? new RegExp(`(?:\\d\\s*)?${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\b|\\s)`, "i")
          : new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\w*\\b`, "i");
        if (rx.test(lower)) return group[0];
      }
    }
    return "штук";
  }
  // end: Голосовой ввод — единица трекера

  // start: Голосовой ввод — ограничить интервал «каждые X дней» под модель приложения (2–7)
  function capHabitEveryXDays(days) {
    return Math.min(7, Math.max(2, Number(days) || 2));
  }

  // start: Голосовой ввод — «через N дней»: пропустить N дней → интервал N+1 (через день = 2)
  function habitIntervalFromThroughDays(rawCount) {
    const skipped = parseCountToken(rawCount);
    if (skipped === null) return capHabitEveryXDays(2);
    return capHabitEveryXDays(skipped + 1);
  }
  // end: Голосовой ввод — интервал «через N дней»

  // start: Голосовой ввод — число из цифры или слова («два», «2»)
  function parseCountToken(raw) {
    const token = String(raw || "").toLowerCase().trim();
    if (/^\d+$/.test(token)) return Number(token);
    if (Object.prototype.hasOwnProperty.call(COUNT_WORDS, token)) return COUNT_WORDS[token];
    return null;
  }
  // end: Голосовой ввод — число из слова

  // start: Голосовой ввод — убрать остатки фраз периодичности из названия привычки
  function stripHabitFrequencyRemains(text) {
    let rest = String(text || "");
    const cleanup = [
      new RegExp(`(?:^|[\\s,—–-]+)${COUNT_TOKEN_RX}\\s+раз(?:а|ов|)?\\s+в\\s+недел${CYR_TAIL}`, "gi"),
      new RegExp(`(?:^|[\\s,—–-]+)раз\\s+в\\s+${COUNT_TOKEN_RX}\\s+дн${CYR_TAIL}`, "gi"),
      new RegExp(`(?:^|[\\s,—–-]+)через\\s+${COUNT_TOKEN_RX}\\s+дн${CYR_TAIL}`, "gi"),
      new RegExp(`(?:^|[\\s,—–-]+)каждые\\s+${COUNT_TOKEN_RX}\\s+дн${CYR_TAIL}`, "gi"),
      new RegExp(`(?:^|[\\s,—–-]+)каждые\\s+${COUNT_TOKEN_RX}\\s+недел${CYR_TAIL}`, "gi"),
      /(?:^|[\s,—–-]+)(?:раз\s+в\s+неделю|один\s+раз\s+в\s+неделю|еженедельно|каждую\s+неделю)/gi,
      /(?:^|[\s,—–-]+)(?:раз\s+в\s+месяц|каждый\s+месяц|ежемесячно|раз\s+в\s+две\s+недели|каждые\s+2\s+недели)/gi,
      /(?:^|[\s,—–-]+)(?:через\s+день|каждый\s+второй\s+день|раз\s+в\s+два\s+дня|раз\s+в\s+2\s+дня)/gi,
      /(?:^|[\s,—–-]+)(?:каждый\s+день|ежедневно|каждое\s+утро|каждый\s+вечер|каждую\s+ночь|регулярно)/gi,
      new RegExp(`(?:^|[\\s,—–-]+)(?:кажд(?:ый|ую|ое)\\s+)?(?:по\\s+)?${WEEKDAY_NAME_RX}`, "gi"),
      /(?:^|[\s,—–-]+)по\s+будням/gi,
      /(?:^|[\s,—–-]+)по\s+выходным/gi
    ];
    cleanup.forEach((rx) => { rest = rest.replace(rx, " "); });
    rest = rest.replace(/\s+и\s+/gi, " ");
    return cleanText(rest);
  }
  // end: Голосовой ввод — убрать остатки периодичности

  // start: Голосовой ввод — разобрать периодичность привычки из текста
  function parseHabitFrequency(rest) {
    let text = rest;
    let habitFreqType = "daily";
    let habitFrequencyDays = 1;
    let habitWeekTarget = null;
    let habitWeekMode = null;
    let habitWeekDays = [];

    const timesWeekMatch = text.match(new RegExp(`${COUNT_TOKEN_RX}\\s+раз(?:а|ов|)?\\s+в\\s+недел${CYR_TAIL}`, "i"));
    if (timesWeekMatch) {
      const count = parseCountToken(timesWeekMatch[1]);
      if (count !== null && count >= 2) {
        habitFreqType = "times_week";
        habitWeekTarget = Math.min(6, Math.max(2, count));
        habitWeekMode = "flexible";
        text = text.replace(timesWeekMatch[0], " ");
      } else if (count === 1) {
        habitFreqType = "every_x";
        habitFrequencyDays = 7;
        text = text.replace(timesWeekMatch[0], " ");
      }
    }

    const fixedDays = [];
    const weekdayRx = new RegExp(`(?:^|[\\s,]|(?<=и\\s))(?:кажд(?:ый|ую|ое)\\s+)?(?:по\\s+)?(${WEEKDAY_NAME_RX})`, "gi");
    let weekdayMatch;
    while ((weekdayMatch = weekdayRx.exec(text)) !== null) {
      const idx = findWeekdayIndex(weekdayMatch[1]);
      if (idx !== null) fixedDays.push(Number(idx));
    }
    if (/по\s+будням/i.test(text)) {
      [0, 1, 2, 3, 4].forEach((day) => fixedDays.push(day));
      text = text.replace(/по\s+будням/gi, " ");
    }
    if (/по\s+выходным/i.test(text)) {
      [5, 6].forEach((day) => fixedDays.push(day));
      text = text.replace(/по\s+выходным/gi, " ");
    }
    if (fixedDays.length) {
      habitFreqType = "times_week";
      habitWeekMode = "fixed";
      habitWeekDays = Array.from(new Set(fixedDays)).sort((a, b) => a - b);
      habitWeekTarget = Math.max(habitWeekTarget || 0, habitWeekDays.length);
      if (habitWeekTarget < 2) habitWeekTarget = Math.max(2, habitWeekDays.length);
      text = text.replace(new RegExp(`(?:^|[\\s,]|(?<=и\\s))(?:кажд(?:ый|ую|ое)\\s+)?(?:по\\s+)?${WEEKDAY_NAME_RX}`, "gi"), " ");
      text = text.replace(/\s+и\s+/gi, " ");
    } else if (/кажд(?:ый|ую|ое)\s+(?:понедельник|вторник|сред|четверг|пятниц|суббот|воскресен)/i.test(text)) {
      const singleDay = findWeekdayIndex(text);
      if (singleDay !== null) {
        habitFreqType = "every_x";
        habitFrequencyDays = 7;
        habitWeekTarget = null;
        habitWeekMode = null;
        habitWeekDays = [];
        text = text.replace(new RegExp(`(?:^|[\\s,])кажд(?:ый|ую|ое)\\s+${WEEKDAY_NAME_RX}`, "gi"), " ");
      }
    }

    const everyWeeksMatch = text.match(new RegExp(`каждые\\s+${COUNT_TOKEN_RX}\\s+недел${CYR_TAIL}`, "i"));
    if (everyWeeksMatch) {
      habitFreqType = "every_x";
      habitFrequencyDays = capHabitEveryXDays((parseCountToken(everyWeeksMatch[1]) || 1) * 7);
      text = text.replace(everyWeeksMatch[0], " ");
    }

    const everyDaysMatch = text.match(new RegExp(`каждые\\s+${COUNT_TOKEN_RX}\\s+дн${CYR_TAIL}`, "i"));
    if (everyDaysMatch) {
      habitFreqType = "every_x";
      habitFrequencyDays = capHabitEveryXDays(parseCountToken(everyDaysMatch[1]) || 2);
      text = text.replace(everyDaysMatch[0], " ");
    }

    const everyOtherMatch = text.match(new RegExp(`через\\s+${COUNT_TOKEN_RX}\\s+дн${CYR_TAIL}`, "i"));
    if (everyOtherMatch) {
      habitFreqType = "every_x";
      habitFrequencyDays = habitIntervalFromThroughDays(everyOtherMatch[1]);
      text = text.replace(everyOtherMatch[0], " ");
    } else if (/через\s+день|каждый\s+второй\s+день|раз\s+в\s+два\s+дня|раз\s+в\s+2\s+дня/i.test(text)) {
      habitFreqType = "every_x";
      habitFrequencyDays = capHabitEveryXDays(2);
      text = text.replace(/через\s+день|каждый\s+второй\s+день|раз\s+в\s+два\s+дня|раз\s+в\s+2\s+дня/gi, " ");
    }

    const everyXDaysMatch = text.match(new RegExp(`раз\\s+в\\s+${COUNT_TOKEN_RX}\\s+дн${CYR_TAIL}`, "i"));
    if (everyXDaysMatch) {
      habitFreqType = "every_x";
      habitFrequencyDays = capHabitEveryXDays(parseCountToken(everyXDaysMatch[1]) || 2);
      text = text.replace(everyXDaysMatch[0], " ");
    }

    if (/раз\s+в\s+месяц|каждый\s+месяц|ежемесячно/i.test(text)) {
      habitFreqType = "every_x";
      habitFrequencyDays = 7;
      text = text.replace(/раз\s+в\s+месяц|каждый\s+месяц|ежемесячно/gi, " ");
    }

    if (/раз\s+в\s+неделю|один\s+раз\s+в\s+неделю|еженедельно|каждую\s+неделю/i.test(text)) {
      habitFreqType = "every_x";
      habitFrequencyDays = 7;
      text = text.replace(/раз\s+в\s+неделю|один\s+раз\s+в\s+неделю|еженедельно|каждую\s+неделю/gi, " ");
    }

    if (/раз\s+в\s+две\s+недели|каждые\s+2\s+недели/i.test(text)) {
      habitFreqType = "every_x";
      habitFrequencyDays = 7;
      text = text.replace(/раз\s+в\s+две\s+недели|каждые\s+2\s+недели/gi, " ");
    }

    if (/каждый\s+день|ежедневно|каждое\s+утро|каждый\s+вечер|каждую\s+ночь|регулярно/i.test(text) && habitFreqType === "daily") {
      text = text.replace(/каждый\s+день|ежедневно|каждое\s+утро|каждый\s+вечер|каждую\s+ночь|регулярно/gi, " ");
    }

    text = stripHabitFrequencyRemains(text);

    return {
      habitFreqType,
      habitFrequencyDays,
      habitWeekTarget,
      habitWeekMode,
      habitWeekDays,
      text: cleanText(text)
    };
  }
  // end: Голосовой ввод — периодичность привычки

  // start: Голосовой ввод — разбор привычки
  function parseHabitSegment(segment) {
    let rest = segment;
    let habitWeekStartDay = 0;
    let notifyTime = "";
    let time = "";
    const remindMatch = rest.match(/(?:напомни|уведомление|напоминание)\s+(?:в|к|на)\s+(\d{1,2})(?::(\d{2}))?\s*(утра|утром|утро|дня|днём|днем|вечера|вечером|вечер|ночи|ночью|ночь)?/i);
    if (remindMatch) {
      notifyTime = normalizeTime(remindMatch[1], remindMatch[2], remindMatch[3] || remindMatch[0]);
      rest = rest.replace(remindMatch[0], " ");
    }
    const timeMatch = rest.match(/(?:^|\s)(?:в|к)\s+(\d{1,2})(?::(\d{2}))?\s*(утра|утром|утро|дня|днём|днем|вечера|вечером|вечер|ночи|ночью|ночь)?/i);
    if (timeMatch) {
      time = normalizeTime(timeMatch[1], timeMatch[2], timeMatch[3] || timeMatch[0]);
      rest = rest.replace(timeMatch[0], " ");
    }
    const freq = parseHabitFrequency(rest);
    rest = freq.text;
    const startMatch = rest.match(new RegExp(`(?:начиная\\s+)?(?:с|со)\\s+(${WEEKDAY_NAME_RX})`, "i"));
    if (startMatch) {
      const idx = findWeekdayIndex(startMatch[1]);
      if (idx !== null) habitWeekStartDay = Number(idx);
      rest = rest.replace(startMatch[0], " ");
    }
    const text = stripTypeKeywords(rest, "habit") || cleanText(rest) || "Привычка";
    return {
      type: "habit",
      text,
      habitFreqType: freq.habitFreqType,
      habitFrequencyDays: freq.habitFrequencyDays,
      habitWeekTarget: freq.habitWeekTarget,
      habitWeekMode: freq.habitWeekMode,
      habitWeekDays: freq.habitWeekDays,
      habitWeekStartDay,
      time,
      notifyTime
    };
  }
  // end: Голосовой ввод — разбор привычки

  // start: Голосовой ввод — разбор задачи
  function parseTaskSegment(segment, todayKey) {
    let work = segment;
    const dateInfo = extractDate(work, todayKey);
    work = dateInfo.rest;
    const timeInfo = extractTaskTimes(work);
    work = timeInfo.rest;
    work = work.replace(/\s+(?:с\s+)?(?:напоминанием|напоминание|напомни|уведомление)\s+(?:в|к|на)\s+\d{1,2}(?::\d{2})?\s*(?:утра|утром|утро|дня|днём|днем|вечера|вечером|вечер|ночи|ночью|ночь|часов)?/gi, " ");
    work = work.replace(/(?:^|[\s,—–-]+)(?:в|к|на)\s+\d{1,2}:\d{2}\s*(?:часов|ч\.?)?/gi, " ");
    work = work.replace(new RegExp(`(?:^|[\\s,—–-]+)(?:на|к|в)\\s+(?:\\d{1,2}|${hourWordPattern()})(?:\\s+час(?:${HOUR_UNIT_SUFFIX}|))?(?:\\s+(?:${SPOKEN_TIME_PERIOD}))?`, "gi"), " ");
    work = work.replace(/\s+(?:в|к|на)\s+\d{1,2}(?::\d{2})?\s*(?:утра|утром|утро|дня|днём|днем|вечера|вечером|вечер|ночи|ночью|ночь|часов)?/gi, " ");
    const text = stripTypeKeywords(work, "task") || cleanText(work) || "Задача";
    const taskTime = timeInfo.time || null;
    const dueDate = buildDueDate(dateInfo.date, taskTime);
    return {
      type: "task",
      text,
      date: dateInfo.date,
      time: taskTime,
      notifyTime: timeInfo.notifyTime || null,
      dueDate
    };
  }
  // end: Голосовой ввод — разбор задачи

  // start: Голосовой ввод — разбор покупок
  function parseShoppingSegment(segment) {
    let rest = segment;
    const listMatch = rest.match(/(?:в\s+покупки|список\s+покупок|добавь\s+в\s+покупки|в\s+магазин|закупка|продукты|купить)\s*[:\-]?\s*(.+)$/i);
    let itemsText = listMatch ? listMatch[1] : stripTypeKeywords(rest, "shopping");
    itemsText = itemsText.replace(/^купить\s+/i, "");
    const items = splitShoppingItems(itemsText);
    if (!items.length) items.push(stripTypeKeywords(rest, "shopping") || "Покупка");
    return { type: "shopping", items };
  }
  // end: Голосовой ввод — разбор покупок

  // start: Голосовой ввод — разбор заметки
  function parseNoteSegment(segment) {
    const text = stripTypeKeywords(segment, "note") || cleanText(segment);
    return { type: "note", text: text || "Заметка" };
  }
  // end: Голосовой ввод — разбор заметки

  // start: Голосовой ввод — разбор желания
  function parseWishlistSegment(segment) {
    const text = stripTypeKeywords(segment, "wishlist") || cleanText(segment);
    return { type: "wishlist", text: text || "Желание" };
  }
  // end: Голосовой ввод — разбор желания

  // start: Голосовой ввод — разбор трекера
  function parseTrackerSegment(segment) {
    let rest = segment;
    let trackerGoal = null;
    let capturedUnit = "";
    const goalMatch = rest.match(/(?:цель\s+)?(\d+(?:[.,]\d+)?)\s*(грамм\w*|гр\b|литр\w*|\bл\b|штук\w*|шт\b|таблет\w*|порц\w*|стакан\w*|час\w*|\bч\b|раз\w*|км\b|ккал\b|калор\w*)?(?:\s+в\s+день)?/i);
    if (goalMatch) {
      trackerGoal = Number(String(goalMatch[1]).replace(",", "."));
      capturedUnit = goalMatch[2] || "";
      rest = rest.replace(goalMatch[0], " ");
    }
    const trackerUnit = detectTrackerUnit(segment, capturedUnit);
    const text = stripTypeKeywords(rest, "tracker") || cleanText(segment) || "Показатель";
    return {
      type: "tracker",
      text,
      trackerUnit,
      trackerGoal: Number.isFinite(trackerGoal) ? trackerGoal : null
    };
  }
  // end: Голосовой ввод — разбор трекера

  // start: Голосовой ввод — главный разбор текста в массив сущностей
  function parseVoiceTranscript(text) {
    const todayKey = getTodayKey();
    const segments = splitIntoSegments(text);
    const items = [];
    segments.forEach((segment) => {
      const type = detectSegmentType(segment);
      if (type === "habit") items.push(parseHabitSegment(segment));
      else if (type === "shopping") items.push(parseShoppingSegment(segment));
      else if (type === "note") items.push(parseNoteSegment(segment));
      else if (type === "wishlist") items.push(parseWishlistSegment(segment));
      else if (type === "tracker") items.push(parseTrackerSegment(segment));
      else items.push(parseTaskSegment(segment, todayKey));
    });
    return items;
  }

function parseVoiceTranscript(text) {
  const todayKey = getTodayKey();
  const segments = splitIntoSegments(text);
  const items = [];
  segments.forEach((segment) => {
    const type = detectSegmentType(segment);
    if (type === "habit") items.push(parseHabitSegment(segment));
    else if (type === "shopping") items.push(parseShoppingSegment(segment));
    else if (type === "note") items.push(parseNoteSegment(segment));
    else if (type === "wishlist") items.push(parseWishlistSegment(segment));
    else if (type === "tracker") items.push(parseTrackerSegment(segment));
    else items.push(parseTaskSegment(segment, todayKey));
  });
  return items;
}
module.exports = { parseVoiceTranscript };
