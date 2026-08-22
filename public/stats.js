/* MALAMUSIC - SERVER AUTHORITATIVE LISTENING STATS */
var Stats = {
    total: 0,
    last: null,
    lastTrackId: null,
    pending: 0,
    inFlight: false,
    flushTimer: null,
    refreshTimer: null,
    tick: function(track, position) {
        if (!track || !Number.isFinite(position) || position < 0) return;
        var id = String(track.videoId || track.id || track.video_id || '');
        if (this.lastTrackId !== id) {
            this.lastTrackId = id;
            this.last = position;
            return;
        }
        if (this.last !== null) {
            var delta = position - this.last;
            if (delta > 0 && delta <= 10) this.pending += delta;
        }
        this.last = position;
        if (this.pending >= 15) this.flush(false);
    },
    reset: function(track) {
        this.last = null;
        this.lastTrackId = track ? String(track.videoId || track.id || track.video_id || '') : null;
    },
    flush: async function(force) {
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
    scheduleFlush: function(delay, force) {
        if (this.flushTimer) return;
        var self = this;
        this.flushTimer = setTimeout(function() {
            self.flushTimer = null;
            self.flush(force);
        }, Number(delay) || 250);
    },
    flushBeacon: function() {
        var seconds = Math.min(120, Math.floor(this.pending));
        if (seconds < 1) return;
        this.pending -= seconds;
        try {
            var body = new Blob([JSON.stringify({ seconds: seconds })], { type: 'application/json' });
            if (!navigator.sendBeacon('/api/stats?action=listen', body)) this.pending += seconds;
        } catch (_) { this.pending += seconds; }
    },
    refresh: function() {
        if (typeof Profile !== 'undefined' && typeof Profile.refreshListeningStats === 'function') Profile.refreshListeningStats();
    }
};
function refreshServerStatsSoon() {
    if (Stats.refreshTimer) return;
    Stats.refreshTimer = setTimeout(function() { Stats.refreshTimer = null; Stats.refresh(); }, 300);
}
window.addEventListener('pagehide', function() { Stats.flushBeacon(); }, { capture: true });
window.addEventListener('focus', refreshServerStatsSoon);
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') { Stats.flush(true); refreshServerStatsSoon(); }
    else Stats.flush(true);
});
