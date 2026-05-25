import { useEffect } from 'react';
import { APP_STORE_SCREEN } from './constants';
import { LOVEQUEST_SHOWCASE_SLIDES } from './slides';

export function LoveQuestAppStoreScreenshotIndex() {
  useEffect(() => {
    document.documentElement.classList.add('lq-app-store-screenshot-index');
    return () => document.documentElement.classList.remove('lq-app-store-screenshot-index');
  }, []);

  const { w, h } = APP_STORE_SCREEN;

  return (
    <main className="min-h-[100dvh] bg-[#f5f0f3] px-6 py-10">
      <div className="mx-auto max-w-lg">
        <h1 className="text-xl font-extrabold text-rose-800">LoveQuest App Store 截圖</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#6b5a64]">
          每張為固定 <strong className="text-[#3a2e34]">{w} × {h}</strong> 畫布，請用 Playwright 或 Chrome
          DevTools 擷取，勿使用 html2canvas。
        </p>

        <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-xs leading-relaxed text-rose-900">
          <strong>Playwright：</strong> 先執行 <code className="rounded bg-white px-1">npm run dev:client</code>
          ，再執行 <code className="rounded bg-white px-1">npm run screenshot:lovequest</code>
        </p>

        <ul className="mt-6 space-y-2">
          {LOVEQUEST_SHOWCASE_SLIDES.map((s, i) => (
            <li key={s.id}>
              <a
                href={`/app-store-screenshot/lovequest/${i + 1}`}
                className="block rounded-xl border border-rose-100 bg-white px-4 py-3 text-sm font-bold text-rose-800 shadow-sm transition hover:bg-rose-50"
              >
                {i + 1}. {s.marketingTitle}
                <span className="mt-1 block text-xs font-normal text-[#8a7a84]">
                  /app-store-screenshot/lovequest/{i + 1} → {s.filename}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs text-[#8a7a84]">
          Chrome DevTools：開啟上方連結 → F12 → 裝置工具列 → 自訂 {w} × {h} → 擷取螢幕截圖
        </p>
      </div>
    </main>
  );
}
