import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext.jsx';
import Auth from '../Auth.jsx';

vi.mock('../../../services/authService.js', () => ({
  authService: {
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    refresh: vi.fn(),
    changePassword: vi.fn(),
  },
}));

import { authService } from '../../../services/authService.js';

const renderAuth = () =>
  render(
    <MemoryRouter initialEntries={['/signin']}>
      <AuthProvider>
        <Auth />
      </AuthProvider>
    </MemoryRouter>
  );

describe('Auth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render sign in form by default', () => {
    renderAuth();

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
  });

  it('should toggle to sign up form', async () => {
    const user = userEvent.setup();
    renderAuth();

    await user.click(screen.getByText('Sign up'));

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it('should toggle back to sign in', async () => {
    const user = userEvent.setup();
    renderAuth();

    await user.click(screen.getByText('Sign up'));
    await user.click(screen.getByText('Sign in'));

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
  });

  it('should call login on sign in form submit', async () => {
    authService.login.mockResolvedValueOnce({
      data: { access_token: 'tok', user: { id: 1, email: 'a@b.com' } },
    });

    const user = userEvent.setup();
    renderAuth();

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/password/i), 'pass123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'a@b.com', password: 'pass123' })
      );
    });
  });

  it('should call signup then login on sign up form submit', async () => {
    authService.signup.mockResolvedValueOnce({ data: { id: 1 } });
    authService.login.mockResolvedValueOnce({
      data: { access_token: 'tok', user: { id: 1, email: 'new@test.com' } },
    });

    const user = userEvent.setup();
    renderAuth();

    await user.click(screen.getByText('Sign up'));
    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/email/i), 'new@test.com');
    await user.type(screen.getByLabelText(/password/i), 'pass123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(authService.signup).toHaveBeenCalled();
    });
  });

  it('should display error on failed login', async () => {
    authService.login.mockRejectedValueOnce({
      response: { data: { detail: 'Invalid credentials' } },
    });

    const user = userEvent.setup();
    renderAuth();

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should clear form and error when toggling mode', async () => {
    authService.login.mockRejectedValueOnce({
      response: { data: { detail: 'Bad creds' } },
    });

    const user = userEvent.setup();
    renderAuth();

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Bad creds')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Sign up'));

    expect(screen.queryByText('Bad creds')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveValue('');
  });
});
