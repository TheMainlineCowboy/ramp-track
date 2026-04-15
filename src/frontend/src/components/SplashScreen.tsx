const rampTrackSplash =
  "/assets/ramptracksplash-019d2e4b-1a18-736f-a7f6-8bff4344c78b.png";

export default function SplashScreen() {
  return (
    <div
      className="fixed inset-0"
      style={{
        backgroundImage: `url(${rampTrackSplash})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute bottom-12 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-black/30 backdrop-blur-sm">
          <div className="h-5 w-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
          <span className="text-white/90 text-sm font-medium tracking-wide">
            Loading Ramp Track...
          </span>
        </div>
      </div>
    </div>
  );
}
