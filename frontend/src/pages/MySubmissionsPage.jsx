import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMySubmissions } from "../services/api.js";

export default function MySubmissionsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const formatAnswer = (ans) => {
    if (ans === null || ans === undefined || ans === "") return "-";
    if (Array.isArray(ans)) return ans.join(", ");
    return String(ans);
  };
  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const { data } = await getMySubmissions();
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error("Failed to load submissions", err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Top tabs: Assigned Forms / My Submissions */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          <Link
            to="/user/dashboard"
            className={`py-3 px-1 text-sm font-medium ${location.pathname === '/user/dashboard' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Assigned Forms
          </Link>
          <Link
            to="/user/submissions"
            className={`py-3 px-1 text-sm font-medium ${location.pathname === '/user/submissions' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            My Submissions
          </Link>
        </nav>
      </div>

      <h2 className="text-2xl font-bold mb-6">My Submissions</h2>

      {loading ? (
        <p>Loading submissions...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Form Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted Date</th>
                {/* dynamic field headers (from first submission's form) */}
                {submissions.length > 0 && submissions[0].formId?.fields?.map((field) => (
                  <th key={field._id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{field.label || field.type}</th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
                {submissions.length === 0 ? (
                <tr>
                  <td colSpan={2 + (submissions[0]?.formId?.fields?.length || 0) + 2} className="px-6 py-8 text-center text-gray-500">No submissions yet.</td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-sm">{sub.formId?.title || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(sub.createdAt).toLocaleDateString()}</td>

                    {/* show values for each field in the header order */}
                    {submissions[0]?.formId?.fields?.map((field) => (
                      <td key={field._id} className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {sub.answers?.[field._id]
                          ? (Array.isArray(sub.answers[field._id]) ? sub.answers[field._id].join(", ") : String(sub.answers[field._id]))
                          : "-"}
                      </td>
                    ))}

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">{sub.submissionStatus || "Submitted"}</span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button onClick={() => { setSelectedSubmission(sub); setShowModal(true); }} className="text-blue-600 hover:text-blue-900 font-medium">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Submission Details - {selectedSubmission.formId?.title}</h3>

            <div className="mb-4">
              <p className="text-sm text-gray-500">Submitted on</p>
              <p className="font-medium">{new Date(selectedSubmission.createdAt).toLocaleString()}</p>
            </div>

            <h4 className="text-lg font-bold mb-3">Form Answers</h4>
            {selectedSubmission.formId?.fields && selectedSubmission.formId.fields.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {selectedSubmission.formId.fields.map((field) => (
                  <div key={field._id} className="p-3 border rounded-md bg-gray-50">
                    <div className="text-sm text-gray-600">{field.label}</div>
                    <div className="mt-1 text-gray-900 font-medium">{formatAnswer(selectedSubmission.answers?.[field._id])}</div>
                  </div>
                ))}
              </div>
            ) : selectedSubmission.answers && Object.keys(selectedSubmission.answers).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(selectedSubmission.answers).map(([fieldId, answer]) => {
                  const label = selectedSubmission.formId?.fields?.find(f => f._id === fieldId)?.label || fieldId;
                  return (
                    <div key={fieldId} className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="text-sm text-gray-500 mb-1">{label}</p>
                      <p className="font-medium text-gray-900">{Array.isArray(answer) ? answer.join(", ") : String(answer)}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No answers provided</p>
            )}

            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => { setShowModal(false); setSelectedSubmission(null); }} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
