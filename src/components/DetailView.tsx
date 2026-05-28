import { Mp3Metadata } from "../App";

interface DetailViewProps {
  file: Mp3Metadata | null;
  artwork: string | null;
}

export function DetailView({ file, artwork }: DetailViewProps) {
  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-base-content/50 italic text-sm">
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
    <div className="p-4 flex flex-col gap-4 overflow-y-auto h-full">
      <div className="aspect-square w-full bg-base-300 rounded-lg overflow-hidden flex items-center justify-center border border-base-content/10 shadow-inner">
        {artwork ? (
          <img
            src={`data:image/jpeg;base64,${artwork}`}
            alt="Album Art"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl text-base-content/20">🎵</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs uppercase font-bold text-base-content/40 tracking-wider">Metadata</div>
        <div className="grid grid-cols-3 gap-y-2 text-xs">
          <div className="font-semibold">Title:</div>
          <div className="col-span-2 truncate">{file.title || "-"}</div>

          <div className="font-semibold">Artist:</div>
          <div className="col-span-2 truncate">{file.artist || "-"}</div>

          <div className="font-semibold">Album:</div>
          <div className="col-span-2 truncate">{file.album || "-"}</div>

          <div className="font-semibold">Year:</div>
          <div className="col-span-2">{file.year || "-"}</div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs uppercase font-bold text-base-content/40 tracking-wider">File Details</div>
        <div className="grid grid-cols-3 gap-y-2 text-xs">
          <div className="font-semibold">Length:</div>
          <div className="col-span-2">{formatDuration(file.duration)}</div>

          <div className="font-semibold">Size:</div>
          <div className="col-span-2">{formatSize(file.size)}</div>

          <div className="font-semibold">Filename:</div>
          <div className="col-span-2 break-all">{file.filename}</div>
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-auto">
        <div className="text-[10px] uppercase font-bold text-base-content/30 tracking-wider">File Path</div>
        <div className="text-[10px] break-all text-base-content/50 leading-tight">
          {file.path}
        </div>
      </div>
    </div>
  );
}
