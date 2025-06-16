"use client";
import React from "react";

export default function PostVariants({ value, onChange }) {
  const { enabled = false, variants = [] } = value || {};

  const handleVariantChange = (index, newText) => {
    const updated = [...variants];
    updated[index] = newText;
    onChange({ ...value, variants: updated });
  };

  const addVariant = () => {
    onChange({
      ...value,
      variants: [...variants, ""],
    });
  };

  const removeVariant = (index) => {
    const updated = variants.filter((_, i) => i !== index);
    onChange({ ...value, variants: updated });
  };

  return (
    <div className="w-full mt-6 bg-gray-900 border border-gray-700 rounded-xl p-5 shadow-lg">
      <label className="flex items-center gap-3 text-white text-sm font-semibold mb-4">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            const newEnabled = e.target.checked;
            onChange({
              ...value,
              enabled: newEnabled,
              variants: newEnabled ? variants.length ? variants : ["", ""] : [],
            });
          }}
          className="w-5 h-5 accent-blue-500 rounded transition"
        />
        Enable Post Variants (A/B Testing)
      </label>

      {enabled && (
        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div key={index} className="relative">
              <textarea
                value={variant}
                onChange={(e) => handleVariantChange(index, e.target.value)}
                placeholder={`Variant ${index + 1}`}
                className="w-full bg-[#1e293b] text-white border border-gray-600 rounded-lg px-4 py-2 resize-none placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="absolute top-2 right-2 text-red-500 text-xs hover:text-red-600"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {variants.length < 5 && (
            <button
              type="button"
              onClick={addVariant}
              className="text-blue-400 text-sm mt-2 hover:text-blue-500"
            >
              ➕ Add another variant
            </button>
          )}
        </div>
      )}
    </div>
  );
}
