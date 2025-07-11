import { useState, useRef } from 'react';
import { parseExcelFile, validateFile } from '../lib/parseExcel';

const FileUpload = ({ onDataParsed, onError }) => {
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, parsing, success, error
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // 统一的文件处理函数
  const processFile = async (file) => {
    if (!file) {
      return;
    }

    setFileName(file.name);
    setIsDragOver(false); // 重置拖拽状态
    
    // 验证文件
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadStatus('error');
      setMessage(validation.error);
      onError?.(validation.error);
      return;
    }

    // 开始解析
    setUploadStatus('parsing');
    setProgress(0);
    setMessage('正在解析文件...');

    try {
      const products = await parseExcelFile(file, (progress) => {
        setProgress(progress);
        if (progress < 100) {
          setMessage(`正在解析文件... ${progress}%`);
        }
      });

      setUploadStatus('success');
      setProgress(100);
      setMessage(`解析完成！共解析到 ${products.length} 个产品`);
      
      // 通知父组件
      onDataParsed?.(products);

    } catch (error) {
      setUploadStatus('error');
      setMessage(error.message || '文件解析失败');
      onError?.(error.message || '文件解析失败');
    }
  };

  // 点击选择文件
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    await processFile(file);
  };

  // 拖拽事件处理
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有当离开整个拖拽区域时才重置状态
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setUploadStatus('idle');
    setProgress(0);
    setMessage('');
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'parsing':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getButtonText = () => {
    switch (uploadStatus) {
      case 'parsing':
        return '解析中...';
      case 'success':
        return '重新上传';
      case 'error':
        return '重新上传';
      default:
        return '选择Excel文件';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          上传产品数据
        </h2>
        
        {/* 文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {/* 拖拽上传区域 */}
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={uploadStatus === 'parsing' ? undefined : handleUploadClick}
          className={`
            w-full py-8 px-4 rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer
            ${isDragOver
              ? 'border-blue-400 bg-blue-50'
              : uploadStatus === 'parsing'
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }
          `}
        >
          <div className="flex flex-col items-center space-y-3">
            {/* 上传图标 */}
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center
              ${isDragOver
                ? 'bg-blue-100'
                : uploadStatus === 'parsing'
                ? 'bg-gray-200'
                : 'bg-gray-100'
              }
            `}>
              <svg
                className={`w-6 h-6 ${isDragOver ? 'text-blue-500' : 'text-gray-500'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            
            {/* 主要文字 */}
            <div className="text-center">
              <p className={`
                text-lg font-medium
                ${isDragOver ? 'text-blue-600' : 'text-gray-900'}
              `}>
                {isDragOver
                  ? '松开鼠标上传文件'
                  : uploadStatus === 'parsing'
                  ? '正在解析...'
                  : '点击或拖拽文件到此处'
                }
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {isDragOver
                  ? '支持 .xlsx 格式文件'
                  : '支持从卖家精灵下载的 .xlsx 文件'
                }
              </p>
            </div>
            
            {/* 辅助按钮 */}
            {!isDragOver && uploadStatus !== 'parsing' && (
              <button
                disabled={uploadStatus === 'parsing'}
                className={`
                  px-4 py-2 rounded-md font-medium text-white transition-colors
                  ${uploadStatus === 'parsing'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                  }
                `}
              >
                {getButtonText()}
              </button>
            )}
          </div>
        </div>
        
        {/* 文件名显示 */}
        {fileName && (
          <div className="mt-3 text-sm text-gray-600">
            已选择: {fileName}
          </div>
        )}
        
        {/* 进度条 */}
        {uploadStatus === 'parsing' && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {progress}%
            </div>
          </div>
        )}
        
        {/* 状态消息 */}
        {message && (
          <div className={`mt-4 text-sm ${getStatusColor()}`}>
            {message}
          </div>
        )}
        
        {/* 重置按钮 */}
        {(uploadStatus === 'success' || uploadStatus === 'error') && (
          <button
            onClick={handleReset}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            清除
          </button>
        )}
        
        {/* 使用说明 */}
        {uploadStatus === 'idle' && (
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>• 支持点击上传或拖拽上传</p>
            <p>• 支持从卖家精灵下载的.xlsx文件</p>
            <p>• 文件大小限制：10MB</p>
            <p>• 示例文件：Product-Arts,Crafts&Sewing-US-Last-30-days-39193.xlsx</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload; 