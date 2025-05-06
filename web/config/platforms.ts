// Centralized list of common subscription platforms/providers for the app
// Extend this list as needed for new integrations or UI dropdowns

export interface PlatformConfig {
  name: string;
  logo: string; // Can be a local or remote asset
}

export const COMMON_PLATFORMS: PlatformConfig[] = [
  {
    name: 'Netflix',
    logo: '/netflix.svg',
  },
  {
    name: 'iCloud+',
    logo: '/icloudplus.svg',
  },
  {
    name: 'Apple Music',
    logo: '/apple-music.svg',
  },
  {
    name: 'ChatGPT Plus',
    logo: '/openai-plus.svg',
  },
  {
    name: 'Perplexity',
    logo: '/perplexity.svg',
  },
  {
    name: 'Youtube',
    logo: '/youtube.svg',
  },
  {
    name: 'Google One',
    logo: '/google-one.svg',
  },
];

export const PLATFORM_LOGO_MAP: Record<string, string> = COMMON_PLATFORMS.reduce((acc, p) => {
  acc[p.name.toLowerCase()] = p.logo;
  return acc;
}, {} as Record<string, string>);

export const DEFAULT_PLATFORM_LOGO = '/placeholder-logo.svg';

