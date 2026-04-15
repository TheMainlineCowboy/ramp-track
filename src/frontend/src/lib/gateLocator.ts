interface GateCoord {
  id: string;
  lat: number;
  lon: number;
  radiusMeters: number;
}

const GATES: GateCoord[] = [
  {
    id: "B1",
    lat: 33.43652941271447,
    lon: -111.99648442024326,
    radiusMeters: 60,
  },
  {
    id: "B2",
    lat: 33.43668190654748,
    lon: -111.99705682189241,
    radiusMeters: 60,
  },
  {
    id: "B3",
    lat: 33.43673513220326,
    lon: -111.99651112464439,
    radiusMeters: 60,
  },
  {
    id: "B4",
    lat: 33.43688154066052,
    lon: -111.99706718884259,
    radiusMeters: 60,
  },
  {
    id: "B5",
    lat: 33.43718145515051,
    lon: -111.99650353821168,
    radiusMeters: 60,
  },
  {
    id: "B6",
    lat: 33.43741056883996,
    lon: -111.99706240387128,
    radiusMeters: 60,
  },
  {
    id: "B7",
    lat: 33.43737137911717,
    lon: -111.99651965938126,
    radiusMeters: 60,
  },
  {
    id: "B8",
    lat: 33.4376780762007,
    lon: -111.99706798585063,
    radiusMeters: 60,
  },
  {
    id: "B9",
    lat: 33.43776458337843,
    lon: -111.99654248243465,
    radiusMeters: 60,
  },
  {
    id: "B10",
    lat: 33.43794225554831,
    lon: -111.99706878327603,
    radiusMeters: 60,
  },
  {
    id: "B11",
    lat: 33.43794225554789,
    lon: -111.99654487471129,
    radiusMeters: 60,
  },
  {
    id: "B12",
    lat: 33.43803741314922,
    lon: -111.99696511795754,
    radiusMeters: 60,
  },
  {
    id: "B13",
    lat: 33.43805338364498,
    lon: -111.99676097702903,
    radiusMeters: 60,
  },
  {
    id: "B14",
    lat: 33.43804140577353,
    lon: -111.99689574193673,
    radiusMeters: 60,
  },
  {
    id: "B15A",
    lat: 33.43647778584341,
    lon: -111.99387927676857,
    radiusMeters: 60,
  },
  {
    id: "B15B",
    lat: 33.43670936191042,
    lon: -111.99284421844931,
    radiusMeters: 60,
  },
  {
    id: "B16",
    lat: 33.43666411146744,
    lon: -111.99464161556904,
    radiusMeters: 60,
  },
  {
    id: "B17",
    lat: 33.43661220651089,
    lon: -111.9939335017044,
    radiusMeters: 60,
  },
  {
    id: "B18",
    lat: 33.43687040008856,
    lon: -111.99464480527213,
    radiusMeters: 60,
  },
  {
    id: "B19",
    lat: 33.43679587005656,
    lon: -111.99398294208704,
    radiusMeters: 60,
  },
  {
    id: "B20",
    lat: 33.43691964310474,
    lon: -111.9946527795274,
    radiusMeters: 60,
  },
  {
    id: "B21",
    lat: 33.43724438013012,
    lon: -111.99399410604437,
    radiusMeters: 60,
  },
  {
    id: "B22",
    lat: 33.43746530709402,
    lon: -111.99463364131637,
    radiusMeters: 60,
  },
  {
    id: "B23",
    lat: 33.43766760116439,
    lon: -111.99403397732058,
    radiusMeters: 60,
  },
  {
    id: "B24",
    lat: 33.43766627028742,
    lon: -111.99465756408296,
    radiusMeters: 60,
  },
  {
    id: "B25",
    lat: 33.43792978422625,
    lon: -111.99400048544894,
    radiusMeters: 60,
  },
  {
    id: "B26",
    lat: 33.43792179896715,
    lon: -111.99464161557242,
    radiusMeters: 60,
  },
  {
    id: "B27",
    lat: 33.43805355564857,
    lon: -111.99427161012802,
    radiusMeters: 60,
  },
  {
    id: "B28",
    lat: 33.43807618051315,
    lon: -111.99438005999964,
    radiusMeters: 60,
  },
  {
    id: "A1",
    lat: 33.43651899128809,
    lon: -111.99903042276948,
    radiusMeters: 60,
  },
];

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearestGate(lat: number, lon: number): string {
  let nearest: GateCoord | null = null;
  let nearestDist = Number.POSITIVE_INFINITY;
  for (const gate of GATES) {
    const dist = haversineMeters(lat, lon, gate.lat, gate.lon);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = gate;
    }
  }
  if (nearest && nearestDist <= 200) {
    return `Gate ${nearest.id}`;
  }
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

export function getLocationString(): Promise<string> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve("Location unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve(getNearestGate(pos.coords.latitude, pos.coords.longitude));
      },
      () => {
        resolve("Location unavailable");
      },
      { timeout: 10000, maximumAge: 30000 },
    );
  });
}
