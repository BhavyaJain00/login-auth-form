import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ADMIN DASHBOARD
 * Complete admin control panel for tenant management
 * - Manage users
 * - Create/Edit/Delete forms
 * - View submissions
 * - Publish forms
 */
export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, logout, getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [forms, setForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [publishedForms, setPublishedForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateFormModal, setShowCreateFormModal] = useState(false);
  const [showAssignFormModal, setShowAssignFormModal] = useState(false);
  const [showUserSubmissionsModal, setShowUserSubmissionsModal] = useState(false);
  const [showSubmissionDetailsModal, setShowSubmissionDetailsModal] = useState(false);
  const [selectedFormForAssign, setSelectedFormForAssign] = useState(null);
  const [selectedUserForSubmissions, setSelectedUserForSubmissions] = useState(null);
  const [selectedSubmissionDetails, setSelectedSubmissionDetails] = useState(null);
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [newUserData, setNewUserData] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [newFormData, setNewFormData] = useState({
    title: "",
    description: "",
  });

  const API_URL = import.meta.env.VITE_API_URL;
  const token = getToken();

  // Fetch users on component mount
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "forms") {
      fetchForms();
    } else if (activeTab === "submissions") {
      fetchSubmissions();
    } else if (activeTab === "published") {
      fetchPublishedForms();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublishedForms = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/api/forms/public`);

      if (!response.ok) throw new Error("Failed to fetch published forms");
      const data = await response.json();
      setPublishedForms(data.forms || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchForms = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/api/admin/forms`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch forms");
      const data = await response.json();
      setForms(data.forms || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/api/admin/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch submissions");
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setError("");

      if (!newUserData.username || !newUserData.email || !newUserData.password || !newUserData.passwordConfirm) {
        setError("All fields are required");
        return;
      }

      if (newUserData.password !== newUserData.passwordConfirm) {
        setError("Passwords do not match");
        return;
      }

      const response = await fetch(`${API_URL}/api/admin/users/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUserData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setUsers([...users, data.user]);
      setNewUserData({
        username: "",
        email: "",
        password: "",
        passwordConfirm: "",
      });
      setShowCreateUserModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      setError("");
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete user");

      setUsers(users.filter((u) => u._id !== userId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateForm = async (e) => {
    e.preventDefault();
    try {
      setError("");

      if (!newFormData.title) {
        setError("Form title is required");
        return;
      }

      const response = await fetch(`${API_URL}/api/admin/forms/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newFormData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setForms([...forms, data.form]);
      setNewFormData({
        title: "",
        description: "",
      });
      setShowCreateFormModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePublishForm = async (formId) => {
    try {
      setError("");
      const response = await fetch(`${API_URL}/api/admin/forms/${formId}/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      // Update forms list
      setForms(forms.map((f) => (f._id === formId ? data.form : f)));

      // Show public link
      alert(`Form published! Public link:\n${data.publicLink}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteForm = async (formId) => {
    if (!window.confirm("Are you sure you want to delete this form and all its submissions?")) return;

    try {
      setError("");
      const response = await fetch(`${API_URL}/api/admin/forms/${formId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete form");

      setForms(forms.filter((f) => f._id !== formId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenAssignForm = (form) => {
    setSelectedFormForAssign(form);
    // Extract user IDs from assignedUsers (which may be objects or strings)
    const userIds = form.assignedUsers?.map(user => typeof user === 'string' ? user : user._id) || [];
    setAssignedUsers(userIds);
    setShowAssignFormModal(true);
  };

  const handleToggleUserAssignment = (userId) => {
    if (assignedUsers.includes(userId)) {
      setAssignedUsers(assignedUsers.filter(id => id !== userId));
    } else {
      setAssignedUsers([...assignedUsers, userId]);
    }
  };

  const handleSaveFormAssignment = async () => {
    if (!selectedFormForAssign) return;

    try {
      setError("");
      const response = await fetch(`${API_URL}/api/admin/forms/${selectedFormForAssign._id}/assign-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds: assignedUsers }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      // Update forms list
      setForms(forms.map((f) => (f._id === selectedFormForAssign._id ? data.form : f)));
      setShowAssignFormModal(false);
      alert("Form assignments updated successfully!");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewUserSubmissions = async (user) => {
    try {
      setLoading(true);
      setError("");
      setSelectedUserForSubmissions(user);
      
      const response = await fetch(`${API_URL}/api/admin/users/${user._id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load submissions");

      setUserSubmissions(data.submissions || []);
      setShowUserSubmissionsModal(true);
    } catch (err) {
      setError(err.message || "Failed to load user submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome, {user?.username}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("users")}
            className={`py-2 px-4 font-medium ${
              activeTab === "users"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("forms")}
            className={`py-2 px-4 font-medium ${
              activeTab === "forms"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Forms
          </button>
          <button
            onClick={() => setActiveTab("submissions")}
            className={`py-2 px-4 font-medium ${
              activeTab === "submissions"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Submissions
          </button>
          <button
            onClick={() => setActiveTab("published")}
            className={`py-2 px-4 font-medium ${
              activeTab === "published"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Published
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Manage Users</h2>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                + Create User
              </button>
            </div>

            {loading ? (
              <p>Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-gray-600">No users yet. Create your first user to get started.</p>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td className="px-6 py-4 whitespace-nowrap">{u.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => handleViewUserSubmissions(u)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            View Submissions
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Published Tab */}
        {activeTab === "published" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Published Forms</h2>
            </div>

            {loading ? (
              <p>Loading published forms...</p>
            ) : publishedForms.length === 0 ? (
              <p className="text-gray-600">No published forms yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {publishedForms.map((f) => {
                  const publicUrl = `${window.location.origin}/form/${f.publicFormToken}`;
                  return (
                    <div key={f._id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium">{f.title}</h3>
                        <p className="text-sm text-gray-500">{f.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <a href={publicUrl} target="_blank" rel="noreferrer" className="text-blue-600">Open</a>
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(publicUrl);
                              alert('Copied public URL to clipboard');
                            } catch (err) {
                              // fallback prompt
                              window.prompt('Copy this URL', publicUrl);
                            }
                          }}
                          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                        >
                          Copy URL
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Forms Tab */}
        {activeTab === "forms" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Manage Forms</h2>
              <button
                onClick={() => setShowCreateFormModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                + Create Form
              </button>
            </div>

            {loading ? (
              <p>Loading forms...</p>
            ) : forms.length === 0 ? (
              <p className="text-gray-600">No forms yet. Create your first form.</p>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fields</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Users</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {forms.map((form) => (
                      <tr key={form._id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{form.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{form.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{form.fields?.length || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            form.isPublished ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {form.isPublished ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {form.assignedUsers?.length || 0} users
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => navigate(`/admin/forms/${form._id}/edit`)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleOpenAssignForm(form)}
                            className="text-purple-600 hover:text-purple-900 font-medium"
                          >
                            Assign
                          </button>
                          {!form.isPublished && (
                            <button
                              onClick={() => handlePublishForm(form._id)}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              Publish
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteForm(form._id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Submissions Tab */}
        {activeTab === "submissions" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Form Submissions</h2>

            {loading ? (
              <p>Loading submissions...</p>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Form</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          No submissions yet.
                        </td>
                      </tr>
                    ) : (
                      submissions.map((sub) => (
                        <tr key={sub._id}>
                          <td className="px-6 py-4 whitespace-nowrap">{sub.formId?.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{sub.userId?.username}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => {
                                if (user?.role === "ADMIN") {
                                  setSelectedSubmissionDetails(sub);
                                  setShowSubmissionDetailsModal(true);
                                } else {
                                  alert("Only admins can view submission details");
                                }
                              }}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Create New User</h3>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={newUserData.username}
                onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />

              <input
                type="email"
                placeholder="Email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />

              <input
                type="password"
                placeholder="Password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />

              <input
                type="password"
                placeholder="Confirm Password"
                value={newUserData.passwordConfirm}
                onChange={(e) => setNewUserData({ ...newUserData, passwordConfirm: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Create New Form</h3>

            <form onSubmit={handleCreateForm} className="space-y-4">
              <input
                type="text"
                placeholder="Form Title"
                value={newFormData.title}
                onChange={(e) => setNewFormData({ ...newFormData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />

              <textarea
                placeholder="Description (optional)"
                value={newFormData.description}
                onChange={(e) => setNewFormData({ ...newFormData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="3"
              />

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateFormModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Create Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Users to Form Modal */}
      {showAssignFormModal && selectedFormForAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">Assign Users to "{selectedFormForAssign.title}"</h3>

            <div className="space-y-3 mb-6">
              {users.length === 0 ? (
                <p className="text-gray-500">No users available</p>
              ) : (
                users.map((user) => (
                  <label key={user._id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={assignedUsers.includes(user._id)}
                      onChange={() => handleToggleUserAssignment(user._id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="flex-1">
                      <span className="font-medium">{user.username}</span>
                      <span className="text-gray-600 text-sm"> ({user.email})</span>
                    </span>
                  </label>
                ))
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAssignFormModal(false);
                  setSelectedFormForAssign(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFormAssignment}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Save Assignments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Submissions Modal */}
      {showUserSubmissionsModal && selectedUserForSubmissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-6xl w-full max-h-96 overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">Submissions by {selectedUserForSubmissions.username}</h3>

            {userSubmissions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No submissions yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Form Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted Date</th>
                      {/* Dynamic form field headers */}
                      {userSubmissions.length > 0 && userSubmissions[0].formId?.fields?.map((field) => (
                        <th key={field._id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {field.label || field.type}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userSubmissions.map((submission) => (
                      <tr key={submission._id}>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-sm">
                          {submission.formId?.title || "N/A"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </td>
                        {/* Dynamic form data columns */}
                        {submission.formId?.fields?.map((field) => (
                          <td key={field._id} className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                            {submission.answers?.[field._id] 
                              ? (Array.isArray(submission.answers[field._id]) 
                                  ? submission.answers[field._id].join(", ") 
                                  : String(submission.answers[field._id]))
                              : "-"}
                          </td>
                        ))}
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            onClick={() => {
                              setSelectedSubmissionDetails(submission);
                              setShowSubmissionDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Full Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-2 justify-end mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowUserSubmissionsModal(false);
                  setSelectedUserForSubmissions(null);
                  setUserSubmissions([]);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Submission Details Modal */}
      {showSubmissionDetailsModal && selectedSubmissionDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">
              Submission Details - {selectedSubmissionDetails.formId?.title}
            </h3>

            <div className="mb-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Submitted by</p>
                <p className="font-medium">{selectedSubmissionDetails.userId?.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Submitted on</p>
                <p className="font-medium">
                  {new Date(selectedSubmissionDetails.createdAt).toLocaleDateString()} {new Date(selectedSubmissionDetails.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <hr className="my-6" />

            <h4 className="text-lg font-bold mb-4">Form Answers</h4>

            {selectedSubmissionDetails.answers && Object.keys(selectedSubmissionDetails.answers).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(selectedSubmissionDetails.answers).map(([fieldId, answer]) => (
                  <div key={fieldId} className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="text-sm text-gray-500 mb-1">Field ID: {fieldId}</p>
                    <p className="font-medium text-gray-900">
                      {Array.isArray(answer) ? answer.join(", ") : String(answer)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No answers provided</p>
            )}

            <div className="flex gap-2 justify-end mt-8">
              <button
                type="button"
                onClick={() => {
                  setShowSubmissionDetailsModal(false);
                  setSelectedSubmissionDetails(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
