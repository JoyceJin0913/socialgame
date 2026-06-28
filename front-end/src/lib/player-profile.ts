export type PlayerProfile = {
  nick: string;
  ageRange: string;
  pronoun: string;
  playStyle: string;
  contactCode: string;
  guest: boolean;
  createdAt: string;
};

export const PROFILE_STORAGE_KEY = "huatangchun_player_profile";
export const NICK_STORAGE_KEY = "huatangchun_match_nick";

export const DEFAULT_PROFILE: PlayerProfile = {
  nick: "入梦旅人",
  ageRange: "",
  pronoun: "",
  playStyle: "剧情沉浸",
  contactCode: "",
  guest: true,
  createdAt: "",
};

export function readPlayerProfile(): PlayerProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<PlayerProfile>) };
  } catch {
    // Ignore corrupted local data and fall back to a guest profile.
  }
  const nick = window.localStorage.getItem(NICK_STORAGE_KEY) || DEFAULT_PROFILE.nick;
  return { ...DEFAULT_PROFILE, nick };
}

export function savePlayerProfile(profile: PlayerProfile) {
  if (typeof window === "undefined") return;
  const normalized = {
    ...profile,
    nick: normalizeNick(profile.nick),
    createdAt: profile.createdAt || new Date().toISOString(),
  };
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(normalized));
  window.localStorage.setItem(NICK_STORAGE_KEY, normalized.nick);
}

export function normalizeNick(value: string) {
  return value.trim().slice(0, 12) || DEFAULT_PROFILE.nick;
}
