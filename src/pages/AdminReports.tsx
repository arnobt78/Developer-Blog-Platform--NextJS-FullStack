import React, { useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { api } from "../api";
import { Post, User } from "../types";

interface Report {
  id: string;
  post: Post;
  user: User;
  reason?: string;
  status: string;
  createdAt: string;
}

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      const res = await api.get<Report[]>("/reports");
      setReports(res.data);
      setLoading(false);
    };
    fetchReports();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    await api.patch(`/reports/${id}`, { status });
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  if (loading) {
    return <LoadingSpinner text="Loading reports..." />;
  }
  return (
    <div className="container mx-auto pt-24 px-4">
      <h1 className="text-2xl font-bold mb-4">Reported Posts</h1>
      {reports.length === 0 ? (
        <div className="text-gray-500 text-xl">No reports found.</div>
      ) : (
        <div className="w-full overflow-x-auto">
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="min-w-full border border-gray-300 bg-white">
              <thead>
                <tr>
                  <th className="text-left px-4 py-2 w-1/4">Post</th>
                  <th className="text-left px-4 py-2 w-1/6">Reported By</th>
                  <th className="text-left px-4 py-2 w-1/3">Reason</th>
                  <th className="text-left px-4 py-2 w-1/12">Status</th>
                  <th className="text-left px-4 py-2 w-1/6">Reported At</th>
                  <th className="text-left px-4 py-2 w-1/6">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-2">
                      <a
                        href={`/post/${r.post.id}`}
                        className="text-blue-600 underline"
                        title={r.post.title}
                      >
                        {r.post.title.split(" ").slice(0, 6).join(" ")}
                        {r.post.title.split(" ").length > 6 ? "..." : ""}
                      </a>
                    </td>
                    <td className="px-4 py-2">{r.user.name}</td>
                    <td className="px-4 py-2">
                      {r.reason || (
                        <span className="text-gray-400">No reason</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{r.status}</td>
                    <td className="px-4 py-2">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      {r.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleStatusChange(r.id, "resolved")}
                            className="text-green-600 mr-2"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleStatusChange(r.id, "ignored")}
                            className="text-gray-600"
                          >
                            Ignore
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
