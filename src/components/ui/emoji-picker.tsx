import React, { useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const EMOJI_CATEGORIES = {
  "📚 Lectura": ["📚", "📖", "📕", "📗", "📘", "📙", "📓", "📔", "📒", "🔖", "🏷️", "✨"],
  "😊 Caras": ["😊", "🥰", "😍", "🤩", "😎", "🤓", "🧐", "🤔", "😌", "😇", "🥳", "😏"],
  "❤️ Corazones": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💕", "💖", "💗", "💝"],
  "🌟 Símbolos": ["🌟", "⭐", "✨", "🔥", "💫", "🌙", "☀️", "🌈", "🍂", "🍁", "🌻", "🌸"],
  "🎉 Celebración": ["🎉", "🎊", "🎈", "🏆", "🥇", "🎯", "💯", "👏", "🙌", "💪", "🤝", "👍"],
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onEmojiSelect(emoji);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-primary/10"
        >
          <Smile className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="end">
        <div className="space-y-3">
          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
            <div key={category}>
              <p className="text-xs text-muted-foreground mb-1.5 px-1">
                {category}
              </p>
              <div className="grid grid-cols-6 gap-1">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelect(emoji)}
                    className="w-9 h-9 flex items-center justify-center text-lg hover:bg-muted rounded-md transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
