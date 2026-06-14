import { Mp3Metadata } from "../App";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import {
  Edit2,
  FolderTree,
  Clock,
  Copy,
  Check,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  PlayCircle,
  Play,
  Trash2
} from "lucide-react";
import { useState } from "react";
import { revealItemInDir, openPath } from "@tauri-apps/plugin-opener";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Mp3TableProps {
  files: Mp3Metadata[];
  onEdit: (file: Mp3Metadata) => void;
  onOrganize: (path: string, rule: string) => void;
  onDelete: (path: string) => void;
  onSelect: (file: Mp3Metadata) => void;
  onDoubleClick: (file: Mp3Metadata) => void;
  selectedPath: string | null;
  onSort: (field: "filename" | "artist" | "quality") => void;
  sortField: "filename" | "artist" | "quality";
  sortOrder: "asc" | "desc";
}

export function Mp3Table({
  files,
  onEdit,
  onOrganize,
  onDelete,
  onSelect,
  onDoubleClick,
  selectedPath,
  onSort,
  sortField,
  sortOrder
}: Mp3TableProps) {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPath(text);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderSortIcon = (field: "filename" | "artist" | "quality") => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  return (
    <div className="rounded-md border h-full overflow-hidden flex flex-col">
      <div className="relative flex-1 overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 bg-background border-b z-10">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th
                className="h-10 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => onSort("filename")}
              >
                <div className="flex items-center">
                  ファイル名
                  {renderSortIcon("filename")}
                </div>
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">タイトル</th>
              <th
                className="h-10 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => onSort("artist")}
              >
                <div className="flex items-center">
                  アーティスト
                  {renderSortIcon("artist")}
                </div>
              </th>
              <th
                className="h-10 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => onSort("quality")}
              >
                <div className="flex items-center">
                  品質
                  {renderSortIcon("quality")}
                </div>
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                <Clock className="h-3 w-3 inline mr-1" />
                長さ
              </th>
              <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">アクション</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {files.map((file) => (
              <tr
                key={file.path}
                className={cn(
                  "border-b transition-colors hover:bg-muted/50 cursor-pointer",
                  selectedPath === file.path && "bg-muted font-medium"
                )}
                onClick={(e) => { e.stopPropagation(); onSelect(file); }}
                onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(file); }}
              >
                <td className="p-4 align-middle max-w-xs truncate text-xs group/file">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{file.filename}</span>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-5 w-5 p-0 opacity-0 group-hover/file:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(file.filename);
                      }}
                      title="ファイル名をコピー"
                    >
                      {copiedPath === file.filename ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </td>
                <td className="p-4 align-middle truncate max-w-[150px] text-xs">{file.title || "-"}</td>
                <td className="p-4 align-middle truncate max-w-[150px] text-[10px] uppercase tracking-wider text-muted-foreground">
                  {file.artist || "-"}
                </td>
                <td className="p-4 align-middle font-mono text-[10px] text-muted-foreground">
                  {file.bitrate ? `${file.bitrate}kbps` : "-"}
                </td>
                <td className="p-4 align-middle font-mono text-[10px] text-muted-foreground">
                  {formatDuration(file.duration)}
                </td>
                <td className="p-4 align-middle text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-6 w-6 p-0 text-primary"
                      onClick={(e) => { e.stopPropagation(); onDoubleClick(file); }}
                      title="Roastで再生"
                    >
                      <Play className="h-3 w-3 fill-current" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-6 w-6 p-0"
                      onClick={(e) => { e.stopPropagation(); openPath(file.path); }}
                      title="外部プレイヤーで開く"
                    >
                      <PlayCircle className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-6 w-6 p-0"
                      onClick={(e) => { e.stopPropagation(); revealItemInDir(file.path); }}
                      title="フォルダで開く"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-6 w-6 p-0"
                      onClick={(e) => { e.stopPropagation(); onEdit(file); }}
                      title="タグを編集"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-6 w-6 p-0 hover:text-destructive transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`「${file.filename}」を削除してもよろしいですか？`)) {
                          onDelete(file.path);
                        }
                      }}
                      title="ファイルを削除"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="xs"
                          className="h-6 text-[10px] gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FolderTree className="h-3 w-3" />
                          整理する
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>整理ルールを選択</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOrganize(file.path, "artist_dash_song"); }}>
                          Artist - Song.mp3
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOrganize(file.path, "artist_space_song"); }}>
                          Artist Song.mp3
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOrganize(file.path, "song_space_artist"); }}>
                          Song Artist.mp3
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOrganize(file.path, "song_pipe_artist"); }}>
                          Song | Artist.mp3
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOrganize(file.path, "song_dash_artist"); }}>
                          Song - Artist.mp3
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {files.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
            <p>MP3ファイルが見つかりません。</p>
            <p className="text-xs">設定から音楽フォルダを選択してください。</p>
          </div>
        )}
      </div>
    </div>
  );
}
