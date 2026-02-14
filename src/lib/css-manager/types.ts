export interface CSSEntry {
  id: string;
  name: string;
  group_name: string;
  css_content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CSSBackup {
  id: string;
  css_entry_id: string;
  css_content: string;
  backed_up_at: string;
}
