"use client";

import { useRef, useState } from "react";
import type { Work } from "../lib/types";

type SubmitData = {
  message: string;
  liveUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
  attachments: Work["attachments"];
};

type Props = {
  work: Work;
  employeeName: string;
  onClose: () => void;
  onSubmit: (data: SubmitData) => void;
};

export default function WorkSubmissionModal({
  work,
  employeeName,
  onClose,
  onSubmit,
}: Props) {
  const [message, setMessage] = useState(
    work.submission?.message || ""
  );

  const [liveUrl, setLiveUrl] = useState(
    work.submission?.liveUrl || ""
  );

  const [githubUrl, setGithubUrl] = useState(
    work.submission?.githubUrl || ""
  );

  const [demoUrl, setDemoUrl] = useState(
    work.submission?.demoUrl || ""
  );

  const [attachments, setAttachments] = useState<
    NonNullable<Work["attachments"]>
  >(work.submission?.attachments || []);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFiles(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    setError("");
    setUploading(true);

    try {
      const newAttachments: NonNullable<Work["attachments"]> = [];

      for (const file of files) {
        if (file.size > 15 * 1024 * 1024) {
          setError(
            `${file.name} is larger than 15 MB. Please upload a smaller file.`
          );
          continue;
        }

        const url = await readFileAsDataUrl(file);

        newAttachments.push({
          id:
            "ATT-" +
            Date.now() +
            "-" +
            Math.random()
              .toString(36)
              .substring(2, 8),

          name: file.name,

          type: getAttachmentType(file),

          url,

          uploadedAt: new Date().toISOString(),

          uploadedBy: employeeName,
        });
      }

      setAttachments((current) => [
        ...current,
        ...newAttachments,
      ]);
    } catch {
      setError("Unable to upload the selected file.");
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeAttachment(id: string) {
    setAttachments((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  function handleSubmit() {
    setError("");

    if (!message.trim()) {
      setError("Please add submission notes.");
      return;
    }

    if (
      !liveUrl.trim() &&
      !githubUrl.trim() &&
      !demoUrl.trim() &&
      attachments.length === 0
    ) {
      setError(
        "Please add at least one link or upload at least one file."
      );
      return;
    }

    onSubmit({
      message: message.trim(),
      liveUrl: liveUrl.trim() || undefined,
      githubUrl: githubUrl.trim() || undefined,
      demoUrl: demoUrl.trim() || undefined,
      attachments,
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
              Submit Work
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {work.title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Submit your completed work for Owner Review.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900"
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto p-6">
          <div className="space-y-6">

            {/* WORK INFO */}
            <div className="grid gap-4 sm:grid-cols-3">
              <InfoBox
                label="Work ID"
                value={work.id}
              />

              <InfoBox
                label="Status"
                value={work.status}
              />

              <InfoBox
                label="Deadline"
                value={work.deadline || "Not set"}
              />
            </div>

            {/* NOTES */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Submission Notes *
              </label>

              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                rows={5}
                placeholder="Explain what you completed, important changes, client requirements completed, testing details, etc."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {/* LINKS */}
            <div>
              <div className="mb-3">
                <p className="text-sm font-bold text-slate-900">
                  Project Links
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Add any relevant website, GitHub or demo link.
                </p>
              </div>

              <div className="space-y-3">

                <InputField
                  label="Live Website URL"
                  placeholder="https://yourwebsite.com"
                  value={liveUrl}
                  onChange={setLiveUrl}
                />

                <InputField
                  label="GitHub URL"
                  placeholder="https://github.com/username/project"
                  value={githubUrl}
                  onChange={setGithubUrl}
                />

                <InputField
                  label="Demo URL"
                  placeholder="https://..."
                  value={demoUrl}
                  onChange={setDemoUrl}
                />

              </div>
            </div>

            {/* FILE UPLOAD */}
            <div>
              <div className="mb-3">
                <p className="text-sm font-bold text-slate-900">
                  Upload Files
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Upload PNG, JPG, PDF, documents, code files or videos.
                  Maximum 15 MB per file in this V1 demo.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,.html,.css,.js,.ts,.tsx"
                onChange={handleFiles}
                className="hidden"
              />

              <button
                type="button"
                disabled={uploading}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <div className="text-3xl">
                  {uploading ? "⏳" : "📎"}
                </div>

                <p className="mt-2 text-sm font-bold text-slate-700">
                  {uploading
                    ? "Uploading..."
                    : "Click to upload files"}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Images · Videos · PDF · Documents · ZIP · Code
                </p>
              </button>

              {/* FILE LIST */}
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">

                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Selected Files ({attachments.length})
                  </p>

                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg">
                          {getFileIcon(file.name)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-700">
                            {file.name}
                          </p>

                          <p className="text-xs text-slate-400">
                            {file.type}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeAttachment(file.id)
                        }
                        className="ml-3 shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ERROR */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

          </div>
        </div>

        {/* FOOTER */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={uploading}
            onClick={handleSubmit}
            className="rounded-xl bg-emerald-600 px-7 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit Work for Review →
          </button>

        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INPUT
========================================================= */

function InputField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <input
        type="url"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
      />
    </div>
  );
}

/* =========================================================
   INFO BOX
========================================================= */

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   FILE TYPE
========================================================= */

function getAttachmentType(
  file: File
) {
  if (file.type.startsWith("image/")) {
    return "Image" as const;
  }

  if (file.type.startsWith("video/")) {
    return "Video" as const;
  }

  if (
    file.type.includes("pdf") ||
    file.type.includes("document") ||
    file.type.includes("spreadsheet") ||
    file.type.includes("presentation") ||
    file.name.match(
      /\.(doc|docx|xls|xlsx|ppt|pptx|txt|csv)$/i
    )
  ) {
    return "Document" as const;
  }

  if (
    file.name.match(
      /\.(js|jsx|ts|tsx|html|css|json|py|java|php|sql|gs)$/i
    )
  ) {
    return "Code" as const;
  }

  return "Other" as const;
}

/* =========================================================
   FILE ICON
========================================================= */

function getFileIcon(name: string) {
  const lower = name.toLowerCase();

  if (
    lower.match(
      /\.(png|jpg|jpeg|gif|webp|svg)$/i
    )
  ) {
    return "🖼️";
  }

  if (
    lower.match(
      /\.(mp4|mov|avi|mkv|webm)$/i
    )
  ) {
    return "🎥";
  }

  if (lower.endsWith(".pdf")) {
    return "📕";
  }

  if (
    lower.match(
      /\.(doc|docx)$/i
    )
  ) {
    return "📄";
  }

  if (
    lower.match(
      /\.(xls|xlsx|csv)$/i
    )
  ) {
    return "📊";
  }

  if (
    lower.match(
      /\.(zip|rar|7z)$/i
    )
  ) {
    return "🗜️";
  }

  if (
    lower.match(
      /\.(js|jsx|ts|tsx|html|css|json|py|java|php|sql|gs)$/i
    )
  ) {
    return "💻";
  }

  return "📎";
}

/* =========================================================
   FILE READER
========================================================= */

function readFileAsDataUrl(
  file: File
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () =>
      resolve(String(reader.result));

    reader.onerror = () =>
      reject(
        new Error("Unable to read file")
      );

    reader.readAsDataURL(file);
  });
}