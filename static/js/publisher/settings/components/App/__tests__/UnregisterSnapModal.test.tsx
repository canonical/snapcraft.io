import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from "@testing-library/user-event"; 
import '@testing-library/jest-dom';
import { UnregisterSnapModal } from '../../UnregisterSnapModal';

// Mock the global fetch function
global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({}),
})) as jest.Mock;

const mockSetUnregisterModalOpen = jest.fn();
const mockSetUnregisterError = jest.fn();
const mockSetUnregisterErrorMessage = jest.fn();

const defaultProps = {
  snapName: 'test-snap',
  setUnregisterModalOpen: mockSetUnregisterModalOpen,
  setUnregisterError: mockSetUnregisterError,
  setUnregisterErrorMessage: mockSetUnregisterErrorMessage,
};

describe('UnregisterSnapModal', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    mockSetUnregisterModalOpen.mockClear();
    mockSetUnregisterError.mockClear();
    mockSetUnregisterErrorMessage.mockClear();
  });

  test('renders the modal with the correct snap name', () => {
    render(<UnregisterSnapModal {...defaultProps} />);
    expect(screen.getByText('Unregister "test-snap"')).toBeInTheDocument();
  });

  test('closes the modal when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<UnregisterSnapModal {...defaultProps} />);
    await user.click(screen.getByText('Cancel'));
    expect(mockSetUnregisterModalOpen).toHaveBeenCalledWith(false);
  });

  test('disables the Unregister button and shows spinner when clicked', async () => {
    const user = userEvent.setup();
    render(<UnregisterSnapModal {...defaultProps} />);
    const unregisterButton = screen.getByText('Unregister');
    await user.click(unregisterButton);
    expect(unregisterButton).toHaveAttribute("aria-disabled","true");
    expect(screen.getByText('Unregistering...')).toBeInTheDocument();
  });

  test('calls fetch with correct parameters and redirects on success', async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
    render(<UnregisterSnapModal {...defaultProps} />);
    await user.click(screen.getByText('Unregister'));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/packages/test-snap', expect.objectContaining({
        method: 'DELETE',
        headers: {
          'X-CSRFToken': window['CSRF_TOKEN'],
        },
      }));
      expect(window.location.href).toBe('/snaps');
    });
  });

  test('handles errors correctly', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'Some error occurred' }),
    }));
    render(<UnregisterSnapModal {...defaultProps} />);
    await user.click(screen.getByText('Unregister'));
    await waitFor(() => {
      expect(mockSetUnregisterModalOpen).toHaveBeenCalledWith(false);
      expect(mockSetUnregisterError).toHaveBeenCalledWith(true);
      expect(mockSetUnregisterErrorMessage).toHaveBeenCalledWith('Some error occurred');
    });
  });

  test('logs error to console if fetch throws', async () => {
    const user = userEvent.setup();
    console.error = jest.fn();
    (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.reject('Fetch error'));
    render(<UnregisterSnapModal {...defaultProps} />);
    await user.click(screen.getByText('Unregister'));
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Fetch error');
    });
  });
});
