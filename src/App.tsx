import { useState, useEffect, useRef, useMemo } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { Mp3Table } from "./components/Mp3Table";
import { EditModal } from "./components/EditModal";
import { DetailView } from "./components/DetailView";
import { SettingsModal } from "./components/SettingsModal";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Slider } from "./components/ui/slider";
import {
  Settings as SettingsIcon,
  Info,
  Search,
  Play,
  Pause,
  Repeat,
  Volume2,
  Music4
} from "lucide-react";
import "./App.css";

export interface Mp3Metadata {
  path: string;
  filename: string;
  title: string | null;
  artist: string | null;
  album: string | null;
  year: number | null;
  duration: number | null;
  size: number;
  is_locked: boolean;
}

interface Settings {
  defaultFolder: string | null;
}

function App() {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("roast-settings");
    return saved ? JSON.parse(saved) : { defaultFolder: null };
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sortField, setSortField] = useState<"filename" | "artist">("filename");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [mp3Files, setMp3Files] = useState<Mp3Metadata[]>([]);
  const [editingFile, setEditingFile] = useState<Mp3Metadata | null>(null);
  const [selectedFile, setSelectedFile] = useState<Mp3Metadata | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoop, setIsLoop] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Disable right-click globally
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  // Handle audio source changes and autoplay
  useEffect(() => {
    if (audioSrc && audioRef.current) {
      const audio = audioRef.current;
      console.log("Audio source changed:", audioSrc);

      const startPlayback = () => {
        playPromiseRef.current = audio.play();
        playPromiseRef.current
          .then(() => {
            setIsPlaying(true);
            setStatus("再生中...");
            playPromiseRef.current = null;
          })
          .catch(e => {
            if (e.name !== "AbortError") {
              console.error("Playback failed:", e);
              setStatus(`再生エラー: ${e.message}`);
            }
            playPromiseRef.current = null;
          });
      };

      const onCanPlay = () => {
        startPlayback();
        audio.removeEventListener("canplay", onCanPlay);
      };

      // Stop current if playing
      if (playPromiseRef.current) {
        playPromiseRef.current.then(() => {
          audio.pause();
          audio.addEventListener("canplay", onCanPlay);
          audio.load();
        }).catch(() => {
          audio.addEventListener("canplay", onCanPlay);
          audio.load();
        });
      } else {
        audio.addEventListener("canplay", onCanPlay);
        audio.load();
      }

      return () => {
        audio.removeEventListener("canplay", onCanPlay);
      };
    }
  }, [audioSrc]);

  // Load files on startup if default folder exists
  useEffect(() => {
    if (settings.defaultFolder) {
      loadMp3Files(settings.defaultFolder);
    }
  }, []);

  async function loadMp3Files(dir: string) {
    try {
      const files: Mp3Metadata[] = await invoke("get_mp3_metadata", { dirPath: dir });
      setMp3Files(files);
      setStatus(`${files.length} 個のファイルを読み込みました`);
    } catch (err) {
      console.error(err);
      setStatus("ファイルの読み込みに失敗しました");
    }
  }

  async function organizeFile(path: string, rule: string) {
    try {
      await invoke("organize_mp3", { path, rule });
      setStatus("整理が完了しました");
      if (settings.defaultFolder) loadMp3Files(settings.defaultFolder);
    } catch (err: any) {
      console.error(err);
      setStatus(`整理失敗: ${err.message || err}`);
    }
  }

  async function updateMetadata(file: Mp3Metadata) {
    try {
      await invoke("update_mp3_metadata", { path: file.path, metadata: file });
      setStatus("メタデータを更新しました");
      setEditingFile(null);
      if (settings.defaultFolder) loadMp3Files(settings.defaultFolder);
    } catch (err) {
      console.error(err);
      setStatus("メタデータの更新に失敗しました");
    }
  }

  const selectFile = async (file: Mp3Metadata) => {
    setSelectedFile(file);
    try {
      const artwork: string | null = await invoke("get_mp3_artwork", { path: file.path });
      setSelectedArtwork(artwork);
    } catch (err) {
      console.error("Error fetching artwork:", err);
      setSelectedArtwork(null);
    }
  };

  const playFile = async (file: Mp3Metadata) => {
    if (file.is_locked) {
      setStatus("ファイルがロックされています");
      alert("ファイルが他のプログラムによってロックされているため、再生できません。");
      return;
    }

    selectFile(file);
    setIsSidebarOpen(true);

    try {
      setStatus("準備中...");
      const assetUrl = convertFileSrc(file.path);
      console.log("Converted path to asset URL:", assetUrl);
      setAudioSrc(assetUrl);
    } catch (err: any) {
      console.error("Error converting file source:", err);
      setStatus(`読み込み失敗: ${err.message || err}`);
    }
  };

  const togglePlay = async () => {
    if (audioRef.current) {
      const audio = audioRef.current;
      if (isPlaying) {
        if (playPromiseRef.current) {
          try {
            await playPromiseRef.current;
          } catch (e) {
            // Ignore abort or other play errors
          }
        }
        audio.pause();
        setIsPlaying(false);
      } else {
        try {
          playPromiseRef.current = audio.play();
          await playPromiseRef.current;
          setIsPlaying(true);
          playPromiseRef.current = null;
        } catch (e: any) {
          if (e.name !== "AbortError") {
            setStatus(`Error: ${e.message}`);
          }
          playPromiseRef.current = null;
        }
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    const time = value[0];
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const vol = value[0];
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const handleAudioError = (e: any) => {
    const error = e.target.error;
    console.error("Audio error:", error);
    let message = "不明な再生エラー";
    if (error) {
      switch (error.code) {
        case 1: message = "再生が中断されました"; break;
        case 2: message = "ネットワークエラー"; break;
        case 3: message = "オーディオのデコードに失敗しました"; break;
        case 4: message = "サポートされていない形式か、権限がありません"; break;
      }
    }
    setStatus(`エラー: ${message}`);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredFiles = useMemo(() => {
    let result = [...mp3Files];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f =>
        (f.filename?.toLowerCase() ?? "").includes(q) ||
        (f.title?.toLowerCase() ?? "").includes(q) ||
        (f.artist?.toLowerCase() ?? "").includes(q) ||
        (f.album?.toLowerCase() ?? "").includes(q)
      );
    }

    result.sort((a, b) => {
      let valA = (sortField === "filename" ? a.filename : (a.artist || "")).toLowerCase();
      let valB = (sortField === "filename" ? b.filename : (b.artist || "")).toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [mp3Files, searchQuery, sortField, sortOrder]);

  const toggleSort = (field: "filename" | "artist") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem("roast-settings", JSON.stringify(newSettings));
    if (newSettings.defaultFolder) {
      loadMp3Files(newSettings.defaultFolder);
    }
  };

  // Update selected file if the list changes
  useEffect(() => {
    if (selectedFile) {
      const updated = mp3Files.find(f => f.path === selectedFile.path);
      if (updated) setSelectedFile(updated);
    }
  }, [mp3Files]);

  return (
    <div className="h-screen bg-background text-foreground overflow-hidden font-sans flex flex-col selection:bg-primary selection:text-primary-foreground">
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={audioSrc || undefined}
        loop={isLoop}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onError={handleAudioError}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
             <Music4 className="h-5 w-5 text-primary" />
             <h1 className="text-sm font-bold tracking-[0.2em] uppercase">Roast</h1>
          </div>
          <Button variant="ghost" size="xs" className="h-7 border bg-muted/30" onClick={() => setShowSettings(true)}>
            <SettingsIcon className="h-3 w-3 mr-2" />
            設定
          </Button>
          {settings.defaultFolder && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[200px] font-mono opacity-60">
              {settings.defaultFolder}
            </span>
          )}
        </div>

        <div className="flex-1 max-w-md mx-8 relative group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            type="text"
            placeholder="ライブラリを検索..."
            className="pl-8 h-8 bg-muted/40 border-transparent focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          {status && (
            <div className="px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
               <span className="text-[9px] font-bold uppercase tracking-tighter text-primary">{status}</span>
            </div>
          )}
          <Button
            variant={isSidebarOpen ? "secondary" : "ghost"}
            size="xs"
            className="h-8 w-8 p-0 border"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Main Area */}
        <div className="flex-1 overflow-hidden p-4">
          <Mp3Table
            files={filteredFiles}
            onEdit={(file) => setEditingFile(file)}
            onOrganize={organizeFile}
            onSelect={selectFile}
            onDoubleClick={playFile}
            selectedPath={selectedFile?.path || null}
            onSort={toggleSort}
            sortField={sortField}
            sortOrder={sortOrder}
          />
        </div>

        {/* Sidebar (Detail View) */}
        {isSidebarOpen && (
          <aside className="w-80 h-full border-l bg-muted/10 overflow-hidden transition-all duration-300">
            <DetailView file={selectedFile} artwork={selectedArtwork} />
          </aside>
        )}
      </main>

      {/* Player Bar */}
      <footer className="h-24 border-t bg-background/95 backdrop-blur px-8 flex flex-col justify-center gap-3">
        {/* Seekbar */}
        <div className="flex items-center gap-3 w-full">
          <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">{formatTime(currentTime)}</span>
          <Slider
            min={0}
            max={duration || 0}
            step={0.1}
            value={[currentTime]}
            onValueChange={handleSeek}
            className="flex-1"
          />
          <span className="text-[10px] font-mono text-muted-foreground w-10">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4 w-[300px]">
             <Button
                variant="default"
                size="icon"
                className="h-10 w-10 rounded-full shadow-lg"
                onClick={togglePlay}
                disabled={status.startsWith("エラー") || status.startsWith("読み込み失敗")}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
             </Button>

             <Button
                variant={isLoop ? "secondary" : "ghost"}
                size="icon"
                className={isLoop ? "text-primary bg-primary/10 border-primary/20" : "text-muted-foreground"}
                onClick={() => setIsLoop(!isLoop)}
                title="Loop Track"
              >
                <Repeat className="h-4 w-4" />
             </Button>

             <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold truncate leading-none mb-1">
                  {selectedFile ? (selectedFile.title || selectedFile.filename) : "曲が選択されていません"}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">
                  {selectedFile?.artist || "—"}
                </span>
             </div>
           </div>

           {/* Volume Control */}
           <div className="flex items-center gap-3 w-[200px]">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[volume]}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
           </div>
        </div>
      </footer>

      {editingFile && (
        <EditModal
          file={editingFile}
          onSave={updateMetadata}
          onCancel={() => setEditingFile(null)}
          onChange={(file) => setEditingFile(file)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
