export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-10 border-b border-neutral-950/5 dark:border-white/10">
      <div className="bg-green-300 dark:bg-green-800">
        <div className="flex h-14 items-center justify-between gap-8 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <a className="shrink-0" aria-label="Home" href="/">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
            </a>
            <a className="text-lg font-bold text-gray-950 dark:text-white">Mieszkanieo</a>
            <div
              className="flex items-center gap-0.5 rounded-2xl bg-neutral-950/5 py-0.5 pr-2.5 pl-2.5 text-xs/5 font-medium text-gray-950 tabular-nums hover:bg-neutral-950/7.5 data-active:bg-neutral-950/7.5 dark:bg-white/10 dark:text-white dark:hover:bg-white/12.5 dark:data-active:bg-white/12.5"
            >
              v3.0.0
            </div>
            <a
              aria-label="GitHub repository"
              href="https://github.com/nokocu/mieszkanieo"
            >
              <svg
                viewBox="0 0 20 20"
                className="size-5 fill-black/40 dark:fill-gray-400"
              >
                <path d="M10 0C4.475 0 0 4.475 0 10a9.994 9.994 0 006.838 9.488c.5.087.687-.213.687-.476 0-.237-.013-1.024-.013-1.862-2.512.463-3.162-.612-3.362-1.175-.113-.287-.6-1.175-1.025-1.412-.35-.188-.85-.65-.013-.663.788-.013 1.35.725 1.538 1.025.9 1.512 2.337 1.087 2.912.825.088-.65.35-1.088.638-1.338-2.225-.25-4.55-1.112-4.55-4.937 0-1.088.387-1.987 1.025-2.688-.1-.25-.45-1.274.1-2.65 0 0 .837-.262 2.75 1.026a9.28 9.28 0 012.5-.338c.85 0 1.7.112 2.5.337 1.912-1.3 2.75-1.024 2.75-1.024.55 1.375.2 2.4.1 2.65.637.7 1.025 1.587 1.025 2.687 0 3.838-2.337 4.688-4.562 4.938.362.312.675.912.675 1.85 0 1.337-.013 2.412-.013 2.75 0 .262.188.574.688.474A10.016 10.016 0 0020 10c0-5.525-4.475-10-10-10z"></path>
              </svg>
            </a>
          </div>

        </div>
      </div>
    </header>
  );
}
