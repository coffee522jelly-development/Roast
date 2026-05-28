import { Mp3Metadata } from "../App";

interface DetailViewProps {
  file: Mp3Metadata | null;
}

export function DetailView({ file }: DetailViewProps) {
  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-base-content/50 italic text-sm">
        Select a file to see details
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4 overflow-y-auto h-full">
      <div className="aspect-square w-full bg-base-300 rounded-lg overflow-hidden flex items-center justify-center border border-base-content/10 shadow-inner">
        {file.artwork ? (
          <img
            src={`data:image/jpeg;base64,${file.artwork}`}
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

      <div className="flex flex-col gap-1 mt-auto">
        <div className="text-[10px] uppercase font-bold text-base-content/30 tracking-wider">File Path</div>
        <div className="text-[10px] break-all text-base-content/50 leading-tight">
          {file.path}
        </div>
      </div>
    </div>
  );
}
