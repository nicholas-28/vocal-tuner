# Product Definition

## Working name

Vocal Tuner

The final public name can change later.

## Problem

Existing pitch-monitor apps may be cluttered with advertising, unavailable in some app stores, visually overloaded, or designed more like technical instruments than learning tools.

Students with an underdeveloped sense of pitch need temporary external feedback while learning to hear, reproduce, and correct notes independently.

## First user

A vocal student who:

- struggles to identify whether a note is too high or too low;
- needs immediate visual feedback;
- practices on a phone;
- benefits from hearing a reference pitch;
- should not need an account or subscription to begin.

## Core promise

Sing a note and immediately understand:

- which note is being produced;
- how far it is from the note center;
- whether it is above or below;
- how the pitch changes over time.

## Core learning loop

1. Hear a reference.
2. Sing.
3. Observe.
4. Correct.
5. Listen again.
6. Repeat with less visual dependence.

## MVP scope

### Included

- Microphone permission flow
- Live monophonic pitch detection
- Current note and octave
- Frequency in Hz
- Deviation in cents
- Scrolling pitch history
- Semitone grid
- Vertical piano-style reference keyboard
- Reference tone while pressing a key
- Pause
- Clear
- Manual visible-range selection
- Mobile-first responsive layout
- Installable PWA shell
- Local processing only

### Explicitly excluded

- Accounts
- Cloud sync
- Teacher dashboard
- AI coach
- Social features
- Payments
- App Store release
- Full audio editor
- Polyphonic recognition
- Automatic singing assessment
- Gamification
- Metronome
- Long-term recordings

## Success criteria for the first usable version

- A new user can begin within 15 seconds.
- Pitch appears with acceptable stability on modern iPhone and Android browsers.
- Silence and unpitched sounds produce gaps instead of random notes.
- Reference notes start and stop cleanly.
- The graph remains readable on a phone.
- At least three students report that the app helps them correct pitch.
- No microphone audio is uploaded.

## Product principles

- Listening is more important than scoring.
- Feedback should guide, not shame.
- Visual information must remain calm and legible.
- The tool should gradually return attention to the ear and body.
- The first version must stay small.
