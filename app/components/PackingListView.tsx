'use client';

import { useState, useEffect } from 'react';
import { PackingItem, PackingCategory, TodoItem } from '../types/packing';
import { supabase } from '../../lib/supabase';

const packingCategoryLabels: Record<PackingCategory, string> = {
  documents: '📄 서류/문서',
  electronics: '🔌 전자기기',
  clothing: '👕 의류',
  toiletries: '🧴 세면도구',
  medicine: '💊 약품',
  accessories: '🎒 액세서리',
  others: '📦 기타',
};

interface PackingListViewProps {
  projectId: string;
}

export default function PackingListView({ projectId }: PackingListViewProps) {
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [activeTab, setActiveTab] = useState<'packing' | 'todo'>('packing');

  // Packing item form state
  const [newPackingItem, setNewPackingItem] = useState({
    category: 'others' as PackingCategory,
    item_name: '',
    quantity: 1,
    notes: '',
  });

  // Todo item form state
  const [newTodoItem, setNewTodoItem] = useState({
    task: '',
    due_date: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    notes: '',
  });

  // Load data
  useEffect(() => {
    loadPackingItems();
    loadTodoItems();
  }, []);

  const loadPackingItems = async () => {
    const { data, error } = await supabase
      .from('packing_items')
      .select('*')
      .eq('trip_id', projectId)
      .order('category', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPackingItems(data);
    }
  };

  const loadTodoItems = async () => {
    const { data, error } = await supabase
      .from('todo_items')
      .select('*')
      .eq('trip_id', projectId)
      .order('is_completed', { ascending: true })
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true });

    if (!error && data) {
      setTodoItems(data);
    }
  };

  // Packing item functions
  const addPackingItem = async () => {
    if (!newPackingItem.item_name.trim()) {
      alert('준비물 이름을 입력하세요!');
      return;
    }

    const { error } = await supabase.from('packing_items').insert([
      {
        ...newPackingItem,
        trip_id: projectId,
        is_packed: false,
      },
    ]);

    if (!error) {
      setNewPackingItem({
        category: 'others',
        item_name: '',
        quantity: 1,
        notes: '',
      });
      loadPackingItems();
    } else {
      alert('추가 실패!');
    }
  };

  const togglePackingItem = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('packing_items')
      .update({ is_packed: !currentStatus })
      .eq('id', id);

    if (!error) {
      loadPackingItems();
    }
  };

  const deletePackingItem = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('packing_items').delete().eq('id', id);

    if (!error) {
      loadPackingItems();
    }
  };

  // Todo item functions
  const addTodoItem = async () => {
    if (!newTodoItem.task.trim()) {
      alert('할 일을 입력하세요!');
      return;
    }

    const { error } = await supabase.from('todo_items').insert([
      {
        ...newTodoItem,
        trip_id: projectId,
        is_completed: false,
        due_date: newTodoItem.due_date || null,
      },
    ]);

    if (!error) {
      setNewTodoItem({
        task: '',
        due_date: '',
        priority: 'medium',
        notes: '',
      });
      loadTodoItems();
    } else {
      alert('추가 실패!');
    }
  };

  const toggleTodoItem = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('todo_items')
      .update({ is_completed: !currentStatus })
      .eq('id', id);

    if (!error) {
      loadTodoItems();
    }
  };

  const deleteTodoItem = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('todo_items').delete().eq('id', id);

    if (!error) {
      loadTodoItems();
    }
  };

  // Group packing items by category
  const groupedPackingItems = packingItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<PackingCategory, PackingItem[]>);

  // Calculate statistics
  const packingStats = {
    total: packingItems.length,
    packed: packingItems.filter((item) => item.is_packed).length,
    percentage: packingItems.length > 0
      ? Math.round((packingItems.filter((item) => item.is_packed).length / packingItems.length) * 100)
      : 0,
  };

  const todoStats = {
    total: todoItems.length,
    completed: todoItems.filter((item) => item.is_completed).length,
    percentage: todoItems.length > 0
      ? Math.round((todoItems.filter((item) => item.is_completed).length / todoItems.length) * 100)
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <span>✈️</span>
          <span>여행 준비</span>
        </h1>
        <p className="text-gray-600 mt-2">준비물과 할 일을 체크리스트로 관리하세요</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('packing')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'packing'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>🎒</span>
              <span>준비물 목록</span>
              <span className="bg-white text-indigo-600 px-2 py-1 rounded-full text-xs">
                {packingStats.packed}/{packingStats.total}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('todo')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'todo'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>✅</span>
              <span>할 일 목록</span>
              <span className="bg-white text-indigo-600 px-2 py-1 rounded-full text-xs">
                {todoStats.completed}/{todoStats.total}
              </span>
            </div>
          </button>
        </div>

        {/* Packing List Tab */}
        {activeTab === 'packing' && (
          <div className="p-6 space-y-6">
            {/* Progress Bar */}
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">준비 진행률</span>
                <span className="text-sm font-bold text-indigo-600">{packingStats.percentage}%</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-3">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${packingStats.percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Add New Packing Item */}
            <div className="bg-indigo-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-800">새 준비물 추가</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <select
                  value={newPackingItem.category}
                  onChange={(e) =>
                    setNewPackingItem({ ...newPackingItem, category: e.target.value as PackingCategory })
                  }
                  className="px-3 py-2 border-2 border-indigo-200 rounded-lg"
                >
                  {Object.entries(packingCategoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="준비물 이름"
                  value={newPackingItem.item_name}
                  onChange={(e) => setNewPackingItem({ ...newPackingItem, item_name: e.target.value })}
                  className="px-3 py-2 border-2 border-indigo-200 rounded-lg"
                  onKeyDown={(e) => e.key === 'Enter' && addPackingItem()}
                />
                <input
                  type="number"
                  placeholder="수량"
                  min="1"
                  value={newPackingItem.quantity}
                  onChange={(e) => setNewPackingItem({ ...newPackingItem, quantity: parseInt(e.target.value) || 1 })}
                  className="px-3 py-2 border-2 border-indigo-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="메모 (선택)"
                  value={newPackingItem.notes}
                  onChange={(e) => setNewPackingItem({ ...newPackingItem, notes: e.target.value })}
                  className="px-3 py-2 border-2 border-indigo-200 rounded-lg"
                />
              </div>
              <button
                onClick={addPackingItem}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                + 추가
              </button>
            </div>

            {/* Packing Items by Category */}
            <div className="space-y-4">
              {Object.entries(packingCategoryLabels).map(([category, label]) => {
                const items = groupedPackingItems[category as PackingCategory] || [];
                if (items.length === 0) return null;

                const packedCount = items.filter((item) => item.is_packed).length;

                return (
                  <div key={category} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
                      <span>{label}</span>
                      <span className="text-sm text-gray-600">
                        {packedCount}/{items.length}
                      </span>
                    </h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                            item.is_packed ? 'bg-green-50 border-2 border-green-200' : 'bg-white border-2 border-gray-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={item.is_packed}
                            onChange={() => togglePackingItem(item.id!, item.is_packed)}
                            className="w-5 h-5 rounded cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className={`font-semibold ${item.is_packed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                              {item.item_name}
                              {item.quantity > 1 && (
                                <span className="ml-2 text-sm text-indigo-600">x{item.quantity}</span>
                              )}
                            </div>
                            {item.notes && (
                              <div className="text-sm text-gray-600 mt-1">{item.notes}</div>
                            )}
                          </div>
                          <button
                            onClick={() => deletePackingItem(item.id!)}
                            className="text-red-600 hover:text-red-800 px-2"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {packingItems.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  아직 준비물이 없습니다. 위에서 추가해보세요!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Todo List Tab */}
        {activeTab === 'todo' && (
          <div className="p-6 space-y-6">
            {/* Progress Bar */}
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">완료율</span>
                <span className="text-sm font-bold text-green-600">{todoStats.percentage}%</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${todoStats.percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Add New Todo Item */}
            <div className="bg-green-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-800">새 할 일 추가</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="할 일"
                  value={newTodoItem.task}
                  onChange={(e) => setNewTodoItem({ ...newTodoItem, task: e.target.value })}
                  className="px-3 py-2 border-2 border-green-200 rounded-lg md:col-span-2"
                  onKeyDown={(e) => e.key === 'Enter' && addTodoItem()}
                />
                <select
                  value={newTodoItem.priority}
                  onChange={(e) => setNewTodoItem({ ...newTodoItem, priority: e.target.value as 'high' | 'medium' | 'low' })}
                  className="px-3 py-2 border-2 border-green-200 rounded-lg"
                >
                  <option value="high">🔴 높음</option>
                  <option value="medium">🟡 보통</option>
                  <option value="low">🟢 낮음</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="date"
                  value={newTodoItem.due_date}
                  onChange={(e) => setNewTodoItem({ ...newTodoItem, due_date: e.target.value })}
                  className="px-3 py-2 border-2 border-green-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="메모 (선택)"
                  value={newTodoItem.notes}
                  onChange={(e) => setNewTodoItem({ ...newTodoItem, notes: e.target.value })}
                  className="px-3 py-2 border-2 border-green-200 rounded-lg"
                />
              </div>
              <button
                onClick={addTodoItem}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                + 추가
              </button>
            </div>

            {/* Todo Items */}
            <div className="space-y-3">
              {todoItems.map((item) => {
                const isOverdue = item.due_date && new Date(item.due_date) < new Date() && !item.is_completed;

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-4 rounded-lg transition-all ${
                      item.is_completed
                        ? 'bg-green-50 border-2 border-green-200'
                        : isOverdue
                        ? 'bg-red-50 border-2 border-red-200'
                        : 'bg-white border-2 border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.is_completed}
                      onChange={() => toggleTodoItem(item.id!, item.is_completed)}
                      className="w-5 h-5 rounded cursor-pointer mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold ${item.is_completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                          {item.task}
                        </span>
                        {item.priority === 'high' && (
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">
                            🔴 높음
                          </span>
                        )}
                        {item.priority === 'medium' && (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-semibold">
                            🟡 보통
                          </span>
                        )}
                        {item.priority === 'low' && (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">
                            🟢 낮음
                          </span>
                        )}
                      </div>
                      {item.due_date && (
                        <div className={`text-sm mt-1 ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          📅 {item.due_date} {isOverdue && '(기한 지남!)'}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-sm text-gray-600 mt-1">{item.notes}</div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteTodoItem(item.id!)}
                      className="text-red-600 hover:text-red-800 px-2"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}

              {todoItems.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  아직 할 일이 없습니다. 위에서 추가해보세요!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
