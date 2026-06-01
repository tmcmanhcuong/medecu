import React from 'react';
import { Zap } from 'lucide-react';

export default function WorkspaceHeader({ activeNotebook }) {
  return (
    <header className="px-10 py-5 flex items-center justify-between border-b border-divider-hairline dark:border-surface-tile-3 bg-surface-parchment dark:bg-surface-tile-2 z-20 relative transition-colors">
      <div className="flex items-center space-x-4">
        <div className="p-2.5 bg-surface-canvas dark:bg-surface-tile-3 rounded-sm border border-divider-hairline dark:border-transparent">
          <Zap className="w-6 h-6 text-brand dark:text-brand-on-dark" />
        </div>
        <div>
          <h1 className="text-display-md font-display font-semibold tracking-tight text-ink dark:text-ink-on-dark leading-none">
            EduMate <span className="text-brand dark:text-brand-on-dark">AI</span>
          </h1>
          <p className="text-caption font-body text-ink-muted-48 dark:text-ink-muted-80 mt-1">Powered by Amazon Bedrock</p>
        </div>
      </div>
      <div />
    </header>
  );
}
