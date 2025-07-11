import React, { useState, useEffect, useCallback, useMemo } from 'react';

const FilterPanel = React.memo(({ products, onFiltersChange, initialFilters = {} }) => {
  // 筛选状态
  const [filters, setFilters] = useState({
    priceRange: initialFilters.priceRange || [0, 1000],
    monthlySalesRange: initialFilters.monthlySalesRange || [0, 10000],
    monthlyRevenueRange: initialFilters.monthlyRevenueRange || [0, 100000],
    reviewCountRange: initialFilters.reviewCountRange || [0, 5000],
    ratingRange: initialFilters.ratingRange || [0, 5],
    daysSinceLaunchRange: initialFilters.daysSinceLaunchRange || [0, 365],
    shippingMethods: initialFilters.shippingMethods || [],
    sellerLocations: initialFilters.sellerLocations || [],
  });

  // 数据范围 - 从产品数据中计算
  const [dataRanges, setDataRanges] = useState({
    price: { min: 0, max: 1000 },
    monthlySales: { min: 0, max: 10000 },
    monthlyRevenue: { min: 0, max: 100000 },
    reviewCount: { min: 0, max: 5000 },
    rating: { min: 0, max: 5 },
    daysSinceLaunch: { min: 0, max: 365 },
  });

  // 可选项
  const [options, setOptions] = useState({
    shippingMethods: [],
    sellerLocations: [],
  });

  // 面板折叠状态
  const [isExpanded, setIsExpanded] = useState(true);

  // 计算数据范围和选项
  useEffect(() => {
    if (products && products.length > 0) {
      // 计算数值范围
      const prices = products.map(p => p.price).filter(p => p > 0);
      const monthlySales = products.map(p => p.monthlySales).filter(s => s >= 0);
      const monthlyRevenues = products.map(p => p.monthlyRevenue).filter(r => r >= 0);
      const reviewCounts = products.map(p => p.reviewCount).filter(r => r >= 0);
      const ratings = products.map(p => p.rating).filter(r => r > 0);
      
      // 计算上架天数
      const daysSinceLaunchValues = products.map(p => {
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

      const newDataRanges = {
        price: {
          min: Math.min(...prices, 0),
          max: Math.max(...prices, 1000)
        },
        monthlySales: {
          min: Math.min(...monthlySales, 0),
          max: Math.max(...monthlySales, 10000)
        },
        monthlyRevenue: {
          min: Math.min(...monthlyRevenues, 0),
          max: Math.max(...monthlyRevenues, 100000)
        },
        reviewCount: {
          min: Math.min(...reviewCounts, 0),
          max: Math.max(...reviewCounts, 5000)
        },
        rating: {
          min: Math.min(...ratings, 0),
          max: Math.max(...ratings, 5)
        },
        daysSinceLaunch: {
          min: Math.min(...daysSinceLaunchValues, 0),
          max: Math.max(...daysSinceLaunchValues, 365)
        }
      };

      setDataRanges(newDataRanges);

      // 更新筛选器默认范围
      setFilters(prev => ({
        ...prev,
        priceRange: [newDataRanges.price.min, newDataRanges.price.max],
        monthlySalesRange: [newDataRanges.monthlySales.min, newDataRanges.monthlySales.max],
        monthlyRevenueRange: [newDataRanges.monthlyRevenue.min, newDataRanges.monthlyRevenue.max],
        reviewCountRange: [newDataRanges.reviewCount.min, newDataRanges.reviewCount.max],
        ratingRange: [newDataRanges.rating.min, newDataRanges.rating.max],
        daysSinceLaunchRange: [newDataRanges.daysSinceLaunch.min, newDataRanges.daysSinceLaunch.max],
      }));

      // 提取配送方式和卖家地区选项
      const shippingMethods = [...new Set(products.map(p => p.shippingMethod).filter(s => s))];
      const sellerLocations = [...new Set(products.map(p => p.sellerLocation).filter(l => l))];

      setOptions({
        shippingMethods: shippingMethods.sort(),
        sellerLocations: sellerLocations.sort(),
      });
    }
  }, [products]);

  // 更新筛选条件
  const updateFilters = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // 为每个筛选条件创建稳定的onChange函数
  const handlePriceRangeChange = useCallback((range) => updateFilters('priceRange', range), [updateFilters]);
  const handleMonthlySalesRangeChange = useCallback((range) => updateFilters('monthlySalesRange', range), [updateFilters]);
  const handleMonthlyRevenueRangeChange = useCallback((range) => updateFilters('monthlyRevenueRange', range), [updateFilters]);
  const handleReviewCountRangeChange = useCallback((range) => updateFilters('reviewCountRange', range), [updateFilters]);
  const handleRatingRangeChange = useCallback((range) => updateFilters('ratingRange', range), [updateFilters]);
  const handleDaysSinceLaunchRangeChange = useCallback((range) => updateFilters('daysSinceLaunchRange', range), [updateFilters]);
  const handleShippingMethodsChange = useCallback((selected) => updateFilters('shippingMethods', selected), [updateFilters]);
  const handleSellerLocationsChange = useCallback((selected) => updateFilters('sellerLocations', selected), [updateFilters]);

  // 重置筛选条件
  const resetFilters = useCallback(() => {
    const resetFilters = {
      priceRange: [dataRanges.price.min, dataRanges.price.max],
      monthlySalesRange: [dataRanges.monthlySales.min, dataRanges.monthlySales.max],
      monthlyRevenueRange: [dataRanges.monthlyRevenue.min, dataRanges.monthlyRevenue.max],
      reviewCountRange: [dataRanges.reviewCount.min, dataRanges.reviewCount.max],
      ratingRange: [dataRanges.rating.min, dataRanges.rating.max],
      daysSinceLaunchRange: [dataRanges.daysSinceLaunch.min, dataRanges.daysSinceLaunch.max],
      shippingMethods: [],
      sellerLocations: [],
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  }, [dataRanges, onFiltersChange]);

  // 处理搜索按钮点击
  const handleSearch = useCallback(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  // 范围输入框组件
  const RangeInput = useCallback(({ label, range, min, max, step = 1, prefix = '', suffix = '', onChange }) => {
    const handleMinChange = useCallback((e) => {
      const newValue = Number(e.target.value);
      if (!isNaN(newValue) && newValue <= range[1]) {
        onChange([newValue, range[1]]);
      }
    }, [range, onChange]);

    const handleMaxChange = useCallback((e) => {
      const newValue = Number(e.target.value);
      if (!isNaN(newValue) && newValue >= range[0]) {
        onChange([range[0], newValue]);
      }
    }, [range, onChange]);

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <div className="relative">
              {prefix && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">{prefix}</span>
                </div>
              )}
              <input
                type="number"
                min={min}
                max={range[1]}
                step={step}
                value={range[0]}
                onChange={handleMinChange}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${prefix ? 'pl-7' : 'pl-3'} pr-3 py-2`}
              />
            </div>
          </div>
          <span className="text-gray-500">至</span>
          <div className="flex-1">
            <div className="relative">
              {prefix && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">{prefix}</span>
                </div>
              )}
              <input
                type="number"
                min={range[0]}
                max={max}
                step={step}
                value={range[1]}
                onChange={handleMaxChange}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${prefix ? 'pl-7' : 'pl-3'} pr-3 py-2`}
              />
            </div>
          </div>
          {suffix && (
            <span className="text-gray-500 text-sm">{suffix}</span>
          )}
        </div>
      </div>
    );
  }, []);

  // 多选下拉框组件
  const MultiSelect = ({ label, options: selectOptions, selected, onChange }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} ({selected.length}项已选)
      </label>
      <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md">
        {selectOptions.map((option) => (
          <label key={option} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...selected, option]);
                } else {
                  onChange(selected.filter(item => item !== option));
                }
              }}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md w-full">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">产品筛选</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={resetFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            重置
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 筛选内容 */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* 价格范围 */}
          <RangeInput
            label="价格范围"
            range={filters.priceRange}
            min={dataRanges.price.min}
            max={dataRanges.price.max}
            step={1}
            prefix="$"
            onChange={handlePriceRangeChange}
          />

          {/* 月销量范围 */}
          <RangeInput
            label="月销量范围"
            range={filters.monthlySalesRange}
            min={dataRanges.monthlySales.min}
            max={dataRanges.monthlySales.max}
            step={1}
            onChange={handleMonthlySalesRangeChange}
          />

          {/* 月销售额范围 */}
          <RangeInput
            label="月销售额范围"
            range={filters.monthlyRevenueRange}
            min={dataRanges.monthlyRevenue.min}
            max={dataRanges.monthlyRevenue.max}
            step={100}
            prefix="$"
            onChange={handleMonthlyRevenueRangeChange}
          />

          {/* 评分数范围 */}
          <RangeInput
            label="评分数范围"
            range={filters.reviewCountRange}
            min={dataRanges.reviewCount.min}
            max={dataRanges.reviewCount.max}
            step={1}
            onChange={handleReviewCountRangeChange}
          />

          {/* 评分范围 */}
          <RangeInput
            label="评分范围"
            range={filters.ratingRange}
            min={dataRanges.rating.min}
            max={dataRanges.rating.max}
            step={0.1}
            onChange={handleRatingRangeChange}
          />

          {/* 上架至今范围 */}
          <RangeInput
            label="上架至今范围"
            range={filters.daysSinceLaunchRange}
            min={dataRanges.daysSinceLaunch.min}
            max={dataRanges.daysSinceLaunch.max}
            step={1}
            suffix="天"
            onChange={handleDaysSinceLaunchRangeChange}
          />

          {/* 配送方式 */}
          {options.shippingMethods.length > 0 && (
            <MultiSelect
              label="配送方式"
              options={options.shippingMethods}
              selected={filters.shippingMethods}
              onChange={handleShippingMethodsChange}
            />
          )}

          {/* 卖家所属地 */}
          {options.sellerLocations.length > 0 && (
            <MultiSelect
              label="卖家所属地"
              options={options.sellerLocations}
              selected={filters.sellerLocations}
              onChange={handleSellerLocationsChange}
            />
          )}

          {/* 搜索按钮 */}
          <div className="pt-4">
            <button
              onClick={handleSearch}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              搜索
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default FilterPanel; 