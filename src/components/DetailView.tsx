import { Mp3Metadata } from "../App";
import { Card } from "./ui/card";
import { Music2 } from "lucide-react";

interface DetailViewProps {
  file: Mp3Metadata | null;
  artwork: string | null;
}

export function DetailView({ file, artwork }: DetailViewProps) {
  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground italic text-sm">
        Select a file to see details
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
    <div className="p-4 flex flex-col gap-6 overflow-y-auto h-full">
      <Card className="aspect-square w-full overflow-hidden flex items-center justify-center bg-muted border-none shadow-sm">
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
            Metadata
          </h4>
          <dl className="grid grid-cols-3 gap-y-3 text-xs">
            <dt className="text-muted-foreground font-medium">Title</dt>
            <dd className="col-span-2 truncate font-semibold">{file.title || "-"}</dd>

            <dt className="text-muted-foreground font-medium">Artist</dt>
            <dd className="col-span-2 truncate font-semibold">{file.artist || "-"}</dd>

            <dt className="text-muted-foreground font-medium">Album</dt>
            <dd className="col-span-2 truncate">{file.album || "-"}</dd>

            <dt className="text-muted-foreground font-medium">Year</dt>
            <dd className="col-span-2">{file.year || "-"}</dd>
          </dl>
        </section>

        <section>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 border-b pb-1">
            Properties
          </h4>
          <dl className="grid grid-cols-3 gap-y-3 text-xs">
            <dt className="text-muted-foreground font-medium">Length</dt>
            <dd className="col-span-2 font-mono text-[11px]">{formatDuration(file.duration)}</dd>

            <dt className="text-muted-foreground font-medium">Size</dt>
            <dd className="col-span-2">{formatSize(file.size)}</dd>

            <dt className="text-muted-foreground font-medium">Filename</dt>
            <dd className="col-span-2 break-all text-[10px] leading-tight text-muted-foreground">
              {file.filename}
            </dd>
          </dl>
        </section>
      </div>

      <div className="mt-auto pt-6 border-t">
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Location</span>
        <p className="text-[9px] break-all text-muted-foreground/60 leading-relaxed font-mono">
          {file.path}
        </p>
      </div>
    </div>
  );
}
