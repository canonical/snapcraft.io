import {
  templates
} from './screenshots';

describe('templates', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = document.createElement('div');
  });

  describe('row template', () => {
    it('should render content in Vanilla row pattern', () => {
      const result = templates.row('test-content');
      wrapper.innerHTML = result;

      expect(result).toContain('test-content');
      expect(wrapper.querySelector('.row')).not.toBeNull();
    });
  });

  describe('empty template', () => {
    it('should render `Add images` link', () => {
      const result = templates.empty();
      wrapper.innerHTML = result;

      expect(result).toContain('Add images');
      expect(wrapper.querySelector('.js-add-screenshots')).not.toBeNull();
    });
  });

  describe('screenshot template', () => {
    it('should render image with screenshot url', () => {
      const screenshot = { url: 'test-screenshot.png' };
      const result = templates.screenshot(screenshot);
      wrapper.innerHTML = result;

      expect(wrapper.querySelector('img').src).toBe(screenshot.url);
    });

    it('should mark selected screenshots', () => {
      const screenshot = { url: 'test-screenshot.png', selected: true };
      const result = templates.screenshot(screenshot);
      wrapper.innerHTML = result;

      expect(wrapper.querySelector('.p-screenshot').classList.contains('is-selected')).toBe(true);
    });

    it('should mark deleted screenshots', () => {
      const screenshot = { url: 'test-screenshot.png', status: 'delete' };
      const result = templates.screenshot(screenshot);
      wrapper.innerHTML = result;

      expect(wrapper.querySelector('.p-screenshot').classList.contains('is-deleted')).toBe(true);
    });
  });

  describe('changes template', () => {
    it('should render empty if no screenshots changed', () => {
      const result = templates.changes(0, 0);
      expect(result).toBe('');
    });

    it('should render singular when there is 1 screenshot to upload', () => {
      const result = templates.changes(1, 0);
      expect(result).toContain('1 image to upload');
      expect(result).not.toContain('to delete');
    });

    it('should render plural when there is more screenshots to upload', () => {
      const result = templates.changes(2, 0);
      expect(result).toContain('2 images to upload');
      expect(result).not.toContain('to delete');
    });

    it('should render singular when there is 1 screenshot to delete', () => {
      const result = templates.changes(0, 1);
      expect(result).not.toContain('to upload');
      expect(result).toContain('1 image to delete');
    });

    it('should render plural when there is more screenshots to upload', () => {
      const result = templates.changes(0, 2);
      expect(result).not.toContain('to upload');
      expect(result).toContain('2 images to delete');
    });

    it('should render both when needed', () => {
      const result = templates.changes(3, 2);
      expect(result).toContain('3 images to upload');
      expect(result).toContain('2 images to delete');
    });
  });
});
