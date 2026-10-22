// start: тесты поиска услуги по словарю
import { describe, expect, it } from 'vitest';
import { preprocessTranscript } from './preprocessTranscript';
import { resolveServicesFromText } from './serviceResolution';

describe('resolveServicesFromText', () => {
  it('ламинирование бровей + она будет длиться полчаса', () => {
    const raw =
      'запиши машу иванову на процедуру ламинирования бровей она будет длиться полчаса';
    const cleaned = preprocessTranscript(raw);
    const services = resolveServicesFromText(cleaned);

    expect(services.join(', ').toLowerCase()).toMatch(/ламинирование|бров/);
  });

  it('наращивание ресниц 3D + процедура длится', () => {
    const raw =
      'Запиши на наращивание ресниц 3D за 1500 рублей. Процедура длится 30 минут.';
    const cleaned = preprocessTranscript(raw);
    const services = resolveServicesFromText(cleaned);

    expect(cleaned).toMatch(/3d/i);
    expect(services.join(', ').toLowerCase()).toMatch(/наращивание/);
    expect(services.join(', ').toLowerCase()).toMatch(/3d/);
  });

  it('лазерная эпиляция — распознаёт тип и фразу «на лазерную эпиляцию»', () => {
    const raw = 'Запиши Олю на лазерную эпиляцию бикини за 2500 рублей';
    const cleaned = preprocessTranscript(raw);
    const services = resolveServicesFromText(cleaned);

    expect(services.join(', ').toLowerCase()).toMatch(/лазерн/);
    expect(services.join(', ').toLowerCase()).toMatch(/бикини/);
  });

  it('диодная эпиляция — из словаря и контекста', () => {
    const raw = 'Запиши на диодную эпиляцию ног на пятницу за 3000';
    const cleaned = preprocessTranscript(raw);
    const services = resolveServicesFromText(cleaned);

    expect(services.join(', ').toLowerCase()).toMatch(/диодн/);
  });

  it('фотосессия / съёмка — синонимы для фотографа', () => {
    const raw = 'Запиши семью Ивановых на фотосессию в студии за 5000';
    const cleaned = preprocessTranscript(raw);
    const services = resolveServicesFromText(cleaned);

    expect(services.join(', ').toLowerCase()).toMatch(/фото/);
  });

  it('урок английского — для репетитора', () => {
    const raw = 'Запиши Петю на урок английского за 1500 на среду в 17:00';
    const cleaned = preprocessTranscript(raw);
    const services = resolveServicesFromText(cleaned);

    expect(services.join(', ').toLowerCase()).toMatch(/урок английского/);
  });

  it('урок по английскому — с предлогом «по»', () => {
    const raw = 'Запиши Петю урок по английскому за 1500';
    const cleaned = preprocessTranscript(raw);
    const services = resolveServicesFromText(cleaned);

    expect(services.join(', ').toLowerCase()).toMatch(/урок английского/);
  });

  it('урок по английскому языку — четыре слова до нормализации', () => {
    const raw = 'Запиши на урок по английскому языку за 1500';
    const cleaned = preprocessTranscript(raw);
    const services = resolveServicesFromText(cleaned);

    expect(cleaned.toLowerCase()).toContain('урок английского');
    expect(services.join(', ').toLowerCase()).toMatch(/урок английского/);
  });

  it('урок танцев — занятие для хореографа', () => {
    const raw = 'Запиши Катю на урок танцев за 800';
    const cleaned = preprocessTranscript(raw);
    const services = resolveServicesFromText(cleaned);

    expect(services.join(', ').toLowerCase()).toMatch(/урок танцев/);
  });

  it('не путает «на Марину» с услугой', () => {
    const raw = 'Запиши на марину на маникюр за 1200';
    const cleaned = preprocessTranscript(raw);
    const services = resolveServicesFromText(cleaned);

    expect(services.join(', ').toLowerCase()).toMatch(/маникюр/);
    expect(services.join(', ').toLowerCase()).not.toMatch(/марин/);
  });
});
// end: тесты поиска услуги
