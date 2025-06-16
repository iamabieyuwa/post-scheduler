"use client";

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  postToDelete,
  isDeleting,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-[#111] text-white p-6 rounded-lg shadow-xl w-full max-w-sm border border-gray-700">
        <h2 className="text-lg font-semibold mb-2">Delete Post?</h2>
        <p className="text-sm text-gray-400 mb-6">
          Are you sure you want to delete this post? This action cannot be undone.
        </p>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-sm"
          >
            {isDeleting ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
