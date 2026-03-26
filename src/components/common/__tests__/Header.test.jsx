import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header.jsx';

vi.mock('../../../services/authService.js', () => ({
  authService: {
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn().mockResolvedValue({}),
    me: vi.fn(),
    refresh: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock('../../../services/workspaceService.js', () => ({
  workspaceService: {
    list: vi.fn().mockResolvedValue({ data: [] }),
    create: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../context/AuthContext.jsx', async () => {
  const React = await import('react');
  let mockValue = {
    user: null,
    loading: false,
    error: '',
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    isLoggedIn: vi.fn(() => false),
    clearError: vi.fn(),
  };
  return {
    AuthProvider: ({ children }) => children,
    useAuth: () => mockValue,
    __setMockValue: (val) => { mockValue = { ...mockValue, ...val }; },
  };
});

vi.mock('../../../context/WorkspaceContext.jsx', () => ({
  WorkspaceProvider: ({ children }) => children,
  useWorkspaceContext: vi.fn(() => ({
    workspaces: [],
    activeWorkspace: null,
    loading: false,
    error: '',
    initializing: false,
    selectWorkspace: vi.fn(),
    createWorkspace: vi.fn(),
    updateWorkspace: vi.fn(),
    deleteWorkspace: vi.fn(),
    refreshWorkspaces: vi.fn(),
  })),
}));

vi.mock('../../workspace/WorkspaceSelector.jsx', () => ({
  default: () => <div data-testid="workspace-selector">WorkspaceSelector</div>,
}));

vi.mock('../../auth/ChangePassword.jsx', () => ({
  default: ({ onClose }) => (
    <div data-testid="change-password-modal">
      <button onClick={onClose}>Close CP</button>
    </div>
  ),
}));

import { __setMockValue } from '../../../context/AuthContext.jsx';

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __setMockValue({
      user: null,
      loading: false,
      isLoggedIn: vi.fn(() => false),
      logout: vi.fn(),
    });
  });

  const renderHeader = () =>
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

  it('should render app name', () => {
    renderHeader();
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('should not show workspace selector or user menu when logged out', () => {
    renderHeader();
    expect(screen.queryByTestId('workspace-selector')).not.toBeInTheDocument();
  });

  it('should show workspace selector and user info when logged in', () => {
    __setMockValue({
      user: { id: 1, email: 'test@test.com', full_name: 'Test User' },
      loading: false,
      isLoggedIn: vi.fn(() => true),
      logout: vi.fn(),
    });

    renderHeader();

    expect(screen.getByTestId('workspace-selector')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should show email when full_name is absent', () => {
    __setMockValue({
      user: { id: 1, email: 'test@test.com' },
      loading: false,
      isLoggedIn: vi.fn(() => true),
      logout: vi.fn(),
    });

    renderHeader();

    expect(screen.getByText('test@test.com')).toBeInTheDocument();
  });

  it('should open user dropdown and show options', async () => {
    const user = userEvent.setup();
    __setMockValue({
      user: { id: 1, email: 'a@b.com', full_name: 'User' },
      loading: false,
      isLoggedIn: vi.fn(() => true),
      logout: vi.fn(),
    });

    renderHeader();

    await user.click(screen.getByText('User'));

    expect(screen.getByText('Change Password')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText('a@b.com')).toBeInTheDocument();
  });

  it('should call logout when Logout is clicked', async () => {
    const mockLogout = vi.fn();
    const user = userEvent.setup();
    __setMockValue({
      user: { id: 1, email: 'a@b.com', full_name: 'User' },
      loading: false,
      isLoggedIn: vi.fn(() => true),
      logout: mockLogout,
    });

    renderHeader();

    await user.click(screen.getByText('User'));
    await user.click(screen.getByText('Logout'));

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should open ChangePassword modal', async () => {
    const user = userEvent.setup();
    __setMockValue({
      user: { id: 1, email: 'a@b.com', full_name: 'User' },
      loading: false,
      isLoggedIn: vi.fn(() => true),
      logout: vi.fn(),
    });

    renderHeader();

    await user.click(screen.getByText('User'));
    await user.click(screen.getByText('Change Password'));

    expect(screen.getByTestId('change-password-modal')).toBeInTheDocument();
  });

  it('should show loading header when loading is true', () => {
    __setMockValue({
      user: null,
      loading: true,
      isLoggedIn: vi.fn(() => false),
      logout: vi.fn(),
    });

    renderHeader();

    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(screen.queryByTestId('workspace-selector')).not.toBeInTheDocument();
  });
});
