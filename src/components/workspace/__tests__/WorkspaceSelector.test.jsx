import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkspaceSelector from '../WorkspaceSelector.jsx';

const mockSelectWorkspace = vi.fn();
const mockCreateWorkspace = vi.fn();
const mockUpdateWorkspace = vi.fn();
const mockDeleteWorkspace = vi.fn();

vi.mock('../../../context/WorkspaceContext.jsx', () => ({
  useWorkspaceContext: vi.fn(() => ({
    workspaces: [
      { id: 1, name: 'Workspace 1', role: 'admin' },
      { id: 2, name: 'Workspace 2', role: 'member' },
    ],
    activeWorkspace: { id: 1, name: 'Workspace 1', role: 'admin' },
    selectWorkspace: mockSelectWorkspace,
    createWorkspace: mockCreateWorkspace,
    updateWorkspace: mockUpdateWorkspace,
    deleteWorkspace: mockDeleteWorkspace,
  })),
}));

import { useWorkspaceContext } from '../../../context/WorkspaceContext.jsx';

describe('WorkspaceSelector Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show active workspace name on the trigger button', () => {
    render(<WorkspaceSelector />);
    expect(screen.getByText('Workspace 1')).toBeInTheDocument();
  });

  it('should show "Select Workspace" when no active workspace', () => {
    useWorkspaceContext.mockReturnValueOnce({
      workspaces: [],
      activeWorkspace: null,
      selectWorkspace: mockSelectWorkspace,
      createWorkspace: mockCreateWorkspace,
      updateWorkspace: mockUpdateWorkspace,
      deleteWorkspace: mockDeleteWorkspace,
    });

    render(<WorkspaceSelector />);
    expect(screen.getByText('Select Workspace')).toBeInTheDocument();
  });

  it('should open dropdown on click', async () => {
    const user = userEvent.setup();
    render(<WorkspaceSelector />);

    await user.click(screen.getByText('Workspace 1'));

    expect(screen.getByText('Workspace 2')).toBeInTheDocument();
    expect(screen.getByText('New Workspace')).toBeInTheDocument();
  });

  it('should select a workspace from dropdown', async () => {
    const user = userEvent.setup();
    render(<WorkspaceSelector />);

    await user.click(screen.getByText('Workspace 1'));
    await user.click(screen.getByText('Workspace 2'));

    expect(mockSelectWorkspace).toHaveBeenCalledWith({
      id: 2,
      name: 'Workspace 2',
      role: 'member',
    });
  });

  it('should show create input when New Workspace is clicked', async () => {
    const user = userEvent.setup();
    render(<WorkspaceSelector />);

    await user.click(screen.getByText('Workspace 1'));
    await user.click(screen.getByText('New Workspace'));

    expect(screen.getByPlaceholderText('Workspace name')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('should create workspace when Add is clicked', async () => {
    mockCreateWorkspace.mockResolvedValueOnce({
      success: true,
      workspace: { id: 3, name: 'New WS' },
    });

    const user = userEvent.setup();
    render(<WorkspaceSelector />);

    await user.click(screen.getByText('Workspace 1'));
    await user.click(screen.getByText('New Workspace'));
    await user.type(screen.getByPlaceholderText('Workspace name'), 'New WS');
    await user.click(screen.getByText('Add'));

    expect(mockCreateWorkspace).toHaveBeenCalledWith({ name: 'New WS' });
  });

  it('should create workspace on Enter key', async () => {
    mockCreateWorkspace.mockResolvedValueOnce({
      success: true,
      workspace: { id: 3, name: 'Enter WS' },
    });

    const user = userEvent.setup();
    render(<WorkspaceSelector />);

    await user.click(screen.getByText('Workspace 1'));
    await user.click(screen.getByText('New Workspace'));
    await user.type(screen.getByPlaceholderText('Workspace name'), 'Enter WS');
    await user.keyboard('{Enter}');

    expect(mockCreateWorkspace).toHaveBeenCalledWith({ name: 'Enter WS' });
  });

  it('should not show delete button for non-admin workspaces', async () => {
    const user = userEvent.setup();
    render(<WorkspaceSelector />);

    await user.click(screen.getByText('Workspace 1'));

    // Hover over workspace 2 (member role) — delete button should not be present
    const ws2Element = screen.getByText('Workspace 2').closest('div');
    // Delete buttons should only appear for admin workspaces
    // Count delete-related title attributes
    const deleteButtons = screen.queryAllByTitle('Delete');
    // Only workspace 1 (admin) should have a delete button
    expect(deleteButtons).toHaveLength(1);
  });

  it('should not create workspace with empty name', async () => {
    const user = userEvent.setup();
    render(<WorkspaceSelector />);

    await user.click(screen.getByText('Workspace 1'));
    await user.click(screen.getByText('New Workspace'));
    await user.click(screen.getByText('Add'));

    expect(mockCreateWorkspace).not.toHaveBeenCalled();
  });
});
