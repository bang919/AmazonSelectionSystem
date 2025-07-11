import { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import FileUpload from '../components/FileUpload';
import ProductList from '../components/ProductList';
import FilterPanel from '../components/FilterPanel';
import { getBatchCategoryBlacklistStatus, isProductBlacklisted } from '../lib/firebase';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filters, setFilters] = useState({});
  const [blacklistMap, setBlacklistMap] = useState({});
  const [isLoadingBlacklist, setIsLoadingBlacklist] = useState(false);
  const [error, setError] = useState('');

  // 处理数据解析完成
  const handleDataParsed = async (parsedProducts) => {
    setProducts(parsedProducts);
    setError('');
    console.log('解析到的产品数据:', parsedProducts);

    // 获取类目黑名单
    await loadBlacklist(parsedProducts);
    
    // 立即使用默认筛选条件执行第一次搜索
    performInitialSearch(parsedProducts);
  };

  // 处理错误
  const handleError = (errorMessage) => {
    setError(errorMessage);
    setProducts([]);
    setFilteredProducts([]);
    setBlacklistMap({});
  };

  // 加载类目黑名单
  const loadBlacklist = async (productList) => {
    if (!productList || productList.length === 0) {
      return;
    }

    setIsLoadingBlacklist(true);
    try {
      const subCategories = productList.map(p => p.subCategory).filter(Boolean);
      const blacklist = await getBatchCategoryBlacklistStatus(subCategories);
      setBlacklistMap(blacklist);
      console.log('类目黑名单加载完成:', blacklist);
    } catch (error) {
      console.error('加载类目黑名单失败:', error);
    } finally {
      setIsLoadingBlacklist(false);
    }
  };

  // 执行初始搜索
  const performInitialSearch = (productList) => {
    if (!productList || productList.length === 0) {
      return;
    }

    // 计算数据范围
    const prices = productList.map(p => p.price).filter(p => p > 0);
    const monthlySales = productList.map(p => p.monthlySales).filter(s => s >= 0);
    const monthlyRevenues = productList.map(p => p.monthlyRevenue).filter(r => r >= 0);
    const reviewCounts = productList.map(p => p.reviewCount).filter(r => r >= 0);
    const ratings = productList.map(p => p.rating).filter(r => r > 0);
    
    const daysSinceLaunchValues = productList.map(p => {
      if (!p.launchDate) return 0;
      try {
        const launch = new Date(p.launchDate);
        const now = new Date();
        const diffTime = Math.abs(now - launch);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } catch {
        return 0;
      }
    }).filter(d => d >= 0);

    // 设置默认筛选条件（使用数据的最大最小值）
    const defaultFilters = {
      priceRange: [Math.min(...prices, 0), Math.max(...prices, 1000)],
      monthlySalesRange: [Math.min(...monthlySales, 0), Math.max(...monthlySales, 10000)],
      monthlyRevenueRange: [Math.min(...monthlyRevenues, 0), Math.max(...monthlyRevenues, 100000)],
      reviewCountRange: [Math.min(...reviewCounts, 0), Math.max(...reviewCounts, 5000)],
      ratingRange: [Math.min(...ratings, 0), Math.max(...ratings, 5)],
      daysSinceLaunchRange: [Math.min(...daysSinceLaunchValues, 0), Math.max(...daysSinceLaunchValues, 365)],
      shippingMethods: [],
      sellerLocations: [],
    };

    setFilters(defaultFilters);
    
    // 使用当前黑名单执行筛选
    const filtered = applyFilters(productList, defaultFilters, blacklistMap);
    setFilteredProducts(filtered);
  };

  // 计算上架至今天数
  const calculateProductDays = (launchDate) => {
    if (!launchDate) return 0;
    try {
      const launch = new Date(launchDate);
      const now = new Date();
      const diffTime = Math.abs(now - launch);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  // 筛选逻辑
  const applyFilters = useCallback((productList, filterConditions, blacklist) => {
    if (!productList || productList.length === 0) {
      return [];
    }

    return productList.filter(product => {
      // 价格筛选
      if (filterConditions.priceRange) {
        const [minPrice, maxPrice] = filterConditions.priceRange;
        if (product.price < minPrice || product.price > maxPrice) {
          return false;
        }
      }

      // 月销量筛选
      if (filterConditions.monthlySalesRange) {
        const [minSales, maxSales] = filterConditions.monthlySalesRange;
        if (product.monthlySales < minSales || product.monthlySales > maxSales) {
          return false;
        }
      }

      // 月销售额筛选
      if (filterConditions.monthlyRevenueRange) {
        const [minRevenue, maxRevenue] = filterConditions.monthlyRevenueRange;
        if (product.monthlyRevenue < minRevenue || product.monthlyRevenue > maxRevenue) {
          return false;
        }
      }

      // 评分数筛选
      if (filterConditions.reviewCountRange) {
        const [minCount, maxCount] = filterConditions.reviewCountRange;
        if (product.reviewCount < minCount || product.reviewCount > maxCount) {
          return false;
        }
      }

      // 评分筛选
      if (filterConditions.ratingRange) {
        const [minRating, maxRating] = filterConditions.ratingRange;
        if (product.rating < minRating || product.rating > maxRating) {
          return false;
        }
      }

      // 上架至今天数筛选
      if (filterConditions.daysSinceLaunchRange) {
        const [minDays, maxDays] = filterConditions.daysSinceLaunchRange;
        const productDays = calculateProductDays(product.launchDate);
        if (productDays < minDays || productDays > maxDays) {
          return false;
        }
      }

      // 配送方式筛选
      if (filterConditions.shippingMethods && filterConditions.shippingMethods.length > 0) {
        if (!filterConditions.shippingMethods.includes(product.shippingMethod)) {
          return false;
        }
      }

      // 卖家所属地筛选
      if (filterConditions.sellerLocations && filterConditions.sellerLocations.length > 0) {
        if (!filterConditions.sellerLocations.includes(product.sellerLocation)) {
          return false;
        }
      }

      // 类目黑名单筛选
      if (isProductBlacklisted(product, blacklist)) {
        return false;
      }

      return true;
    });
  }, []);



  // 处理筛选条件变化
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    const filtered = applyFilters(products, newFilters, blacklistMap);
    setFilteredProducts(filtered);
  }, [products, blacklistMap, applyFilters]);

  // 计算统计数据
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const filteredCount = filteredProducts.length;
    const highRatingCount = filteredProducts.filter(p => p.rating >= 4.0).length;
    const highSalesCount = filteredProducts.filter(p => p.monthlySales >= 100).length;
    const blacklistedCount = products.filter(p => isProductBlacklisted(p, blacklistMap)).length;

    return {
      total: totalProducts,
      filtered: filteredCount,
      highRating: highRatingCount,
      highSales: highSalesCount,
      blacklisted: blacklistedCount
    };
  }, [products, filteredProducts, blacklistMap]);

  return (
    <>
      <Head>
        <title>亚马逊选品系统</title>
        <meta name="description" content="基于卖家精灵数据的亚马逊选品分析系统" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* 页面标题 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              亚马逊选品系统
            </h1>
            <p className="text-gray-600">
              上传卖家精灵Excel文件，智能分析亚马逊产品数据
            </p>
          </div>

          {/* 文件上传区域 */}
          <div className="mb-8">
            <FileUpload 
              onDataParsed={handleDataParsed}
              onError={handleError}
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="max-w-2xl mx-auto mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      上传失败
                    </h3>
                    <div className="mt-1 text-sm text-red-700">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 数据统计 */}
          {products.length > 0 && (
            <div className="max-w-7xl mx-auto mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    数据统计
                  </h2>
                  {isLoadingBlacklist && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      正在加载类目黑名单...
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.total}
                    </div>
                    <div className="text-sm text-blue-800">
                      产品总数
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.filtered}
                    </div>
                    <div className="text-sm text-purple-800">
                      筛选结果
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.highRating}
                    </div>
                    <div className="text-sm text-green-800">
                      高评分产品 (≥4.0)
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-600">
                      {stats.highSales}
                    </div>
                    <div className="text-sm text-yellow-800">
                      高销量产品 (≥100)
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-600">
                      {stats.blacklisted}
                    </div>
                    <div className="text-sm text-red-800">
                      黑名单产品
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 筛选和产品展示区域 */}
          {products.length > 0 && (
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* 筛选面板 */}
                <div className="lg:col-span-1">
                  <div className="sticky top-4">
                    <FilterPanel 
                      products={products}
                      onFiltersChange={handleFiltersChange}
                    />
                  </div>
                </div>
                
                {/* 产品列表 */}
                <div className="lg:col-span-3">
                  {filteredProducts.length > 0 ? (
                    <ProductList products={filteredProducts} itemsPerPage={20} />
                  ) : (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                      <div className="text-gray-500 text-lg mb-2">
                        没有找到符合筛选条件的产品
                      </div>
                      <div className="text-gray-400 text-sm">
                        请尝试调整筛选条件或重置筛选器
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 功能说明 */}
          {products.length === 0 && !error && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  功能说明
                </h2>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-blue-600 font-bold text-xs">1</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">上传Excel文件</div>
                      <div>支持从卖家精灵下载的.xlsx格式文件</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-blue-600 font-bold text-xs">2</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">自动解析数据</div>
                      <div>系统会自动解析产品信息，包括ASIN、标题、价格、销量等</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-blue-600 font-bold text-xs">3</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">数据展示与筛选</div>
                      <div>以卡片形式展示产品，支持多条件筛选和分析</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
} 