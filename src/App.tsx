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

  const [mp3Files, setMp3Files] = useState<Mp3Metadata[]>([]);
  const [editingFile, setEditingFile] = useState<Mp3Metadata | null>(null);
  const [selectedFile, setSelectedFile] = useState<Mp3Metadata | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoop, setIsLoop] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const drawerToggleRef = useRef<HTMLInputElement | null>(null);

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
    if (audioRef.current) {
      const assetUrl = convertFileSrc(file.path);
      audioRef.current.src = assetUrl;
      audioRef.current.load(); // Force reload to ensure src is updated
      audioRef.current.play().catch(e => console.error("Playback error:", e));
      setIsPlaying(true);
    }
    // Open drawer on double click
    if (drawerToggleRef.current) {
      drawerToggleRef.current.checked = true;
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Playback error:", e));
      }
      setIsPlaying(!isPlaying);
    }
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
    <div className="drawer drawer-end h-screen bg-base-100 text-base-content overflow-hidden font-sans">
      <input
        id="my-drawer"
        type="checkbox"
        className="drawer-toggle"
        ref={drawerToggleRef}
        defaultChecked={true}
      />
      <div className="drawer-content flex flex-col h-full overflow-hidden">
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
            <label htmlFor="my-drawer" className="btn btn-xs btn-square btn-ghost border border-base-content/20">
              <span className="text-[10px]">INFO</span>
            </label>
          </div>
        </div>

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

        {/* Simple Player Bar */}
        {selectedFile && (
          <div className="bg-base-300 h-16 border-t border-base-content/10 flex items-center px-4 gap-6">
             <div className="flex items-center gap-4">
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

             <audio
              ref={audioRef}
              loop={isLoop}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="hidden"
             />
          </div>
        )}
      </div>

      {/* Sidebar (Detail View) */}
      <div className="drawer-side h-full overflow-hidden border-l border-base-content/10 shadow-2xl">
        <label htmlFor="my-drawer" className="drawer-overlay"></label>
        <div className="bg-base-200 w-80 h-full overflow-hidden">
          <DetailView file={selectedFile} artwork={selectedArtwork} />
        </div>
      </div>

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
