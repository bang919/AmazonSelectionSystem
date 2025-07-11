import { useState } from 'react';
import Head from 'next/head';
import FileUpload from '../components/FileUpload';
import ProductList from '../components/ProductList';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  const handleDataParsed = (parsedProducts) => {
    setProducts(parsedProducts);
    setError('');
    console.log('解析到的产品数据:', parsedProducts);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setProducts([]);
  };

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
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  数据统计
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {products.length}
                    </div>
                    <div className="text-sm text-blue-800">
                      产品总数
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {products.filter(p => p.rating >= 4.0).length}
                    </div>
                    <div className="text-sm text-green-800">
                      高评分产品 (≥4.0)
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-600">
                      {products.filter(p => p.monthlySales >= 100).length}
                    </div>
                    <div className="text-sm text-yellow-800">
                      高销量产品 (≥100)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 产品展示 */}
          {products.length > 0 && (
            <div className="max-w-7xl mx-auto">
              <ProductList products={products} itemsPerPage={20} />
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