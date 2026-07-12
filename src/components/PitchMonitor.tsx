const noteLabels = ['A4', 'G♯4', 'G4', 'F♯4', 'F4', 'E4', 'D♯4'];

export function PitchMonitor() {
  return (
    <section className="monitor" aria-label="Pitch monitor">
      <div className="monitor__heading">
        <h2>Pitch history</h2>
        <span>Pitch graph will be added in a later issue</span>
      </div>
      <div className="semitone-grid" aria-label="Empty semitone grid">
        {noteLabels.map((note) => (
          <div className="grid-row" key={note}>
            <span>{note}</span>
          </div>
        ))}
        <div className="playhead" aria-hidden="true" />
      </div>
    </section>
  );
}
