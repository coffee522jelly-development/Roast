import { useState, useEffect, useRef, useMemo } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { Mp3Table } from "./components/Mp3Table";
import { EditModal } from "./components/EditModal";
import { DetailView } from "./components/DetailView";
import { SettingsModal } from "./components/SettingsModal";
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
      audioRef.current.load();
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => {
          console.error("Playback failed:", e);
          setStatus(`Playback failed: ${e.message}`);
        });
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
      setStatus(`Loaded ${files.length} files`);
    } catch (err) {
      console.error(err);
      setStatus("Error loading files");
    }
  }

  async function organizeFile(path: string) {
    try {
      await invoke("organize_mp3", { path });
      setStatus("File organized");
      if (settings.defaultFolder) loadMp3Files(settings.defaultFolder);
    } catch (err) {
      console.error(err);
      setStatus(`Error organizing file: ${err}`);
    }
  }

  async function updateMetadata(file: Mp3Metadata) {
    try {
      await invoke("update_mp3_metadata", { path: file.path, metadata: file });
      setStatus("Metadata updated");
      setEditingFile(null);
      if (settings.defaultFolder) loadMp3Files(settings.defaultFolder);
    } catch (err) {
      console.error(err);
      setStatus("Error updating metadata");
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

  const playFile = (file: Mp3Metadata) => {
    selectFile(file);
    const assetUrl = convertFileSrc(file.path);
    setAudioSrc(assetUrl);
    setIsSidebarOpen(true);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(e => console.error("Playback failed:", e));
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return mp3Files;
    const q = searchQuery.toLowerCase();
    return mp3Files.filter(f =>
      (f.filename?.toLowerCase() ?? "").includes(q) ||
      (f.title?.toLowerCase() ?? "").includes(q) ||
      (f.artist?.toLowerCase() ?? "").includes(q) ||
      (f.album?.toLowerCase() ?? "").includes(q)
    );
  }, [mp3Files, searchQuery]);

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
    <div className="h-screen bg-base-100 text-base-content overflow-hidden font-sans flex flex-col">
      {/* Hidden Audio Element - Always rendered */}
      <audio
        ref={audioRef}
        src={audioSrc || undefined}
        loop={isLoop}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* Header */}
      <div className="navbar bg-base-200 border-b border-base-content/10 px-4 min-h-0 h-12 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-black tracking-tighter uppercase opacity-50">Roast</h1>
          <button className="btn btn-xs btn-ghost border border-base-content/20" onClick={() => setShowSettings(true)}>
            Settings
          </button>
          {settings.defaultFolder && (
            <span className="text-[10px] opacity-30 truncate max-w-[200px]">
              {settings.defaultFolder}
            </span>
          )}
        </div>

        <div className="flex-1 max-w-sm mx-4">
          <input
            type="text"
            placeholder="Search library..."
            className="input input-bordered input-xs w-full bg-base-300 border-transparent focus:border-primary/30 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          {status && <span className="text-[10px] italic opacity-30">{status}</span>}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`btn btn-xs btn-square ${isSidebarOpen ? "btn-primary" : "btn-ghost border border-base-content/20"}`}
          >
            <span className="text-[10px]">INFO</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Area */}
        <div className="flex-1 overflow-hidden p-2">
          <Mp3Table
            files={filteredFiles}
            onEdit={(file) => setEditingFile(file)}
            onOrganize={organizeFile}
            onSelect={selectFile}
            onDoubleClick={playFile}
            selectedPath={selectedFile?.path || null}
          />
        </div>

        {/* Sidebar (Detail View) */}
        {isSidebarOpen && (
          <div className="w-80 h-full bg-base-200 border-l border-base-content/10 shadow-2xl overflow-hidden transition-all duration-300">
            <DetailView file={selectedFile} artwork={selectedArtwork} />
          </div>
        )}
      </div>

      {/* Enhanced Player Bar */}
      {selectedFile && (
        <div className="bg-base-300 border-t border-base-content/10 flex flex-col p-2 gap-1 px-4">
          {/* Seekbar */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-[9px] font-mono opacity-50 w-8">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="range range-primary range-xs h-1 flex-1"
            />
            <span className="text-[9px] font-mono opacity-50 w-8">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-6 h-10">
             <div className="flex items-center gap-3">
               <button className="btn btn-circle btn-sm btn-primary" onClick={togglePlay}>
                  {isPlaying ? "⏸" : "▶"}
               </button>

               <div className="flex items-center gap-2 bg-base-100 px-3 py-1 rounded-full border border-base-content/5 shadow-inner">
                  <span className="text-[9px] uppercase font-bold opacity-50 tracking-wider">Loop</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-xs"
                    checked={isLoop}
                    onChange={(e) => setIsLoop(e.target.checked)}
                  />
               </div>
             </div>

             <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-bold truncate tracking-tight">{selectedFile.title || selectedFile.filename}</span>
                <span className="text-[10px] opacity-50 uppercase tracking-widest">{selectedFile.artist || "Unknown Artist"}</span>
             </div>

             {/* Volume Control */}
             <div className="flex items-center gap-2 w-32">
                <span className="text-[10px] opacity-50 font-bold uppercase tracking-tighter">Vol</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="range range-xs h-1 flex-1"
                />
             </div>
          </div>
        </div>
      )}

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
