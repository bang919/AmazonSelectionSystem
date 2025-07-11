import { calculateDaysSinceLaunch } from '../lib/parseExcel';

const ProductCard = ({ product, index }) => {
  // 计算上架至今天数
  const daysSinceLaunch = calculateDaysSinceLaunch(product.launchDate);

  // 处理商品页面跳转
  const handleProductClick = () => {
    if (product.productUrl) {
      window.open(product.productUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // 处理大类目点击事件
  const handleCategoryClick = (e) => {
    e.stopPropagation();
    console.log('大类目点击 - URL:', product.mainCategoryUrl, '类目:', product.mainCategory);
    if (product.mainCategoryUrl) {
      window.open(product.mainCategoryUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('大类目暂无可用链接，请检查Excel文件中的超链接设置');
    }
  };

  // 处理小类目点击事件
  const handleSubCategoryClick = (e) => {
    e.stopPropagation();
    console.log('小类目点击 - URL:', product.subCategoryUrl, '类目:', product.subCategory);
    if (product.subCategoryUrl) {
      window.open(product.subCategoryUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('小类目暂无可用链接');
    }
  };

  return (
    <div className="product-card bg-white rounded-lg shadow-md hover:shadow-lg overflow-hidden">
      <div className="p-3">
        {/* 顶部：产品图片 */}
        <div className="w-full mb-3">
          <div 
            className="w-full aspect-video bg-gray-100 rounded-md overflow-hidden cursor-pointer"
            onClick={handleProductClick}
          >
            {product.mainImage ? (
              <img
                src={product.mainImage}
                alt={product.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCA2MEgxNDBWMTQwSDYwVjYwWiIgZmlsbD0iI0Q1RDVENSIvPgo8L3N2Zz4K';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* 标题 - 可点击跳转 */}
        <div className="mb-2">
          <h3 
            className="text-sm font-medium text-gray-900 line-clamp-3 leading-tight cursor-pointer hover:text-blue-600 transition-colors"
            onClick={handleProductClick}
          >
            {product.title || '无标题'}
          </h3>
        </div>

        {/* ASIN */}
        <div className="text-xs text-gray-500 mb-2 font-mono">
          {product.asin}
        </div>

        {/* 价格和评分 */}
        <div className="flex justify-between items-center mb-2">
          <div className="text-lg font-bold text-green-600">
            ${product.price.toFixed(2)}
          </div>
          <div className="flex items-center text-xs">
            <span className="font-semibold text-yellow-600">
              {product.rating ? product.rating.toFixed(1) : '0.0'}
            </span>
            <svg className="w-3 h-3 text-yellow-400 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </div>
        </div>

        {/* 类目信息 */}
        <div className="text-xs mb-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">大类目:</span>
            <span 
              className="text-blue-600 hover:text-blue-800 cursor-pointer underline"
              onClick={handleCategoryClick}
            >
              {product.mainCategory || '未知'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">小类目:</span>
            <span 
              className="text-blue-600 hover:text-blue-800 cursor-pointer underline text-right"
              onClick={handleSubCategoryClick}
            >
              {product.subCategory || '未知'}
            </span>
          </div>
        </div>

        {/* 销售数据 */}
        <div className="text-xs mb-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">月销量:</span>
            <span className="font-semibold text-blue-600">
              {product.monthlySales.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">月销售额:</span>
            <span className="font-semibold text-green-600">
              ${product.monthlyRevenue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 其他信息 */}
        <div className="text-xs mb-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">评分数:</span>
            <span className="text-gray-700">
              {product.reviewCount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">上架:</span>
            <span className="text-gray-700">
              {daysSinceLaunch}天
            </span>
          </div>
        </div>

        {/* 底部：配送和卖家信息 */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            product.shippingMethod === 'FBA' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {product.shippingMethod || '未知'}
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
            {product.sellerLocation || '未知'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 