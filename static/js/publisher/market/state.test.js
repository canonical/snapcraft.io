import { updateState, diffState } from './state';

describe('updateState', () => {
  let state;

  beforeEach(() => {
    state = {
      title: 'Default test title'
    };
  });

  describe('when passing FormData values', () => {
    let formData;

    beforeEach(() => {
      formData = new FormData();
    });

    test('should add value from allowed keys', () => {
      formData.set('summary', 'Test summary');
      updateState(state, formData);

      expect(state.summary).toBe('Test summary');
    });

    test('should update value from allowed keys', () => {
      formData.set('title', 'Test title');
      updateState(state, formData);

      expect(state.title).toBe('Test title');
    });

    test('should not add value not from allowed keys', () => {
      formData.set('something', 'Test something');
      updateState(state, formData);

      expect(state.something).toBeUndefined();
    });
  });

  describe('when passing object with values', () => {
    test('should add value from allowed keys', () => {
      updateState(state, {
        summary: 'Test summary'
      });

      expect(state.summary).toBe('Test summary');
    });

    test('should update value from allowed keys', () => {
      updateState(state, {
        title: 'Test title'
      });

      expect(state.title).toBe('Test title');
    });

    test('should not add value not from allowed keys', () => {
      updateState(state, {
        something: 'Test something'
      });

      expect(state.something).toBeUndefined();
    });
  });
});


describe('diffState', () => {

  test('should return null if states are equal is empty', () => {
    expect(diffState({
      title: 'Test title'
    }, {
      title: 'Test title'
    })).toBeNull();
  });

  test('should return diff containing only changed fields', () => {
    expect(diffState({
      title: 'Test title',
      summary: 'Test summary',
    }, {
      title: 'Test title',
      summary: 'Test summary changed',
      something: 'Test something'
    })).toEqual({
      summary: 'Test summary changed'
    });
  });

  // when comparing images
  describe('when comparing images in state', () => {
    test('should remove images marked for deletion', () => {
      expect(diffState({
        images: [
          { url: 'test1.png', status: 'uploaded' },
          { url: 'test2.png', status: 'uploaded' }
        ]
      }, {
        images: [
          { url: 'test1.png', status: 'uploaded' },
          { url: 'test2.png', status: 'delete' },
          { url: 'test3.png', status: 'new' }
        ]
      })).toEqual({
        images: [
          { url: 'test1.png', status: 'uploaded' },
          { url: 'test3.png', status: 'new' }
        ]
      });
    });

    test('should ignore selected status', () => {
      expect(diffState({
        images: [
          { url: 'test1.png', status: 'uploaded' },
          { url: 'test2.png', status: 'uploaded' }
        ]
      }, {
        images: [
          { url: 'test1.png', status: 'uploaded', selected: false },
          { url: 'test2.png', status: 'uploaded', selected: true }
        ]
      })).toBeNull();
    });
  });

});
