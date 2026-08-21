var Stats = {
    total: 0,
    last: null,
    pending: 0,
    inFlight: false,
    tick: function(track, position) {
        if (!track || !position || !isFinite(position)) return;
        if (this.last !== null) { var delta = position - this.last; if (delta > 0 && delta <= 5) this.pending += delta; }
        this.last = position;
        if (this.pending >= 15) this.flush();
    },
    reset: function() { this.last = null; },
    flush: async function() {
        if (this.inFlight) return;
        var seconds = Math.min(120, Math.floor(this.pending));
        if (seconds < 10) return;
        this.pending -= seconds;
        this.inFlight = true;
        try {
            var response = await fetch('/api/stats?action=listen', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seconds: seconds }) });
            if (!response.ok) throw new Error('stats request failed');
            if (typeof Profile !== 'undefined' && typeof Profile.refreshListeningStats === 'function') Profile.refreshListeningStats();
        } catch (_) {
            this.pending += seconds;
        } finally {
            this.inFlight = false;
        }
    },
    flushBeacon: function() {
        var seconds = Math.min(120, Math.floor(this.pending));
        if (seconds < 10) return;
        this.pending -= seconds;
        try {
            var body = new Blob([JSON.stringify({ seconds: seconds })], { type: 'application/json' });
            if (!navigator.sendBeacon('/api/stats?action=listen', body)) this.pending += seconds;
        } catch (_) {
            this.pending += seconds;
        }
    }
};
window.addEventListener('pagehide', function() { Stats.flushBeacon(); }, { capture: true });
