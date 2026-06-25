import { Mp3Metadata } from "../App";
import { cn } from "../lib/utils";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Music2, Copy, Check } from "lucide-react";
import { useState } from "react";

interface DetailViewProps {
  file: Mp3Metadata | null;
  artwork: string | null;
  status: { label: string; color: string; icon: React.ReactNode } | null;
}

export function DetailView({ file, artwork, status }: DetailViewProps) {
  const [copied, setCopied] = useState(false);

  const copyFilename = async () => {
    if (!file) return;
    try {
      await navigator.clipboard.writeText(file.filename);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground italic text-sm">
        ファイルを選択すると詳細が表示されます
      </div>
    );
  }

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="p-4 flex flex-col gap-6 overflow-y-auto h-full relative z-10">
      <div className="space-y-4">
        {status && (
          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 border backdrop-blur-md shadow-sm w-fit", status.color)}>
            {status.icon}
            <span className="text-[10px] font-black uppercase tracking-widest">{status.label}</span>
          </div>
        )}
      </div>

      <Card className="aspect-square w-full overflow-hidden flex items-center justify-center bg-muted border-none shadow-[0_10px_30px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
        {artwork ? (
          <img
            src={artwork}
            alt="Album Art"
            className="w-full h-full object-cover"
          />
        ) : (
          <Music2 className="h-16 w-16 text-muted-foreground/20" />
        )}
      </Card>

      <div className="space-y-4">
        <section>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 border-b pb-1">
            メタデータ
          </h4>
          <dl className="grid grid-cols-3 gap-y-3 text-xs">
            <dt className="text-muted-foreground font-medium">タイトル</dt>
            <dd className="col-span-2 truncate font-semibold">{file.title || "-"}</dd>

            <dt className="text-muted-foreground font-medium">アーティスト</dt>
            <dd className="col-span-2 truncate font-semibold">{file.artist || "-"}</dd>

            <dt className="text-muted-foreground font-medium">アルバム</dt>
            <dd className="col-span-2 truncate">{file.album || "-"}</dd>

            <dt className="text-muted-foreground font-medium">リリース年</dt>
            <dd className="col-span-2">{file.year || "-"}</dd>
          </dl>
        </section>

        <section>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 border-b pb-1">
            プロパティ
          </h4>
          <dl className="grid grid-cols-3 gap-y-3 text-xs">
            <dt className="text-muted-foreground font-medium">長さ</dt>
            <dd className="col-span-2 font-mono text-[11px]">{formatDuration(file.duration)}</dd>

            <dt className="text-muted-foreground font-medium">サイズ</dt>
            <dd className="col-span-2">{formatSize(file.size)}</dd>

            <dt className="text-muted-foreground font-medium">品質</dt>
            <dd className="col-span-2">
              <span className="font-semibold">{file.bitrate || "-"} kbps</span>
              <span className="text-muted-foreground ml-2">({(file.sample_rate || 0) / 1000} kHz)</span>
            </dd>

            <dt className="text-muted-foreground font-medium">ファイル名</dt>
            <dd className="col-span-2 flex items-start gap-2 group/copy">
              <span className="break-all text-[10px] leading-tight text-muted-foreground flex-1">
                {file.filename}
              </span>
              <Button
                variant="ghost"
                size="xs"
                className="h-5 w-5 p-0 opacity-0 group-hover/copy:opacity-100 transition-opacity"
                onClick={copyFilename}
                title="ファイル名をコピー"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </dd>
          </dl>
        </section>
      </div>

      <div className="mt-auto pt-6 border-t">
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">場所</span>
        <p className="text-[9px] break-all text-muted-foreground/60 leading-relaxed font-mono">
          {file.path}
        </p>
      </div>
    </div>
  );
}
