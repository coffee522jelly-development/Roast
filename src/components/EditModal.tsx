import { useState } from "react";
import { Mp3Metadata } from "../App";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Copy, ClipboardPaste, Check } from "lucide-react";

interface EditModalProps {
  file: Mp3Metadata;
  onSave: (file: Mp3Metadata) => void;
  onCancel: () => void;
  onChange: (file: Mp3Metadata) => void;
}

export function EditModal({ file, onSave, onCancel, onChange }: EditModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  const pasteFromClipboard = async (field: keyof Mp3Metadata) => {
    try {
      const text = await navigator.clipboard.readText();
      onChange({ ...file, [field]: text });
    } catch (err) {
      console.error("Failed to paste!", err);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>メタデータの編集</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="filename" className="text-right font-bold whitespace-nowrap">ファイル名</Label>
            <div className="col-span-3 flex flex-col gap-1">
              <Input
                id="filename"
                value={file.filename}
                onChange={(e) => onChange({ ...file, filename: e.target.value })}
                className="text-xs border-primary/20"
              />
              <span className="text-[9px] text-muted-foreground">※物理的なファイル名が変更されます</span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right whitespace-nowrap">タイトル</Label>
            <Input
              id="title"
              value={file.title || ""}
              onChange={(e) => onChange({ ...file, title: e.target.value })}
              className="col-span-3 text-xs"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="artist" className="text-right whitespace-nowrap">アーティスト</Label>
            <div className="col-span-3 flex gap-1">
              <Input
                id="artist"
                value={file.artist || ""}
                onChange={(e) => onChange({ ...file, artist: e.target.value })}
                className="text-xs flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => copyToClipboard(file.artist || "", "artist")}
                title="コピー"
              >
                {copiedField === "artist" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => pasteFromClipboard("artist")}
                title="ペースト"
              >
                <ClipboardPaste className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="album" className="text-right whitespace-nowrap">アルバム</Label>
            <div className="col-span-3 flex gap-1">
              <Input
                id="album"
                value={file.album || ""}
                onChange={(e) => onChange({ ...file, album: e.target.value })}
                className="text-xs flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => copyToClipboard(file.album || "", "album")}
                title="コピー"
              >
                {copiedField === "album" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => pasteFromClipboard("album")}
                title="ペースト"
              >
                <ClipboardPaste className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right whitespace-nowrap">リリース年</Label>
            <Input
              id="year"
              type="number"
              value={file.year || ""}
              onChange={(e) => onChange({ ...file, year: e.target.value ? parseInt(e.target.value) : null })}
              className="col-span-3 text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>キャンセル</Button>
          <Button onClick={() => onSave(file)}>保存する</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
