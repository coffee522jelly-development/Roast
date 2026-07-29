import { useState, useEffect, useRef, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { cn } from "./lib/utils";
import { Mp3Table } from "./components/Mp3Table";
import { Mp3GridView } from "./components/Mp3GridView";
import { WaveformDisplay } from "./components/WaveformDisplay";
import { EditModal } from "./components/EditModal";
import { DetailView } from "./components/DetailView";
import { SettingsModal } from "./components/SettingsModal";
import { Visualizer } from "./components/Visualizer";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Slider } from "./components/ui/slider";
import {
  Settings as SettingsIcon,
  Info,
  Search,
  X,
  Play,
  Pause,
  Repeat,
  Volume2,
  Flame,
  LayoutGrid,
  List,
  Activity,
  RotateCw,
  Maximize,
  Shrink,
  Coffee,
  CheckCircle2,
  Library
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
  bitrate: number | null;
  sample_rate: number | null;
}

interface Settings {
  defaultFolder: string | null;
  theme: string;
  bgMode: string;
  waveformOpacity: number;
}

function App() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem("roast-settings");
      const defaults = { defaultFolder: null, theme: "zinc", bgMode: "light", waveformOpacity: 0.5 };
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch (e) {
      console.error("Failed to parse settings:", e);
      return { defaultFolder: null, theme: "zinc", bgMode: "light", waveformOpacity: 0.5 };
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid" | "visualizer">("table");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sortField, setSortField] = useState<"filename" | "artist" | "quality">("filename");
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
  const [rawB64, setRawB64] = useState<string | null>(null);
  const [aPoint, setAPoint] = useState<number | null>(null);
  const [bPoint, setBPoint] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Web Audio API refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const lpfNodeRef = useRef<BiquadFilterNode | null>(null);
  const hpfNodeRef = useRef<BiquadFilterNode | null>(null);

  const [lpfFreq, setLpfFreq] = useState(20000);
  const [hpfFreq, setHpfFreq] = useState(20);
  const [isFilterEnabled, setIsFilterEnabled] = useState(false);

  // Initialize Web Audio API
  useEffect(() => {
    if (audioRef.current && !audioContextRef.current) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserNodeRef.current = analyser;

      const lpf = audioContext.createBiquadFilter();
      lpf.type = "lowpass";
      lpf.frequency.value = 20000;
      lpfNodeRef.current = lpf;

      const hpf = audioContext.createBiquadFilter();
      hpf.type = "highpass";
      hpf.frequency.value = 20;
      hpfNodeRef.current = hpf;

      const source = audioContext.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;

      // Connect: source -> Analyser -> LPF -> HPF -> destination
      source.connect(analyser);
      analyser.connect(lpf);
      lpf.connect(hpf);
      hpf.connect(audioContext.destination);
    }
  }, []);

  // Update filter parameters
  useEffect(() => {
    if (lpfNodeRef.current && hpfNodeRef.current) {
      if (isFilterEnabled) {
        lpfNodeRef.current.frequency.setTargetAtTime(lpfFreq, audioContextRef.current!.currentTime, 0.05);
        hpfNodeRef.current.frequency.setTargetAtTime(hpfFreq, audioContextRef.current!.currentTime, 0.05);
      } else {
        lpfNodeRef.current.frequency.setTargetAtTime(20000, audioContextRef.current!.currentTime, 0.05);
        hpfNodeRef.current.frequency.setTargetAtTime(20, audioContextRef.current!.currentTime, 0.05);
      }
    }
  }, [lpfFreq, hpfFreq, isFilterEnabled]);

  // Apply theme and bg mode
  useEffect(() => {
    document.body.setAttribute("data-theme", settings.theme);
    document.body.setAttribute("data-bg-mode", settings.bgMode);
  }, [settings.theme, settings.bgMode]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F or Cmd+F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        const searchInput = document.getElementById("search-input");
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  async function deleteFile(path: string) {
    try {
      await invoke("delete_mp3", { path });
      setStatus("ファイルを削除しました");

      // Clear current audio source if deleted file was playing
      if (selectedFile?.path === path) {
        setAudioSrc(null);
        setSelectedFile(null);
      }

      if (settings.defaultFolder) loadMp3Files(settings.defaultFolder);
    } catch (err: any) {
      console.error(err);
      setStatus(`削除失敗: ${err.message || err}`);
    }
  }

  async function updateMetadata(file: Mp3Metadata) {
    try {
      // 1. Check if filename changed
      const originalFile = mp3Files.find(f => f.path === file.path);
      let currentPath = file.path;

      if (originalFile && originalFile.filename !== file.filename) {
        setStatus("リネーム中...");
        const newPath: string = await invoke("rename_mp3_file", {
          path: file.path,
          newName: file.filename
        });
        currentPath = newPath;
      }

      // 2. Update tags
      await invoke("update_mp3_metadata", { path: currentPath, metadata: file });

      setStatus("更新が完了しました");
      setEditingFile(null);
      if (settings.defaultFolder) loadMp3Files(settings.defaultFolder);
    } catch (err: any) {
      console.error(err);
      setStatus(`更新失敗: ${err.message || err}`);
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
    console.log("ROAST: Starting playback for", file.filename);
    if (file.is_locked) {
      setStatus("ファイルがロックされています");
      alert("ファイルが他のプログラムによってロックされているため、再生できません。");
      return;
    }

    selectFile(file);
    setIsSidebarOpen(true); // Open sidebar when playing

    try {
      setStatus("読み込み中...");
      console.log("ROAST_DEBUG: Invoking read_audio_file for", file.path);
      const b64: string = await invoke("read_audio_file", { path: file.path });
      console.log("ROAST_DEBUG: Received b64 data, length:", b64.length);

      setRawB64(b64);
      setAPoint(null);
      setBPoint(null);

      // Using Data URL directly as a final fallback for problematic environments
      const dataUrl = `data:audio/mpeg;base64,${b64}`;

      // Also maintain Blob as an alternative if needed, but Data URL is more direct
      // Here we prioritize Data URL for extreme compatibility
      setAudioSrc(dataUrl);
    } catch (err: any) {
      console.error("Error loading file via Rust backend:", err);
      setStatus(`読み込み失敗: ${err}`);
    }
  };

  const togglePlay = async () => {
    if (!audioSrc) return;
    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }
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
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      setDuration(audioRef.current.duration);

      // A-B Repeat logic
      if (aPoint !== null && bPoint !== null) {
        if (time >= bPoint) {
          audioRef.current.currentTime = aPoint;
        }
      }
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
        case 4:
          message = "非対応形式、またはコーデック不足です。Windows Media Feature Packがインストールされているか確認してください。";
          alert("再生エラー: ブラウザエンジン(WebView2)で再生できません。Windows N版などをお使いの場合は Media Feature Pack のインストールが必要な場合があります。外部プレイヤーでの再生もご検討ください。");
          break;
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

  const getRoastStatus = (file: Mp3Metadata | null) => {
    if (!file) return null;
    let score = 0;
    if (file.title) score += 25;
    if (file.artist) score += 25;
    if (file.album) score += 15;
    if (file.year) score += 10;
    if ((file.bitrate || 0) >= 320) score += 25;

    if (score >= 100) return { label: "Perfectly Roasted", color: "text-amber-500", icon: <Flame className="h-3 w-3" /> };
    if (score >= 75) return { label: "Well Done", color: "text-amber-600/80", icon: <Coffee className="h-3 w-3" /> };
    if (score >= 50) return { label: "Medium", color: "text-muted-foreground", icon: <CheckCircle2 className="h-3 w-3" /> };
    return { label: "Lightly Roasted", color: "text-muted-foreground/40", icon: null };
  };

  const setA = () => {
    setAPoint(currentTime);
    if (bPoint !== null && currentTime >= bPoint) setBPoint(null);
    setStatus("点Aを設定しました");
  };

  const setB = () => {
    if (aPoint !== null && currentTime <= aPoint) {
      alert("点Bは点Aより後である必要があります");
      return;
    }
    setBPoint(currentTime);
    setStatus("点Bを設定しました");
  };

  const clearAB = () => {
    setAPoint(null);
    setBPoint(null);
    setStatus("A-Bリピートを解除しました");
  };

  const filteredFiles = useMemo(() => {
    let result = [...mp3Files];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f =>
        (f.filename?.toLowerCase() ?? "").includes(q) ||
        (f.title?.toLowerCase() ?? "").includes(q) ||
        (f.artist?.toLowerCase() ?? "").includes(q) ||
        (f.album?.toLowerCase() ?? "").includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortField === "quality") {
        let valA = a.bitrate || 0;
        let valB = b.bitrate || 0;
        if (valA === valB) {
          valA = a.sample_rate || 0;
          valB = b.sample_rate || 0;
        }
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }

      let valA = (sortField === "filename" ? a.filename : (a.artist || "")).toLowerCase();
      let valB = (sortField === "filename" ? b.filename : (b.artist || "")).toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [mp3Files, searchQuery, sortField, sortOrder]);

  const toggleSort = (field: "filename" | "artist" | "quality") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleFocusMode = async () => {
    const nextMode = !isFocusMode;
    setIsFocusMode(nextMode);

    const win = getCurrentWindow();
    if (nextMode) {
      // Small vertical size for Focus Mode
      await win.setSize(new LogicalSize(500, 800));
    } else {
      // Large horizontal size for Standard Mode
      await win.setSize(new LogicalSize(1280, 800));
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

  const libraryStats = useMemo(() => {
    const totalSize = mp3Files.reduce((acc, f) => acc + f.size, 0);
    const gb = totalSize / (1024 * 1024 * 1024);
    return {
      count: mp3Files.length,
      size: gb >= 1 ? `${gb.toFixed(2)} GB` : `${(totalSize / (1024 * 1024)).toFixed(1)} MB`
    };
  }, [mp3Files]);

  return (
    <div className="relative h-screen bg-background text-foreground overflow-hidden font-sans flex flex-col selection:bg-primary selection:text-primary-foreground transition-colors duration-500">
      {/* Dynamic Background */}
      {selectedArtwork && (
        <div
          className="absolute inset-0 z-0 pointer-events-none transition-all duration-1000 ease-in-out opacity-20 scale-110 blur-[100px]"
          style={{
            backgroundImage: `url(${selectedArtwork})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

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
             <Flame className="h-5 w-5 text-primary fill-primary/10" />
             <h1 className="text-sm font-bold tracking-[0.2em] uppercase">Roast</h1>
          </div>
          <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/20">
            <Button
              variant="ghost"
              size="xs"
              className="h-8 w-8 p-0"
              onClick={() => setShowSettings(true)}
              title="設定"
            >
              <SettingsIcon className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              className="h-8 w-8 p-0"
              onClick={() => settings.defaultFolder && loadMp3Files(settings.defaultFolder)}
              title="ライブラリを更新"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </Button>
          </div>
          {settings.defaultFolder && !isFocusMode && (
            <div className="flex items-center gap-3 border-l pl-6 ml-2 h-6 border-muted/30">
               <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">
                  <Library className="h-3 w-3" />
                  <span>{libraryStats.count} 曲</span>
                  <span className="mx-1 opacity-30">/</span>
                  <span>{libraryStats.size}</span>
               </div>
               <span className="text-[9px] text-muted-foreground truncate max-w-[150px] font-mono opacity-40 italic">
                 {settings.defaultFolder}
               </span>
            </div>
          )}
        </div>

        <div className="flex-1 max-w-md mx-8 relative group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            id="search-input"
            type="text"
            placeholder="ライブラリを検索..."
            className="pl-8 pr-8 h-8 bg-muted/40 border-transparent focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {status && (
            <div className="px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
               <span className="text-[9px] font-bold uppercase tracking-tighter text-primary">{status}</span>
            </div>
          )}
          <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/20">
            <Button
              variant={isFocusMode ? "secondary" : "ghost"}
              size="xs"
              className="h-7 w-7 p-0"
              onClick={toggleFocusMode}
              title={isFocusMode ? "標準モード" : "集中モード"}
            >
              {isFocusMode ? <Shrink className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
            </Button>

            {!isFocusMode && (
              <>
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="xs"
                  className="h-7 w-7 p-0"
                  onClick={() => setViewMode("table")}
                  title="リスト表示"
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="xs"
                  className="h-7 w-7 p-0"
                  onClick={() => setViewMode("grid")}
                  title="アルバムアート表示"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={viewMode === "visualizer" ? "secondary" : "ghost"}
                  size="xs"
                  className="h-7 w-7 p-0"
                  onClick={() => setViewMode("visualizer")}
                  title="ビジュアライザー表示"
                >
                  <Activity className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>

          {!isFocusMode && (
            <Button
              variant={isSidebarOpen ? "secondary" : "ghost"}
              size="xs"
              className="h-8 w-8 p-0 border"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Info className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden z-10">
        {/* Main Area */}
        <div className="flex-1 overflow-hidden p-4">
          {isFocusMode ? (
            <div className="h-full flex flex-col items-center justify-center gap-10 animate-in fade-in zoom-in duration-500 max-w-full px-4">
              <div className="relative aspect-square w-full max-w-[420px] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-muted ring-1 ring-primary/10">
                {selectedArtwork ? (
                  <img src={selectedArtwork} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-10">
                    <Flame className="w-24 h-24" />
                  </div>
                )}
              </div>
              <div className="text-center space-y-3 w-full">
                <h2 className="text-xl font-bold tracking-tight truncate px-2">{selectedFile?.title || selectedFile?.filename || "No Selection"}</h2>
                <p className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground opacity-60 truncate">{selectedFile?.artist || "Unknown Artist"}</p>
              </div>
            </div>
          ) : viewMode === "table" ? (
            <Mp3Table
              files={filteredFiles}
              onEdit={(file) => setEditingFile(file)}
              onOrganize={organizeFile}
              onDelete={deleteFile}
              onSelect={selectFile}
              onDoubleClick={playFile}
              selectedPath={selectedFile?.path || null}
              onSort={toggleSort}
              sortField={sortField}
              sortOrder={sortOrder}
            />
          ) : viewMode === "grid" ? (
            <Mp3GridView
              files={filteredFiles}
              onSelect={selectFile}
              onDoubleClick={playFile}
              selectedPath={selectedFile?.path || null}
            />
          ) : viewMode === "visualizer" ? (
            <Visualizer analyserNode={analyserNodeRef.current} theme={settings.theme} />
          ) : null}
        </div>

        {/* Sidebar (Detail View) */}
        {isSidebarOpen && !isFocusMode && (
          <aside className="w-80 h-full border-l bg-muted/10 backdrop-blur-sm overflow-hidden transition-all duration-300">
            <DetailView
              file={selectedFile}
              artwork={selectedArtwork}
              status={getRoastStatus(selectedFile)}
            />
          </aside>
        )}
      </main>

      {/* Player Bar */}
      <footer className={`h-44 border-t bg-background/95 backdrop-blur ${isFocusMode ? "px-6" : "px-10"} flex flex-col justify-center gap-1 z-30`}>
        {/* Waveform and Seekbar Container */}
        <div className="w-full flex flex-col gap-0.5 pt-2">
          <div className="relative w-full h-14">
            <WaveformDisplay
              b64Data={rawB64}
              currentTime={currentTime}
              duration={duration}
              onSeek={(t: number) => {
                if (audioRef.current) audioRef.current.currentTime = t;
                setCurrentTime(t);
              }}
              aPoint={aPoint}
              bPoint={bPoint}
              opacity={settings.waveformOpacity}
              theme={settings.theme}
            />
          </div>

          <div className="relative w-full h-4 flex items-center">
            <Slider
              min={0}
              max={duration || 0}
              step={0.1}
              value={[currentTime]}
              onValueChange={handleSeek}
              className="w-full relative z-10"
            />
          </div>

          <div className="flex items-center justify-between px-0.5">
            <span className="text-[9px] font-mono text-muted-foreground opacity-70">
              {formatTime(currentTime)}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground opacity-70">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 overflow-hidden">
           <div className={`flex items-center gap-4 ${isFocusMode ? "flex-1" : "min-w-[300px]"} min-w-0`}>
             <div className="flex items-center gap-2 shrink-0">
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
                  className={isLoop ? "text-primary bg-primary/10 border-primary/20 shrink-0" : "text-muted-foreground shrink-0"}
                  onClick={() => setIsLoop(!isLoop)}
                  title="1曲ループ"
                >
                  <Repeat className="h-4 w-4" />
               </Button>
             </div>

             {!isFocusMode && (
               <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/20 ml-2 shrink-0">
                  <Button
                    variant={aPoint !== null ? "secondary" : "ghost"}
                    size="xs"
                    className="h-7 text-[10px] px-2"
                    onClick={setA}
                  >
                    A
                  </Button>
                  <Button
                    variant={bPoint !== null ? "secondary" : "ghost"}
                    size="xs"
                    className="h-7 text-[10px] px-2"
                    onClick={setB}
                  >
                    B
                  </Button>
                  {(aPoint !== null || bPoint !== null) && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-7 text-[10px] px-2 text-destructive hover:text-destructive"
                      onClick={clearAB}
                    >
                      解除
                    </Button>
                  )}
               </div>
             )}

             <div className="flex flex-col min-w-0 ml-2 overflow-hidden">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold truncate leading-none whitespace-nowrap">
                    {selectedFile ? (selectedFile.title || selectedFile.filename) : "曲が選択されていません"}
                  </span>
                  {selectedFile && (
                    <div className={cn("shrink-0", getRoastStatus(selectedFile)?.color)}>
                      {getRoastStatus(selectedFile)?.icon}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest truncate opacity-60 whitespace-nowrap">
                  {selectedFile?.artist || "—"}
                </span>
             </div>
           </div>

           {/* Filter Controls */}
           {!isFocusMode && (
           <div className="flex items-center gap-6 border-x px-8 mx-4 h-16">
              <div className="flex flex-col gap-2">
                 <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest font-bold opacity-40">Filter System</span>
                    <Button
                      variant={isFilterEnabled ? "secondary" : "ghost"}
                      size="xs"
                      className={`h-5 px-2 text-[8px] font-bold ${isFilterEnabled ? "text-primary border-primary/20" : "opacity-50"}`}
                      onClick={() => setIsFilterEnabled(!isFilterEnabled)}
                    >
                      {isFilterEnabled ? "ACTIVE" : "BYPASS"}
                    </Button>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-1.5 w-24">
                       <div className="flex justify-between items-center text-[8px] font-mono">
                          <span className="opacity-60">LPF</span>
                          <span className={isFilterEnabled ? "text-primary" : "opacity-40"}>
                            {lpfFreq < 1000 ? `${lpfFreq}Hz` : `${(lpfFreq/1000).toFixed(1)}k`}
                          </span>
                       </div>
                       <Slider
                         min={200}
                         max={20000}
                         step={100}
                         value={[lpfFreq]}
                         onValueChange={(v) => setLpfFreq(v[0])}
                         disabled={!isFilterEnabled}
                         className="w-full"
                       />
                    </div>
                    <div className="flex flex-col gap-1.5 w-24">
                       <div className="flex justify-between items-center text-[8px] font-mono">
                          <span className="opacity-60">HPF</span>
                          <span className={isFilterEnabled ? "text-primary" : "opacity-40"}>{hpfFreq}Hz</span>
                       </div>
                       <Slider
                         min={20}
                         max={5000}
                         step={10}
                         value={[hpfFreq]}
                         onValueChange={(v) => setHpfFreq(v[0])}
                         disabled={!isFilterEnabled}
                         className="w-full"
                       />
                    </div>
                 </div>
              </div>
           </div>
           )}

           {/* Volume Control */}
           <div className={`flex items-center gap-3 ${isFocusMode ? "w-24" : "w-[180px]"} shrink-0 justify-end`}>
              <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[volume]}
                onValueChange={handleVolumeChange}
                className={isFocusMode ? "w-16" : "w-24"}
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
      <button id="test-trigger-edit" className="hidden" onClick={() => setEditingFile({
        path: "/fake/path.mp3",
        filename: "test_file.mp3",
        title: "Test Title",
        artist: "Test Artist",
        album: "Test Album",
        year: 2024,
        duration: 120,
        size: 1000,
        is_locked: false,
        bitrate: 320,
        sample_rate: 44100
      })}>Test</button>

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
