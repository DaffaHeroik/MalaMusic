var Stats = {
    pending: 0,
    last: null,
    lastTrackId: null,
    active: false,
    seeking: false,
    inFlight: false,
    flushTimer: null,
    refreshTimer: null,
    trackId: function (track) {
        return String(track && (track.videoId || track.id || track.video_id) || '');
    },
    reset: function (track, position) {
        this.active = false;
        this.seeking = false;
        this.lastTrackId = this.trackId(track) || null;
        this.last = Number.isFinite(position) && position >= 0 ? position : null;
    },
    start: function (track, position) {
        var id = this.trackId(track);
        if (!id) return;
        if (this.lastTrackId !== id) {
            this.lastTrackId = id;
            this.last = null;
        }
        this.last = Number.isFinite(position) && position >= 0 ? position : this.last;
        this.seeking = false;
        this.active = true;
    },
    stop: function (track, position) {
        var id = this.trackId(track);
        if (id && this.lastTrackId && id !== this.lastTrackId) return;
        if (this.active && id && Number.isFinite(position) && position >= 0 && !this.seeking) {
            this.tick(track, position);
        }
        this.active = false;
        this.seeking = false;
        if (Number.isFinite(position) && position >= 0 && (!id || id === this.lastTrackId)) this.last = position;
    },
    markSeeking: function (track) {
        var id = this.trackId(track);
        if (id && this.lastTrackId === id) this.seeking = true;
    },
    rebase: function (track, position) {
        var id = this.trackId(track);
        if (!id || id !== this.lastTrackId) return;
        this.last = Number.isFinite(position) && position >= 0 ? position : this.last;
        this.seeking = false;
    },
    tick: function (track, position) {
        if (!this.active || this.seeking || !track || !Number.isFinite(position) || position < 0) return;
        var id = this.trackId(track);
        if (!id) return;
        if (this.lastTrackId !== id) {
            this.lastTrackId = id;
            this.last = position;
            return;
        }
        if (this.last !== null) {
            var delta = position - this.last;
            // Count only normal forward media progress. A seek or source jump
            // is rebased by the seeking/seeked lifecycle and never credited.
            if (delta > 0 && delta <= 30) this.pending += delta;
        }
        this.last = position;
        if (this.pending >= 15) this.flush(false);
    },
    flush: async function (force) {
        force = Boolean(force);
        if (this.inFlight) {
            if (force) this.scheduleFlush(250, true);
            return;
        }
        var seconds = Math.min(120, Math.floor(this.pending));
        if (seconds < 1 || (!force && seconds < 10)) return;
        this.pending -= seconds;
        this.inFlight = true;
        try {
            var response = await fetch('/api/stats?action=listen', {
                method: 'POST', credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seconds: seconds })
            });
            if (!response.ok) throw new Error('stats request failed: ' + response.status);
            if (typeof Profile !== 'undefined' && typeof Profile.refreshListeningStats === 'function') Profile.refreshListeningStats();
        } catch (_) {
            this.pending += seconds;
        } finally {
            this.inFlight = false;
            if (this.pending >= 10) this.scheduleFlush(250, false);
        }
    },
    scheduleFlush: function (delay, force) {
        if (this.flushTimer) return;
        var self = this;
        this.flushTimer = setTimeout(function () {
            self.flushTimer = null;
            self.flush(force);
        }, Number(delay) || 250);
    },
    flushBeacon: function () {
        var seconds = Math.min(120, Math.floor(this.pending));
        if (seconds < 1) return;
        this.pending -= seconds;
        try {
            var body = new Blob([JSON.stringify({ seconds: seconds })], { type: 'application/json' });
            if (!navigator.sendBeacon('/api/stats?action=listen', body)) this.pending += seconds;
        } catch (_) { this.pending += seconds; }
    },
    refresh: function () {
        if (typeof Profile !== 'undefined' && typeof Profile.refreshListeningStats === 'function') Profile.refreshListeningStats();
    }
};
function refreshServerStatsSoon() {
    if (Stats.refreshTimer) return;
    Stats.refreshTimer = setTimeout(function () { Stats.refreshTimer = null; Stats.refresh(); }, 300);
}
function stopPlaybackStatsForPageHide() {
    if (typeof Stats === 'undefined') return;
    if (typeof AU !== 'undefined' && AU && !AU.paused && typeof S !== 'undefined' && S.ct) Stats.stop(S.ct, AU.currentTime);
    Stats.flushBeacon();
}
window.addEventListener('pagehide', stopPlaybackStatsForPageHide, { capture: true });
window.addEventListener('focus', refreshServerStatsSoon);
document.addEventListener('visibilitychange', function () {
    // Visibility alone is not a listening signal: background audio may continue,
    // so only the native audio lifecycle starts/stops runtime accounting.
    if (document.visibilityState === 'visible') { Stats.flush(true); refreshServerStatsSoon(); }
    else Stats.flush(true);
});
