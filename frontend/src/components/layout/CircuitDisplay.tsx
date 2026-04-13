interface CircuitDisplayProps {
  imageBase64: string | null;
  title?: string;
  alt?: string;
}

export function CircuitDisplay({
  imageBase64,
  title = 'Circuit',
  alt = 'Quantum Circuit',
}: CircuitDisplayProps) {
  if (!imageBase64) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
      <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
        <img
          src={`data:image/png;base64,${imageBase64}`}
          alt={alt}
          className="max-w-full h-auto"
        />
      </div>
    </div>
  );
}
