var StatsTracker = {
    total: 0,
    last: null,
    pending: 0,
    tick: function(track, position) {
        if (!track || !position || !isFinite(position)) return;
        if (this.last !== null) { var delta = position - this.last; if (delta > 0 && delta <= 5) this.pending += delta; }
        this.last = position;
        if (this.pending >= 60) this.flush();
    },
    reset: function() { this.last = null; },
    flush: async function() {
        var seconds = Math.floor(this.pending);
        if (seconds < 10) return;
        this.pending -= seconds;
        try { await fetch('/api/stats?action=listen', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seconds: Math.min(120, seconds) }) }); } catch (_) { this.pending += seconds; }
    }
};
