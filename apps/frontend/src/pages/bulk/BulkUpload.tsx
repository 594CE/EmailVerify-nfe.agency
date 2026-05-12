import { useState, useRef, useEffect } from "react";
import { UploadCloud, File, AlertCircle, CheckCircle } from "lucide-react";
import api from "../../utils/api";

export default function BulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [jobs, setJobs] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchJobs = async () => {
    try {
      const res = await api.get("/verify/bulk");
      setJobs(res.data.jobs);
    } catch (error) {
      console.error("Failed to fetch jobs", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchJobs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    import("../../utils/socket").then(({ default: socket }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleProgress = (data: any) => {
        setJobs((prevJobs) =>
          prevJobs.map((job) => {
            if (job._id === data.jobId) {
              return {
                ...job,
                status: data.status,
                processedEmails: Math.round(
                  (data.progress / 100) * job.totalEmails,
                ),
              };
            }
            return job;
          }),
        );
        if (data.status === "completed") {
          fetchJobs();
        }
      };

      socket.on("bulk-progress", handleProgress);

      return () => {
        socket.off("bulk-progress", handleProgress);
      };
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/verify/bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      fetchJobs();
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-800">Bulk Verification</h1>

      <div
        className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center bg-white hover:bg-slate-50 transition-colors cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
        />
        <UploadCloud className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        {file ? (
          <div className="text-slate-700 font-medium">{file.name}</div>
        ) : (
          <div>
            <span className="text-primary-600 font-medium">
              Click to upload
            </span>{" "}
            or drag and drop
            <div className="text-sm text-slate-500 mt-1">
              CSV files only (max 100,000 rows)
            </div>
          </div>
        )}
      </div>

      {file && (
        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-500 disabled:opacity-50 transition-colors"
          >
            {isUploading ? "Uploading..." : "Start Verification"}
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 font-semibold text-slate-800">
          Recent Jobs
        </div>
        <div className="divide-y divide-slate-200">
          {jobs.length === 0 && (
            <div className="p-6 text-center text-slate-500">
              No bulk jobs found.
            </div>
          )}
          {jobs.map((job) => (
            <div
              key={job._id}
              className="p-6 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <File className="h-8 w-8 text-slate-400" />
                <div>
                  <div className="font-medium text-slate-800">
                    {job.fileName}
                  </div>
                  <div className="text-sm text-slate-500">
                    {new Date(job.createdAt).toLocaleString()} •{" "}
                    {job.totalEmails} emails
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end w-64">
                <div className="flex items-center space-x-2 mb-2">
                  {job.status === "completed" && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {job.status === "failed" && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {job.status === "processing" && (
                    <div className="h-5 w-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                  )}
                  {job.status === "pending" && (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                  )}
                  <span className="text-sm font-medium capitalize text-slate-700">
                    {job.status}
                  </span>
                </div>
                {job.status === "processing" && job.totalEmails > 0 && (
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((job.processedEmails / job.totalEmails) * 100)}%`,
                      }}
                    />
                  </div>
                )}
                {job.status === "completed" && job.resultsUrl && (
                  <a
                    href="#"
                    className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                  >
                    Download Results
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
