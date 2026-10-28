export interface ListCardAction {
  label: string;
  icon?: string;
  to?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  color?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'info'
    | 'warning'
    | 'error'
    | 'neutral';
  onSelect?: () => void;
}
