// start: тесты разбора голосовых команд — якорный и свободный режим
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseVoiceText } from './parseIntent';

// start: фиксированная «сегодня» для относительных дат
const FIXED_NOW = new Date('2026-09-15T10:00:00+03:00');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});
// end: фиксированная дата

describe('parseVoiceText — диктовка по полям (якоря)', () => {
  const FIELD_DICTATION =
    'Доход 1000 руб Процедура Клиент 12соболева Настюсделай Тел Дата 15.09 Время Длительность Заметки что у нее аллергия на кошек она опаздываетстоимость процедуры ХХХХХХуб';

  it('разбирает реальный пример с ошибками STT', () => {
    const result = parseVoiceText(FIELD_DICTATION);

    expect(result.intent).toBe('create_appointment');
    expect(result.priceRub).toBe(1000);
    expect(result.clientName).toBe('Соболева Настя');
    expect(result.time).toBe('12:00');
    expect(result.date).toBe('2026-09-15');
    expect(result.notes?.toLowerCase()).toContain('аллергия');
    expect(result.notes?.toLowerCase()).toContain('опаздывает');
    expect(result.notes?.toLowerCase()).not.toMatch(/х{3,}/);
    expect(result.serviceNames.some((s) => /х+/i.test(s))).toBe(false);
  });

  it('не дублирует цену в заметках', () => {
    const result = parseVoiceText(FIELD_DICTATION);
    expect(result.notes).not.toMatch(/1000/);
    expect(result.notes?.toLowerCase()).not.toContain('стоимость процедуры');
  });

  it('оставляет пустую процедуру, если не названа', () => {
    const result = parseVoiceText(FIELD_DICTATION);
    expect((result.serviceName ?? '').trim()).toBe('');
    expect(result.serviceNames).toHaveLength(0);
  });
});

describe('parseVoiceText — свободная фраза', () => {
  it('разбирает запись одной фразой', () => {
    const result = parseVoiceText(
      'Запиши Настю Соболеву на маникюр завтра в 12 аллергия на кошек тысяча рублей',
    );

    expect(result.intent).toBe('create_appointment');
    expect(result.clientName).toBe('Настя Соболева');
    expect(result.serviceName).toBe('маникюр');
    expect(result.time).toBe('12:00');
    expect(result.date).toBe('2026-09-16');
    expect(result.priceRub).toBe(1000);
    expect(result.notes?.toLowerCase()).toContain('аллергия');
    expect(result.clientName?.toLowerCase()).not.toContain('аллергия');
  });

  it('понимает время «в 12» на кириллице', () => {
    const result = parseVoiceText('запиши олю на маникюр завтра в 12');
    expect(result.time).toBe('12:00');
  });

  it('понимает цену словами', () => {
    const result = parseVoiceText('маникюр марине две тысячи рублей');
    expect(result.priceRub).toBe(2000);
  });
});

describe('parseVoiceText — заметки внутри якоря', () => {
  it('не режет заметки повторным якорем «процедуры»', () => {
    const result = parseVoiceText(
      'Клиент Марина Заметки аллергия на латекс стоимость процедуры не обсуждали',
    );

    expect(result.clientName).toMatch(/Марина/i);
    expect(result.notes?.toLowerCase()).toContain('аллергия');
    expect(result.notes?.toLowerCase()).toContain('латекс');
    expect(result.serviceNames.some((s) => /обсуждали/i.test(s))).toBe(false);
  });
});

describe('parseVoiceText — свободная речь с «процедура длится»', () => {
  const YANA_CASE =
    'Запиши Яну Турчинскую на ламинирование ресниц за 900 рублей на 14.30. Процедура длится 30 минут. В заметке запиши, что она любит болтать много и иногда приходит раньше.';

  it('разбирает кейс Яна Турчинская — услуга, длительность, заметки отдельно', () => {
    const result = parseVoiceText(YANA_CASE);

    expect(result.priceRub).toBe(900);
    expect(result.time).toBe('14:30');
    expect(result.durationMin).toBe(30);
    expect(result.clientName?.toLowerCase()).toMatch(/турчинск/);
    expect(result.clientName?.toLowerCase()).toMatch(/яна|яну/);
    expect(result.serviceName?.toLowerCase()).toMatch(/ламинирование|ресниц/);
    expect(result.serviceName?.toLowerCase()).not.toMatch(/длится|заметк|болта/);
    expect(result.notes?.toLowerCase()).toMatch(/болта/);
    expect(result.notes?.toLowerCase()).toMatch(/раньше/);
    expect(result.notes?.toLowerCase()).not.toMatch(/длится/);
  });

  it('наращивание ресниц из словаря, «процедура длится» — в длительность', () => {
    const result = parseVoiceText(
      'Запиши на наращивание ресниц 3D за 1500 рублей. Процедура длится 30 минут.',
    );

    expect(result.durationMin).toBe(30);
    expect(result.priceRub).toBe(1500);
    expect(result.serviceName?.toLowerCase()).toMatch(/наращивание|ресниц/);
    expect(result.serviceName?.toLowerCase()).toMatch(/3d/);
    expect(result.serviceName?.toLowerCase()).not.toMatch(/длится|минут/);
  });

  it('явная фраза «на процедуру наращивания ресниц» — в поле процедуры', () => {
    const result = parseVoiceText(
      'Запиши Марину на процедуру наращивания ресниц за 2000. Процедура длится 45 минут.',
    );

    expect(result.durationMin).toBe(45);
    expect(result.serviceName?.toLowerCase()).toMatch(/наращивание|ресниц/);
    expect(result.serviceName?.toLowerCase()).not.toMatch(/длится/);
  });
});

describe('parseVoiceText — цена не в имени', () => {
  it('не кладёт «стоимость» в имя клиента', () => {
    const result = parseVoiceText(
      'запиши марину на маникюр стоимость две тысячи рублей',
    );
    expect(result.clientName?.toLowerCase()).not.toContain('стоимость');
    expect(result.clientName?.toLowerCase()).toMatch(/марин/);
    expect(result.priceRub).toBe(2000);
  });

  it('не кладёт «стоимость процедуры» в имя', () => {
    const result = parseVoiceText('клиент оля стоимость процедуры 1500');
    expect(result.clientName?.toLowerCase()).not.toContain('стоимость');
    expect(result.clientName?.toLowerCase()).not.toContain('процедуры');
    expect(result.priceRub).toBe(1500);
  });
});

describe('parseVoiceText — ламинирование бровей + полчаса', () => {
  it('не кладёт «процедура» в клиента, услуга макс. 3 слова, длительность отдельно', () => {
    const result = parseVoiceText(
      'Запиши Машу Иванову на процедуру ламинирования бровей она будет длиться полчаса',
    );

    expect(result.clientName?.toLowerCase()).toMatch(/маша/);
    expect(result.clientName?.toLowerCase()).toMatch(/иванов/);
    expect(result.clientName?.toLowerCase()).not.toMatch(/процедур/);
    expect(result.serviceName?.toLowerCase()).toMatch(/ламинирование|бров/);
    expect(result.serviceName?.toLowerCase()).not.toMatch(/длит|полчас|будет|она|процедур/);
    expect((result.serviceName ?? '').split(/\s+/).length).toBeLessThanOrEqual(3);
    expect(result.durationMin).toBe(30);
  });

  it('понимает опечатку STT «лабиминирования бровей»', () => {
    const result = parseVoiceText(
      'Запиши Машу Иванову на лабиминирования бровей она будет длиться полчасаи',
    );

    expect(result.serviceName?.toLowerCase()).toMatch(/ламинирование|бров/);
    expect(result.durationMin).toBe(30);
  });
});

describe('parseVoiceText — мостики и якоря заметок', () => {
  it('не кладёт «будет» и «заметке» в клиента', () => {
    const result = parseVoiceText(
      'Запиши Машу Иванову на ламинирование бровей она будет длиться полчаса',
    );

    expect(result.clientName?.toLowerCase()).toMatch(/маша/);
    expect(result.clientName?.toLowerCase()).toMatch(/иванов/);
    expect(result.clientName?.toLowerCase()).not.toMatch(/будет|заметк|длит/);
  });

  it('не кладёт «заметке» и «заметки» в поле клиента', () => {
    const result = parseVoiceText(
      'Запиши Олю на маникюр в заметке она часто опаздывает',
    );

    expect(result.clientName?.toLowerCase()).toMatch(/ол/);
    expect(result.clientName?.toLowerCase()).not.toMatch(/заметк|заметке|заметки/);
    expect(result.notes?.toLowerCase()).toMatch(/она/);
    expect(result.notes?.toLowerCase()).toMatch(/опаздывает/);
  });

  it('«длится» не попадает в заметки, «она» в заметке — ok', () => {
    const result = parseVoiceText(
      'Запиши Марину на маникюр за 1500. Процедура длится 30 минут. В заметке она часто опаздывает.',
    );

    expect(result.durationMin).toBe(30);
    expect(result.notes?.toLowerCase()).toMatch(/опаздывает/);
    expect(result.notes?.toLowerCase()).toMatch(/она/);
    expect(result.notes?.toLowerCase()).not.toMatch(/длится|заметке/);
  });

  it('второй проход находит «полторы тысячи»', () => {
    const result = parseVoiceText(
      'Запиши Олю на маникюр полторы тысячи она будет длиться полчаса',
    );

    expect(result.priceRub).toBe(1500);
    expect(result.durationMin).toBe(30);
  });

  it('«урок по английскому» попадает в поле процедуры', () => {
    const result = parseVoiceText('Запиши Петю урок по английскому за 1500');

    expect(result.serviceName?.toLowerCase()).toMatch(/урок английского/);
  });

  it('«на урок по английскому» попадает в поле процедуры', () => {
    const result = parseVoiceText('Запиши Петю на урок по английскому за 1500');

    expect(result.serviceName?.toLowerCase()).toMatch(/урок английского/);
  });

  it('«на урок по английскому языку» — STT часто добавляет «языку»', () => {
    const result = parseVoiceText('Запиши на урок по английскому языку за 1500');

    expect(result.serviceName?.toLowerCase()).toMatch(/урок английского/);
  });
});

describe('parseVoiceText — «Даша от мамы»', () => {
  const DASHA_CASE =
    'Запиши на сегодня на 21:00Дашу от мамыНа ламинирование бровей за 700 руб. в заметках запиши отдать ей мыло';

  it('клиент «Даша от мамы», не старое имя; заметки без «х» от «заметках»', () => {
    const result = parseVoiceText(DASHA_CASE);

    expect(result.time).toBe('21:00');
    expect(result.priceRub).toBe(700);
    expect(result.clientName).toBe('Даша от мамы');
    expect(result.clientName?.toLowerCase()).toMatch(/даш/);
    expect(result.clientName?.toLowerCase()).toMatch(/мам/);
    expect(result.clientName?.toLowerCase()).not.toMatch(/алин|работ/);
    expect(result.serviceName?.toLowerCase()).toMatch(/ламинирование|бров/);
    expect(result.notes?.toLowerCase()).toMatch(/мыл/);
    expect(result.notes?.toLowerCase()).not.toMatch(/^х\b|\bх\s|заметк/);
  });

  it('«Свету от Даши» — не путает с другим клиентом', () => {
    const result = parseVoiceText(
      'Запиши Свету от Даши на маникюр завтра в 15:00',
    );

    expect(result.clientName?.toLowerCase()).toMatch(/свет/);
    expect(result.clientName?.toLowerCase()).toMatch(/даш/);
    expect(result.clientName?.toLowerCase()).not.toMatch(/алин|работ/);
  });
});

describe('parseVoiceText — «Алина с работы»', () => {
  const ALINA_CASE =
    'Запиши на 19:00 Алину с работы на брови за 700 руб.В заметки она очень громкая';

  it('сохраняет предлог «с работы» в имени, без мусора от «руб.»', () => {
    const result = parseVoiceText(ALINA_CASE);

    expect(result.time).toBe('19:00');
    expect(result.priceRub).toBe(700);
    expect(result.clientName?.toLowerCase()).toMatch(/алин/);
    expect(result.clientName?.toLowerCase()).toMatch(/с\s+работ/);
    expect(result.clientName?.toLowerCase()).not.toMatch(/убв|руб|работы\s+у/);
    expect(result.notes?.toLowerCase()).toMatch(/громк/);
  });
});

describe('parseVoiceText — диктовка с полями после заметки', () => {
  const INNA_CASE =
    'Запиши на сегодня Инну на 19:00 в заметке добавь что она опаздывает стоимость процедуры 1500 процедура наращивание ресниц длительность 03:00';

  it('разбирает поля после «в заметке» и длительность 03:00', () => {
    const result = parseVoiceText(INNA_CASE);

    expect(result.time).toBe('19:00');
    expect(result.priceRub).toBe(1500);
    expect(result.durationMin).toBe(180);
    expect(result.clientName?.toLowerCase()).toMatch(/инн/);
    expect(result.serviceName?.toLowerCase()).toMatch(/наращивание|ресниц/);
    expect(result.notes?.toLowerCase()).toMatch(/она/);
    expect(result.notes?.toLowerCase()).toMatch(/опаздывает/);
    expect(result.notes?.toLowerCase()).not.toMatch(/добавь|запиши|стоимость|длительность|03:00/);
  });
});

describe('parseVoiceText — смысловые заметки', () => {
  it('сохраняет «любит» в тексте заметки', () => {
    const result = parseVoiceText('запиши в заметки что она любит кокос');
    expect(result.notes?.toLowerCase()).toMatch(/любит/);
    expect(result.notes?.toLowerCase()).toMatch(/кокос/);
  });

  it('сохраняет «предпочитает» в тексте заметки', () => {
    const result = parseVoiceText('запиши что она предпочитает зеленый чай');
    expect(result.notes?.toLowerCase()).toMatch(/предпочитает/);
    expect(result.notes?.toLowerCase()).toMatch(/зелен/);
    expect(result.notes?.toLowerCase()).toMatch(/чай/);
  });

  it('сохраняет «просит» в тексте заметки', () => {
    const result = parseVoiceText('в заметках что она просит скидки');
    expect(result.notes?.toLowerCase()).toMatch(/просит/);
    expect(result.notes?.toLowerCase()).toMatch(/скидк/);
  });
});

describe('parseVoiceText — имя клиента без мусора', () => {
  it('не кладёт «что» в имя клиента', () => {
    const result = parseVoiceText('запиши что марину на маникюр завтра в 12');
    expect(result.clientName?.toLowerCase()).toMatch(/марин/);
    expect(result.clientName?.toLowerCase()).not.toMatch(/что/);
  });

  it('не кладёт «на», «за» и «ногтей» в имя клиента', () => {
    const result = parseVoiceText('запиши юлю на маникюр ногтей за 1500 рублей');
    expect(result.clientName?.toLowerCase()).toMatch(/юл/);
    expect(result.clientName?.toLowerCase()).not.toMatch(/на|за|ногт/);
  });

  it('сохраняет «от мамы» и «с работы» в имени', () => {
    const fromMom = parseVoiceText('запиши дашу от мамы на ламинирование бровей');
    expect(fromMom.clientName?.toLowerCase()).toMatch(/даш/);
    expect(fromMom.clientName?.toLowerCase()).toMatch(/от\s+мам/);
    expect(fromMom.clientName?.toLowerCase()).not.toMatch(/\bна\b|\bза\b/);

    const fromWork = parseVoiceText('запиши алину с работы на брови за 700');
    expect(fromWork.clientName?.toLowerCase()).toMatch(/алин/);
    expect(fromWork.clientName?.toLowerCase()).toMatch(/с\s+работ/);
  });
});

describe('parseVoiceText — обломок команды в начале', () => {
  it('не кладёт «Пиши» в имя клиента', () => {
    const result = parseVoiceText('пиши на сегодня юлю от мамы на маникюр');
    expect(result.clientName?.toLowerCase()).toMatch(/юл/);
    expect(result.clientName?.toLowerCase()).toMatch(/мам/);
    expect(result.clientName?.toLowerCase()).not.toMatch(/пиши/);
  });

  it('не кладёт «Напиши» в имя клиента', () => {
    const result = parseVoiceText('напиши юлю от мамы на маникюр');
    expect(result.clientName?.toLowerCase()).toMatch(/юл/);
    expect(result.clientName?.toLowerCase()).toMatch(/мам/);
    expect(result.clientName?.toLowerCase()).not.toMatch(/напиш/i);
  });
});

describe('parseVoiceText — расходы', () => {
  it('распознаёт расход с суммой и описанием', () => {
    const result = parseVoiceText('запиши расход 1500 рублей на материалы для маникюра');
    expect(result.intent).toBe('add_expense');
    expect(result.expenseAmountRub).toBe(1500);
    expect(result.expenseDescription?.toLowerCase()).toMatch(/материал/);
    expect(result.clientName).toBeUndefined();
  });

  it('«запиши Марину на маникюр» остаётся записью, не расходом', () => {
    const result = parseVoiceText('запиши марину на маникюр');
    expect(result.intent).toBe('create_appointment');
    expect(result.clientName?.toLowerCase()).toMatch(/марин/);
  });

  it('распознаёт траты и закупку', () => {
    const expense = parseVoiceText('добавь трату 800 на кофе');
    expect(expense.intent).toBe('add_expense');
    expect(expense.expenseAmountRub).toBe(800);

    const purchase = parseVoiceText('запиши закупку 2300 материалы');
    expect(purchase.intent).toBe('add_expense');
    expect(purchase.expenseAmountRub).toBe(2300);
  });
});

describe('parseVoiceText — intent', () => {
  it('распознаёт только заметку без якоря «заметка»', () => {
    const result = parseVoiceText('запомни что марина любит френч');
    expect(result.intent).toBe('add_note');
    expect(result.notes?.toLowerCase()).toContain('марин');
    expect(result.notes?.toLowerCase()).toContain('любит');
  });

  it('не понимает пустой мусор', () => {
    const result = parseVoiceText('э э ну типа');
    expect(result.intent).toBe('unknown');
  });
});
// end: тесты разбора голосовых команд
