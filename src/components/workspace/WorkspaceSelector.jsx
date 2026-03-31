import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceContext } from '../../context/WorkspaceContext.jsx';

const WorkspaceSelector = () => {
  const {
    workspaces,
    activeWorkspace,
    selectWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
  } = useWorkspaceContext();

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setCreating(false);
        setEditing(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus input when creating/editing
  useEffect(() => {
    if ((creating || editing) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creating, editing]);

  const handleCreate = async () => {
    if (!inputValue.trim()) return;
    await createWorkspace({ name: inputValue.trim() });
    setInputValue('');
    setCreating(false);
  };

  const handleUpdate = async () => {
    if (!inputValue.trim() || !editing) return;
    await updateWorkspace(editing, { name: inputValue.trim() });
    setInputValue('');
    setEditing(null);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Delete this workspace and all its data?')) {
      await deleteWorkspace(id);
    }
  };

  const startEditing = (e, ws) => {
    e.stopPropagation();
    setEditing(ws.id);
    setInputValue(ws.name);
    setCreating(false);
  };

  const startCreating = () => {
    setCreating(true);
    setEditing(null);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (creating) handleCreate();
      else if (editing) handleUpdate();
    }
    if (e.key === 'Escape') {
      setCreating(false);
      setEditing(null);
      setInputValue('');
    }
  };

  return (
    <div className="workspaceDropdown" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors duration-150 text-sm"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
        <span className="text-gray-700 max-w-[160px] truncate">
          {activeWorkspace?.name || 'Select Workspace'}
        </span>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="btnOption absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Workspace list */}
          <div className="max-h-60 overflow-y-auto py-1">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => {
                  selectWorkspace(ws);
                  setOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors duration-100 group ${
                  activeWorkspace?.id === ws.id
                    ? 'bg-gray-100'
                    : 'hover:bg-gray-50'
                }`}
              >
                {editing === ws.id ? (
                  <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 px-2 py-0.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-sm text-gray-700 truncate flex-1">{ws.name}</span>
                )}
                <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editing === ws.id ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpdate(); }}
                      className="text-gray-500 hover:text-green-600 p-0.5"
                      title="Save"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={(e) => startEditing(e, ws)}
                        className="editbtn text-gray-400 hover:text-gray-600 p-0.5"
                        title="Rename"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      {ws.role === 'admin' && (
                        <button
                          onClick={(e) => handleDelete(e, ws.id)}
                          className="deletBtn text-gray-400 hover:text-red-600 p-0.5"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Create workspace input */}
          {creating ? (
            <div className="border-t border-gray-200 px-3 py-2 flex gap-2">
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Workspace name"
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <button
                onClick={handleCreate}
                className="px-2 py-1 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors"
              >
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={startCreating}
              className="w-full border-t border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Workspace
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceSelector;
