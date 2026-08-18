import { ICP_FILING } from '../content'

export function IcpLink({ className }: { className?: string }) {
  return (
    <a
      className={className ? `icp-link ${className}` : 'icp-link'}
      href={ICP_FILING.href}
      data-cursor
    >
      {ICP_FILING.number}
    </a>
  )
}
