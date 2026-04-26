export type PackingCategory =
  | 'documents'      // 서류/문서
  | 'electronics'    // 전자기기
  | 'clothing'       // 의류
  | 'toiletries'     // 세면도구
  | 'medicine'       // 약품/의약품
  | 'accessories'    // 액세서리/소품
  | 'others';        // 기타

export interface PackingItem {
  id?: string;
  trip_id?: string;
  category: PackingCategory;
  item_name: string;
  quantity: number;
  is_packed: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TodoItem {
  id?: string;
  trip_id?: string;
  task: string;
  is_completed: boolean;
  due_date?: string;
  priority?: 'high' | 'medium' | 'low';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
