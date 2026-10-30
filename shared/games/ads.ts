export type AdPlacement = 'catalog' | 'game-info' | 'results' | 'rewarded'
export type AdState = 'disabled' | 'needs-consent' | 'loading' | 'test' | 'unavailable' | 'frequency-limited' | 'error'
export const gameAdConfig = { enabled: false, provider: 'monetag', minimumIntervalMs: 120000, rewardedEnabled: false } as const
export class GameAds {
  private lastShown = 0
  constructor(private testMode = false) {}
  async request(placement: AdPlacement, consent: boolean, playing = false): Promise<{ state: AdState; rewardGranted: false }> {
    if (playing || placement === 'rewarded') return { state: 'unavailable', rewardGranted: false }
    if (!gameAdConfig.enabled && !this.testMode) return { state: 'disabled', rewardGranted: false }
    if (!consent) return { state: 'needs-consent', rewardGranted: false }
    if (this.lastShown && Date.now() - this.lastShown < gameAdConfig.minimumIntervalMs) return { state: 'frequency-limited', rewardGranted: false }
    try {
      // No provider scripts are installed. Test mode cannot load real advertisements.
      this.lastShown = Date.now()
      return { state: this.testMode ? 'test' : 'unavailable', rewardGranted: false }
    } catch { return { state: 'error', rewardGranted: false } }
  }
}
