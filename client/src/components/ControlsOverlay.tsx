import { FighterType } from '@rage-arena/shared';

export const ControlsOverlay = ({ fighterType }: { fighterType?: FighterType }) => {
    const controls = [
        { key: 'W / ↑', label: 'Jump' },
        { key: 'A / ←', label: 'Move Left' },
        { key: 'D / →', label: 'Move Right' },
        { key: 'J', label: 'Punch' },
        { key: 'K', label: 'Kick' },
        { key: 'L', label: 'Smash' },
        { key: 'E', label: 'Special' },
        { key: 'Space', label: 'Block' },
    ];

    return (
        <div className="absolute top-20 right-4 z-20 bg-black/60 border border-gray-700 rounded-xl p-3 backdrop-blur-sm text-xs">
            <div className="text-gray-400 font-bold tracking-widest mb-2 text-[10px]">CONTROLS</div>
            <div className="flex flex-col gap-1">
                {controls.map(c => (
                    <div key={c.key} className="flex items-center gap-2 text-gray-300">
                        <span className="bg-gray-800 border border-gray-600 rounded px-1.5 py-0.5 font-mono text-[10px] text-white min-w-[40px] text-center">
                            {c.key}
                        </span>
                        <span className="text-gray-400 text-[10px]">{c.label}</span>
                    </div>
                ))}
            </div>
            {fighterType && (
                <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] text-yellow-400 font-bold">
                    SPECIAL costs 50 energy
                </div>
            )}
        </div>
    );
};
