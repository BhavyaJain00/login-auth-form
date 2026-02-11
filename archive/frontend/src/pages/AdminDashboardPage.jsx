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
      </main>
    </div>
  );
}
