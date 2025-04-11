"use client";
import EmojiPicker from "emoji-picker-react";
import { useState } from "react";

export default function EmojiPickerBox({ onSelect }) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setShowPicker((prev) => !prev)}
        className="text-sm text-blue-400 hover:text-blue-500"
      >
        😊 Add Emoji
      </button>

      {showPicker && (
        <div className="absolute z-50 mt-2">
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              onSelect(emojiData.emoji);
              setShowPicker(false);
            }}
            theme="dark"
          />
        </div>
      )}
    </div>
  );
}
