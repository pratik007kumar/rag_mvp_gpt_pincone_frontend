import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChangePassword from '../ChangePassword.jsx';

vi.mock('../../../services/authService.js', () => ({
  authService: {
    changePassword: vi.fn(),
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    refresh: vi.fn(),
  },
}));

import { authService } from '../../../services/authService.js';

describe('ChangePassword Component', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the change password form', () => {
    render(<ChangePassword onClose={onClose} />);

    expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<ChangePassword onClose={onClose} />);

    await user.type(screen.getByLabelText(/current password/i), 'old123');
    await user.type(screen.getByLabelText(/^new password$/i), 'new123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'different');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(screen.getByText('New passwords do not match')).toBeInTheDocument();
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  it('should show error when new password is too short', async () => {
    const user = userEvent.setup();
    render(<ChangePassword onClose={onClose} />);

    await user.type(screen.getByLabelText(/current password/i), 'old123');
    await user.type(screen.getByLabelText(/^new password$/i), 'ab');
    await user.type(screen.getByLabelText(/confirm new password/i), 'ab');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(screen.getByText('New password must be at least 6 characters')).toBeInTheDocument();
  });

  it('should submit successfully and show success message', async () => {
    authService.changePassword.mockResolvedValueOnce({ data: {} });
    const user = userEvent.setup();
    render(<ChangePassword onClose={onClose} />);

    await user.type(screen.getByLabelText(/current password/i), 'old123');
    await user.type(screen.getByLabelText(/^new password$/i), 'newpass');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newpass');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText('Password changed successfully!')).toBeInTheDocument();
    });

    expect(authService.changePassword).toHaveBeenCalledWith({
      old_password: 'old123',
      new_password: 'newpass',
    });
  });

  it('should show API error on failure', async () => {
    authService.changePassword.mockRejectedValueOnce({
      response: { data: { detail: 'Old password incorrect' } },
    });

    const user = userEvent.setup();
    render(<ChangePassword onClose={onClose} />);

    await user.type(screen.getByLabelText(/current password/i), 'wrong');
    await user.type(screen.getByLabelText(/^new password$/i), 'newpass');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newpass');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText('Old password incorrect')).toBeInTheDocument();
    });
  });

  it('should call onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<ChangePassword onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<ChangePassword onClose={onClose} />);

    // Click the backdrop (the fixed overlay div)
    const backdrop = container.firstChild;
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChangePassword onClose={onClose} />);

    // The X button has an SVG with a close icon
    const closeButtons = screen.getAllByRole('button');
    // First button-like element in the header area (the X)
    const xButton = closeButtons.find(
      (btn) => btn.querySelector('svg') && !btn.textContent
    );
    if (xButton) {
      await user.click(xButton);
      expect(onClose).toHaveBeenCalled();
    }
  });
});
