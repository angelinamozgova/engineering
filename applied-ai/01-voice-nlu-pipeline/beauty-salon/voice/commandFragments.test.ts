// start: тесты обломков команд STT
import { describe, expect, it } from 'vitest';
import { isCommandFragment, stripLeadingCommandFragment } from './commandFragments';

describe('commandFragments', () => {
  it('распознаёт «пиши» как обломок «запиши»', () => {
    expect(isCommandFragment('пиши')).toBe(true);
  });

  it('не считает имя клиента обломком команды', () => {
    expect(isCommandFragment('юлю')).toBe(false);
  });

  it('убирает «пиши» только в начале фразы', () => {
    expect(stripLeadingCommandFragment('пиши на сегодня юлю от мамы')).toBe(
      'на сегодня юлю от мамы',
    );
  });

  it('не трогает «пиши» в середине', () => {
    expect(stripLeadingCommandFragment('в заметках пиши что она любит чай')).toBe(
      'в заметках пиши что она любит чай',
    );
  });

  it('распознаёт полное «напиши» как команду', () => {
    expect(isCommandFragment('напиши')).toBe(true);
    expect(stripLeadingCommandFragment('напиши юлю на маникюр')).toBe('юлю на маникюр');
  });
});
// end: тесты обломков команд STT
