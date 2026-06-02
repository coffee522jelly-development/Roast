import { open } from "@tauri-apps/plugin-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { FolderOpen, Check } from "lucide-react";
import { cn } from "../lib/utils";

interface Settings {
  defaultFolder: string | null;
  theme: string;
  bgMode: string;
}

interface SettingsModalProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

export function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const pickFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    if (selected && typeof selected === 'string') {
      onSave({ ...settings, defaultFolder: selected });
    }
  };

  const themes = [
    { id: "zinc", color: "bg-[#18181b]", name: "Zinc" },
    { id: "slate", color: "bg-[#334155]", name: "Slate" },
    { id: "stone", color: "bg-[#78716c]", name: "Stone" },
    { id: "rose", color: "bg-[#e11d48]", name: "Rose" },
    { id: "blue", color: "bg-[#2563eb]", name: "Blue" },
    { id: "green", color: "bg-[#16a34a]", name: "Green" },
    { id: "violet", color: "bg-[#7c3aed]", name: "Violet" },
  ];

  const bgModes = [
    { id: "light", name: "ライト", color: "bg-white border-slate-200" },
    { id: "dark", name: "ダーク", color: "bg-slate-900 border-slate-800" },
    { id: "espresso", name: "エスプレッソ", color: "bg-[#1a1412] border-[#2a1d1a]" },
    { id: "sepia", name: "セピア", color: "bg-[#f4ecd8] border-[#e4dcc8]" },
  ];

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>アプリケーション設定</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-widest opacity-70">ミュージックフォルダ</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={settings.defaultFolder || "フォルダが選択されていません"}
                className="bg-muted text-xs border-none"
              />
              <Button size="icon" variant="outline" onClick={pickFolder} className="h-9 w-9 shrink-0">
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              アプリ起動時にこのフォルダを自動的にスキャンします。
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-widest opacity-70">背景色</Label>
            <div className="grid grid-cols-4 gap-2">
              {bgModes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onSave({ ...settings, bgMode: m.id })}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2 rounded-md border-2 transition-all group",
                    m.color,
                    settings.bgMode === m.id ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-70 hover:opacity-100"
                  )}
                >
                  <div className="text-[10px] font-medium leading-none" style={{ color: m.id === 'light' || m.id === 'sepia' ? '#000' : '#fff' }}>
                    {m.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-widest opacity-70">アクセントカラー</Label>
            <div className="grid grid-cols-7 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSave({ ...settings, theme: t.id })}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all flex items-center justify-center relative group",
                    t.color,
                    settings.theme === t.id ? "border-foreground scale-110 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                  title={t.name}
                >
                  {settings.theme === t.id && (
                    <Check className="h-3 w-3 text-white mix-blend-difference" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">閉じる</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
