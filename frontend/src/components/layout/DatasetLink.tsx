import { Grid } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LINK_CLASSES } from '../../constants/ui';

interface DatasetLinkProps {
  to: string;
  label?: string;
}

export function DatasetLink({ to, label = 'Dataset' }: DatasetLinkProps) {
  return (
    <Link to={to} className={LINK_CLASSES.datasetLink}>
      <Grid className="w-4 h-4" />
      {label}
    </Link>
  );
}
