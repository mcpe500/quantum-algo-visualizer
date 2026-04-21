import { HTML2CANVAS_CAPTURE_OPTIONS } from '../constants/app';

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

async function waitForCaptureReady(): Promise<void> {
  if ('fonts' in document) {
    await document.fonts.ready;
  }

  await waitForNextPaint();
  await waitForNextPaint();
}

export async function downloadElementAsPNG(
  elementId: string,
  filename: string
): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error(`Element with id '${elementId}' not found`);
  }

  await waitForCaptureReady();

  const canvas = await html2canvas(element, {
    ...HTML2CANVAS_CAPTURE_OPTIONS,
    logging: false,
    onclone: (clonedDocument) => {
      const clonedElement = clonedDocument.getElementById(elementId);

      if (!clonedElement) {
        return;
      }

      clonedElement.querySelectorAll<HTMLElement>('*').forEach((node) => {
        node.style.animation = 'none';
        node.style.transition = 'none';
      });
    },
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.download = filename;
  link.href = url;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10_000);
}
