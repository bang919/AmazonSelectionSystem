import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

const ProductList = ({ products, itemsPerPage = 10 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  // 计算总页数
  const totalPages = Math.ceil(products.length / pageSize);

  // 计算当前页应该显示的产品
  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setDisplayedProducts(products.slice(startIndex, endIndex));
  }, [products, currentPage, pageSize]);

  // 重置页面当产品列表变化时
  useEffect(() => {
    setCurrentPage(1);
  }, [products]);

  // 处理页面跳转
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 处理每页显示数量变化
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // 重置到第一页
  };

  // 生成页码数组
  const getPageNumbers = () => {
    const delta = 2; // 当前页面前后显示的页码数量
    const pages = [];
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    // 添加第一页
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }

    // 添加中间页码
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // 添加最后一页
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">暂无产品数据</div>
        <div className="text-gray-400 text-sm mt-2">请上传Excel文件来查看产品信息</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 产品统计信息 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            共 <span className="font-bold text-gray-900">{products.length}</span> 个产品
          </div>
          <div className="text-sm text-gray-600">
            第 <span className="font-bold text-gray-900">{currentPage}</span> 页，共 <span className="font-bold text-gray-900">{totalPages}</span> 页
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            显示第 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, products.length)} 个产品
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">每页显示:</span>
            <select 
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* 产品卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {displayedProducts.map((product, index) => (
          <ProductCard 
            key={`${product.asin}-${(currentPage - 1) * pageSize + index}`}
            product={product}
            index={(currentPage - 1) * pageSize + index}
          />
        ))}
      </div>

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-8">
          {/* 上一页按钮 */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            上一页
          </button>

          {/* 页码按钮 */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' ? handlePageChange(page) : null}
                disabled={page === '...'}
                className={`
                  min-w-[40px] h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-colors
                  ${page === currentPage
                    ? 'bg-blue-600 text-white'
                    : page === '...'
                    ? 'text-gray-400 cursor-default'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {page}
              </button>
            ))}
          </div>

          {/* 下一页按钮 */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            下一页
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* 页面跳转 */}
      {totalPages > 5 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <span className="text-sm text-gray-600">跳转到第</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= totalPages) {
                handlePageChange(page);
              }
            }}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-sm text-gray-600">页</span>
        </div>
      )}

      {/* 返回顶部按钮 */}
      {currentPage > 1 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            返回顶部
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductList; 