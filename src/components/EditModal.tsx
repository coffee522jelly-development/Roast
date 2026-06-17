import { Mp3Metadata } from "../App";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface EditModalProps {
  file: Mp3Metadata;
  onSave: (file: Mp3Metadata) => void;
  onCancel: () => void;
  onChange: (file: Mp3Metadata) => void;
}

export function EditModal({ file, onSave, onCancel, onChange }: EditModalProps) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>メタデータの編集</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="filename" className="text-right font-bold">ファイル名</Label>
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
            <Label htmlFor="title" className="text-right">タイトル</Label>
            <Input
              id="title"
              value={file.title || ""}
              onChange={(e) => onChange({ ...file, title: e.target.value })}
              className="col-span-3 text-xs"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="artist" className="text-right">アーティスト</Label>
            <Input
              id="artist"
              value={file.artist || ""}
              onChange={(e) => onChange({ ...file, artist: e.target.value })}
              className="col-span-3 text-xs"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="album" className="text-right">アルバム</Label>
            <Input
              id="album"
              value={file.album || ""}
              onChange={(e) => onChange({ ...file, album: e.target.value })}
              className="col-span-3 text-xs"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">リリース年</Label>
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
