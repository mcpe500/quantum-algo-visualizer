import { STATE_CLASSES } from '../../constants/ui';

interface PageErrorBannerProps {
  message: string;
}

export function PageErrorBanner({ message }: PageErrorBannerProps) {
  return <div className={STATE_CLASSES.errorBanner}>{message}</div>;
}

interface PageLoadingBannerProps {
  message: string;
}

export function PageLoadingBanner({ message }: PageLoadingBannerProps) {
  return (
    <div className={STATE_CLASSES.loadingBanner}>
      <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      {message}
    </div>
  );
}

interface InlineEmptyStateProps {
  message: string;
}

export function InlineEmptyState({ message }: InlineEmptyStateProps) {
  return (
    <div className={STATE_CLASSES.emptyWrapper}>
      <p className={STATE_CLASSES.emptyText}>{message}</p>
    </div>
  );
}

interface PageEmptyStateProps {
  message: string;
}

export function PageEmptyState({ message }: PageEmptyStateProps) {
  return (
    <div className={STATE_CLASSES.emptyPageWrapper}>
      <p className={STATE_CLASSES.emptyPageText}>{message}</p>
    </div>
  );
}
