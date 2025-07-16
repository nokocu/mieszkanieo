export default function Spacer() {
  return (
    <div className="
        row-span-5 
        row-start-1 
        border-x 
        border-x-(--pattern-fg) 
        bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%),repeating-linear-gradient(45deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] 
        bg-[size:10px_10px] 
        bg-fixed 
        [--pattern-fg:var(--color-gray-950)]/5 dark:[--pattern-fg:var(--color-white)]/10"
    >
    </div>
  );
}
