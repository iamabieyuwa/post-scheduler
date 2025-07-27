"use client";
import { FaSpinner } from "react-icons/fa";

export default function ConfirmDisconnectModal({
  isOpen,
  onClose,
  onConfirm,
  isDisconnecting,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-[#111] text-white p-6 rounded-lg shadow-xl w-full max-w-sm border border-gray-700">
        <h2 className="text-lg font-semibold mb-2">Disconnect X Account?</h2>
        <p className="text-sm text-gray-400 mb-6">
          Are you sure you want to disconnect your X (Twitter) account? You won’t be able to schedule posts to it unless you reconnect.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm"
            disabled={isDisconnecting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDisconnecting}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-sm flex items-center gap-2"
          >
            {isDisconnecting ? (
              <FaSpinner className="animate-spin text-white text-sm" />
            ) : (
              "Yes, Disconnect"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
