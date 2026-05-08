import { type FC, useEffect, useRef, useState } from "react";

interface RTSIntroScreenProps {
  onComplete: () => void;
}

const RTSIntroScreen: FC<RTSIntroScreenProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);
  const [opacity, setOpacity] = useState(1);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      document.body.style.overflow = "";
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      onCompleteRef.current();
    };

    const startFade = () => {
      if (doneRef.current) return;
      setOpacity(0);
      fadeTimerRef.current = setTimeout(finish, 1000);
    };

    // Lock scrolling during playback
    document.body.style.overflow = "hidden";

    const video = videoRef.current;
    if (!video) {
      fallbackTimerRef.current = setTimeout(finish, 5000);
      return;
    }

    const handleEnded = () => {
      startFade();
    };

    const handleTimeUpdate = () => {
      if (!video || doneRef.current) return;
      const { currentTime, duration } = video;
      if (duration > 0 && currentTime >= duration - 1.0) {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        startFade();
      }
    };

    const handleError = () => {
      finish();
    };

    fallbackTimerRef.current = setTimeout(() => {
      if (!doneRef.current) finish();
    }, 5000);

    const handlePlaying = () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };

    video.addEventListener("ended", handleEnded);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("error", handleError);
    video.addEventListener("playing", handlePlaying);

    video.play().catch(() => {
      finish();
    });

    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("error", handleError);
      video.removeEventListener("playing", handlePlaying);
      document.body.style.overflow = "";
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#030816",
        overflow: "hidden",
        pointerEvents: "none",
        opacity,
        transition: opacity === 0 ? "opacity 1s ease-in-out" : "none",
      }}
    >
      <video
        ref={videoRef}
        src="/assets/ramptrack_intro.mp4"
        autoPlay
        muted={false}
        playsInline
        preload="auto"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          objectPosition: "center center",
          display: "block",
          border: "none",
          margin: 0,
          padding: 0,
        }}
      />
    </div>
  );
};

export default RTSIntroScreen;
