import React, { useState, useEffect, useRef } from 'react';
import { ShotData, ProcessedFrame, Language, VideoMetadata } from '../types';
import { DownloadIcon, VideoIcon } from './Icons';
import { t } from '../utils/translations';
import { captureHighResFrame, downloadBase64Image, downloadVideoFile } from '../utils/videoUtils';
import ShotTableStats from './ShotTableStats';

interface ShotTableProps {
  shots: ShotData[];
  frames: ProcessedFrame[];
  videoFile: File | null;
  videoMeta: VideoMetadata | null;
  language: Language;
  theme: 'light' | 'dark';
  onUpdateShot: (id: number, field: keyof ShotData, value: string) => void;
}

// Helper to parse MM:SS to seconds
const parseTime = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.toString().split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parseFloat(timeStr);
};

// Virtual Clip Player Component - High Precision
const ClipPlayer = ({ videoSrc, startTime, endTime }: { videoSrc: string, startTime: string, endTime: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const start = parseTime(startTime) + 0.05; // Add small buffer to skip previous shot's last frame
  // Add a tiny buffer (-0.05s) to end time to prevent bleeding into next frame visual
  const end = Math.max(start + 0.1, parseTime(endTime) - 0.02); // Reduce buffer to show current shot's actual last frame

  const animate = () => {
    if (videoRef.current) {
      const vid = videoRef.current;
      
      // High-precision loop check
      if (vid.currentTime >= end) {
        vid.currentTime = start;
        vid.play().catch(() => {}); // Ignore play interruption errors
      }
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onCanPlay = () => {
       video.currentTime = start;
       video.play().catch(e => console.log("Autoplay prevented", e));
       requestRef.current = requestAnimationFrame(animate);
    };

    video.addEventListener('loadedmetadata', onCanPlay);
    // Fallback if metadata already loaded
    if (video.readyState >= 1) {
        onCanPlay();
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      video.removeEventListener('loadedmetadata', onCanPlay);
    };
  }, [start, end]);

  return (
    <video
      ref={videoRef}
      src={videoSrc}
      muted
      playsInline
      className="w-full h-full object-cover"
      style={{ pointerEvents: 'none' }} // Prevent user interaction breaking the loop
    />
  );
};

const ShotTable: React.FC<ShotTableProps> = ({ shots, frames, videoFile, videoMeta, language, theme, onUpdateShot }) => {
  const [showVideo, setShowVideo] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: number, field: string } | null>(null);
  const [downloadingShotId, setDownloadingShotId] = useState<number | null>(null);

  // Create Object URL for the video file once
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoFile]);

  const handleExport = () => {
    const headers = ["Shot", "Start", "End", "Dur", "Size", "Movement", "Description", "Audio", "SFX"];
    const csvContent = [
      headers.join(","),
      ...shots.map(s => 
        [s.shotNumber, s.startTime, s.endTime, s.duration, `"${s.size}"`, `"${s.movement}"`, `"${s.description.replace(/"/g, '""')}"`, `"${s.audio}"`, `"${s.sfx}"`].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `shotlist_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadFrame = async (e: React.MouseEvent, shot: ShotData) => {
      e.stopPropagation();
      if (!videoFile || downloadingShotId !== null) return;

      try {
          setDownloadingShotId(shot.shotNumber);
          const time = parseTime(shot.startTime) + 0.1; // Add slight offset to avoid black frames at cut point
          const base64 = await captureHighResFrame(videoFile, time);
          downloadBase64Image(base64, `Shot_${shot.shotNumber}_${shot.startTime.replace(':', '-')}.jpg`);
      } catch (err) {
          console.error("Failed to download frame", err);
          alert("Could not capture frame.");
      } finally {
          setDownloadingShotId(null);
      }
  };

  const handleDownloadVideo = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (videoFile) {
          downloadVideoFile(videoFile);
      }
  };

  // Render Cell (Text or Input)
  const renderCell = (shot: ShotData, field: keyof ShotData, className: string = "") => {
    const isEditing = editing?.id === shot.shotNumber && editing?.field === field;

    if (isEditing) {
      return (
        <textarea
          autoFocus
          defaultValue={String(shot[field])}
          onFocus={(e) => {
             // Move cursor to end
             const val = e.target.value;
             e.target.value = '';
             e.target.value = val;
          }}
          onBlur={(e) => {
            onUpdateShot(shot.shotNumber, field, e.target.value);
            setEditing(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onUpdateShot(shot.shotNumber, field, (e.target as HTMLTextAreaElement).value);
              setEditing(null);
            }
          }}
          // REFINED EDITING STYLE: 
          // - Gray border instead of thick Blue
          // - Subtle focus ring
          // - Full width/min-height for usability
          // - Larger default height
          className="w-full h-full min-h-[150px] bg-white dark:bg-[#2c2d2e] text-gray-900 dark:text-gray-100 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm font-sans leading-relaxed resize-y block transition-all z-10 relative"
        />
      );
    }

    return (
      <div 
        onDoubleClick={() => setEditing({ id: shot.shotNumber, field: String(field) })}
        className={`cursor-pointer hover:text-gray-900 dark:hover:text-white hover:font-medium transition-colors break-words whitespace-normal leading-relaxed ${className}`}
        title={String(shot[field])}
      >
        {shot[field]}
      </div>
    );
  };

  // Calculate dynamic aspect ratio style for previews
  const previewAspectRatio = videoMeta ? `${videoMeta.width} / ${videoMeta.height}` : '16 / 9';

  return (
    <div className="w-full pb-16 flex flex-col gap-8">
      {/* Removed Top Toolbar Controls to align with other tabs */}

      <div className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e1f20] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none overflow-hidden transition-colors duration-300">
        <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300 table-fixed">
          <thead className="bg-gray-50/50 dark:bg-[#2c2d2e] text-[11px] uppercase text-gray-400 dark:text-gray-500 font-bold tracking-wider border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-4 text-center w-[6%]">
                  <span>{t('shot', language)}</span>
              </th>
              <th className="px-4 py-4 w-[18%]">
                <div className="flex items-center gap-3">
                   {t('preview', language)}
                   {/* Inline Video Toggle */}
                   <button 
                     onClick={() => setShowVideo(!showVideo)}
                     className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none border border-gray-300 dark:border-gray-600 ${showVideo ? 'bg-gray-900 dark:bg-gray-200 border-gray-900 dark:border-gray-200' : 'bg-gray-200 dark:bg-gray-600'}`}
                     title={t('videoPreview', language)}
                   >
                     <span className={`${showVideo ? 'translate-x-3.5' : 'translate-x-0.5'} inline-block h-3 w-3 transform rounded-full bg-white dark:bg-gray-800 transition-transform shadow-sm`} />
                   </button>
                </div>
              </th>
              <th className="px-4 py-4 w-[8%]">{t('time', language)}</th>
              <th className="px-4 py-4 w-[7%]">{t('size', language)}</th>
              <th className="px-4 py-4 w-[8%]">{t('movement', language)}</th>
              <th className="px-4 py-4 w-[24%]">{t('description', language)}</th>
              <th className="px-4 py-4 w-[20%]">{t('dialogue', language)}</th>
              {/* SFX Header with Export Button */}
              <th className="px-4 py-4 w-[9%]">
                  <div className="flex items-center justify-between w-full">
                    <span>{t('sfx', language)}</span>
                    <button 
                        onClick={handleExport} 
                        className="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white transition-colors p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        title="Export CSV"
                      >
                        <DownloadIcon />
                    </button>
                  </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {shots.map((shot) => {
              let frameSrc = "";
              if (frames[shot.thumbnailIndex]) {
                frameSrc = `data:image/jpeg;base64,${frames[shot.thumbnailIndex].data}`;
              } else if (frames.length > 0) {
                 frameSrc = `data:image/jpeg;base64,${frames[0].data}`;
              }
              
              const durationNum = parseFloat(String(shot.duration));

              return (
                <tr key={shot.shotNumber} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="px-4 py-5 text-center font-mono text-gray-900 dark:text-gray-100 font-bold align-top text-sm">
                    {shot.shotNumber}
                  </td>
                  <td className="px-4 py-5 align-top">
                    <div 
                        className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 relative shadow-sm group/thumb"
                        style={{ aspectRatio: previewAspectRatio }}
                    >
                      {showVideo && videoSrc ? (
                        <>
                            <ClipPlayer videoSrc={videoSrc} startTime={shot.startTime} endTime={shot.endTime} />
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover/thumb:opacity-100 transition-opacity z-10">
                                <button 
                                    onClick={(e) => handleDownloadVideo(e)}
                                    className="p-1.5 bg-black/60 hover:bg-black text-white rounded-full shadow-md transition-all"
                                    title={t('downloadHighRes', language)}
                                >
                                    <DownloadIcon />
                                </button>
                            </div>
                        </>
                      ) : (
                        <>
                            {frameSrc && (
                                <img 
                                src={frameSrc} 
                                alt={`Shot ${shot.shotNumber}`} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity backdrop-blur-[1px]">
                                <button 
                                    onClick={(e) => handleDownloadFrame(e, shot)}
                                    disabled={downloadingShotId === shot.shotNumber}
                                    className="p-2 bg-white hover:bg-gray-50 rounded-full text-gray-900 shadow-lg transition-all transform hover:scale-110"
                                    title={t('downloadHighRes', language)}
                                >
                                    {downloadingShotId === shot.shotNumber ? (
                                        <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <DownloadIcon />
                                    )}
                                </button>
                            </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-5 font-mono text-xs align-top">
                    <div className="text-gray-900 dark:text-gray-100 font-semibold">{shot.startTime}</div>
                    <div className="text-gray-400 dark:text-gray-500 mt-1">
                        {isNaN(durationNum) ? shot.duration : durationNum.toFixed(1)}s
                    </div>
                  </td>
                  <td className="px-4 py-5 align-top">
                    <span className="inline-block w-full">
                        {renderCell(shot, 'size', "px-2.5 py-1 bg-gray-100 dark:bg-[#2c2d2e] text-xs font-semibold rounded text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 block text-center")}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-gray-700 dark:text-gray-300 align-top font-medium text-xs">
                    {renderCell(shot, 'movement')}
                  </td>
                  <td className="px-4 py-5 text-gray-600 dark:text-gray-400 leading-relaxed align-top text-sm">
                    {renderCell(shot, 'description')}
                  </td>
                  <td className="px-4 py-5 text-gray-600 dark:text-gray-400 text-sm align-top">
                    {renderCell(shot, 'audio')}
                  </td>
                  <td className="px-4 py-5 text-gray-600 dark:text-gray-400 text-sm align-top">
                    {renderCell(shot, 'sfx')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Metadata and Statistics Footer */}
      <ShotTableStats shots={shots} language={language} theme={theme} />
    </div>
  );
};

export default ShotTable;
