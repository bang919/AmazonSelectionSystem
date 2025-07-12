import React, { useState, useEffect } from 'react';
import { getAllCategoriesWithStatus, updateCategoryBlacklistStatus } from '../lib/firebase';

const BlacklistEditor = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);
  
  // 每页显示的行数（5列 * 50行 = 250个词）
  const itemsPerPage = 250;
  const columnsCount = 5;
  const rowsPerColumn = 50;

  // 格式化类目名称
  const formatCategoryName = (category) => {
    if (!category || typeof category !== 'string') {
      return '';
    }
    return category
      .replaceAll(" ", "")
      .replaceAll("&", "")
      .replaceAll("'", "")
      .replaceAll(",", "");
  };

  // 加载类目数据
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  // 搜索过滤
  useEffect(() => {
    if (searchTerm) {
      // 格式化搜索词
      const formattedSearchTerm = formatCategoryName(searchTerm).toLowerCase();
      
      const filtered = categories.filter(category => {
        // 原始类目名和格式化后的类目名都用于匹配
        const originalMatch = category.id.toLowerCase().includes(searchTerm.toLowerCase());
        const formattedMatch = formatCategoryName(category.id).toLowerCase().includes(formattedSearchTerm);
        return originalMatch || formattedMatch;
      });
      
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
    setCurrentPage(1);
  }, [searchTerm, categories]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getAllCategoriesWithStatus();
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      console.error('加载类目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (categoryId, newStatus) => {
    setSaving(true);
    try {
      const success = await updateCategoryBlacklistStatus(categoryId, newStatus);
      if (success) {
        // 更新本地状态
        setCategories(prev => 
          prev.map(cat => 
            cat.id === categoryId ? { ...cat, isBlacklisted: newStatus } : cat
          )
        );
        setFilteredCategories(prev => 
          prev.map(cat => 
            cat.id === categoryId ? { ...cat, isBlacklisted: newStatus } : cat
          )
        );
      }
    } catch (error) {
      console.error('更新类目状态失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 分页计算
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = filteredCategories.slice(startIndex, endIndex);

  // 将当前页面的类目分配到5列
  const getColumnData = () => {
    const columns = Array(columnsCount).fill().map(() => []);
    
    currentCategories.forEach((category, index) => {
      const columnIndex = Math.floor(index / rowsPerColumn);
      if (columnIndex < columnsCount) {
        columns[columnIndex].push(category);
      }
    });
    
    return columns;
  };

  const columnData = getColumnData();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">编辑黑名单</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* 搜索框 */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="搜索类目...（支持原始名称和格式化后的名称）"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-1 text-sm text-gray-500">
            提示：支持多种格式搜索，例如："Table cloths" 或 "Tablecloths"
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mb-4 text-sm text-gray-600">
          <span>总类目数：{filteredCategories.length}</span>
          <span className="ml-4">黑名单：{filteredCategories.filter(cat => cat.isBlacklisted).length}</span>
          <span className="ml-4">白名单：{filteredCategories.filter(cat => !cat.isBlacklisted).length}</span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* 类目列表 */}
            <div className="overflow-auto max-h-[500px] mb-4">
              <div className="grid grid-cols-5 gap-4">
                {columnData.map((column, colIndex) => (
                  <div key={colIndex} className="space-y-2">
                    {column.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 text-sm"
                      >
                        <div className="truncate flex-1 mr-2">
                          <span title={category.id} className="block">
                            {category.id}
                          </span>
                          <span className="text-xs text-gray-500" title={formatCategoryName(category.id)}>
                            {formatCategoryName(category.id)}
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={category.isBlacklisted}
                            onChange={(e) => handleToggle(category.id, e.target.checked)}
                            className="sr-only"
                            disabled={saving}
                          />
                          <div className={`w-10 h-6 rounded-full ${
                            category.isBlacklisted ? 'bg-red-500' : 'bg-gray-300'
                          } transition-colors relative`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              category.isBlacklisted ? 'transform translate-x-4' : ''
                            }`}></div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mb-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  上一页
                </button>
                <span className="text-sm text-gray-600">
                  第 {currentPage} 页，共 {totalPages} 页
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}

        {/* 底部按钮 */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            关闭
          </button>
          <button
            onClick={loadCategories}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '加载中...' : '刷新'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlacklistEditor; 