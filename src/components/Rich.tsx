import type { RichText } from '../content'

/** Renders body text with an optional faint trailing note. */
export function Rich({ value }: { value: RichText }) {
  return (
    <>
      {value.text}
      {value.muted ? <span className="muted">{value.muted}</span> : null}
    </>
  )
}
