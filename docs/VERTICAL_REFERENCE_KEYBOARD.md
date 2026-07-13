# Vertical Reference Keyboard

Issue 011 added the interactive piano-style keyboard beside the pitch-history graph. Issue 012 connects its completed-activation contract to a continuous reference drone without coupling keyboard layout to Web Audio ownership or microphone permission.

## Scope and key model

Every inclusive visible MIDI note produces one immutable reference-key description containing its integer MIDI note, shared sharp-only note name, octave, label, pitch class, accidental classification, and equal-temperament ideal frequency. Labels reuse the existing MIDI note utilities, and frequencies reuse the existing A4 = 440 Hz note-frequency utility. The model contains no React, DOM, Canvas, or audio objects.

The keyboard is monophonic. Only one pointer or keyboard press can own transient pressed state, and only one reference note can sound. Chords, sustain, MIDI-device input, and letter-key musical mapping remain out of scope.

## DOM and Canvas architecture

Interactive keys are semantic DOM buttons in a fixed-width column to the left of the existing layered Canvas graph. The Canvas remains responsible for the static grid and animated curve. The graph figure keeps its own accessible description, so the keyboard is not nested inside the figure's `role="img"` accessibility boundary.

The keyboard replaces the former dense Canvas note-label gutter. The Canvas graph therefore starts at its own left edge, while every keyboard button displays its note label. This avoids two competing label columns and gives the curve more horizontal space.

## Shared MIDI geometry

The visible range remains the single source of truth. Keys render from high MIDI to low MIDI with one CSS-grid row per inclusive note. For all current presets this produces 25 equal `1fr` rows.

The Canvas and keyboard use the same top and bottom padding values from the Canvas layout configuration. Given `N = highMidi - lowMidi + 1`, a key's normalized center is:

```text
(highMidi - midi + 0.5) / N
```

This is the normalized form of the Canvas semitone-center mapping. Consequently the top and bottom keys include matching half-band space, fractional curve positions remain consistent, and no per-key measurements or cumulative pixel rounding are introduced. One shared CSS height controls the keyboard grid and Canvas viewport; the existing single `ResizeObserver` continues to measure only the Canvas area.

## Natural and accidental geometry

Natural notes use the full keyboard width. Accidentals use 66% width and align toward the graph. Every key still occupies exactly one semitone row. Note text and width distinguish the kinds in addition to color. The shared sharp-only convention is retained; flats are not generated.

## Pressed, selected, and sounding state

Pointer or Enter/Space press sets only `pressedMidi`. A completed activation selects and toggles the note; cancellation never selects or sounds it. Release clears the stronger pressed highlight while a subtler selected state remains. Sounding state is independent: the selected note can be stopped, and a sounding note can remain active while outside the current range. Selection is not persisted across refresh.

The selected note and drone are independent from detected pitch, microphone lifecycle, history Pause/Resume, and Clear. A visible-range change releases any active press but preserves selection and playback. When hidden, an explicit status describes the out-of-range sounding reference.

## Pointer lifecycle and drag policy

Pointer Events cover mouse, touch, and pen input. The first pointer owns the monophonic press and additional pointers are ignored. Pointer capture keeps release delivery reliable outside the key. Pointer up, pointer cancel, lost capture, window blur, focus leaving the keyboard, range change, and unmount all clear the transient press.

Dragging does not change notes in this first version. The initially pressed key remains the owner until release or cancellation. Complex glissando is deferred.

Touch scrolling is disabled only while interacting inside the keyboard. Other controls and page areas retain normal scrolling behavior.

## Keyboard navigation and focus

The keyboard uses roving tabindex, leaving one key in the page tab order:

- Arrow Up moves one semitone higher.
- Arrow Down moves one semitone lower.
- Home moves to the highest visible note.
- End moves to the lowest visible note.
- Enter and Space show pressed state on keydown and activate once on keyup.

Navigation does not wrap. Focused MIDI is preserved across range changes when visible and otherwise moves to the nearest visible boundary. Visible focus, selected, and pressed states do not rely only on color.

## Reference-note status and accessibility

Each button is named with its note and one-decimal ideal frequency, for example “Reference note C4, 261.6 hertz.” `aria-pressed` exposes persistent selection, and the active key's name identifies it as sounding. Separate polite DOM statuses distinguish pressed, selected, stopped, starting, playing, changing, stopping, error, and out-of-range playback states.

The detected current note remains separate DOM content. The graph retains its selected-range and duration description. No hidden DOM node is created for Canvas grid lines.

## Mobile, performance, and independence

The keyboard uses a stable 56 CSS-pixel column while the Canvas consumes the remaining width. Both stay side by side at narrow sizes without changing the existing safe-area shell. Range changes rebuild only 25 buttons. Key interaction produces low-frequency React state updates; it adds no animation loop, per-key observer, detector work, or history transformation.

The keyboard works before microphone permission, while requesting, while active, after Stop, and after denial. It never starts or changes microphone capture.

## Drone integration and limitations

Keyboard components own interaction state only. The parent drone hook translates completed MIDI activations into engine commands. See `REFERENCE_DRONE_SYNTHESIZER.md` for the dedicated Web Audio graph and lifecycle.

Known limitations:

- one note at a time, with no chords or sustain;
- fixed-note drag policy, with no glissando;
- selected notes are not persisted;
- visible ranges remain the three fixed two-octave presets and octave shifts;
- touch sizing and alignment still require physical iPhone Safari and Android Chrome verification.

The drone continues after release by design; this keyboard is a selector for a sustained pitch reference rather than a hold-to-play instrument.
