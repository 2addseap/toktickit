import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
} from "../api.js";
import { useAuth } from "../context/AuthContext.js";

export default function UserManagement() {
  const { currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    role: "REQUESTER",
    department: "",
    isActive: true,
    initialPassword: "",
  });
  const [addFormErrors, setAddFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingAdd, setIsSubmittingAdd] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "REQUESTER",
    department: "",
    isActive: true,
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Reset Password State (inside Edit modal)
  const [resetPasswordInput, setResetPasswordInput] = useState<string>("");
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<string | null>(null);
  const [isSubmittingReset, setIsSubmittingReset] = useState<boolean>(false);

  // Load users from API
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers(searchTerm, roleFilter);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Compute active administrators count across directory
  const activeAdminCount = users.filter(
    (u) => u.role === "ADMINISTRATOR" && u.isActive
  ).length;

  // -------------------------------------------------------------------------
  // Handlers for Add User
  // -------------------------------------------------------------------------
  const handleOpenAddModal = () => {
    setAddForm({
      name: "",
      email: "",
      role: "REQUESTER",
      department: "",
      isActive: true,
      initialPassword: "",
    });
    setAddFormErrors({});
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const validateAddForm = () => {
    const errors: Record<string, string> = {};
    if (!addForm.name.trim()) {
      errors.name = "Full name is required.";
    }
    if (!addForm.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    if (!addForm.initialPassword) {
      errors.initialPassword = "Initial password is required.";
    } else if (addForm.initialPassword.length < 8) {
      errors.initialPassword = "Password must be at least 8 characters.";
    }
    setAddFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddForm()) return;

    setIsSubmittingAdd(true);
    setAddError(null);

    try {
      await createAdminUser({
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        role: addForm.role,
        department: addForm.department.trim() || undefined,
        isActive: addForm.isActive,
        initialPassword: addForm.initialPassword,
      });

      setIsAddModalOpen(false);
      setSuccessMessage(`User "${addForm.name}" created successfully.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchUsers();
    } catch (err: any) {
      setAddError(err.message || "Failed to create user.");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // -------------------------------------------------------------------------
  // Handlers for Edit User
  // -------------------------------------------------------------------------
  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || "",
      isActive: user.isActive ?? true,
    });
    setEditFormErrors({});
    setEditError(null);
    setResetPasswordInput("");
    setResetPasswordError(null);
    setResetPasswordSuccess(null);
  };

  const validateEditForm = () => {
    const errors: Record<string, string> = {};
    if (!editForm.name.trim()) {
      errors.name = "Full name is required.";
    }
    if (!editForm.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !validateEditForm()) return;

    setIsSubmittingEdit(true);
    setEditError(null);

    try {
      await updateAdminUser(editingUser.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        role: editForm.role as any,
        department: editForm.department.trim() || null,
        isActive: editForm.isActive,
      });

      setEditingUser(null);
      setSuccessMessage(`User "${editForm.name}" updated successfully.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchUsers();
    } catch (err: any) {
      setEditError(err.message || "Failed to update user.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleResetPassword = async () => {
    if (!editingUser) return;
    if (!resetPasswordInput || resetPasswordInput.length < 8) {
      setResetPasswordError("Password must be at least 8 characters in length.");
      return;
    }

    setIsSubmittingReset(true);
    setResetPasswordError(null);
    setResetPasswordSuccess(null);

    try {
      await resetAdminUserPassword(editingUser.id, resetPasswordInput);
      setResetPasswordSuccess("Password reset successfully. The user must change password on next login.");
      setResetPasswordInput("");
      fetchUsers();
    } catch (err: any) {
      setResetPasswordError(err.message || "Failed to reset password.");
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Helper checks for safety guardrails
  const isEditingSelf = editingUser ? editingUser.id === currentUser?.id : false;
  const isLastActiveAdmin = editingUser
    ? editingUser.role === "ADMINISTRATOR" && editingUser.isActive && activeAdminCount <= 1
    : false;

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return <span className="badge-role-admin">Administrator</span>;
      case "IT_STAFF":
        return <span className="badge-role-staff">IT Staff</span>;
      default:
        return <span className="badge-role-requester">Requester</span>;
    }
  };

  return (
    <div className="user-management-container" data-testid="user-management-screen">
      {/* Header Strip */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <h2 className="fw-bold mb-0 text-dark">User Management</h2>
          <span className="badge bg-secondary rounded-pill fs-6 px-3 py-1" data-testid="user-count-badge">
            {users.length} {users.length === 1 ? "user" : "users"}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-zen-primary d-flex align-items-center gap-2"
          onClick={handleOpenAddModal}
          data-testid="add-user-btn"
        >
          <span>➕</span> Add User
        </button>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {successMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage(null)}
            aria-label="Close"
          />
        </div>
      )}

      {/* Main Card with Filter Bar and Table */}
      <div className="zen-card p-4 mb-4">
        {/* Filter Controls Bar */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-8">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">🔍</span>
              <input
                type="text"
                className="form-control zen-input border-start-0"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setSearchTerm("")}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="col-12 col-md-4">
            <select
              className="form-select zen-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              data-testid="role-filter"
            >
              <option value="">All Roles</option>
              <option value="REQUESTER">Requester</option>
              <option value="IT_STAFF">IT Staff</option>
              <option value="ADMINISTRATOR">Administrator</option>
            </select>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading users...</span>
            </div>
            <p className="text-muted mt-2">Loading user directory...</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Table View */}
        {!isLoading && !error && users.length > 0 && (
          <div className="table-responsive">
            <table className="zen-table table-hover align-middle" data-testid="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="zen-table-row" data-testid={`user-row-${u.id}`}>
                    <td className="fw-semibold text-dark">{u.name}</td>
                    <td className="text-muted">{u.email}</td>
                    <td>{u.department || <span className="text-muted fst-italic">—</span>}</td>
                    <td>{renderRoleBadge(u.role)}</td>
                    <td>
                      {u.isActive ? (
                        <span className="badge-status-active" data-testid="status-active">
                          ● Active
                        </span>
                      ) : (
                        <span className="badge-status-inactive" data-testid="status-inactive">
                          ○ Inactive
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                        onClick={() => handleOpenEditModal(u)}
                        data-testid={`edit-user-btn-${u.id}`}
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && users.length === 0 && (
          <div className="text-center py-5" data-testid="no-users-message">
            <p className="fs-5 text-muted mb-2">No users found.</p>
            <p className="text-muted small mb-3">Try adjusting your search criteria or role filter.</p>
            {(searchTerm || roleFilter) && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Add User Modal */}
      {/* ------------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
          role="dialog"
          data-testid="add-user-modal"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header zen-header text-white">
                <h5 className="modal-title fw-bold">Add New User</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setIsAddModalOpen(false)}
                  aria-label="Close"
                />
              </div>
              <form onSubmit={handleCreateUser}>
                <div className="modal-body p-4">
                  {addError && (
                    <div className="alert alert-danger py-2 small mb-3" data-testid="add-user-error">
                      {addError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control zen-input ${addFormErrors.name ? "is-invalid" : ""}`}
                      value={addForm.name}
                      onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      data-testid="add-name-input"
                    />
                    {addFormErrors.name && (
                      <div className="invalid-feedback">{addFormErrors.name}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className={`form-control zen-input ${addFormErrors.email ? "is-invalid" : ""}`}
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                      placeholder="e.g. john.doe@kmutt.ac.th"
                      data-testid="add-email-input"
                    />
                    {addFormErrors.email && (
                      <div className="invalid-feedback">{addFormErrors.email}</div>
                    )}
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark">
                        Role <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select zen-select"
                        value={addForm.role}
                        onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                        data-testid="add-role-select"
                      >
                        <option value="REQUESTER">Requester</option>
                        <option value="IT_STAFF">IT Staff</option>
                        <option value="ADMINISTRATOR">Administrator</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark">Department</label>
                      <input
                        type="text"
                        className="form-control zen-input"
                        value={addForm.department}
                        onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                        placeholder="e.g. Computer Engineering"
                        data-testid="add-dept-input"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark">
                      Initial Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className={`form-control zen-input ${addFormErrors.initialPassword ? "is-invalid" : ""}`}
                      value={addForm.initialPassword}
                      onChange={(e) => setAddForm({ ...addForm, initialPassword: e.target.value })}
                      placeholder="Minimum 8 characters"
                      data-testid="add-password-input"
                    />
                    {addFormErrors.initialPassword && (
                      <div className="invalid-feedback">{addFormErrors.initialPassword}</div>
                    )}
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="addUserIsActiveSwitch"
                      checked={addForm.isActive}
                      onChange={(e) => setAddForm({ ...addForm, isActive: e.target.checked })}
                      data-testid="add-isactive-switch"
                    />
                    <label className="form-check-label fw-semibold text-dark" htmlFor="addUserIsActiveSwitch">
                      Account Active
                    </label>
                  </div>

                  <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-0">
                    <span>ℹ️</span>
                    <span>User will be required to change this temporary password upon first login.</span>
                  </div>
                </div>

                <div className="modal-footer bg-light px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setIsAddModalOpen(false)}
                    disabled={isSubmittingAdd}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-zen-primary"
                    disabled={isSubmittingAdd}
                    data-testid="submit-add-user-btn"
                  >
                    {isSubmittingAdd ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Edit User Modal */}
      {/* ------------------------------------------------------------------- */}
      {editingUser && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
          role="dialog"
          data-testid="edit-user-modal"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header zen-header text-white">
                <h5 className="modal-title fw-bold">Edit User: {editingUser.name}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditingUser(null)}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body p-4">
                {editError && (
                  <div className="alert alert-danger py-2 small mb-3" data-testid="edit-user-error">
                    {editError}
                  </div>
                )}

                {/* Safety Alerts */}
                {isEditingSelf && (
                  <div className="alert alert-warning py-2 small mb-3">
                    ⚠️ <strong>Self-Deactivation Guardrail:</strong> You cannot deactivate your own account.
                  </div>
                )}
                {isLastActiveAdmin && (
                  <div className="alert alert-warning py-2 small mb-3" data-testid="last-admin-warning">
                    ⚠️ <strong>Last Active Administrator:</strong> System must maintain at least one active Administrator. Deactivation and role demotion are guarded.
                  </div>
                )}

                <form onSubmit={handleUpdateUser}>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark">
                        Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control zen-input ${editFormErrors.name ? "is-invalid" : ""}`}
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        data-testid="edit-name-input"
                      />
                      {editFormErrors.name && (
                        <div className="invalid-feedback">{editFormErrors.name}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark">
                        Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className={`form-control zen-input ${editFormErrors.email ? "is-invalid" : ""}`}
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        data-testid="edit-email-input"
                      />
                      {editFormErrors.email && (
                        <div className="invalid-feedback">{editFormErrors.email}</div>
                      )}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark">Role</label>
                      <select
                        className="form-select zen-select"
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        disabled={isLastActiveAdmin}
                        title={isLastActiveAdmin ? "Cannot change role of last active Administrator" : undefined}
                        data-testid="edit-role-select"
                      >
                        <option value="REQUESTER">Requester</option>
                        <option value="IT_STAFF">IT Staff</option>
                        <option value="ADMINISTRATOR">Administrator</option>
                      </select>
                      {isLastActiveAdmin && (
                        <small className="text-muted d-block mt-1">
                          Role locked to Administrator (last active Administrator).
                        </small>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark">Department</label>
                      <input
                        type="text"
                        className="form-control zen-input"
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        data-testid="edit-dept-input"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="editUserIsActiveSwitch"
                        checked={editForm.isActive}
                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                        disabled={isEditingSelf || isLastActiveAdmin}
                        data-testid="edit-isactive-switch"
                      />
                      <label className="form-check-label fw-semibold text-dark" htmlFor="editUserIsActiveSwitch">
                        Account Active
                      </label>
                    </div>
                    {isEditingSelf && (
                      <small className="text-muted d-block mt-1" data-testid="self-deactivation-notice">
                        You cannot deactivate your own account.
                      </small>
                    )}
                    {isLastActiveAdmin && !isEditingSelf && (
                      <small className="text-muted d-block mt-1">
                        Cannot deactivate the last active Administrator.
                      </small>
                    )}
                  </div>

                  <div className="d-flex justify-content-end gap-2 mb-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setEditingUser(null)}
                      disabled={isSubmittingEdit}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-zen-primary"
                      disabled={isSubmittingEdit}
                      data-testid="submit-edit-user-btn"
                    >
                      {isSubmittingEdit ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>

                <hr className="my-4" />

                {/* Sub-section: Reset Initial Password */}
                <div className="p-3 bg-light rounded" data-testid="reset-password-section">
                  <h6 className="fw-bold text-dark mb-2">🔑 Reset Initial Password</h6>
                  <p className="text-muted small mb-3">
                    Assign a new temporary password. The user will be required to change it on their next login.
                  </p>

                  {resetPasswordSuccess && (
                    <div className="alert alert-success py-2 small mb-3" data-testid="reset-success-alert">
                      {resetPasswordSuccess}
                    </div>
                  )}

                  {resetPasswordError && (
                    <div className="alert alert-danger py-2 small mb-3" data-testid="reset-error-alert">
                      {resetPasswordError}
                    </div>
                  )}

                  <div className="input-group">
                    <input
                      type="password"
                      className="form-control zen-input"
                      placeholder="New Temporary Password (min 8 chars)"
                      value={resetPasswordInput}
                      onChange={(e) => setResetPasswordInput(e.target.value)}
                      data-testid="reset-password-input"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-primary fw-semibold"
                      onClick={handleResetPassword}
                      disabled={isSubmittingReset || !resetPasswordInput}
                      data-testid="reset-password-btn"
                    >
                      {isSubmittingReset ? "Resetting..." : "Reset Password"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
