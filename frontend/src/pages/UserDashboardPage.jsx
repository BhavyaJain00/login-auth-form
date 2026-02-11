import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * USER DASHBOARD
 * Users can:
 * - View forms assigned to them
 * - Submit forms
 * - View their own submission status
 */
export default function UserDashboardPage() {
  const navigate = useNavigate();
  const { user, logout, getToken } = useAuth();
  const [forms, setForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState("forms");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const token = getToken();

  useEffect(() => {
    if (activeTab === "forms") {
      fetchAssignedForms();
    } else if (activeTab === "submissions") {
      fetchMySubmissions();
    }
  }, [activeTab]);

  const fetchAssignedForms = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/api/forms`, {
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

  const fetchMySubmissions = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/api/forms/submissions/my`, {
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

  const handleLogout = () => {
    logout();
    navigate("/user/login");
  };

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setShowSubmissionModal(true);
  };

  const handleCloseSubmissionModal = () => {
    setSelectedSubmission(null);
    setShowSubmissionModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
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
            onClick={() => setActiveTab("forms")}
            className={`py-2 px-4 font-medium ${
              activeTab === "forms"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Assigned Forms
          </button>
          <button
            onClick={() => setActiveTab("submissions")}
            className={`py-2 px-4 font-medium ${
              activeTab === "submissions"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            My Submissions
          </button>
        </div>

        {/* Assigned Forms Tab */}
        {activeTab === "forms" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Forms Assigned to You</h2>

            {loading ? (
              <p>Loading forms...</p>
            ) : forms.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600 text-lg">No forms assigned to you yet.</p>
                <p className="text-gray-500 mt-2">Check back later or contact your admin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {forms.map((form) => (
                  <div key={form._id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                    <h3 className="text-lg font-bold mb-2">{form.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {form.description || "No description provided"}
                    </p>
                    <div className="text-sm text-gray-600 mb-4">
                      <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {form.fields?.length || 0} Fields
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/user/forms/${form._id}`)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Open Form
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Submissions Tab */}
        {activeTab === "submissions" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Submissions</h2>

            {loading ? (
              <p>Loading submissions...</p>
            ) : submissions.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600 text-lg">You haven't submitted any forms yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Form Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Submitted Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.map((sub) => (
                      <tr key={sub._id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{sub.formId?.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              sub.submissionStatus === "submitted"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {sub.submissionStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewSubmission(sub)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            View
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
        {/* Submission Details Modal (User) */}
        {showSubmissionModal && selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 mx-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">Submission Details</h3>
                  <p className="text-sm text-gray-600">{selectedSubmission.formId?.title}</p>
                </div>
                <button
                  onClick={handleCloseSubmissionModal}
                  className="text-gray-500 hover:text-gray-800"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="text-sm text-gray-600">
                  <strong>Submitted:</strong> {new Date(selectedSubmission.createdAt).toLocaleString()}
                </div>
                <div className="text-sm">
                  <strong>Status:</strong>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${selectedSubmission.submissionStatus === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {selectedSubmission.submissionStatus}
                  </span>
                </div>

                <div>
                  <h4 className="font-medium">Answers</h4>
                  <div className="mt-2">
                    {Array.isArray(selectedSubmission.answers) ? (
                      <div className="space-y-2">
                        {selectedSubmission.answers.map((ans, idx) => (
                          <div key={idx} className="p-2 bg-gray-50 rounded">
                            <div className="text-sm text-gray-700">{ans.label || ans.fieldLabel || ans.fieldId || `Field ${idx+1}`}</div>
                            <div className="text-sm text-gray-900 font-medium">{String(ans.value ?? ans.answer ?? ans)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">{JSON.stringify(selectedSubmission.answers || selectedSubmission, null, 2)}</pre>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
