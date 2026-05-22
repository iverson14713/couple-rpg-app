import { getAuthDebugLines, getAuthEnvironmentSnapshot } from '../services/auth/authDebug';

type Props = {
  title?: string;
  maxHeightClass?: string;
};

export function AuthDebugPanel({ title = 'Auth Debug（Xcode Console: [LQ_AUTH]）', maxHeightClass = 'max-h-40' }: Props) {
  const lines = getAuthDebugLines();
  const env = getAuthEnvironmentSnapshot();

  return (
    <details className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-left">
      <summary className="cursor-pointer text-[11px] font-bold text-stone-600">{title}</summary>
      <pre className={`mt-2 overflow-auto whitespace-pre-wrap break-all text-[9px] leading-snug text-stone-700 ${maxHeightClass}`}>
        {JSON.stringify(env, null, 2)}
      </pre>
      <pre className={`mt-2 overflow-auto whitespace-pre-wrap break-all text-[9px] leading-snug text-stone-600 ${maxHeightClass}`}>
        {lines.length === 0
          ? '（尚無 log，請先點 Google 登入）'
          : lines.map((l) => `${l.t} ${l.step}\n${l.detail ? JSON.stringify(l.detail) : ''}`).join('\n---\n')}
      </pre>
    </details>
  );
}
