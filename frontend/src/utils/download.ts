export async function downloadElementAsPNG(
  elementId: string, 
  filename: string
): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error(`Element with id '${elementId}' not found`);
  }

  const canvas = await html2canvas(element, {
    backgroundColor: '#FAFAFA',
    scale: 2,
    useCORS: true,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
