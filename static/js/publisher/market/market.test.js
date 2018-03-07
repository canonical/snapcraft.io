import market from './market';

describe('initSnapIconEdit', () => {
  let input;
  let icon;

  beforeEach(() => {
    icon = document.createElement('a');
    icon.id = 'test-icon-id';
    document.body.appendChild(icon);

    input = document.createElement('input');
    input.id = 'test-id';
    document.body.appendChild(input);

    URL.createObjectURL = jest.fn().mockReturnValue('test-url');
  });

  test('should set icon src on input change', () => {
    market.initSnapIconEdit('test-icon-id', 'test-id');

    let event = new Event('change');
    // mock list of files on input
    Object.defineProperty(input, 'files', {
      value: []
    });
    input.dispatchEvent(event);

    expect(icon.src).toBe('test-url');
  });
});
