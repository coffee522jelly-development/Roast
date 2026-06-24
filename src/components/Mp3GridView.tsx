import { Mp3Metadata } from "../App";
import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { Music2, Play, Search } from "lucide-react";

interface Mp3GridViewProps {
  files: Mp3Metadata[];
  onSelect: (file: Mp3Metadata) => void;
  onDoubleClick: (file: Mp3Metadata) => void;
  selectedPath: string | null;
}

export function Mp3GridView({ files, onSelect, onDoubleClick, selectedPath }: Mp3GridViewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 p-2 overflow-y-auto h-full pb-10">
      {files.map((file) => (
        <GridItem
          key={file.path}
          file={file}
          onSelect={onSelect}
          onDoubleClick={onDoubleClick}
          isSelected={selectedPath === file.path}
        />
      ))}
      {files.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center h-[400px] text-muted-foreground gap-4">
          <div className="p-6 rounded-full bg-muted/30">
            <Search className="h-8 w-8 opacity-20" />
          </div>
          <div className="text-center">
            <p className="text-xs font-medium">該当するファイルが見つかりません</p>
            <p className="text-[10px] mt-1 opacity-60">検索ワードを変えるか、表示条件を確認してください。</p>
          </div>
        </div>
      )}
    </div>
  );
}

function GridItem({ file, onSelect, onDoubleClick, isSelected }: {
  file: Mp3Metadata,
  onSelect: (f: Mp3Metadata) => void,
  onDoubleClick: (f: Mp3Metadata) => void,
  isSelected: boolean
}) {
  const [artwork, setArtwork] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchArtwork = async () => {
      try {
        const art: string | null = await invoke("get_mp3_artwork", { path: file.path });
        if (mounted) {
          setArtwork(art);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) setLoading(false);
      }
    };
    fetchArtwork();
    return () => { mounted = false; };
  }, [file.path]);

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 p-3 rounded-xl transition-all duration-300 cursor-pointer border-2",
        isSelected
          ? "bg-primary/5 border-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]"
          : "border-transparent hover:bg-muted/50 hover:border-muted-foreground/20"
      )}
      onClick={() => onSelect(file)}
      onDoubleClick={() => onDoubleClick(file)}
    >
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted shadow-sm flex items-center justify-center">
        {loading ? (
          <div className="animate-pulse w-full h-full bg-muted-foreground/10" />
        ) : artwork ? (
          <img
            src={artwork}
            alt={file.title || file.filename}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Music2 className="h-12 w-12 text-muted-foreground/20" />
        )}

        {/* Overlay Play Hint */}
        <div className={cn(
          "absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          isSelected && "opacity-100 bg-primary/20"
        )}>
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
             <Play className="h-6 w-6 fill-current ml-1" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 min-w-0">
        <span className={cn(
          "text-xs font-bold truncate transition-colors",
          isSelected ? "text-primary" : "text-foreground"
        )}>
          {file.title || file.filename}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest truncate opacity-60">
          {file.artist || "—"}
        </span>
      </div>
    </div>
  );
}
