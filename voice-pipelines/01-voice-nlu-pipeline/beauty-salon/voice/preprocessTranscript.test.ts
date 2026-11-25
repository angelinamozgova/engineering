// start: тесты предобработки расшифровки STT
import { describe, expect, it } from 'vitest';
import { preprocessTranscript } from './preprocessTranscript';

describe('preprocessTranscript', () => {
  it('разлепляет цифры и буквы', () => {
    expect(preprocessTranscript('12соболева')).toContain('12');
    expect(preprocessTranscript('12соболева')).toContain('соболева');
  });

  it('отделяет команду от имени', () => {
    const result = preprocessTranscript('настюсделай');
    expect(result).toMatch(/настю/);
    expect(result).toMatch(/сделай/);
  });

  it('переводит тысяча рублей в 1000', () => {
    expect(preprocessTranscript('тысяча рублей')).toContain('1000');
  });

  it('разлепляет «мамына» → «мамы на»', () => {
    expect(preprocessTranscript('дашу от мамына ламинирование')).toContain('мамы на');
  });

  it('разделяет «руб.» и следующую букву без пробела', () => {
    expect(preprocessTranscript('700 руб.в заметки')).toContain('руб. в');
  });

  it('сохраняет контекст стоимости для последующего разбора', () => {
    const result = preprocessTranscript('стоимость процедуры ХХХХХХуб');
    expect(result.toLowerCase()).toContain('стоимость');
    expect(result.toLowerCase()).toContain('процедуры');
  });

  it('разлепляет опаздывает и стоимость', () => {
    const result = preprocessTranscript('она опаздываетстоимость');
    expect(result).toMatch(/опаздывает/);
    expect(result).toMatch(/стоимость/);
  });

  it('разлепляет услугу, склеенную с именем («мамыламинирование»)', () => {
    const result = preprocessTranscript('дашу от мамыламинирование бровей');
    expect(result).toContain('мамы на');
    expect(result).toMatch(/ламинирование/);
  });

  it('разлепляет «светуотдаши» по словарю имён', () => {
    const result = preprocessTranscript('запиши светуотдаши на маникюр');
    expect(result).toMatch(/свету от/);
    expect(result).toMatch(/даш/);
  });

  it('разлепляет якорь заметок, склеенный с текстом', () => {
    const result = preprocessTranscript('700 руб взаметках запиши мыло');
    expect(result).toMatch(/заметк/);
    expect(result).toMatch(/в заметк|руб в/);
  });

  it('не режет слово «длительность» внутри', () => {
    expect(preprocessTranscript('длительность 03:00')).toContain('длительность');
    expect(preprocessTranscript('длительность 03:00')).not.toMatch(/дли тель/);
  });
});
// end: тесты предобработки расшифровки STT
